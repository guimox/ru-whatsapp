const { DisconnectReason } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const useMongoDBAuthState = require('./db/mongo');
const { formatMeals } = require('./util/util');
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function connectEverything(event, mongoURL, contactNumber) {
  try {
    console.log('###### TRYING TO CONNECT TO MONGODB');
    const mongoClient = new MongoClient(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await mongoClient.connect();
    console.log('###### CONNECTED TO MONGODB');

    const collection = mongoClient
      .db('whatsapp-api')
      .collection('auth-info-baileys');

    const { state, saveCreds } = await useMongoDBAuthState(collection);

    const sock = makeWASocket({
      version: [2, 3000, 1015872296],
      printQRInTerminal: true,
      auth: state,
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update || {};

      if (qr) {
        console.log('Showing QR code');
        console.log(qr);
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          console.log('Reconnection attempt due to connection close...');
          await connectEverything(event, mongoURL, contactNumber); // Reconnect with the same parameters
        } else {
          process.exit(1);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    await sock.waitForConnectionUpdate(
      ({ connection }) => connection === 'open'
    );

    console.log('###### CONNECTION OPENED');

    const { date, imgMenu, ruCode } = event.responsePayload;

    if (!date || !ruCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid request. Required fields are missing.',
        }),
      };
    }

    const message = imgMenu ?? formatMeals(event.responsePayload);

    try {
      const msg = await sock.sendMessage(
        contactNumber,
        imgMenu
          ? {
              image: { url: message },
              caption: date,
            }
          : { text: message }
      );
      if (msg.status !== 1) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Internal server error.' }),
        };
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Message sent successfully.',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }
}

exports.handler = async (event) => {
  let mongoURL = process.env.MONGO_URL;
  let contactNumber = process.env.NUMBER_NEWSLETTER;
  console.log('###### EVENT ' + JSON.stringify(event.responsePayload));

  return await connectEverything(event, mongoURL, contactNumber);
};
