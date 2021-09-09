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

const messagesLast60s = {};
const messagesLast3s = {};


client.on("ready", async () => {
	console.log("Bot initialized");
	statcord.autopost();
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
	if (msg.author.bot) return;
	if (!(await virustotalApikeys.get(msg.guild.id))){
		console.log("API Key not config'd");
		return;
	}
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
	console.log("Download done");
	var newmsg = null;
	if (urls.length || attachments.length){
		newmsg = await msg.channel.send("<a:analyzinga:881686382941179924> Scanning URLs and/or attachments...");
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
			console.log(scanlink);
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
	console.log(urls);
});

client.on("messageCreate", async msg => {
	const channel = msg.channel;
	if (!(channel.id in messagesLast60s)){
		messagesLast60s[channel.id] = 0;
	}
	if (msg.member && msg.member.id != msg.member.guild.ownerId && !msg.member.permissions.has("MANAGE_MESSAGES") && (!channel.permissionsFor(msg.member) || !channel.permissionsFor(msg.member).has("MANAGE_MESSAGES"))){
		messagesLast60s[channel.id] += 1;
		setTimeout(async () => {
			messagesLast60s[channel.id] -= 1;
			if (await targetRatelimits60s.get(channel.id)){
				await channel.setRateLimitPerUser(messagesLast60s[channel.id]/(await targetRatelimits60s.get(channel.id))*60, "message flow");
			}
		}, 60000);
		if (await targetRatelimits60s.get(channel.id)){
			await channel.setRateLimitPerUser(messagesLast60s[channel.id]/(await targetRatelimits60s.get(channel.id))*60, "message flow");
		}
	}
});

client.on("messageCreate", async msg => {
	const channel = msg.channel;
	if (!(channel.id in messagesLast3s)){
		messagesLast3s[channel.id] = 0;
	}
	messagesLast3s[channel.id] += 1;
	console.log(messagesLast3s[channel.id]);
	setTimeout(async () => {
		messagesLast3s[channel.id] -= 1;
	}, 3000);
	console.log(await maximumRatelimits3s.get(channel.id));
	if (await maximumRatelimits3s.get(channel.id)){
		if (await maximumRatelimits3s.get(channel.id) <= messagesLast3s[channel.id] && channel.permissionsFor(channel.guild.roles.everyone).has("SEND_MESSAGES")){
			await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
 				'SEND_MESSAGES': false
			}, {
				reason: "Automatic lockdown triggered by influx of messages"
			});
                        await channel.send("Automatic lockdown for 1 minute triggered by influx of messages");
                        setTimeout(async () => {
                                await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                                        'SEND_MESSAGES': true
                                }, {    
                                        reason: "Lockdown ended"
                                });
				await channel.send("Automatic lockdown for 1 minute has ended.");
                        }, 60000);
		}
	}
});

client.login(process.env.TOKEN);
