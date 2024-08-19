const { DisconnectReason } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const useMongoDBAuthState = require('./db/mongo');
const { formatMeals } = require('./util/util');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const connectToWhatsApp = async () => {
  let mongoURL = process.env.MONGO_URL;
  let contactNumber = process.env.NUMBER_NEWSLETTER;

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
          await connectToWhatsApp();
        } else {
          process.exit(1);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    console.log('###### CONNECTION OPENED');

    sock.ev.on('messages.upsert', async (m) => {
      console.log('Message received from:', m.messages[0].key.remoteJid);

      const { date, imgMenu, ruCode } = m.messages[0];

      if (!date || !ruCode) {
        console.log('Invalid request. Required fields are missing.');
        return;
      }

      const message = imgMenu ?? formatMeals(m.messages[0]);

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
          console.error('Failed to send message. Internal server error.');
        } else {
          console.log('Message sent successfully.');
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectToWhatsApp();
