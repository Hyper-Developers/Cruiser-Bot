const InvitesTracker = require("@androz2091/discord-invites-tracker");
// A LOT OF CREDIT GOES TO https://github.com/TheShadowGamer/Invite-Manager

module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (
      !interaction.isCommand() ||
      interaction.commandName != "cruiser" ||
      interaction.options.getSubcommandGroup(false) != "invites"
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
    return await interaction.reply({
      content: "NOT IMPLEMENTED",
      ephemeral: true,
    });
  });
  return;
  const invites = {};
  client.on('ready', async () => {
    await client.guilds.fetch();
    client.guilds.cache.forEach(async g => {
      const guildInvites = await g.fetchInvites();
      invites[g.id] = guildInvites;
    });
  });
  client.on('inviteCreate', invite => {
    const guildInvites = await invite.guild.fetchInvites();
    invites[guild.id] = guildInvites;
  });
  client.on('inviteDelete', invite => {
    const guildInvites = await invite.guild.fetchInvites();
    invites[guild.id] = guildInvites;
  });
  client.on('guildCreate', invite => {
    const guildInvites = await invite.guild.fetchInvites();
    invites[guild.id] = guildInvites;
  });
  client.on('guildMemberAdd', await member => {
    const guildInvites = await member.guild.fetchInvites();
    const ei = invites[member.guild.id];
    invites[member.guild.id] = guildInvites;
    const invite = guildInvites.find(i => ei.get(i.code).uses < i.uses);
    const inviter = client.users.cache.get(invite.inviter.id);
  });
};
