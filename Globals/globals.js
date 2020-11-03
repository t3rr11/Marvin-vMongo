//Required Libraries and Files
const cors = require("cors");
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const Database = require('../Shared/database');
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
let Players, Clans, ClanLeaderboards, GlobalLeaderboards;

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.GlobalsConnect(); }
  if(Database.checkDBConnection() && GlobalItemsHandler.checkGlobalItems() && ManifestHandler.checkManifestMounted()) {
    clearInterval(startupCheck);
    app.listen(3000, function () { Log.SaveLog("Normal", "Globals is listening on port 3000...") });
    Logger();
  }
}, 1000);

app.get("/GetClanLeaderboards", async function(req, res) { res.status(200).send(ClanLeaderboards); });
app.get("/GetGlobalTimePlayedLeadboard", async function(req, res) { res.status(200).send(GetGlobalTimePlayedLeadboard()); });
app.get("/GetGlobalSeasonRankLeadboard", async function(req, res) { res.status(200).send(GetGlobalSeasonRankLeadboard()); });
app.get("/GetGlobalTriumphScoreLeadboard", async function(req, res) { res.status(200).send(GetGlobalTriumphScoreLeadboard()); });
app.get("/GetGlobalValorLeadboard", async function(req, res) { res.status(200).send(GetGlobalValorLeadboard()); });
app.get("/GetGlobalInfamyLeadboard", async function(req, res) { res.status(200).send(GetGlobalInfamyLeadboard()); });
app.get("/GetGlobalLeviLeadboard", async function(req, res) { res.status(200).send(GetGlobalLeviLeadboard()); });
app.get("/GetGlobalEoWLeadboard", async function(req, res) { res.status(200).send(GetGlobalEoWLeadboard()); });
app.get("/GetGlobalSoSLeadboard", async function(req, res) { res.status(200).send(GetGlobalSoSLeadboard()); });
app.get("/GetGlobalLeviPrestigeLeadboard", async function(req, res) { res.status(200).send(GetGlobalLeviPrestigeLeadboard()); });
app.get("/GetGlobalEoWPrestigeLeadboard", async function(req, res) { res.status(200).send(GetGlobalEoWPrestigeLeadboard()); });
app.get("/GetGlobalSoSPrestigeLeadboard", async function(req, res) { res.status(200).send(GetGlobalSoSPrestigeLeadboard()); });
app.get("/GetGlobalLastWishLeadboard", async function(req, res) { res.status(200).send(GetGlobalLastWishLeadboard()); });
app.get("/GetGlobalScourgeLeadboard", async function(req, res) { res.status(200).send(GetGlobalScourgeLeadboard()); });
app.get("/GetGlobalSorrowsLeadboard", async function(req, res) { res.status(200).send(GetGlobalSorrowsLeadboard()); });
app.get("/GetGlobalGardenLeadboard", async function(req, res) { res.status(200).send(GetGlobalGardenLeadboard()); });
app.get("/GetGlobalTotalRaidsLeadboard", async function(req, res) { res.status(200).send(GetGlobalTotalRaidsLeadboard()); });
app.get("/GetGlobalHighestPowerLeadboard", async function(req, res) { res.status(200).send(GetGlobalHighestPowerLeadboard()); });

async function Logger() {
  //Interval for 10 minute status logging.
  var logged = false;
  setInterval(async () => {
    var numbers = [0,1,2,3,4,5,6]
    if(numbers.includes(new Date().getMinutes() / 10)) {
      if(logged === false) {
        logged = true;
        await UpdateLeaderboards();
      }
    }
    else { if(logged) { logged = false; } }
  }, 1000);

  //Get the data
  async function UpdateLeaderboards() {
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

    ProcessClanwars();
  }

  //Process the data
  async function ProcessClanwars() {
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

  await UpdateLeaderboards();
}

function GetGlobalTimePlayedLeadboard() {
  return [...Players.sort((a,b) => { return b.timePlayed - a.timePlayed })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, timePlayed: e.timePlayed, rank: index }
  });
}
function GetGlobalSeasonRankLeadboard() {
  return [...Players.sort((a,b) => { return b.seasonRank - a.seasonRank })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, seasonRank: e.seasonRank, rank: index }
  });
}
function GetGlobalTriumphScoreLeadboard() {
  return [...Players.sort((a,b) => { return b.triumphScore - a.triumphScore })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, triumphScore: e.triumphScore, rank: index }
  });
}
function GetGlobalValorLeadboard() {
  return [...Players.sort((a,b) => { return b.valor.current - a.valor.current })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, valor: e.valor, rank: index }
  });
}
function GetGlobalInfamyLeadboard() {
  return [...Players.sort((a,b) => { return b.infamy.current - a.infamy.current })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, infamy: e.infamy, rank: index }
  });
}
function GetGlobalLeviLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.levi - a.raids.levi })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, levi: e.raids.levi, rank: index }
  });
}
function GetGlobalEoWLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.eow - a.raids.eow })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, eow: e.raids.eow, rank: index }
  });
}
function GetGlobalSoSLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.sos - a.raids.sos })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, sos: e.raids.sos, rank: index }
  });
}
function GetGlobalLeviPrestigeLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.prestige_levi - a.raids.prestige_levi })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_levi: e.raids.prestige_levi, rank: index }
  });
}
function GetGlobalEoWPrestigeLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.prestige_eow - a.raids.prestige_eow })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_eow: e.raids.prestige_eow, rank: index }
  });
}
function GetGlobalSoSPrestigeLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.prestige_sos - a.raids.prestige_sos })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_sos: e.raids.prestige_sos, rank: index }
  });
}
function GetGlobalLastWishLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.lastWish - a.raids.lastWish })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, lastWish: e.raids.lastWish, rank: index }
  });
}
function GetGlobalScourgeLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.scourge - a.raids.scourge })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, scourge: e.raids.scourge, rank: index }
  });
}
function GetGlobalSorrowsLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.sorrows - a.raids.sorrows })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, sorrows: e.raids.sorrows, rank: index }
  });
}
function GetGlobalGardenLeadboard() {
  return [...Players.sort((a,b) => { return b.raids.garden - a.raids.garden })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, garden: e.raids.garden, rank: index }
  });
}
function GetGlobalTotalRaidsLeadboard() {
  return [...Players.sort((a,b) => { return b.totalRaids - a.totalRaids })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, totalRaids: e.totalRaids, rank: index }
  });
}
function GetGlobalHighestPowerLeadboard() {
  return [...Players.sort((a,b) => { return b.highestPower - a.highestPower })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, highestPower: e.highestPower, rank: index }
  });
}