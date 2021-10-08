module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (
      !interaction.isCommand() ||
      interaction.commandName != "cruiser" ||
      interaction.options.getSubcommand(false) != "history"
    )
      return;
    if (
      !interaction.member ||
      !(
        interaction.member.id == interaction.guild.ownerId ||
        interaction.member.permissions.has("VIEW_AUDIT_LOG")
      )
    )
      return await interaction.reply({
        content: "You do not have the VIEW_AUDIT_LOG permission!",
        ephemeral: true,
      });
    return await interaction.reply({
      content: "NOT IMPLEMENTED",
      ephemeral: true,
    });
  });
};
