module.exports = async client => {
  client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'cruiser') {
      if (interaction.options.getSubcommandGroup() === 'settings'){
        if (!interaction.member || !(interaction.member.id == interaction.guild.ownerId || interaction.member.permissions.has("ADMINISTRATOR"))){
          return await interaction.reply({ content: "You do not have the ADMINISTRATOR permission!", ephemeral: true });
        }
        switch (interaction.options.getSubcommand()){
          case "autoslowmode":
            if (interaction.options.get("target") == null){
              await client.targetRatelimits60s.delete(interaction.channelId);
            } else {
              await client.targetRatelimits60s.set(interaction.channelId, interaction.options.get("target").value);
            }
            break;
          case "autolockdown":
            if (interaction.options.get("threshold") == null){
              await client.maximumRatelimits3s.delete(interaction.channelId);
            } else {
              await client.maximumRatelimits3s.set(interaction.channelId, interaction.options.get("threshold").value);
            }
            break;
          case "virustotal":
            if (interaction.options.get("apikey") == null){
              await client.virustotalApikeys.delete(interaction.guild.id);
            } else {
              await client.virustotalApikeys.set(interaction.guild.id, interaction.options.get("apikey").value);
            }
            break;
        }
        return await interaction.reply({ content: 'Set option succesfully.', ephemeral: true });
      }
    }
  });
};
