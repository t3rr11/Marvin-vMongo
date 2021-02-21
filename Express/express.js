//Required Libraries and Files
const fs = require("fs");
const cors = require("cors");
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const compression = require('compression');
const Database = require('../Shared/database');
const { ErrorHandler } = require('../Shared/handlers/errorHandler');
const Log = require('../Shared/log');
const Misc = require('../Shared/misc');
var app = express();

app.use(cors());
app.use(compression());
app.use(bodyParser.json({ extended: true }));

//Global variables
let isConnecting = false;
let adminToken = null;

//Set adminToken refresh interval
async function RefreshAdminToken() { adminToken = fs.readFileSync("../Shared/configs/AdminToken").toString(); }
setInterval(() => RefreshAdminToken(), 1000 * 60);

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.ExpressConnect(); }
  if(Database.checkDBConnection()) {
    clearInterval(startupCheck);
    RefreshAdminToken();
    app.listen(3001, function () { Log.SaveLog("Express", "Startup", "Express is listening on port 3001...") });
  }
}, 1000);

app.get("/Test", async function(req, res) { res.status(200).send("Hello World"); });
app.get("/GetAllClans", async function(req, res) { await DatabaseFunction(req, res, { func: "getAllClansForExpress", amount: 1000 }); });
app.get("/GetDailyUsers", async function(req, res) { await DatabaseFunction(req, res, { func: "getDailyUsers" }); });
app.get("/GetGlobals", async function(req, res) { await DatabaseFunction(req, res, { func: "getGlobalItems" }); });
app.get("/GetClan", async function(req, res) { await DatabaseFunction(req, res, { func: "getClanByID", amount: 1 }, { clanID: req.query.clanID }); });
app.get("/GetClanMembers", async function(req, res) { await DatabaseFunction(req, res, { func: "getClanMembersByID", amount: 100 }, { clanID: req.query.clanID }); });
app.get("/GetClanBroadcasts", async function(req, res) { await DatabaseFunction(req, res, { func: "getClanBroadcastsByID", amount: 250 }, { clanID: req.query.clanID }); });
app.get("/GetBackendStatus", async function(req, res) { await DatabaseFunction(req, res, { func: "getBackendLogs", amount: 1 }); });
app.get("/GetFrontendStatus", async function(req, res) { await DatabaseFunction(req, res, { func: "getFrontendLogs", amount: 1 }); });
app.get("/GetBackendStatusHistory", async function(req, res) { await DatabaseFunction(req, res, { func: "getBackendLogs", amount: 300 }); });
app.get("/GetFrontendStatusHistory", async function(req, res) { await DatabaseFunction(req, res, { func: "getFrontendLogs", amount: 300 }); });
app.get("/GetLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs" }, { date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetDailyAPIStatus", async function (req, res) { await DatabaseFunction(req, res, { func: "getAPIStatus", amount: 86400 }); });
app.get("/GetLogHistory", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }); });
app.get("/GetFrontendStartup", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 1 }, { location: "Frontend", type: "Startup" }); });
app.get("/GetBackendStartup", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 1 }, { location: "Backend", type: "Startup" }); });
app.get("/GetGlobalsStartup", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 1 }, { location: "Globals", type: "Startup" }); });
app.get("/GetExpressStartup", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 1 }, { location: "Express", type: "Startup" }); });
app.get("/GetFrontendLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }, { location: "Frontend", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetBackendLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }, { location: "Backend", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetExpressLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }, { location: "Express", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetDatabaseLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }, { location: "Database", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetBroadcastLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getBroadcastLogs", amount: 300 }, { date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetBroadcasts", async function(req, res) { await DatabaseFunction(req, res, { func: "getBroadcasts", amount: 300 }, { date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetGlobalsLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }, { location: "Globals", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetErrorHandlerLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }, { type: "Error", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetNormalTimeLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getTimeLogs", amount: 60 }, { type: "Normal", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetRealtimeTimeLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getTimeLogs", amount: 300 }, { type: "Realtime", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });

app.get("/GetGuilds", async function(req, res) { await DiscordReq(req, res, { name: "/GetGuilds", func: "getGuildsByGuildIDArrayList", amount: 20 }, { token: req.query.token }); });
app.get("/GetAllGuilds", async function(req, res) { await DiscordReq(req, res, { name: "/GetAllGuilds", func: "getGuildsByGuildIDArrayList", amount: 20 }, { token: req.query.token }); });
app.get("/GetClansFromGuildID", async function(req, res) { await DiscordReq(req, res, { name: "/GetClansFromGuildID", func: "getClansFromGuildID", amount: 100 }, { token: req.query.token, guildID: req.query.guildID }); });
app.get("/GetUsersFromGuildID", async function(req, res) { await DiscordReq(req, res, { name: "/GetUsersFromGuildID", func: "getUsersFromGuildID", amount: 1000 }, { token: req.query.token, guildID: req.query.guildID }); });
app.get("/GetGuildDashboard", async function(req, res) { await DiscordReq(req, res, { name: "/GetGuildDashboard", func: "getGuildDashboard" }, { token: req.query.token, guildID: req.query.guildID }); });
app.get("/GetGuildRankings", async function(req, res) { await UnAuthedDiscordReq(req, res, { name: "/GetGuildRankings", func: "getGuildDashboard" }, { token: req.query.token, guildID: req.query.guildID }); });
app.get("/SaveAuth", async function(req, res) { await DatabaseFunction(req, res, { func: "addAuth" }, { auth: req.query }); });

app.get("/GetWeeklyFrontendLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getWeeklyFrontendLogs", amount: 744 }); });
app.get("/GetWeeklyBackendLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getWeeklyBackendLogs", amount: 744 }); });
app.get("/GetNormalScanTimeLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getScanTimeLogs", amount: 360, type: "Normal" }); });
app.get("/GetRealtimeScanTimeLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getScanTimeLogs", amount: 3000, type: "Realtime" }); });
app.get("/GetAggregateWeeklyFrontendLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getAggregateWeeklyFrontendLogs" }); });

