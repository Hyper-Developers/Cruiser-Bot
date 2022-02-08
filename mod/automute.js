module.exports = async (client) => {
  const messagesLast3s = {};
  const repeatedMutes = {};
  client.on("messageCreate", async (msg) => {
    let channel = msg.channel;
    let maximumRatelimits = await client.maximumRatelimitsPerUser3s.get(
      channel.id
    );
    if (
      maximumRatelimits &&
      msg.member &&
      !msg.member.bot &&
      msg.member.id != msg.member.guild.ownerId &&
      !msg.member.permissions.has("MANAGE_MESSAGES") &&
      (!channel.permissionsFor(msg.member) ||
        !channel.permissionsFor(msg.member).has("MANAGE_MESSAGES"))
    ) {
      if (!(msg.member.id in messagesLast3s)) {
        messagesLast3s[msg.member.id] = 0;
        repeatedMutes[msg.member.id] = 0;
      }
      messagesLast3s[msg.member.id] += 1;
      setTimeout(async () => {
        messagesLast3s[msg.member.id] -= 1;
      }, 3000);
      if (maximumRatelimits <= messagesLast3s[msg.member.id]) {
        let doRepeat = true;
        while (doRepeat) {
          let lastMsgs = await channel.messages.fetch({ messages: 50 });
          let threesecsago = new Date(Date.now() - 3000);
          lastMsgs = lastMsgs.filter(
            (m) => m.createdAt.getTime() >= threesecsago.getTime()
          );
          doRepeat = lastMsgs.length == 50;
          channel.bulkDelete(
            lastMsgs.filter(
              (m) => m && m.member && m.member.id == msg.member.id
            )
          );
        }
        let lockdownExp = repeatedMutes[msg.member.id];
        let lockdownLen =
          parseInt((await client.autoInitial.get(channel.guild.id)) || 5) *
          Math.pow(2, lockdownExp);
        await msg.member.timeout(lockdownLen * 1000);
        repeatedMutes[msg.member.id] += 1;
        setTimeout(async () => {
          if (repeatedMutes[msg.member.id] == lockdownExp + 1) {
            repeatedMutes[msg.member.id] = 0;
          }
        }, lockdownLen * 1000 * 2);
      }
    }
  });
};
