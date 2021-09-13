require("dotenv").config();
const Discord = require("discord.js");
const util = require('util');
const Keyv = require("@keyvhq/keyv");
const KeyvMySQL  = require("@keyvhq/mysql");
const nvt = require('node-virustotal');
const getUrls = require('get-urls');
const got = require("got");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const wget = require('node-wget-promise');
const Statcord = require("statcord.js");

const client = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_BANS,
		Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
		Discord.Intents.FLAGS.GUILD_WEBHOOKS,
		Discord.Intents.FLAGS.GUILD_INVITES,
		Discord.Intents.FLAGS.GUILD_VOICE_STATES,
		Discord.Intents.FLAGS.GUILD_PRESENCES,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING
	]
});

const statcord = new Statcord.Client({
    key: process.env.STATCORD,
    client,
});

statcord.on("autopost-start", () => {
    // Emitted when statcord autopost starts
    console.log("Started autopost");
});

const targetRatelimits60s = new Keyv({ store: new KeyvMySQL(process.env.MYSQL), namespace: 'targetRatelimits60s'});
const maximumRatelimits3s = new Keyv({ store: new KeyvMySQL(process.env.MYSQL), namespace: 'maximumRatelimits3s'});
const virustotalApikeys = new Keyv({ store: new KeyvMySQL(process.env.MYSQL), namespace: 'virustotalApikeys'});
const enableDrep = new Keyv({ store: new KeyvMySQL(process.env.MYSQL), namespace: 'enableDrep'});
const enableKsoft = new Keyv({ store: new KeyvMySQL(process.env.MYSQL), namespace: 'enableKsoft'});

const invites = {};
const messagesLast60s = {};
const messagesLast3s = {};
const repeatedLockdowns = {};

client.on("ready", async () => {
	console.log("Bot initialized");
	statcord.autopost();
});

client.on("inviteCreate", async invite => {
	invites[invite.guild.id].push(invite);
});

client.on("inviteDelete", async invite => {
	invites[invite.guild.id] = invites[invite.guild.id].filter(i => i.code != invite.code);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === 'cruiser') {
		if (interaction.options.getSubcommandGroup() === 'settings'){
			if (!interaction.member || !(interaction.member.id == interaction.guild.ownerId || interaction.member.permissions.has("ADMINISTRATOR"))){
				return await interaction.reply({ content: "You do not have the ADMINISTRATOR permission!", ephemeral: true });
			}
			switch (interaction.options.getSubcommand()){
				case "autoslowmode":
					if (interaction.options.get("target") == null){
						await targetRatelimits60s.delete(interaction.channelId);
					} else {
						await targetRatelimits60s.set(interaction.channelId, interaction.options.get("target").value);
					}
					break;
				case "autolockdown":
					if (interaction.options.get("threshold") == null){
                                                await maximumRatelimits3s.delete(interaction.channelId);
                                        } else {
                                                await maximumRatelimits3s.set(interaction.channelId, interaction.options.get("threshold").value);
                                        }
					break;
				case "virustotal":
                                        if (interaction.options.get("apikey") == null){
                                                await virustotalApikeys.delete(interaction.guild.id);
                                        } else {
                                                await virustotalApikeys.set(interaction.guild.id, interaction.options.get("apikey").value);
                                        }
                                        break;
			}
			return await interaction.reply({ content: 'Set option succesfully.', ephemeral: true });
		}
	} else if (interaction.commandName == "invite"){
		return await interaction.reply({
			content: "Links:",
			components: [{
				type: "ACTION_ROW",
				components: [
					{
						type: "BUTTON",
						label: "Invite Me",
						style: "LINK",
						emoji: "<:3475blurpleintegration:882743419783483455>",
						url: "https://discord.com/api/oauth2/authorize?client_id=834923899032567900&permissions=8&redirect_uri=https%3A%2F%2Fdiscord.com%2Foauth2%2Fauthorized&scope=applications.commands%20bot"
					},
					{
						type: "BUTTON",
						label: "Support Server",
						style: "LINK",
						emoji: "<:emoji_68:761124777519611955>",
						url: "https://discord.gg/XQSRmzz"
					}
				]
			}],
			ephemeral: true
		});
	}
});

