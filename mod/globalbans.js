const axios = require("axios");

module.exports = async (client) => {
  client.on("guildMemberAdd", async (member) => {
    let logChannel = await client.channels
      .fetch(await client.joinleaveLogChannel.get(member.guild.id))
      .catch((e) => {
        return null;
      });
    let ksoftBanData = null;
    if (await client.enableKsoft.get(member.guild.id)) {
      try {
        ksoftBanData = (
          await axios({
            method: "get",
            url: "https://bans-data.ksoft.si/bans/" + member.id,
          })
        ).data;
      } catch {}
    }
    let ksoftBanned = ksoftBanData && ksoftBanData.active;
    if (ksoftBanned) {
      await member.send({
        content:
          "You are global banned by ksoft.si: " + ksoftBanData.banData.reason,
        components: [
          {
            type: "ACTION_ROW",
            components: [
              {
                type: "BUTTON",
                style: "LINK",
                url: "https://bans.ksoft.si/user/" + member.id,
                label: "Your Ksoft.si Ban Page",
                disabled: true,
              },
              {
                type: "BUTTON",
                style: "LINK",
                url: "https://discord.gg/7bqdQd4",
                label: "Appeal Ksoft.si Ban",
              },
            ],
          },
        ],
      });
      await logChannel.send(
        `<:bad:881629455964061717> Member \`${member.user.tag.replaceAll(
          "`",
          "`"
        )}\` is global banned by <:ksoft:901516737198055485> Ksoft.si:\n\`\`\`${ksoftBanData.banData.reason.replaceAll(
          "`",
          "`"
        )}\`\`\``
      );
      return member.kick("Ksoft.si: " + ksoftBanData.banData.reason);
    }
    let discordRepInfractionsData = null;
    if (await client.enableDrep.get(member.guild.id)) {
      try {
        discordRepInfractionsData = (
          await axios({
            method: "get",
            url: "https://discordrep.com/api/v3/infractions/" + member.id,
            headers: {
              authorization: process.env.DREP,
            },
          })
        ).data;
      } catch {}
    }
    let drepBanned =
      discordRepInfractionsData &&
      discordRepInfractionsData.type &&
      discordRepInfractionsData.type.toLowerCase() == "ban";
    // ref: https://git.farfrom.earth/aero/forks/drep.js/-/blob/master/src/endpoints/infractions.js
    // https://git.farfrom.earth/aero/forks/drep.js/-/blob/master/lib/structures/Ban.js
    if (drepBanned) {
      await member.send({
        content:
          "You are global banned by DiscordRep.com: " +
          discordRepInfractionsData.reason,
        components: [
          {
            type: "ACTION_ROW",
            components: [
              {
                type: "BUTTON",
                style: "LINK",
                url: "https://discordrep.com/u/" + member.id,
                label: "Your DiscordRep Profile Page",
              },
              {
                type: "BUTTON",
                style: "LINK",
                url: "https://discord.gg/Cy2RMwh",
                label: "Appeal DiscordRep Ban",
              },
            ],
          },
        ],
      });
      await logChannel.send(
        `<:bad:881629455964061717> Member \`${member.user.tag.replaceAll(
          "`",
          "`"
        )}\` is global banned by <:DR:901516919243415603> DiscordRep:\n\`\`\`${discordRepInfractionsData.reason.replaceAll(
          "`",
          "`"
        )}\`\`\``
      );
      return member.kick("DiscordRep: " + discordRepInfractionsData.reason);
    }
    await logChannel.send(
      `<:good:881629715419516958> Member \`${member.user.tag.replaceAll(
        "`",
        "`"
      )}\` is not global banned by <:DR:901516919243415603> DiscordRep or <:ksoft:901516737198055485> Ksoft.Si.`
    );
  });
};
