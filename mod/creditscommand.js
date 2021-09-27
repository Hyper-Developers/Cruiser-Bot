module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (
      interaction.commandName == "cruiser" &&
      interaction.options.getSubcommand() == "credits"
    ) {
      return await interaction.reply({
        content: ""+
          "Electro Cloud: Hyper Development Owner\n"+
          "Pandapip1: Main Developer\n"+
          "Androz2091: Invite Tracking & Backups\n"+
          "Discord.js: The library that Cruiser uses\n"+
          "Ksoft.si: Global Bans\n"+
          "DiscordRep: More Global Bans\n"+
          "VirusTotal: Virus and Link Scans\n"+
          "IPQualityScore: Faster Link Scans",
        ephemeral: true
      });
    }
  });
};
