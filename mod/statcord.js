const Statcord = require("statcord.js");

module.exports = async client => {
  const statcord = new Statcord.Client({
      key: process.env.STATCORD,
      client,
  });
  
  statcord.on("autopost-start", () => {
      console.log("Started Statcord autopost");
  });

  client.on("ready", async () => {
    console.log("Started Bot");
    statcord.autopost();
  });
}
