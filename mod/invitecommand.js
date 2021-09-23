module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName == "cruiser" && interaction.options.getSubcommand() == "invite") {
      return await interaction.reply({
        content: "Links:",
        components: [
          {
            type: "ACTION_ROW",
            components: [
              {
                type: "BUTTON",
                label: "Invite Me",
                style: "LINK",
                emoji: "<:3475blurpleintegration:882743419783483455>",
                url: "https://discord.com/api/oauth2/authorize?client_id=834923899032567900&permissions=8&redirect_uri=https%3A%2F%2Fdiscord.com%2Foauth2%2Fauthorized&scope=applications.commands%20bot",
              },
              {
                type: "BUTTON",
                label: "Support Server",
                style: "LINK",
                emoji: "<:emoji_68:761124777519611955>",
                url: "https://discord.gg/XQSRmzz",
              },
            ],
          },
        ],
        ephemeral: true,
      });
    }
  });
};
