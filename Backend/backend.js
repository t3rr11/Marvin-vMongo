//Required Libraries and Files
let Config = require('../Configs/Config.json');
const Checks = require('./scripts/checks');
const database = require('./scripts/database');
const Test = require('./scripts/testing');

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

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async () => {
  if(database.checkSSHConnection && database.checkDBConnection) {
    clearInterval(startupCheck);
    //Initialize the backend and start running!
    //init();

    //Testing Below
    //addUser();
    //findUser("4611686018471334813");
    await doChecks();
    Test.getClanInfo();
  }
}, 1000);