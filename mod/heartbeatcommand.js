module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (
      interaction.commandName == "cruiser" &&
      interaction.options.getSubcommand() == "heartbeat"
    ) {
      if (
        !interaction.member ||
        !(
          interaction.member.id == interaction.guild.ownerId ||
          interaction.member.permissions.has("ADMINISTRATOR")
        )
      )
        return await interaction.reply({
          content: "You do not have the ADMINISTRATOR permission!",
          ephemeral: true,
        });
      if (!interaction.guild.me.permissions.has("ADMINISTRATOR"))
        return await interaction.reply({
          content:
            "<:bad:881629455964061717> There is a major issue with your configuration:\n<:Reply:892089083172630539> <@!834923899032567900> does not have Administrator permission. This is needed so that <@!834923899032567900> can manage all <:member:901459666716991499> members, <:channel:901459667002224710> channels, and <:role:901459667077718036> roles.",
          ephemeral: true,
        });
      let guildWarns = [
        "VirusTotal Anti-Virus and Anti-Scam is disabled.",
        "IPQualityScore Anti-Scam is disabled.",
        "KSoft.si global bans are disabled.",
        "DiscordRep global bans are disabled.",
        "Cruiser anti-selfbot is disabled.",
        "Cruiser anti-webhook abuse is disabled.",
      ];
      let guildWarnsEnabled = (
        await Promise.all(
          [
            client.virustotalApikeys,
            client.ipqsApikeys,
            client.enableKsoft,
            client.enableDrep,
            client.enableAntibot,
            client.enableAntiwebhook,
          ].map((db) => db.get(interaction.guild.id))
        )
      ).map((e) => !e);
      if (!guildWarnsEnabled.some((e) => e))
        return await interaction.reply({
          content: "<:good:881629715419516958> Everything is good!",
          ephemeral: true,
        });
      let result =
        "<:warning:881629456039571537> There are potential issues with your configuration:\n" +
        guildWarns
          .filter((e, i) => guildWarnsEnabled[i])
          .map(
            (e, i, o) =>
              (i == o.length - 1
                ? "<:Reply:892089083172630539>"
                : "<:Reply_Continued:892089615484330014>") +
              " " +
              e
          )
          .join("\n") +
        "\nGo to <https://github.com/Hyper-Developers/Cruiser-Frontend/wiki/Configuration-Tutorial> for more information.";
      return await interaction.reply({
        content: result,
        ephemeral: true,
      });
    }
  });
};
