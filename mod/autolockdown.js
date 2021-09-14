module.exports = async client => {
  const messagesLast3s = {};
  const repeatedLockdowns = {};
  client.on("messageCreate", async msg => {
    let channel = msg.channel;
    let maximumRatelimits = await client.maximumRatelimits3s.get(channel.id);
    if (maximumRatelimits && msg.member && !msg.member.bot && msg.member.id != msg.member.guild.ownerId && !msg.member.permissions.has("MANAGE_MESSAGES") && (!channel.permissionsFor(msg.member) || !channel.permissionsFor(msg.member).has("MANAGE_MESSAGES"))){
      if (!(channel.id in messagesLast3s)){
        messagesLast3s[channel.id] = 0;
        repeatedLockdowns[channel.id] = 0;
      }
      messagesLast3s[channel.id] += 1;
      setTimeout(async () => {
        messagesLast3s[channel.id] -= 1;
      }, 3000);
      if (maximumRatelimits <= messagesLast3s[channel.id] && channel.permissionsFor(channel.guild.roles.everyone).has("SEND_MESSAGES")){
        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
          'SEND_MESSAGES': false
        }, {
          reason: "Automatic lockdown triggered by influx of messages"
        });
        let doRepeat = true;
        while (doRepeat) {
          let lastMsgs = await channel.messages.fetch({ messages: 50 });
          let threesecsago = new Date(Date.now() - 3000);
          lastMsgs = lastMsgs.filter(m => m.createdAt.getTime() >= threesecsago.getTime());
          doRepeat = lastMsgs.length == 50;
          channel.bulkDelete(lastMsgs.filter(
            m => m &&
              m.member &&
              !m.member.bot &&
              m.member.id != m.guild.ownerId &&
              !m.member.permissions.has("MANAGE_MESSAGES") &&
              (!channel.permissionsFor(m.member) || !channel.permissionsFor(m.member).has("MANAGE_MESSAGES"))
          ));
        }
        let lockdownExp = repeatedLockdowns[channel.id];
        repeatedLockdowns[channel.id] += 1;
        await channel.send("Automatic lockdown for "+5*Math.pow(2, lockdownExp)+" seconds triggered by influx of messages");
        setTimeout(async () => {
                await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                        'SEND_MESSAGES': true
                }, {    
                        reason: "Lockdown ended"
                });
                await channel.send("Automatic lockdown for "+5*Math.pow(2, lockdownExp)+" seconds has ended.");
                setTimeout(async () => {
                  if (repeatedLockdowns[channel.id] == lockdownExp + 1){
                    repeatedLockdowns[channel.id] = 0;
                  }
                }, 3000);
        }, 5*Math.pow(2, lockdownExp));
      }
    }
  });
};
