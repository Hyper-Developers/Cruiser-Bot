require("dotenv").config();
const Discord = require("discord.js");
const Keyv = require("@keyvhq/keyv");
const KeyvMySQL = require("@keyvhq/mysql");
const fs = require("fs");

(async () => {
  const client = new Discord.Client({
    intents: Object.values(Discord.Intents.FLAGS),
  });

  client.targetRatelimits60s = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "targetRatelimits60s",
  });
  client.maximumRatelimits3s = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "maximumRatelimits3s",
  });
  client.virustotalApikeys = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "virustotalApikeys",
  });
  client.enableDrep = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "enableDrep",
  });
  client.enableKsoft = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "enableKsoft",
  });
  client.enableAntibot = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "enableAntibot",
  });
  client.enableAntiwebhook = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "enableAntiwebhook",
  });
  client.enableAntinuke = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "enableAntinuke",
  });
  client.ipqsApikeys = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "ipqsApikeys",
  });
  client.antinukeTokens = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "antinukeTokens",
  });
  client.informationTokens = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: "informationTokens",
  });

  await Promise.all(
    fs
      .readdirSync("./mod")
      .filter((file) => file.endsWith(".js"))
      .map((file) => require(`./mod/${file}`)(client))
  );

  client.login(process.env.TOKEN);
})();