app.get("/CheckAuthorization", async function(req, res) {
  if(req.query.token && req.query.token === adminToken) { res.status(200).send({ "isError": false, "message": "Success", "code": 200 }); }
  else { res.status(200).send({ "isError": true, "message": "Unauthorised", "code": 500 }); }
});

app.get("/SeasonProgress", async function(req, res) {
  const data = await SoT(`https://www.seaofthieves.com/api/profilev2/seasons-progress`, { rat: decodeURI(req.query.rat) });
  res.status(200).send(data);
});

async function DatabaseFunction(req, res, options, data) {
  try {
    Database[options.func](options, data, (isError, isFound, response) => {
      if(!isError) {
        if(isFound) { res.status(200).send({ "isError": false, "message": "Success", "code": 200, data: response }); }
        else { res.status(200).send({ "isError": false, "message": "Not Found", "code": 404, data: [] }); }
      }
      else {
        res.status(200).send({ "isError": true, "message": data, "code": 500 });
        ErrorHandler("Med", data);
      }
    });
  }
  catch (err) {
    res.status(200).send({ "isError": true, "message": err.toString.length > 0 ? err : `Error trying to use function: Database.${ options.func }()`, "code": 500 }); 
    ErrorHandler("Med", err.toString.length > 0 ? err : `Error trying to use function: Database.${ options.func }()`);
  }
}

async function UnAuthedDiscordReq(req, res, options, reqData) {
  switch(true) {
    case options.name === "/GetGuildRankings": {
      CallbackDatabaseFunction(req, options, { guildID: reqData.guildID }, ({ isError, message, code, data }) => {
        if(!isError) {
          data.guild = { guildID: data.guild.guildID, guildName: data.guild.guildName }
          data.clans = data.clans.map(e => { return { clanID: e.clanID, clanName: e.clanName, clanCallsign: e.clanCallsign } });
          res.status(200).send({ isError, message, code, data });
        }
        else { res.status(200).send({ "isError": true, "message": message, "code": 500 }); }
      });
      break;
    }
    default: { res.status(200).send({ "isError": true, "message": "No request option was given", "code": 500 }); break; }
  }
}

