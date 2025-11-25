const {
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const useMongoDBAuthState = require('./db/mongo');
const { formatMeals, formatImageMenu } = require('./util/util');
const { MongoClient } = require('mongodb');
require('dotenv').config();

let mongoClient;
let sock;

async function startProcessToSendMessage(event, mongoURL, contactNumber) {
  try {
    if (!mongoClient) {
      console.log('###### CONNECTING TO MONGODB');
      mongoClient = new MongoClient(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await mongoClient.connect();
      console.log('###### CONNECTED TO MONGODB');
    }

    const collection = mongoClient
      .db('whatsapp-api')
      .collection('auth-info-baileys');

    console.log('###### FETCHING AUTH STATE FROM MONGODB');
    const { state, saveCreds } = await useMongoDBAuthState(collection);
    const { version } = await fetchLatestBaileysVersion();
    console.log('###### AUTH STATE FETCHED');

    if (!sock) {
      console.log('###### CREATING WHATSAPP SOCKET');
      sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
      });

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update || {};

        if (qr) {
          console.log('##### SHOWING QR CODE');
          console.log(qr);
        }

        if (connection === 'close') {
          console.log('##### CONNECTION CLOSED');
          const shouldReconnect =
            lastDisconnect?.error?.output?.statusCode !==
            DisconnectReason.loggedOut;

          if (shouldReconnect) {
            console.log(
              '##### RECONNECTION ATTEMPT DUE TO CONNECTION CLOSE...'
            );
            // FIXED: Changed from connectEverything to startProcessToSendMessage
            sock = null; // Reset socket to force recreation
            await startProcessToSendMessage(event, mongoURL, contactNumber);
          } else {
            console.log('##### LOGGED OUT, EXITING...');
            sock = null;
            process.exit(1);
          }
        }
      });

      sock.ev.on('creds.update', saveCreds);
      console.log('##### WHATSAPP SOCKET CREATED AND EVENT LISTENERS ADDED');
    }

    console.log('##### WAITING FOR WHATSAPP CONNECTION TO OPEN...');

    // Add timeout to prevent hanging
    const connectionTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 30000)
    );

    const connectionPromise = sock.waitForConnectionUpdate(
      ({ connection }) => connection === 'open'
    );

    await Promise.race([connectionPromise, connectionTimeout]);
    console.log('###### CONNECTION OPENED');

    console.log('###### RESPONSE', event.responsePayload);

    const { imgMenu, ruCode } = event.responsePayload;

    if (!ruCode) {
      console.log('##### MISSING REQUIRED FIELDS: RUCODE');
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid request. RuCode is required.',
        }),
      };
    }

    console.log('##### FORMATTING MESSAGE...');
    const message = imgMenu ?? formatMeals(event.responsePayload);
    console.log('##### MESSAGE FORMATTED:', message);

    try {
      console.log('##### SENDING MESSAGE...');
      const msg = await sock.sendMessage(
        contactNumber,
        imgMenu
          ? {
              image: { url: message },
              caption: formatImageMenu(event.responsePayload),
            }
          : { text: message }
      );
      console.log('##### MESSAGE SENT:', msg);

      if (msg.status !== 1) {
        console.log('##### MESSAGE SENDING FAILED:', msg);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Internal server error.' }),
        };
      }
    } catch (error) {
      console.error('##### ERROR SENDING MESSAGE:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error.' }),
      };
    }

    console.log('##### MESSAGE SENT SUCCESSFULLY');
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Message sent successfully.',
      }),
    };
  } catch (error) {
    console.error('##### ERROR IN THE FUNCTION:', error);

    // Clean up on error
    if (sock) {
      sock = null;
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error.',
        details: error.message,
      }),
    };
  }
}

exports.handler = async (event) => {
  const mongoURL = process.env.MONGO_URL;
  const contactNumber = process.env.NUMBER_NEWSLETTER;
  console.log('###### EVENT RECEIVED:', JSON.stringify(event.responsePayload));
  return await startProcessToSendMessage(event, mongoURL, contactNumber);
};
