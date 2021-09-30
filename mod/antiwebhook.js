module.exports = async (client) => {
  client.on("messageCreate", async (msg) => {
    if (msg.webhookId && (await client.enableAntiwebhook.get(msg.guild.id))) {
      if (
        msg.mentions.everyone ||
        msg.mentions.roles.filter(
          (r) => r.members.size / r.guild.members.size > 0.2
        ).size > 0 ||
        msg.mentions.users.size > 5
      ) {
        try {
          await (await msg.fetchWebhook()).delete();
        } catch {}
      }
    }
  });
};
