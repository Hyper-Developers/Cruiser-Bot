module.exports = async (client) => {
  const messagesLast3s = {};
  const repeatedMutes = {};
  client.on("messageCreate", async (msg) => {
    return;
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
      if (
        maximumRatelimits <= messagesLast3s[msg.member.id] &&
        channel.permissionsFor(msg.member).has("SEND_MESSAGES")
      ) {
        await channel.permissionOverwrites.edit(
          msg.member,
          {
            SEND_MESSAGES: false,
          },
          {
            reason: "Automatic mute triggered by influx of messages",
          }
        );
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
        repeatedMutes[msg.member.id] += 1;
        setTimeout(async () => {
          await channel.permissionOverwrites.edit(
            msg.member.id,
            {
              SEND_MESSAGES: true,
            },
            {
              reason: "Automatic mute ended",
            }
          );
          setTimeout(async () => {
            if (repeatedMutes[channel.id] == lockdownExp + 1) {
              repeatedMutes[channel.id] = 0;
            }
          }, 3000);
        }, 5 * Math.pow(2, lockdownExp));
      }
    }
  });
};
