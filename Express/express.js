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
    app.listen(3001, function () { Log.SaveLog("Normal", "Express is listening on port 3001...") });
  }
}, 1000);

app.get("/Test", async function(req, res) { res.status(200).send("Hello World"); });