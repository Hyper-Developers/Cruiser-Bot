module.exports = async (client) => {
  const invites = {};
  client.on("inviteCreate", async (invite) => {
    invites[invite.guild.id].push(invite);
  });

  client.on("inviteDelete", async (invite) => {
    invites[invite.guild.id] = invites[invite.guild.id].filter(
      (i) => i.code != invite.code
    );
  });

  client.on("guildMemberAdd", async (member) => {
    let g = member.guild;
    if (!invites[g.id]) invites[g.id] = await g.fetchInvites();
  });
};