async function DiscordReq(req, res, options, reqData) {
  fetch(`https://discord.com/api/users/@me/guilds`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${ reqData.token }`, 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  .then(async function(response) {
    response = JSON.parse(await response.text());
    if(response.code === 0) {
      res.status(200).send({ "isError": true, "message": response.message, "code": 500 });
      if(response.message === '401: Unauthorized') { ErrorHandler("Med", `Someone tried to access ${ options.name } with an Invalid access token: ${ reqData.token }.`); }
      else { ErrorHandler("Med", `Someone tried to access ${ options.name } and hit this error: ${ response.message }.`); }
    }
    else {
      switch(true) {
        case options.name === "/GetGuilds": {
          let adminGuilds = response.filter(e => (e.permissions & 0x00000008) == 0x00000008);
          CallbackDatabaseFunction(req, options, { guilds: adminGuilds }, ({ isError, message, code, data }) => {
            if(!isError) { res.status(200).send({ isError, message, code, data }); }
            else { res.status(200).send({ "isError": true, "message": message, "code": 500 }); }
          });
          break;
        }
        case options.name === "/GetAllGuilds": {
          CallbackDatabaseFunction(req, options, { guilds: response }, ({ isError, message, code, data }) => {
            let guildIDs = data.map(e => e.guildID);
            data = response.filter(e => guildIDs.includes(e.id));
            if(!isError) { res.status(200).send({ isError, message, code, data }); }
            else { res.status(200).send({ "isError": true, "message": message, "code": 500 }); }
          });
          break;
        }
        case options.name === "/GetClansFromGuildID": {
          let adminGuilds = response.filter(e => (e.permissions & 0x00000008) == 0x00000008);
          if(adminGuilds.find(e => e.id === reqData.guildID)) {
            CallbackDatabaseFunction(req, options, { guildID: reqData.guildID }, ({ isError, message, code, data }) => {
              if(!isError) { res.status(200).send({ isError, message, code, data }); }
              else { res.status(200).send({ "isError": true, "message": message, "code": 500 }); }
            });
          }
          else { res.status(200).send({ "isError": true, "message": "This access token is not vaild for this guild.", "code": 500 }); }
          break;
        }
        case options.name === "/GetUsersFromGuildID": {
          let adminGuilds = response.filter(e => (e.permissions & 0x00000008) == 0x00000008);
          if(adminGuilds.find(e => e.id === reqData.guildID)) {
            CallbackDatabaseFunction(req, options, { guildID: reqData.guildID }, ({ isError, message, code, data }) => {
              if(!isError) { res.status(200).send({ isError, message, code, data }); }
              else { res.status(200).send({ "isError": true, "message": message, "code": 500 }); }
            });
          }
          else { res.status(200).send({ "isError": true, "message": "This access token is not vaild for this guild.", "code": 500 }); }
          break;
        }
        case options.name === "/GetGuildDashboard": {
          let adminGuilds = response.filter(e => (e.permissions & 0x00000008) == 0x00000008);
          if(adminGuilds.find(e => e.id === reqData.guildID)) {
            CallbackDatabaseFunction(req, options, { guildID: reqData.guildID }, ({ isError, message, code, data }) => {
              if(!isError) { res.status(200).send({ isError, message, code, data }); }
              else { res.status(200).send({ "isError": true, "message": message, "code": 500 }); }
            });
          }
          else { res.status(200).send({ "isError": true, "message": "This access token is not vaild for this guild.", "code": 500 }); }
          break;
        }
        default: { res.status(200).send({ "isError": true, "message": "No request option was given", "code": 500 }); break; }
      }
    }
  })
  .catch((error) => { console.log(error); return { error: true, reason: error } });
}

async function CallbackDatabaseFunction(req, options, data, callback) {
  try {
    Database[options.func](options, data, (isError, isFound, response) => {
      if(!isError) {
        if(isFound) { callback({ "isError": false, "message": "Success", "code": 200, data: response }); }
        else { callback({ "isError": false, "message": "Not Found", "code": 404, data: [] }); }
      }
      else {
        callback({ "isError": true, "message": data, "code": 500 });
        ErrorHandler("Med", data);
      }
    });
  }
  catch (err) {
    callback({ "isError": true, "message": err.toString.length > 0 ? err : `Error trying to use function: Database.${ options.func }()`, "code": 500 }); 
    ErrorHandler("Med", err.toString.length > 0 ? err : `Error trying to use function: Database.${ options.func }()`);
  }
}

async function SoT(path, user) {
  return await fetch(`${ path }`, {
    headers: {
      "Referer": `https://www.seaofthieves.com`,
      "Host": "www.seaofthieves.com",
      "cookie": `rat=${ user?.rat }; Domain=.seaofthieves.com; Path=/; Expires=Tue, 02 Feb 2021 07:43:19 GMT; HttpOnly; Secure`
    }
  }).then(async (request) => {
    try {
      const response = await request.text();
      if(Misc.IsJSON(response)) {
        const res = JSON.parse(response);
        if(request.ok && res.ErrorCode && res.ErrorCode !== 1) { return { "isError": true, "Data": res } }
        else if(request.ok) { return { "isError": false, "Data": res } }
        else { return { "isError": true, "Data": res } }
      } else { return { "isError": true, "Data": "Did not recieve json" } }
    } catch (err) { return { "isError": true, "Data": err } } 
  }).catch((err) => { return { "isError": true, "Data": err } });
}