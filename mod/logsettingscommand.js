module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (
      !interaction.isCommand() ||
      interaction.commandName != "cruiser" ||
      interaction.options.getSubcommand(false) != "logs"
    )
      return;
    if (
      !interaction.member ||
      !(
        interaction.member.id == interaction.guild.ownerId ||
        (interaction.member.permissions.has("MANAGE_CHANNELS") && interaction.member.permissions.has("VIEW_AUDIT_LOG"))
      )
    )
      return await interaction.reply({
        content: "You do not have the required permissions!",
        ephemeral: true,
      });
    const thesetting = client[interaction.options.getString("type")];
    if (interaction.options.getChannel("channel") == null || interaction.options.getChannel("channel").type != "GUILD_TEXT") {
      await thesetting.delete(interaction.guild.id);
      return await interaction.reply({
        content:
          "Unset log channel for `" +
          interaction.options.getString("type") +
          "` succesfully.",
        ephemeral: true,
      });
    } else {
      await thesetting.set(
        interaction.guild.id,
        interaction.options.getChannel("channel").id
      );
      return await interaction.reply({
        content:
          "Set log channel for `" +
          interaction.options.getString("type") +
          "` to <#" +
          interaction.options.getChannel("channel").id +
          "> successfully.",
        ephemeral: true,
      });
    }
    return await interaction.reply({
      content: "An error occured",
      ephemeral: true,
    });
  });
};
