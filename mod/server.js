const express = require("express");
const axios = require("axios");

module.exports = async (client) => {
  const app = express();

  app.set("trust proxy", "loopback");

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send({
      success: true,
    });
  });

  app.get("/authorized", (req, res) => {
    if (!req.body.code || !req.body.state) {
      res.status(400).send({
        success: false,
      });
      return;
    }
    try {
      const oauthResult = await axios({
        method: "POST",
        url: "https://discord.com/api/oauth2/token",
        data: {
          client_id: client.user.id,
          client_secret: process.env.CLIENT_SECRET,
          code: req.body.code,
          grant_type: "authorization_code",
          redirect_uri: `https://hyper-developers.github.io/Cruiser-Frontend/authorized.html`,
          scope: "identify connections guilds guilds.join",
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
      await client.tokenDB.set(userResult.id, oauthData);
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