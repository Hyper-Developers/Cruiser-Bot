// Prevent user roles from being granted moderation perms

module.exports = async (client) => {
  let modperms = [
    "KICK_MEMBERS",
    "BAN_MEMBERS",
    "ADMINISTRATOR",
    "MANAGE_CHANNELS",
    "MANAGE_GUILD",
    "VIEW_AUDIT_LOG",
    "PRIORITY_SPEAKER",
    "SEND_TTS_MESSAGES",
    "MANAGE_MESSAGES",
    "MENTION_EVERYONE",
    "VIEW_GUILD_INSIGHTS",
    "MUTE_MEMBERS",
    "DEAFEN_MEMBERS",
    "MOVE_MEMBERS",
    "MANAGE_NICKNAMES",
    "MANAGE_ROLES",
    "MANAGE_WEBHOOKS",
    "MANAGE_EMOJIS_AND_STICKERS",
    "MANAGE_THREADS",
    "USE_PUBLIC_THREADS",
    "USE_PRIVATE_THREADS",
  ];
  client.on("guildCreate", async (guild) => {
    guild.roles.cache.forEach(async (role) => {
      if (role.members.length / role.guild.members.length < 0.2) return;
      let newperms = role.permissions;
      await Promise.all(
        modperms.map(async (perm) => {
          if (role.permissions.has(perm, false)) {
            newperms = newperms.remove(perm);
          }
        })
      );
      if (!role.permissions.has(newperms)) {
        await role.setPermissions(
          newperms,
          "Removed abusable permissions from presumed public role"
        );
      }
    });
  });
  client.on("roleUpdate", async (oldRole, role) => {
    if (!(await client.enableAntiabuse.get(role.guild.id))) return;
    if (role.members.length / role.guild.members.length < 0.2) return;
    let newperms = role.permissions;
    await Promise.all(
      modperms.map(async (perm) => {
        if (
          !oldRole.permissions.has(perm, false) &&
          role.permissions.has(perm, false)
        ) {
          newperms = newperms.remove(perm);
        }
      })
    );
    if (!role.permissions.has(newperms)) {
      await role.setPermissions(newperms, "Anti-Abuse triggered");
      let logChannel = await client.channels
        .fetch(await client.antiAbuseLogChannel.get(role.guild.id))
        .catch((e) => {
          return null;
        });
      if (logChannel)
        await logChannel.send(`<:bad:881629455964061717> Removed abusable permissions from presumed public role`);
    }
  });
};
