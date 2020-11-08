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
let Players = { };
let Clans = { };

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.GlobalsConnect(); }
  if(Database.checkDBConnection() && GlobalItemsHandler.checkGlobalItems() && ManifestHandler.checkManifestMounted()) {
    clearInterval(startupCheck);
    app.listen(3000, function () { Log.SaveLog("Globals", "Startup", "Globals is listening on port 3000...") });
    await UpdateLeaderboards();
    Logger();
  }
}, 1000);

app.get("/GetClanLeaderboards", async function(req, res) { res.status(200).send(Clans); });
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
  var lastLog = 0;
  setInterval(async () => {
    var numbers = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]
    if(numbers.includes(new Date().getHours()) && lastLog !== new Date().getHours()) {
      if(logged === false) {
        logged = true;
        lastLog = new Date().getHours();
        await UpdateLeaderboards();
      }
    }
    else { if(logged) { logged = false; } }
  }, 1000);
}

//Get the data
async function UpdateLeaderboards() {
  let start = Date.now();
  await new Promise(resolve => Database.getTrackedClans(async (isError, isFound, clans) => {
    if(!isError) {
      if(isFound) {
        console.log(`Step 1: Got Tracked Clans: ${ Date.now() - start }ms`);
        await new Promise(resolve2 => Database.getUsersByClanIDArrayList(clans.map(e => { return e.clanID  }), (isError, isFound, users) => {
          if(!isError) {
            if(isFound) {
              console.log(`Step 2: Got Tracked Users: ${ Date.now() - start }ms`);
              ProcessClanLeaderboards(clans.map(e => { return { clanID: e.clanID, clanName: e.clanName } }), users);
            }
            else { ErrorHandler("Low", `Players were not found`); }
          }
          else { ErrorHandler("Med", users); }
          resolve2(true);
        }));
      }
      else { ErrorHandler("Low", `Clans were not found`); }
    }
    else { ErrorHandler("Med", clans); }
    resolve(true);
  }));
}

function ProcessClanLeaderboards(clans, users) {
  let TempClans = { };
  let start = Date.now();

  for(let i in users) {
    //Add player to Players array
    Players[users[i].membershipID] = {
      membershipID: users[i].membershipID,
      displayName: users[i].displayName,
      timePlayed: users[i].timePlayed,
      seasonRank: users[i].seasonRank,
      triumphScore: users[i].triumphScore,
      valor: users[i].valor.current,
      infamy: users[i].infamy.current,
      levi: { normal: users[i].raids.levi, prestige: users[i].raids.prestige_levi },
      eow: { normal: users[i].raids.eow, prestige: users[i].raids.prestige_eow },
      sos: { normal: users[i].raids.sos, prestige: users[i].raids.prestige_sos },
      lastWish: users[i].raids.lastWish,
      scourge: users[i].raids.scourge,
      sorrows: users[i].raids.sorrows,
      garden: users[i].raids.garden,
      totalRaids: users[i].totalRaids,
      highestPower: users[i].highestPower,
    }

    //Add players stats to Clans array
    if(!TempClans[users[i].clanID]) {
      TempClans[users[i].clanID] = {
        clanName: clans.find(e => e.clanID === users[i].clanID).clanName,
        timePlayed: users[i].timePlayed,
        seasonRank: users[i].seasonRank,
        triumphScore: users[i].triumphScore,
        valor: users[i].valor.current,
        infamy: users[i].infamy.current,
        levi: ( users[i].raids.levi + users[i].raids.prestige_levi ),
        eow: ( users[i].raids.eow + users[i].raids.prestige_eow ),
        sos: ( users[i].raids.sos + users[i].raids.prestige_sos ),
        lastWish: users[i].raids.lastWish,
        scourge: users[i].raids.scourge,
        sorrows: users[i].raids.sorrows,
        garden: users[i].raids.garden,
        totalRaids: users[i].totalRaids
      }
    }
    else {
      TempClans[users[i].clanID].timePlayed += users[i].timePlayed;
      TempClans[users[i].clanID].seasonRank += users[i].seasonRank;
      TempClans[users[i].clanID].triumphScore += users[i].triumphScore;
      TempClans[users[i].clanID].valor += users[i].valor.current;
      TempClans[users[i].clanID].infamy += users[i].infamy.current;
      TempClans[users[i].clanID].levi += ( users[i].raids.levi + users[i].raids.prestige_levi );
      TempClans[users[i].clanID].eow += ( users[i].raids.eow + users[i].raids.prestige_eow );
      TempClans[users[i].clanID].sos += ( users[i].raids.sos + users[i].raids.prestige_sos );
      TempClans[users[i].clanID].lastWish += users[i].raids.lastWish;
      TempClans[users[i].clanID].scourge += users[i].raids.scourge;
      TempClans[users[i].clanID].sorrows += users[i].raids.sorrows;
      TempClans[users[i].clanID].garden += users[i].raids.garden;
      TempClans[users[i].clanID].totalRaids += users[i].totalRaids;
    }
  }
  Clans = TempClans;
  console.log(`Step 3: Finished Processing: ${ Date.now() - start }ms`);
}

function GetGlobalTimePlayedLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.timePlayed - a.timePlayed })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, timePlayed: e.timePlayed, rank: index }
  });
}
function GetGlobalSeasonRankLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.seasonRank - a.seasonRank })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, seasonRank: e.seasonRank, rank: index }
  });
}
function GetGlobalTriumphScoreLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.triumphScore - a.triumphScore })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, triumphScore: e.triumphScore, rank: index }
  });
}
function GetGlobalValorLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.valor - a.valor })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, valor: e.valor, rank: index }
  });
}
function GetGlobalInfamyLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.infamy - a.infamy })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, infamy: e.infamy, rank: index }
  });
}
function GetGlobalLeviLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.levi.normal - a.levi.normal })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, levi: e.levi.normal, rank: index }
  });
}
function GetGlobalEoWLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.eow.normal - a.eow.normal })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, eow: e.eow.normal, rank: index }
  });
}
function GetGlobalSoSLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.sos.normal - a.sos.normal })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, sos: e.sos.normal, rank: index }
  });
}
function GetGlobalLeviPrestigeLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.levi.prestige - a.levi.prestige })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_levi: e.levi.prestige, rank: index }
  });
}
function GetGlobalEoWPrestigeLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.eow.prestige - a.eow.prestige })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_eow: e.eow.prestige, rank: index }
  });
}
function GetGlobalSoSPrestigeLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.sos.prestige - a.sos.prestige })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_sos: e.sos.prestige, rank: index }
  });
}
function GetGlobalLastWishLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.lastWish - a.lastWish })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, lastWish: e.lastWish, rank: index }
  });
}
function GetGlobalScourgeLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.scourge - a.scourge })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, scourge: e.scourge, rank: index }
  });
}
function GetGlobalSorrowsLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.sorrows - a.sorrows })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, sorrows: e.sorrows, rank: index }
  });
}
function GetGlobalGardenLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.garden - a.garden })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, garden: e.garden, rank: index }
  });
}
function GetGlobalTotalRaidsLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.totalRaids - a.totalRaids })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, totalRaids: e.totalRaids, rank: index }
  });
}
function GetGlobalHighestPowerLeadboard() {
  return [...Object.values(Players).sort((a,b) => { return b.highestPower - a.highestPower })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, highestPower: e.highestPower, rank: index }
  });
}