//Required Libraries and Files
const fs = require("fs");
const cors = require("cors");
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const Database = require('../Shared/database');
const { ErrorHandler } = require('../Shared/handlers/errorHandler');
const Log = require('../Shared/log');
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
app.get("/GetClan", async function(req, res) { await DatabaseFunction(req, res, { func: "getClanByID", amount: 1 }, { clanID: req.query.clanID }); });
app.get("/GetClanMembers", async function(req, res) { await DatabaseFunction(req, res, { func: "getClanMembersByID", amount: 100 }, { clanID: req.query.clanID }); });
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
app.get("/GetGlobalsLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }, { location: "Globals", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/GetErrorHandlerLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 300 }, { type: "Error", date: { $gte: req.query.date ? new Date(req.query.date.toString()) : new Date() } }); });
app.get("/CheckAuthorization", async function(req, res) {
  if(req.query.token && req.query.token === adminToken) { res.status(200).send({ "isError": false, "message": "Success", "code": 200 }); }
  else { res.status(200).send({ "isError": true, "message": "Unauthorised", "code": 500 }); }
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