client.on("messageCreate", async msg => {
	const channel = msg.channel;
	// Auto Slowmode
	let targetRatelimit = await targetRatelimits60s.get(channel.id);
	if (targetRatelimit && msg.member && !msg.member.bot && msg.member.id != msg.member.guild.ownerId && !msg.member.permissions.has("MANAGE_MESSAGES") && (!channel.permissionsFor(msg.member) || !channel.permissionsFor(msg.member).has("MANAGE_MESSAGES"))){
		if (!(channel.id in messagesLast60s)){
			messagesLast60s[channel.id] = 0;
		}
		messagesLast60s[channel.id] += 1;
		setTimeout(async () => {
			messagesLast60s[channel.id] -= 1;
			if (targetRatelimit && Math.floor(channel.rateLimitPerUser) != Math.floor(messagesLast60s[channel.id]/targetRatelimit*60)){
				await channel.setRateLimitPerUser(messagesLast60s[channel.id]/targetRatelimit*60, "Automatic Slowmode of "+targetRatelimit+" per minute");
			}
		}, 60000);
		if (targetRatelimit && Math.floor(channel.rateLimitPerUser) != Math.floor(messagesLast60s[channel.id]/targetRatelimit*60)){
			await channel.setRateLimitPerUser(messagesLast60s[channel.id]/targetRatelimit*60, "Automatic Slowmode of "+targetRatelimit+" per minute");
		}
	}
	// Auto Lockdown
	let maximumRatelimits = await maximumRatelimits3s.get(channel.id);
	if (maximumRatelimits && msg.member && !msg.member.bot && msg.member.id != msg.member.guild.ownerId && !msg.member.permissions.has("MANAGE_MESSAGES") && (!channel.permissionsFor(msg.member) || !channel.permissionsFor(msg.member).has("MANAGE_MESSAGES"))){
		if (!(channel.id in messagesLast3s)){
			messagesLast3s[channel.id] = 0;
			repeatedLockdowns[channel.id] = 0;
		}
		messagesLast3s[channel.id] += 1;
		setTimeout(async () => {
			messagesLast3s[channel.id] -= 1;
		}, 3000);
		if (maximumRatelimits <= messagesLast3s[channel.id] && channel.permissionsFor(channel.guild.roles.everyone).has("SEND_MESSAGES")){
			await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
 				'SEND_MESSAGES': false
			}, {
				reason: "Automatic lockdown triggered by influx of messages"
			});
			let doRepeat = true;
			while (doRepeat) {
				let lastMsgs = await channel.messages.fetch({ messages: 50 });
				let threesecsago = new Date(Date.now() - 3000);
				lastMsgs = lastMsgs.filter(m => m.createdAt.getTime() >= threesecsago.getTime());
				doRepeat = lastMsgs.length == 50;
				channel.bulkDelete(lastMsgs.filter(
					m => m &&
						m.member &&
						!m.member.bot &&
						m.member.id != m.guild.ownerId &&
						!m.member.permissions.has("MANAGE_MESSAGES") &&
						(!channel.permissionsFor(m.member) || !channel.permissionsFor(m.member).has("MANAGE_MESSAGES"))
				));
			}
			let lockdownExp = repeatedLockdowns[channel.id];
			repeatedLockdowns[channel.id] += 1;
                        await channel.send("Automatic lockdown for "+5*Math.pow(2, lockdownExp)+" seconds triggered by influx of messages");
                        setTimeout(async () => {
                                await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                                        'SEND_MESSAGES': true
                                }, {    
                                        reason: "Lockdown ended"
                                });
				await channel.send("Automatic lockdown for "+5*Math.pow(2, lockdownExp)+" seconds has ended.");
				setTimeout(async () => {
					if (repeatedLockdowns[channel.id] == lockdownExp + 1){
						repeatedLockdowns[channel.id] = 0;
					}
				}, 3000);
                        }, 5*Math.pow(2, lockdownExp));
		}
	}
	// Virus & Link Scans
	if ((await virustotalApikeys.get(msg.guild.id))){
		const defaultTimedInstance = nvt.makeAPI();
		defaultTimedInstance.setKey(await virustotalApikeys.get(msg.guild.id));
		var urls = Array.from(getUrls(msg.content));
		var attachments = [];
		await Promise.all(msg.attachments.map(async attachment => {
			if (attachment && attachment.proxyURL){
				!fs.existsSync(`./assets/`) && fs.mkdirSync(`./assets/`, { recursive: true })
				var attpath = path.resolve("/tmp/cruiser/scan", attachment.name);
				await wget(attachment.url, { output: attpath, onStart: console.log, onProgress: console.log });
				attachments.push({
					filename: attpath,
					mimetype: attachment.contentType,
				})
			}
		}));
		var newmsg = null;
		if (urls.length || attachments.length){
			newmsg = await msg.reply("<a:analyzinga:881686382941179924> Scanning URLs and/or attachments...");
		}
		var issus = false;
		for (var i = 0; i < urls.length; i++){
			const analysisraw = await util.promisify(defaultTimedInstance.initialScanURL)(urls[i]);
			const analysis = JSON.parse(analysisraw).data.id;
			const scanraw = await util.promisify(defaultTimedInstance.getAnalysisInfo)(analysis);
			const scan = JSON.parse(scanraw).data.attributes.stats;
			const scanlink = "https://www.virustotal.com/gui/url/"+analysis.substring(
			    analysis.indexOf("-") + 1, 
			    analysis.lastIndexOf("-")
			);
			if (scan.malicious){
				await newmsg.edit("<:bad:881629455964061717> URL sent by user <@!"+msg.author.id+"> is unsafe/malicious:\n"+scanlink);
				await msg.delete();
				return;
			} else if (scan.suspicious && !issus){
				await newmsg.edit("<:warning:881629456039571537> URL sent by user <@!"+msg.author.id+"> is suspicious:\n"+scanlink);
				issus = true;
			}
		}
		if (newmsg && !issus){
			for (var i = 0; i < attachments.length; i++){
				const fileraw = await util.promisify(defaultTimedInstance.uploadFile)(attachments[i].filename, attachments[i].mimetype);
				const analysis = nvt.sha256(await util.promisify(fs.readFile)(attachments[i].filename));
				const scanlink = "https://www.virustotal.com/gui/file/"+analysis;
				const scanraw = await util.promisify(defaultTimedInstance.fileLookup)(analysis);
				const scan = JSON.parse(scanraw).data.attributes.last_analysis_stats;
				if (scan.malicious){
					await newmsg.edit("<:bad:881629455964061717> Attachment sent by user <@!"+msg.author.id+"> is unsafe/malicious:\n"+scanlink);
					await msg.delete();
					return;
				} else if (scan.suspicious && !issus){
					await newmsg.edit("<:warning:881629456039571537> Attachment sent by user <@!"+msg.author.id+"> is suspicious:\n"+scanlink);
					issus = true;
				}
			}
			if (!issus){
				await newmsg.edit("<:good:881629715419516958> Message is safe!");
			}
		}
	}
});

