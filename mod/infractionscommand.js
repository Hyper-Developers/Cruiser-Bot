module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (
      !interaction.isCommand() ||
      interaction.commandName != "cruiser" ||
      interaction.options.getSubcommandGroup(false) != "infractions"
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
      antispam: [client.autoInitial, interaction.guild.id, "initial"],
      antivirus: [
        client.antivirusPunishments,
        interaction.guild.id,
        "threshold",
      ],
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
        thesetting[1],
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
