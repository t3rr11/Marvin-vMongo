//Required Libraries and Files
let Config = require('../Configs/Config.json');
const { ErrorHandler } = require('./scripts/errorHandler');
const SSHConfig = require(`../Configs/${ Config.isLocal ? 'Local' : 'Live' }/SSHConfig.js`).Config;
const DiscordConfig = require(`../Configs/${ Config.isLocal ? 'Local' : 'Live' }/DiscordConfig.json`);
const Checks = require('./scripts/checks');
const database = require('./scripts/database');
const name = require('./scripts/name');

//Global variables
let InitializationTime = new Date().getTime();
let LastScanTime = new Date().getTime();
let APIDisabled = false;
let ScanSpeed = 10;
let ClanScans = 0;
let ScanLength = 0;

async function init() {
  //Do initialization checks
  await doChecks();

  //Define variables
  var guilds = [];
  var clans = [];
  var processing = [];

  //Clan scanner function
  clanScanner = async function() {
    
  };

  //If config allows, start scanning clans...
  if(Config.enableTracking) { clanScanner(); }

  //Loops
	setInterval(() => { Log.SaveBackendStatus(APIDisabled, ScanSpeed, ClanScans, ScanLength, LastScanTime, InitializationTime, processing); }, 1000 * 10); //10 Second Interval
	setInterval(() => { doChecks(); }, 1000 * 60 * 1); //1 Minute Interval

  //Console Log
  if(Config.enableDebug){ console.clear(); }
  Log.SaveLog("Info", `Backend server has started.`);
  Log.SaveLog("Info", `Tracking ${ Config.enableTracking ? "Enabled." : "Disabled." }`);
};

async function doChecks() {
  await Checks.CheckMaintenance(APIDisabled, (isDisabled) => { APIDisabled = isDisabled });
  await Checks.UpdateScanSpeed(ScanSpeed, (Speed) => { ScanSpeed = Speed });
}

function addUsers() {
  let i;
  for(i = 0; i < 10; i++) {
    database.addUser({ name: name.generateName(), sr: Math.floor(Math.random() * 2000), valor: Math.floor(Math.random() * 2000), glory: Math.floor(Math.random() * 5500) });
  }
}

function findUser(membershipID) {
  database.findUserByID(membershipID, (isError, isFound, data) => {
    if(!isError) {
      if(isFound) {
        console.log(data);
      } else { ErrorHandler("Low", `Failed to find user: ${ membershipID }`); }
    } else { ErrorHandler("High", data); }
  });
}

function addUser() {
  database.addUser({
    clanID: 3917089,
    displayName: "Terrii",
    membershipID: "4611686018471334813",
    currentClass: "Titan",
    joinDate: new Date("2019-10-08T01:40:21Z"),
    lastPlayed: new Date(1600514192000)
  }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
}

function addGuild() {
  database.addGuild({
    guildID: "305561313675968513",
    guildName: "Test Server",
    ownerID: "194972321168097280",
    ownerAvatar: "5d26991834b1477572ba55aa47689d02",
    clans: [3917089],
    region: "sydney",
  });
}

function addClan() {
  database.addClan({
    clanID: 3917089,
    clanName: "Marvins Minions",
    clanCallsign: "MM",
  });
}

//Initialize the backend and start running!
//init();

//Testing
addUser();
//findUser("4611686018471334813");