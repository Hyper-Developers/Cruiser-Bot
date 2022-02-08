require("dotenv").config();
const Discord = require("discord.js");
const Keyv = require("@keyvhq/core");
const KeyvMySQL = require("@keyvhq/mysql");
const fs = require("fs");

function addDatabase(client, prop, namespace) {
  client[prop] = new Keyv({
    store: new KeyvMySQL(process.env.MYSQL),
    namespace: namespace,
  });
}

const databases = {
  // Anti-spam
  "targetRatelimits60s": "targetRatelimits60s",
  "maximumRatelimits3s": "maximumRatelimits3s",
  "maximumRatelimitsPerUser3s": "maximumRatelimitsPerUser3s",
  "autoInitial": "autoInitial",
  // Anti-malicious message
  "enableAntibot": "enableAntibot",
  "ipqsApikeys": "ipqsApikeys",
  "virustotalApikeys": "virustotalApikeys",
  "enableAntiwebhook": "enableAntiwebhook",
  "antivirusPunishments": "antivirusPunishments",
  // Anti-nuke backups
  "enableAntinuke": "enableAntinuke",
  "antinukeTokens": "antinukeTokens",
  "antinukeReminderCooldown": "antinukeReminderCooldown",
  // Anti-abuse
  "enableAntiabuse": "enableAntiabuse",
  // Anti-bot joins
  "enableHumanVerification": "enableHumanVerification",
  "humanVerificationNeeded": "humanVerificationNeeded",
  "informationTokens": "informationTokens",
  "enableDrep": "enableDrep",
  "enableKsoft": "enableKsoft",
  // Invite tracking
  "enableInvitetracking": "enableInvitetracking",
  "invitesUsed": "invitesUsed",
  // Log channels
  "auditLogChannel": "auditLogChannel",
  "configLogChannel": "configLogChannel",
  "antiAbuseLogChannel": "antiAbuseLogChannel",
  "antiScamLogChannel": "antiScamLogChannel",
  "antiBotChannel": "antiBotChannel",
  "backupsLogChannel": "backupsLogChannel",
  "joinleaveLogChannel": "joinleaveLogChannel"
}

(async () => {
  const client = new Discord.Client({
    intents: Object.values(Discord.Intents.FLAGS),
  });

  Object.keys(databases).forEach(key => addDatabase(client, key, databases[key]));

  await Promise.all(
    fs
      .readdirSync("./mod")
      .filter((file) => file.endsWith(".js"))
      .map((file) => require(`./mod/${file}`)(client))
  );

  client.login(process.env.TOKEN);
})();
