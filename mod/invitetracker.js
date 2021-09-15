const utils = require("utils");
// A LOT OF CREDIT GOES TO https://github.com/TheShadowGamer/Invite-Manager
module.exports = async (client) => {
  return; // disable while in development
  const guildInvites = {};
  
  let sleep = utils.promisify(setTimeout);
  
  async function fetchInvites(guild){
    let data = await Promise.all([guild.fetchInvites(), guild.vanityURLCode ? guild.fetchVanityData() : sleep(0)]);
    let invites = data[0];
    if (guild.vanityURLCode)
      invites[guild.vanityURLCode] = data[1];
    return invites;
  }
  
  async function refreshInvites(guild){
    if (!(await client.enableInvitetrack.get(guild.id))) return;
    guildInvites[guild.id] = await fetchInvites(guild);
  }
  
  client.on("ready", async () => client.guilds.cache.forEach(refreshInvites));
  client.on("inviteCreate", async invite => refreshInvites(invite.guild));
  client.on("inviteDelete", async invite => refreshInvites(invite.guild));
  
  client.on("guildMemberAdd", async (member) => {
    if (!(await client.enableInvitetrack.get(member.guild.id))) return;
    if (member.partial) member = await member.fetch();
    let welcomeChannel = await this.client.channels.fetch(await client.invitetrackChannel.get(member.guild.id));
    let inviteMethod = {
      type: "UNKNOWN"
    };
    if (member.user.bot){
      let entry = null;
      let backoff = 0;
      while ((!entry || entry.target.id != member.id) && backoff <= 5){
        entry = (await member.guild.fetchAuditLogs({
          limit: 1,
          type: 'BOT_ADD',
        })).entries.first();
        await sleep(1000*Math.pow(2, backoff));
        backoff++;
      }
      inviteMethod = {
        type: "BOT_ADD",
        inviter: entry && entry.target.id == member.id ? entry.executor.id : 0
      }
    } else {
      const cachedInvites = guildInvites[member.guild.id];
      const newInvites = await fetchInvites(member.guild);
      guildInvites[member.guild.id] = newInvites;
      const usedInvite = newInvites.find(inv => newInvites[inv.code].uses > inv.uses || (inv.uses == inv.maxUses - 1 && !(inv.code in newInvites)));
      if (!usedInvite) {
        // unknown is default
      } else if (usedInvite.code === member.guild.vanityURLCode) {
        inviteMethod = {
          type: "VANITY_INVITE",
          code: usedInvite.code
        };
      } else if (usedInvite.code === (await guild.fetchWidgetSettings()).enabled ? (await member.guild.invites.fetch((await member.guild.fetchWidget()).instantInvite)).code : null){
        inviteMethod = {
          type: "WIDGET_INVITE",
          code: usedInvite.code
        };
      } else {
        inviteMethod = {
          type: "USER_INVITE",
          code: usedInvite.code,
          inviter: usedInvite.inviter.id
        };
      }
    }
  });
  
  client.on('guildMemberRemove', async member => {
    if (!(await client.enableInvitetrack.get(member.guild.id))) return;
  });
};
