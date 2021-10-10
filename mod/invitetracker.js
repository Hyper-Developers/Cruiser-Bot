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
  const tracker = InvitesTracker.init(client, {
    fetchGuilds: true,
    fetchVanity: true,
    fetchAuditLogs: true,
  });
  tracker.on("guildMemberAdd", async (member, type, invite) => {
    if (!(await client.enableInvitetracking.get(member.guild.id))) return;
    if (!(await client.invitesUsed.get(member.guild.id))) {
      await client.invitesUsed.set(member.guild.id, {});
    }
    let invitesUsed = await client.invitesUsed.get(member.guild.id);
    if (type === "normal") {
      invitesUsed[member.id] = {
        version: 1,
        type: "invite",
        invite: {
          code: invite.code,
          inviter: invite.inviter.id,
        },
      };
    } else if (type === "vanity") {
      invitesUsed[member.id] = {
        version: 1,
        type: "invite_vanity",
        invite: {
          code: member.guild.vanityURLCode,
        },
      };
    } else if (type === "unknown") {
      invitesUsed[member.id] = {
        version: 1,
        type: "unknown",
      };
    } else if (type === "permissions") {
      invitesUsed[member.id] = {
        version: 1,
        type: "unknown_permissions",
      };
    }
    await client.invitesUsed.set(member.guild.id, invitesUsed);
  });
};
