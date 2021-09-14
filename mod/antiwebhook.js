module.exports = async (client) => {
  client.on("messageCreate", async (msg) => {
    if (msg.webhookId && (await client.enableAntiwebhook.get(msg.guild.id))) {
      if (
        msg.mentions.everyone ||
        msg.mentions.roles.filter(
          (r) => r.members.length / r.guild.members.length > 0.2
        ) ||
        msg.mentions.users.length > 5
      ) {
        await (await msg.fetchWebhook()).delete();
      }
    }
  });
};
