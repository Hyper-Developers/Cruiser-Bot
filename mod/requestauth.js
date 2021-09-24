module.exports = async client => {
  let sendReminder = async member => {
    if (!(await client.enableAntinuke(member.guild.id)) || await client.antinukeReminderCooldown(member.guild.id) > Date.now()) return;
    await member.send({
      content: `emotehere \`${member.guild.name.replace("`", "\\`")}\` uses <@!${client.user.id}>'s automatic Anti-Nuke, which re-adds you in the case that you are falsely banned during a raid. Please click the button below to authorize <@!${client.user.id}>.`,
      components: [{
        type: "ACTION_ROW",
        components: [{
          type: "BUTTON",
          style: "LINK",
          label: "Authorize",
          url: "https://discord.com/oauth2/authorize?client_id=834923899032567900&scope=identify%20guilds.join&redirect_uri=https%3A%2F%2Fhyper-developers.github.io%2FCruiser-Frontend%2Fauthorized.html&state=requestguildsjointoken"
        }]
      }]
    });
    await client.antinukeReminderCooldown.set(member.id, new Date(Date.now().getTime()+1000*60*60*24));
  };
  client.on("messageCreate", async msg => {
    if (!msg.guild) return;
    sendReminder(msg.member);
    // https://discord.com/oauth2/authorize?client_id=834923899032567900&scope=identify%20identify.email%20connections%20guilds&redirect_uri=https%3A%2F%2Fhyper-developers.github.io%2FCruiser-Frontend%2Fauthorized.html&state=requestinformationtoken
  });
  client.on("guildMemberAdd", async member => {
    sendReminder(member);
  });
}
