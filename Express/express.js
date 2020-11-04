//Required Libraries and Files
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

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.ExpressConnect(); }
  if(Database.checkDBConnection()) {
    clearInterval(startupCheck);
    app.listen(3001, function () { Log.SaveLog("Express", "Startup", "Express is listening on port 3001...") });
  }
}, 1000);

app.get("/Test", async function(req, res) { res.status(200).send("Hello World"); });
app.get("/GetBackendStatus", async function(req, res) { await DatabaseFunction(req, res, { func: "getBackendLogs", amount: 1 }); });
app.get("/GetFrontendStatus", async function(req, res) { await DatabaseFunction(req, res, { func: "getFrontendLogs", amount: 1 }); });
app.get("/GetLogs", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 1 }); });
app.get("/GetBackendStatusHistory", async function(req, res) { await DatabaseFunction(req, res, { func: "getBackendLogs", amount: 100 }); });
app.get("/GetFrontendStatusHistory", async function(req, res) { await DatabaseFunction(req, res, { func: "getFrontendLogs", amount: 100 }); });
app.get("/GetLogHistory", async function(req, res) { await DatabaseFunction(req, res, { func: "getLogs", amount: 100 }); });

async function DatabaseFunction(req, res, data) {
  try {
    Database[data.func](data, (isError, isFound, data) => {
      if(!isError) {
        if(isFound) { res.status(200).send({ "isError": false, "message": "Success", "code": 200, data: data }); }
        else { res.status(200).send({ "isError": false, "message": "Not Found", "code": 404, data: [] }); }
      }
      else {
        res.status(200).send({ "isError": true, "message": data, "code": 500 });
        ErrorHandler("Med", data);
      }
    });
  }
  catch (err) {
    res.status(200).send({ "isError": true, "message": err.toString.length > 0 ? err : `Error trying to use function: Database.${ data.func }()`, "code": 500 }); 
    ErrorHandler("Med", err.toString.length > 0 ? err : `Error trying to use function: Database.${ data.func }()`);
  }
}