const { DisconnectReason } = require('@whiskeysockets/baileys');
const useMongoDBAuthState = require('./mongoAuthState');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { MongoClient } = require('mongodb');
const { formatMeals } = require('./helpers');
require('dotenv').config();

const connectionLogic = async (sock) => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Trying to reconnect, attempt ${retries + 1}`);
      await sock.connect();
      console.log('Reconnected successfully');
      return;
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.error('Max reconnection attempts reached. Exiting.');
  process.exit();
};

exports.handler = async (event) => {
  let mongoURL = process.env.MONGO_URL;
  let contactNumber = process.env.NUMBER_NEWSLETTER.split(',');

  console.log(event.responsePayload);

  try {
    console.log('Trying to connect to MongoDB');
    const mongoClient = new MongoClient(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await mongoClient.connect();
    console.log('Connected to MongoDB');

    const collection = mongoClient
      .db('whatsapp-api')
      .collection('auth-info-baileys');
    const { state, saveCreds } = await useMongoDBAuthState(collection);
    const sock = makeWASocket({
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
          await connectionLogic(sock);
        } else {
          process.exit();
        }
      }
    });

    await sock.waitForConnectionUpdate(
      ({ connection }) => connection === 'open'
    );

    console.log('Connection opened');

    sock.ev.on('creds.update', saveCreds);

    const { menuId, sortId, date, meals, ruCode, served } =
      event.responsePayload;

    if (!menuId || !sortId || !date || !meals || !ruCode || !served) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid request. Required fields are missing.',
        }),
      };
    }

    console.log(event);

    const message = formatMeals(event.responsePayload);

    try {
      const msg = await sock.sendMessage(contactNumber, { text: message });
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
};
