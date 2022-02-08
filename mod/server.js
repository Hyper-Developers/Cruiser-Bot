const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fpjs = require("@fingerprintjs/fingerprintjs-pro-server-api");

const fpjs_client = new fpjs.FingerprintJsServerApiClient({ region: fpjs.Region.Global, apiToken: process.env.FPJS_API_KEY });

module.exports = async (client) => {
  const app = express();

  app.set("trust proxy", "loopback");

  app.use(express.json());
  app.use(cors());

  app.get("/", async (req, res) => {
    res.send({
      success: true,
    });
  });

  app.post("/authorized", async (req, res) => {
    if (
      !req.body.code ||
      !req.body.state ||
      !req.body.visitorId ||
      ["requestguildsjointoken", "requestinformationtoken"].indexOf(req.body.state) < 0
    ) return res.status(400).send({
      success: false,
    });
    try {
      const visitorResult = await fpjs_client.getVisitorHistory(req.body.visitorId, {
        limit: 1
      });
      if (
        visitorResult.visitorId != req.body.visitorId ||
        visitorResult.visits[0].incognito ||
        Date.now() - 1000 * 60 > visitorResult.visits[0].timestamp ||
        req.ips.indexOf(visitorResult.visits[0].ip) < 0
      ) return res.status(403).send({
        success: false,
      });
      const oauthResult = await axios({
        method: "POST",
        url: "https://discord.com/api/oauth2/token",
        data: {
          client_id: client.user.id,
          client_secret: process.env.CLIENT_SECRET,
          code: req.body.code,
          grant_type: "authorization_code",
          redirect_uri: `https://hyper-developers.github.io/Cruiser-Frontend/authorized.html`,
          scope: {
            requestguildsjointoken: "identify guilds.join",
            requestinformationtoken:
              "identify identify.email connections guilds",
          }[req.body.state],
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const oauthData = oauthResult.data;
      const userResult = await axios({
        method: "GET",
        url: "https://discord.com/api/users/@me",
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });
      await client[
        {
          requestguildsjointoken: "antinukeTokens",
          requestinformationtoken: "informationTokens",
        }[req.body.state]
      ].set(userResult.id, oauthData);
      res.status(200).send({
        success: true,
      });
      return;
    } catch (error) {
      res.status(500).send({
        success: false,
      });
      return;
    }
  });

  app.listen(3333, () => {
    console.log(`Express listening at http://localhost:${port}`);
  });
};