client.on("guildMemberAdd", async member => {
	if (!invites[g.id]) invites[g.id] = await g.fetchInvites();
	let ksoftBanData = null;
	if (await enableKsoft.get(member.guild.id)) {
		try {
			ksoftBanData = (await axios({
				method: 'get',
				url: 'https://bans-data.ksoft.si/bans/'+member.id
			})).data;
		} catch {}
	}
	let discordRepInfractionsData = null;
	if (await enableDrep.get(member.guild.id)) {
		try {
			discordRepInfractionsData = (await axios({
				method: 'get',
				url: 'https://discordrep.com/api/v3/infractions/'+member.id,
				headers: {
					authorization: process.env.DREP
				}
			}).data;
		} catch {}
	}
	if (ksoftBanData && ksoftBanData.active){
		await member.send({
			content: "You are global banned by ksoft.si: "+ksoftBanData.banData,
			components: [{
				type: "ACTION_ROW",
				components: [{
					type: "BUTTON",
					style: "LINK",
					url: "https://bans.ksoft.si/user/"+member.id,
					label: "More Information (disabled due to bug)",
					disabled: true
				}, {
					type: "BUTTON",
					style: "LINK",
					url: "https://discord.gg/7bqdQd4",
					label: "Appeal"
				}]
			}]
		});
	}
	if (discordRepInfractionsData && discordRepInfractionsData.type && discordRepInfractionsData.type.toLowerCase() == "ban"){
		await member.send({
			content: "You are global banned by DiscordRep.com: "+discordRepInfractionsData.reason,
			components: [{
				type: "ACTION_ROW",
				components: [{
					type: "BUTTON",
					style: "LINK",
					url: "https://discordrep.com/u/"+member.id,
					label: "More Information"
				}, {
					type: "BUTTON",
					style: "LINK",
					url: "https://discord.gg/Cy2RMwh",
					label: "Appeal"
				}]
			}]
		});
	}
	// ref: https://git.farfrom.earth/aero/forks/drep.js/-/blob/master/src/endpoints/infractions.js
	// https://git.farfrom.earth/aero/forks/drep.js/-/blob/master/lib/structures/Ban.js
	if ((ksoftBanData && ksoftBanData.active) || (discordRepInfractionsData && discordRepInfractionsData.type && discordRepInfractionsData.type.toLowerCase() == "ban")){
		await member.kick((ksoftBanData.active ? 'Ksoft.si' : 'DiscordRep') + ((ksoftBanData.active && false) ? ' and DiscordRep' : '') + ' global banned');
	}
});

client.login(process.env.TOKEN);
