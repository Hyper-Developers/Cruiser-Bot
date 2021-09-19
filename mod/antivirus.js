const getUrls = require("get-urls");
const wget = require("node-wget-promise");
const path = require("path");
const util = require("util");
const nvt = require("node-virustotal");
const fs = require("fs");

module.exports = async (client) => {
  client.on("messageCreate", async (msg) => {
    if (msg.guild && await client.virustotalApikeys.get(msg.guild.id)) {
      const channel = msg.channel;
      const defaultTimedInstance = nvt.makeAPI();
      defaultTimedInstance.setKey(
        await client.virustotalApikeys.get(msg.guild.id)
      );
      var urls = Array.from(getUrls(msg.content));
      var attachments = [];
      await Promise.all(
        msg.attachments.map(async (attachment) => {
          if (attachment && attachment.proxyURL) {
            !fs.existsSync(`./assets/`) &&
              fs.mkdirSync(`./assets/`, { recursive: true });
            var attpath = path.resolve("/tmp/cruiser/scan", attachment.name);
            await wget(attachment.url, {
              output: attpath,
              onStart: console.log,
              onProgress: console.log,
            });
            attachments.push({
              filename: attpath,
              mimetype: attachment.contentType,
            });
          }
        })
      );
      var reaction = null;
      if (urls.length || attachments.length) {
        reaction = await msg.react("<a:analyzing:884596286039396432>");
      }
      var issus = false;
      for (var i = 0; i < urls.length; i++) {
        const analysisraw = await util.promisify(
          defaultTimedInstance.initialScanURL
        )(urls[i]);
        const analysis = JSON.parse(analysisraw).data.id;
        const scanraw = await util.promisify(
          defaultTimedInstance.getAnalysisInfo
        )(analysis);
        const scan = JSON.parse(scanraw).data.attributes.stats;
        const scanlink =
          "https://www.virustotal.com/gui/url/" +
          analysis.substring(
            analysis.indexOf("-") + 1,
            analysis.lastIndexOf("-")
          );
        if (scan.malicious && scan.malicious > 2) {
          await channel.send(
            "<:bad:881629455964061717> URL sent by user <@!" +
              msg.author.id +
              "> is unsafe/malicious:\n" +
              scanlink
          );
          await msg.delete();
          return;
        } else if (!issus && ((scan.malicious && scan.malicious > 1) || (scan.malicious && scan.suspicious && (scan.malicious + scan.suspicious > 2)) || (scan.suspicious && scan.suspicious > 2))) {
          if (msg.deleted){
            await channel.send(
            "<:warning:881629456039571537> URL sent by user <@!" +
              msg.author.id +
              "> is suspicious:\n" +
              scanlink
            );
          } else {
            await msg.reply(
              "<:warning:881629456039571537> URL sent by user <@!" +
                msg.author.id +
                "> is suspicious:\n" +
                scanlink
            );
          }
          issus = true;
        }
      }
      if ((urls.length || attachments.length) && !issus) {
        for (var i = 0; i < attachments.length; i++) {
          const fileraw = await util.promisify(defaultTimedInstance.uploadFile)(
            attachments[i].filename,
            attachments[i].mimetype
          );
          const analysis = nvt.sha256(
            await util.promisify(fs.readFile)(attachments[i].filename)
          );
          const scanlink = "https://www.virustotal.com/gui/file/" + analysis;
          const scanraw = await util.promisify(defaultTimedInstance.fileLookup)(
            analysis
          );
          const scan = JSON.parse(scanraw).data.attributes.last_analysis_stats;
          if (scan.malicious) {
            await channel.send(
              "<:bad:881629455964061717> Attachment sent by user <@!" +
                msg.author.id +
                "> is unsafe/malicious:\n" +
                scanlink
            );
            await msg.delete();
            return;
          } else if (scan.suspicious && !issus) {
            if (msg.deleted){
              await channel.send(
                "<:warning:881629456039571537> Attachment sent by user <@!" +
                  msg.author.id +
                  "> is suspicious:\n" +
                  scanlink
              );
            } else {
              await msg.reply(
                "<:warning:881629456039571537> Attachment sent by user <@!" +
                  msg.author.id +
                  "> is suspicious:\n" +
                  scanlink
              );
            }
            issus = true;
          }
        }
        if (!issus) {
          reaction.remove()
          msg.react("<:good:881629715419516958>");
        }
      }
    }
  });
};
