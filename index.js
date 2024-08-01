const { DisconnectReason } = require("@whiskeysockets/baileys");
const useMongoDBAuthState = require("./mongoAuthState");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { MongoClient } = require("mongodb");
const { formatMeals } = require("./helpers");
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

  const objectToTest = {
    date: "2024-07-31T13:05:48.359288493-03:00",
    ruCode: "POL",
    meals: {
      lunch: [
        {
          name: "Frango ao sugo",
          icons: ["Origem-animal-site"],
        },
        {
          name: "Vegano: almôndega de grão-de-bico ao sugo",
          icons: ["Simbolo-vegano-300x300", "Gluten-site"],
        },
        {
          name: "Polenta cremosa",
          icons: ["Simbolo-vegano-300x300"],
        },
        {
          name: "Saladas de folhosa e pepino",
          icons: ["Simbolo-vegano-300x300", "Simbolo-vegano-300x300"],
        },
        {
          name: "Salada de frutas",
          icons: ["Simbolo-vegano-300x300"],
        },
      ],
      breakfast: [
        {
          name: "Pão de milho com queijo",
          icons: ["Gluten-site", "Leite-e-derivados-site"],
        },
        {
          name: "Maçã",
          icons: ["Simbolo-vegano-300x300"],
        },
      ],
      dinner: [
        {
          name: "Nhoque à bolonhesa",
          icons: ["Origem-animal-site", "Gluten-site"],
        },
        {
          name: "Vegano: nhoque de lentilha ao sugo",
          icons: ["Simbolo-vegano-300x300", "Gluten-site"],
        },
        {
          name: "Sopa de legumes com arroz",
          icons: ["Simbolo-vegano-300x300"],
        },
        {
          name: "Saladas de folhosas e abobrinha ralada",
          icons: ["Simbolo-vegano-300x300", "Simbolo-vegano-300x300"],
        },
      ],
    },
    served: ["breakfast", "lunch", "dinner"],
  };

  const message = formatMeals(objectToTest);

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

  await sock.sendMessage(process.env.NUMBER_NEWSLETTER, { text: message });

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "Message sent successfully.",
    }),
  };
}

connectionLogic();
