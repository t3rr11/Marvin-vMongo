//Required Libraries and Files
let Config = require('../Configs/Config.json');
const Log = require('./scripts/log');
const Checks = require('./scripts/checks');
const Database = require('./scripts/database');
const Merge = require('./scripts/sqlMerge');
const Test = require('./scripts/testing');
const { ErrorHandler } = require('./scripts/errorHandler');
const DefinitionHandler = require('./scripts/definitionHandler');
const Tracking = require('./scripts/tracking');

//Global variables
let InitializationTime = new Date().getTime();
let LastScanTime = new Date().getTime();
let APIDisabled = false;
let ScanSpeed = 10;
let ClanScans = 0;
let ScanLength = 0;

async function init() {
  //Clear console if in debug mode
  //if(Config.enableDebug){ console.clear(); }
  
  //Do initialization checks
  await doChecks();

  //Define variables
  var allClans = []; 
  var clans = [];
  var startTime = new Date().getTime();
  var processing = [];
  var index = 0;

  await Database.getTrackedClans((isError, isFound, data) => {
    if(!isError) {
      if(Config.isLocal) { allClans, clans = data.filter(e => !e.realtime); }
      else { allClans, clans = data.filter(e => e.realtime); }
    }
  });

  //Loops
	setInterval(() => { Log.SaveBackendStatus(APIDisabled, ScanSpeed, ClanScans, ScanLength, LastScanTime, InitializationTime, processing); }, 1000 * 10); //10 Second Interval
  setInterval(() => { doChecks(); }, 1000 * 60 * 1); //1 Minute Interval
  setInterval(() => { DefinitionHandler.updateDefinitions(); }, 1000 * 60 * 1); //1 Minute Interval

  //Console Log
  Log.SaveLog("Info", `Backend server has started.`);
  Log.SaveLog("Info", `Tracking ${ Config.enableTracking ? "Enabled." : "Disabled." }`);

  //Clan scanner function, this is the main heart of the backend. It will scan for clan members, then update them or add them accordingly.
  clanScanner = async ()  => {
    //Alorigthm to check how many clans are being processed, for optimal time we want this to be between 20-30 at all times possible. But never over 30.
    if(processing.length >= Math.round(ScanSpeed * 0.8)) { setTimeout(clanScanner, 1000 * 5); }
    else if(processing.length >= ScanSpeed) { setTimeout(clanScanner, 1000 * 120); }
    else { setTimeout(clanScanner, 100); }

    //Start data grabbing.
    if(index < clans.length-1) {
      //Add clan to processing queue.
      processing.push({ "clanID": clans[index].clanID, "added": new Date().getTime() });

      //Get clan members
      Tracking.UpdateClan(clans[index], function UpdateClan(clan, isError, severity, err) {
        if(isError) { ErrorHandler(severity, err); }
        //Remove it from queue as clan update has finished.
        processing.splice(processing.indexOf(processing.find(e => e.clanID === clan.clanID)), 1);
      });
    }
    else {
      //Restart when processing length is lower than scanspeed. Allow 10 seconds for restart.
      if(!APIDisabled) {
        //If there are only a few clans left, restart the scanning.
        if(processing.length <= Math.round(ScanSpeed * 0.6)) {
          //Allow 15 seconds to avoid restarting multiple times.
          if((new Date().getTime() - new Date(LastScanTime).getTime()) > 15000) {
            restartTracking();
          }
        } 
      }
    }

    index++;
  };

  //Reset function, this will restart the scanning process if marvin has scanned mostly all clans. Again trying to keep above 20 so it will rescan before it is finished the previous scan.
  restartTracking = async () => {
    Database.getTrackedClans((isError, isFound, data) => {
      if(!isError) {
        var onlineMembers = 0;
        for(let i in clans) { onlineMembers += clans[i].onlineMembers; }
        console.log(`Scan took: ${ Math.round((new Date().getTime() - startTime) / 1000) }s to scan ${ clans.length } clans. Which was a total of ${ onlineMembers } players. Each: ~(${ (Math.round((new Date().getTime() - startTime) / 1000) / onlineMembers).toFixed(2) }s) @ Scanspeed: ${ Config.scanSpeed }`);
        LastScanTime = new Date().getTime(); //Log last scan time.
        ScanLength = new Date().getTime() - startTime; //Get timing of last scan. This is for tracking purposes.
        if(Config.isLocal) { allClans = data.filter(e => !e.realtime); }
        else { allClans = data.filter(e => e.realtime); }
        clans = []; //Reset clans array to be empty.
    
        //Check processing clans, If any are taking longer than 15 minutes, remove from processing queue and re-add.
        for(var i in processing) { if((new Date().getTime() - processing[i].added) > (1000 * 60 * 15)) { processing.splice(processing.indexOf(processing.find(e => e.clanID === processing[i].clanID)), 1); } }
    
        //Create a new array with clans to scan that are not already being scanned.
        clans = allClans.filter(e => !processing.find(f => f.clanID === e.clanID));
    
        //Reset start time and index.
        startTime = new Date().getTime();
        index = 0;
      }
    })
  }

  //If config allows, start scanning clans...
  if(Config.enableTracking) {
    let clansEmptyCheck = setInterval(async function ClanEmptyCheck() {
      if(clans.length !== 0) {
        //Initialize the clan scanner.
        clearInterval(clansEmptyCheck);
        clanScanner();
      }
    }, 1000);
  }
};

async function doChecks() {
  await DefinitionHandler.updateDefinitions();
  await Checks.CheckMaintenance(APIDisabled, (isDisabled) => { APIDisabled = isDisabled });
  await Checks.UpdateScanSpeed(ScanSpeed, (Speed) => { ScanSpeed = Speed });
}

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(Database.checkSSHConnection() && Database.checkDBConnection() && DefinitionHandler.checkDefinitions()) {
    //Initialize the backend and start running!
    clearInterval(startupCheck);
    init();

    //Testing Below
    //Test.getClanInfo();
    //Merge.addNewGuilds();
    //Merge.addNewClans();
  }
}, 1000);