const InvitesTracker = require('@androz2091/discord-invites-tracker');
// A LOT OF CREDIT GOES TO https://github.com/TheShadowGamer/Invite-Manager
module.exports = async (client) => {
  return; // disable while in development
  const tracker = InvitesTracker.init(client, {
      fetchGuilds: true,
      fetchVanity: true,
      fetchAuditLogs: true
  });
  tracker.on('guildMemberAdd', (member, type, invite) => {
      if (type === 'normal'){
          
      } else if(type === 'vanity'){
          
      } else if(type === 'unknown'){
          
      } else if(type === 'permissions'){
          
      }
  });
};
