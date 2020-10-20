//Required Libraries and Files
const cors = require("cors");
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const Database = require('../Shared/Database');
const GlobalItemsHandler = require('../Shared/handlers/globalItemsHandler');
const ManifestHandler = require('../Shared/handlers/manifestHandler');
const { ErrorHandler } = require('../Shared/handlers/errorHandler');
const Log = require('../Shared/log');
var app = express();

app.use(cors());
app.use(compression());
app.use(bodyParser.json({ extended: true }));

//Global variables
let isConnecting = false;
let Players = [];
let Clans = [];
var ClanLeaderboards = [];

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.ExpressConnect(); }
  if(Database.checkDBConnection() && GlobalItemsHandler.checkGlobalItems() && ManifestHandler.checkManifestMounted()) {
    clearInterval(startupCheck);
    Logger();
  }
}, 1000);

app.get("/GetClanLeaderboards", async function(req, res) { res.status(200).send(ClanLeaderboards); });

async function Logger() {
  //Interval for 10 minute status logging.
  var logged = false;
  setInterval(async () => {
    var numbers = [0,1,2,3,4,5,6]
    if(numbers.includes(new Date().getMinutes() / 10)) {
      if(logged === false) {
        logged = true;
        await GetTheData();
        ProcessData();
      }
    }
    else { if(logged) { logged = false; } }
  }, 1000);

  //Get the data
  async function GetTheData() {
    await new Promise(resolve => Database.getAllUsers((isError, isFound, data) => {
      if(!isError) {
        if(isFound) { Players = data; }
        else { ErrorHandler("Low", `Players were not found`); }
      }
      else { ErrorHandler("Med", data); }
      resolve(true);
    }));
    await new Promise(resolve => Database.getTrackedClans((isError, isFound, data) => {
      if(!isError) {
        if(isFound) { Clans = data; }
        else { ErrorHandler("Low", `Clans were not found`); }
      }
      else { ErrorHandler("Med", data); }
      resolve(true);
    }));
  }

  //Process the data
  async function ProcessData() {
    var Leaderboard = [];
    for(var i in Clans) {
      //Ignore non-tracked clans
      if(!Leaderboard.find(e => e.clanID === Clans[i].clanID)) {
      var totalTimePlayed = 0;
      var totalTriumphScore = 0;
      var totalLeviCompletions = 0;
      var totalEowCompletions = 0;
      var totalSosCompletions = 0;
      var totalLastWishCompletions = 0;
      var totalScourgeCompletions = 0;
      var totalSorrowsCompletions = 0;
      var totalGardenCompletions = 0;
      var totalSeasonRanks = 0;
        //Scan each player add to respective clans
        for(var j in Players) {
          if(Players[j].clanID === Clans[i].clanID) {
            totalTimePlayed += Players[j].timePlayed;
            totalTriumphScore += Players[j].triumphScore;
            totalLeviCompletions += ( Players[j].raids.levi + Players[j].raids.prestige_levi );
            totalEowCompletions += ( Players[j].raids.eow + Players[j].raids.prestige_eow );
            totalSosCompletions += ( Players[j].raids.sos + Players[j].raids.prestige_sos );
            totalLastWishCompletions += Players[j].raids.lastWish;
            totalScourgeCompletions += Players[j].raids.scourge;
            totalSorrowsCompletions += Players[j].raids.sorrows;
            totalGardenCompletions += Players[j].raids.garden;
            totalSeasonRanks += Players[j].seasonRank;
          }
        }
        //Finally save all that data
        Leaderboard.push({
          "clanID": Clans[i].clanID,
          "clanName": Clans[i].clanName,
          "data": {
            "timePlayed": totalTimePlayed,
            "triumphScore": totalTriumphScore,
            "leviCompletions": totalLeviCompletions,
            "eowCompletions": totalEowCompletions,
            "sosCompletions": totalSosCompletions,
            "lwCompletions": totalLastWishCompletions,
            "scourgeCompletions": totalScourgeCompletions,
            "sorrowsCompletions": totalSorrowsCompletions,
            "gardenCompletions": totalGardenCompletions,
            "totalRaids": (totalLeviCompletions + totalEowCompletions + totalSosCompletions + totalLastWishCompletions + totalScourgeCompletions + totalSorrowsCompletions + totalGardenCompletions),
            "seasonRanks": totalSeasonRanks
          }
        });
      }
    }
    ClanLeaderboards = Leaderboard;
  }

  await GetTheData();
  ProcessData();
};

app.listen(3000, function () { Log.SaveLog("Normal", "Express is listening on port 3000...") });