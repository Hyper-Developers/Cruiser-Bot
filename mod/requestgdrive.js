const { v1: uuidv1, v4: uuidv4 } = require("uuid");

module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (
      interaction.commandName == "cruiser" &&
      interaction.options.getSubcommand() == "storage"
    ) {
      const state = uuidv1();
      client.googleDriveStateToUserId[state] = interaction.user.id;
      return await interaction.reply({
        content: `https://accounts.google.com/o/oauth2/auth?user_id=&include_granted_scopes=true&client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&scope=https://www.googleapis.com/auth/drive.appdata&state=${state}`,
        ephemeral: true,
      });
    }
  });
};
