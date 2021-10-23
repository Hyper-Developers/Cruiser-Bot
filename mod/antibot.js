const util = require("util");

module.exports = async (client) => {
  let sleep = await util.promisify(setTimeout);

  const typings = {};
  let allowBypass = true;
  let bypassUsed = [];
  setTimeout(() => {
    allowBypass = false;
    bypassUsed = [];
  }, 60000);
  client.on("typingStart", async (typing) => {
    if (!typings[typing.user.id]) typings[typing.user.id] = [];
    typings[typing.user.id].push({
      channel: typing.channel.id,
      startedAt: typing.startedAt,
      startedTimestamp: typing.startedTimestamp,
    });
  });
  client.on("messageCreate", async (msg) => {
    if (
      msg.member &&
      !msg.member.user.bot &&
      !msg.attachments.size &&
      !msg.stickers.size &&
      !msg.activity &&
      (await client.enableAntibot.get(msg.guild.id))
    ) {
      let logChannel = await client.channels
        .fetch(await client.antiBotChannel.get(msg.guild.id))
        .catch((e) => {
          return null;
        });
      if (msg.embeds && msg.embeds.some((e) => e.type == "rich")){
        await logChannel.send(`<:bad:881629455964061717> <@!${msg.member.id}> sent a rich embed in <#${msg.channel.id}>`);
        return msg.delete();
      }
      if (msg.nonce === null){
        await logChannel.send(`<:bad:881629455964061717> <@!${msg.member.id}> sent a message without a nonce in <#${msg.channel.id}>`);
        return msg.delete();
      }
      await sleep(client.ws.ping * 4);
      if (
        (!allowBypass || bypassUsed.indexOf(msg.author.id) >= 0) &&
        (!typings[msg.member.id] ||
          !typings[msg.member.id].some((t) => t.channel == msg.channel.id)) &&
        msg.content.length >= 10 // Discord doesn't send typing until like 2 seconds
      ){
        await logChannel.send(`<:bad:881629455964061717> <@!${msg.member.id}> sent a message without typing in <#${msg.channel.id}>`);
        return msg.delete();
      }
      if (allowBypass) bypassUsed.push(msg.member.id);
      if (!typings[msg.member.id]) {
        typings[msg.member.id] = [];
        return;
      }
      if (
        typings[msg.member.id].filter((t) => t.channel != msg.channel.id)
          .length == 0
      )
        return;
      let firstTimestamp = (typings[msg.member.id] || []).filter(
        (t) => t.channel != msg.channel.id
      )[0];
      typings[msg.member.id] = (typings[msg.member.id] || []).filter(
        (t) => t.startedTimestamp == firstTimestamp
      );
    }
  });
};
