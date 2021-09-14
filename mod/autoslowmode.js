module.exports = async (client) => {
  const messagesLast60s = {};
  client.on("messageCreate", async (msg) => {
    const channel = msg.channel;
    let targetRatelimit = await client.targetRatelimits60s.get(channel.id);
    if (
      targetRatelimit &&
      msg.member &&
      !msg.member.bot &&
      msg.member.id != msg.member.guild.ownerId &&
      !msg.member.permissions.has("MANAGE_MESSAGES") &&
      (!channel.permissionsFor(msg.member) ||
        !channel.permissionsFor(msg.member).has("MANAGE_MESSAGES"))
    ) {
      if (!(channel.id in messagesLast60s)) {
        messagesLast60s[channel.id] = 0;
      }
      messagesLast60s[channel.id] += 1;
      setTimeout(async () => {
        messagesLast60s[channel.id] -= 1;
        if (
          targetRatelimit &&
          Math.floor(channel.rateLimitPerUser) !=
            Math.floor((messagesLast60s[channel.id] / targetRatelimit) * 60)
        ) {
          await channel.setRateLimitPerUser(
            (messagesLast60s[channel.id] / targetRatelimit) * 60,
            "Automatic Slowmode of " + targetRatelimit + " per minute"
          );
        }
      }, 60000);
      if (
        targetRatelimit &&
        Math.floor(channel.rateLimitPerUser) !=
          Math.floor((messagesLast60s[channel.id] / targetRatelimit) * 60)
      ) {
        await channel.setRateLimitPerUser(
          (messagesLast60s[channel.id] / targetRatelimit) * 60,
          "Automatic Slowmode of " + targetRatelimit + " per minute"
        );
      }
    }
  });
};
