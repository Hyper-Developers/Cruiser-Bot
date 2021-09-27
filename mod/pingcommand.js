module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (
      interaction.commandName == "cruiser" &&
      interaction.options.getSubcommand() == "ping"
    ) {
      return await interaction.reply({
        content: `Ping: \`${client.ws.ping} ms\``,
        ephemeral: true,
      });
    }
  });
};
