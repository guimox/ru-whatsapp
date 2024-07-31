const { DisconnectReason } = require("@whiskeysockets/baileys");
const useMongoDBAuthState = require("./mongoAuthState");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { MongoClient } = require("mongodb");
require("dotenv").config();

async function connectionLogic() {
  const mongoClient = new MongoClient(process.env.MONGO_URL, {
    useNewUrlParser: true,

    useUnifiedTopology: true,
  });

  await mongoClient.connect();

  const collection = mongoClient

    .db("whatsapp-api")

    .collection("auth-info-baileys");

  const { state, saveCreds } = await useMongoDBAuthState(collection);

  const sock = makeWASocket({
    printQRInTerminal: true,

    auth: state,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update || {};

    if (qr) {
      console.log(qr);
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        connectionLogic();
      }
    }
  });

  const message = "Hello, world!";

  sock.ev.on("messages.update", (messageInfo) => {
    console.log(messageInfo);
  });

  sock.ev.on("messages.upsert", (messageInfoUpsert) => {
    console.log(messageInfoUpsert);
  });

  sock.ev.on("creds.update", saveCreds);

  await sock.waitForConnectionUpdate(({ connection }) => connection === "open");

  //   let result = await sock.newsletterCreate("Testing newsletter");
  //   console.log("nn", result);

  await sock.sendMessage(process.env.NUMBER, { text: message });

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "Message sent successfully.",
    }),
  };
}

connectionLogic();
