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
          let logChannel = await client.channels
            .fetch(await client.antiAbuseLogChannel.get(msg.guild.id))
            .catch((e) => {
              return null;
            });
          await (await msg.fetchWebhook()).delete();
          if (logChannel)
            await logChannel.send(`<:bad:881629455964061717> Deleted abusive webhook.`);
        } catch {}
      }
    }
  });
};
