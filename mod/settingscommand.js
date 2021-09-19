module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (
      !interaction.isCommand() ||
      (interaction.commandName != "cruiser" &&
        interaction.options.getSubcommandGroup() != "settings")
    )
      return;
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
    const settings = {
      autoslowmode: [
        client.targetRatelimits60s,
        interaction.channel.id,
        "target",
      ],
      autolockdown: [
        client.maximumRatelimits3s,
        interaction.channel.id,
        "threshold",
      ],
      virustotal: [client.virustotalApikeys, interaction.guild.id, "apikey"],
      ksoft: [client.enableKsoft, interaction.guild.id, "enabled"],
      drep: [client.enableDrep, interaction.guild.id, "enabled"],
      antibot: [client.enableAntibot, interaction.guild.id, "enabled"],
      antiwebhook: [client.enableAntiwebhook, interaction.guild.id, "enabled"],
      ipqs: [client.ipqsApikeys, interaction.guild.id, "secret"]
    };
    const thesetting = settings[interaction.options.getSubcommand()];
    if (interaction.options.get(thesetting[2]) == null) {
      await thesetting[0].delete(thesetting[1]);
      return await interaction.reply({
        content:
          "Unset option `" +
          interaction.options.getSubcommand() +
          "` succesfully.",
        ephemeral: true,
      });
    } else {
      await thesetting[0].set(
        interaction.channelId,
        interaction.options.get(thesetting[2]).value
      );
      return await interaction.reply({
        content:
          "Set option `" +
          interaction.options.getSubcommand() +
          "` to `" +
          interaction.options.get(thesetting[2]).value +
          "` successfully.",
        ephemeral: true,
      });
    }
  });
};
