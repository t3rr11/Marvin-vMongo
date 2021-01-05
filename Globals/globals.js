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
    Logger();
  }
}, 1000);

app.get("/GetClanLeaderboards", async function(req, res) { res.status(200).send(Clans); });
app.get("/GetGlobalTimePlayedLeaderboard", async function(req, res) { res.status(200).send(GetGlobalTimePlayedLeaderboard()); });
app.get("/GetGlobalSeasonRankLeaderboard", async function(req, res) { res.status(200).send(GetGlobalSeasonRankLeaderboard()); });
app.get("/GetGlobalTriumphScoreLeaderboard", async function(req, res) { res.status(200).send(GetGlobalTriumphScoreLeaderboard()); });
app.get("/GetGlobalValorLeaderboard", async function(req, res) { res.status(200).send(GetGlobalValorLeaderboard()); });
app.get("/GetGlobalInfamyLeaderboard", async function(req, res) { res.status(200).send(GetGlobalInfamyLeaderboard()); });
app.get("/GetGlobalLeviLeaderboard", async function(req, res) { res.status(200).send(GetGlobalLeviLeaderboard()); });
app.get("/GetGlobalEoWLeaderboard", async function(req, res) { res.status(200).send(GetGlobalEoWLeaderboard()); });
app.get("/GetGlobalSoSLeaderboard", async function(req, res) { res.status(200).send(GetGlobalSoSLeaderboard()); });
app.get("/GetGlobalLeviPrestigeLeaderboard", async function(req, res) { res.status(200).send(GetGlobalLeviPrestigeLeaderboard()); });
app.get("/GetGlobalEoWPrestigeLeaderboard", async function(req, res) { res.status(200).send(GetGlobalEoWPrestigeLeaderboard()); });
app.get("/GetGlobalSoSPrestigeLeaderboard", async function(req, res) { res.status(200).send(GetGlobalSoSPrestigeLeaderboard()); });
app.get("/GetGlobalLastWishLeaderboard", async function(req, res) { res.status(200).send(GetGlobalLastWishLeaderboard()); });
app.get("/GetGlobalScourgeLeaderboard", async function(req, res) { res.status(200).send(GetGlobalScourgeLeaderboard()); });
app.get("/GetGlobalSorrowsLeaderboard", async function(req, res) { res.status(200).send(GetGlobalSorrowsLeaderboard()); });
app.get("/GetGlobalGardenLeaderboard", async function(req, res) { res.status(200).send(GetGlobalGardenLeaderboard()); });
app.get("/GetGlobalDSCLeaderboard", async function(req, res) { res.status(200).send(GetGlobalDSCLeaderboard()); });
app.get("/GetGlobalTotalRaidsLeaderboard", async function(req, res) { res.status(200).send(GetGlobalTotalRaidsLeaderboard()); });
app.get("/GetGlobalHighestPowerLeaderboard", async function(req, res) { res.status(200).send(GetGlobalHighestPowerLeaderboard()); });
app.get("/GetGlobalHighestPowerMinusArtifactLeaderboard", async function(req, res) { res.status(200).send(GetGlobalHighestPowerMinusArtifactLeaderboard()); });
app.get("/GetGlobalDawning2020Leaderboard", async function(req, res) { res.status(200).send(GetGlobalDawning2020Leaderboard()); });

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
  count = 0;

  for(let i in users) {
    //Add player to Players array
    Players[users[i].membershipID] = {
      membershipID: users[i].membershipID,
      displayName: users[i].displayName,
      timePlayed: users[i].timePlayed,
      seasonRank: users[i].seasonRank,
      triumphScore: users[i].triumphScore,
      valor: users[i].valor.current,
      glory: users[i].glory,
      infamy: users[i].infamy.current,
      ironBanner: users[i].ironBanner,
      levi: { normal: users[i].raids.levi, prestige: users[i].raids.prestige_levi },
      eow: { normal: users[i].raids.eow, prestige: users[i].raids.prestige_eow },
      sos: { normal: users[i].raids.sos, prestige: users[i].raids.prestige_sos },
      lastWish: users[i].raids.lastWish,
      scourge: users[i].raids.scourge,
      sorrows: users[i].raids.sorrows,
      garden: users[i].raids.garden,
      dsc: users[i].raids.dsc,
      totalRaids: users[i].totalRaids,
      highestPower: users[i].highestPower,
      powerBonus: users[i].powerBonus,
      dawning2020: users[i]["_doc"].dawning2020
    }

    //Add players stats to Clans array
    if(!TempClans[users[i].clanID]) {
      TempClans[users[i].clanID] = {
        clanID: users[i].clanID,
        clanName: clans.find(e => e.clanID === users[i].clanID).clanName,
        timePlayed: users[i].timePlayed,
        seasonRank: users[i].seasonRank,
        triumphScore: users[i].triumphScore,
        valor: users[i].valor.current,
        glory: users[i].glory,
        infamy: users[i].infamy.current,
        ironBanner: users[i].ironBanner,
        levi: ( users[i].raids.levi + users[i].raids.prestige_levi ),
        eow: ( users[i].raids.eow + users[i].raids.prestige_eow ),
        sos: ( users[i].raids.sos + users[i].raids.prestige_sos ),
        lastWish: users[i].raids.lastWish,
        scourge: users[i].raids.scourge,
        sorrows: users[i].raids.sorrows,
        garden: users[i].raids.garden,
        dsc: users[i].raids.dsc,
        totalRaids: users[i].totalRaids,
        dawning2020: users[i]["_doc"].dawning2020
      }
    }
    else {
      TempClans[users[i].clanID].timePlayed += users[i].timePlayed;
      TempClans[users[i].clanID].seasonRank += users[i].seasonRank;
      TempClans[users[i].clanID].triumphScore += users[i].triumphScore;
      TempClans[users[i].clanID].valor += users[i].valor.current;
      TempClans[users[i].clanID].glory += users[i].glory;
      TempClans[users[i].clanID].infamy += users[i].infamy.current;
      TempClans[users[i].clanID].ironBanner.kills += users[i].ironBanner.kills;
      TempClans[users[i].clanID].ironBanner.wins += users[i].ironBanner.wins;
      TempClans[users[i].clanID].levi += ( users[i].raids.levi + users[i].raids.prestige_levi );
      TempClans[users[i].clanID].eow += ( users[i].raids.eow + users[i].raids.prestige_eow );
      TempClans[users[i].clanID].sos += ( users[i].raids.sos + users[i].raids.prestige_sos );
      TempClans[users[i].clanID].lastWish += users[i].raids.lastWish;
      TempClans[users[i].clanID].scourge += users[i].raids.scourge;
      TempClans[users[i].clanID].sorrows += users[i].raids.sorrows;
      TempClans[users[i].clanID].garden += users[i].raids.garden;
      TempClans[users[i].clanID].dsc += users[i].raids.dsc;
      TempClans[users[i].clanID].totalRaids += users[i].totalRaids;
      TempClans[users[i].clanID].dawning2020 += users[i]["_doc"].dawning2020;
    }
  }
  Clans = TempClans;
  console.log(`Step 3: Finished Processing: ${ Date.now() - start }ms`);
}

function GetGlobalTimePlayedLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.timePlayed - a.timePlayed })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, timePlayed: e.timePlayed, rank: index }
  });
}
function GetGlobalSeasonRankLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.seasonRank - a.seasonRank })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, seasonRank: e.seasonRank, rank: index }
  });
}
function GetGlobalTriumphScoreLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.triumphScore - a.triumphScore })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, triumphScore: e.triumphScore, rank: index }
  });
}
function GetGlobalValorLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.valor - a.valor })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, valor: e.valor, rank: index }
  });
}
function GetGlobalInfamyLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.infamy - a.infamy })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, infamy: e.infamy, rank: index }
  });
}
function GetGlobalLeviLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.levi.normal - a.levi.normal })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, levi: e.levi.normal, rank: index }
  });
}
function GetGlobalEoWLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.eow.normal - a.eow.normal })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, eow: e.eow.normal, rank: index }
  });
}
function GetGlobalSoSLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.sos.normal - a.sos.normal })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, sos: e.sos.normal, rank: index }
  });
}
function GetGlobalLeviPrestigeLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.levi.prestige - a.levi.prestige })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_levi: e.levi.prestige, rank: index }
  });
}
function GetGlobalEoWPrestigeLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.eow.prestige - a.eow.prestige })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_eow: e.eow.prestige, rank: index }
  });
}
function GetGlobalSoSPrestigeLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.sos.prestige - a.sos.prestige })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, prestige_sos: e.sos.prestige, rank: index }
  });
}
function GetGlobalLastWishLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.lastWish - a.lastWish })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, lastWish: e.lastWish, rank: index }
  });
}
function GetGlobalScourgeLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.scourge - a.scourge })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, scourge: e.scourge, rank: index }
  });
}
function GetGlobalSorrowsLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.sorrows - a.sorrows })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, sorrows: e.sorrows, rank: index }
  });
}
function GetGlobalGardenLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.garden - a.garden })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, garden: e.garden, rank: index }
  });
}
function GetGlobalDSCLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.dsc - a.dsc })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, dsc: e.dsc, rank: index }
  });
}
function GetGlobalTotalRaidsLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.totalRaids - a.totalRaids })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, totalRaids: e.totalRaids, rank: index }
  });
}
function GetGlobalHighestPowerLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return (b.highestPower+b.powerBonus) - (a.highestPower+a.powerBonus) })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, highestPower: e.highestPower, powerBonus: e.powerBonus, rank: index }
  });
}
function GetGlobalHighestPowerMinusArtifactLeaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.highestPower - a.highestPower })].map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, highestPower: e.highestPower, rank: index }
  });
}
function GetGlobalDawning2020Leaderboard() {
  return [...Object.values(Players).sort((a,b) => { return b.dawning2020 - a.dawning2020 })].filter(e => e.dawning2020).map((e, index) => {
    return { membershipID: e.membershipID, displayName: e.displayName, dawning2020: e.dawning2020, rank: index }
  });
}