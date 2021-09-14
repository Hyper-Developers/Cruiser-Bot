module.exports = async (client) => {
  const typings = {};
  client.on("typingStart", async (typing) => {
    if (!typings[typing.user.id]) typings[typing.user.id] = [];
    typings[typing.user.id].push({
      channel: typing.channel.id,
      startedAt: typing.startedAt,
    });
  });
  client.on("messageCreate", async (msg) => {
    if (
      msg.member &&
      !msg.member.bot &&
      (await client.enableAntibot.get(msg.guild.id))
    ) {
      let typing = typings[typing.user.id]
        ? typings[typing.user.id].filter((t) => t.channel == msg.channel.id)[0]
        : null;
      if (
        !typing ||
        typing.startedAt > new Date(Date.now() - msg.content.length / 10) ||
        msg.embeds
      )
        return msg.delete();
      typings[typing.user.id] = typings[typing.user.id]
        ? typings[typing.user.id].filter((t) => t.channel != msg.channel.id)
        : [];
    }
  });
};
