//Required Libraries and Files
let Config = require('../Shared/configs/Config.json');
const Log = require('../Shared/log');
const Misc = require('../Shared/misc');
const Tracking = require('./scripts/tracking');
const Database = require('../Shared/database');
const { ErrorHandler } = require('../Shared/handlers/errorHandler');
const GlobalItemsHandler = require('../Shared/handlers/globalItemsHandler');
const ManifestHandler = require('../Shared/handlers/manifestHandler');
const APIRequest = require('../Shared/handlers/requestHandler');
const Checks = require('../Shared/checks');
const Merge = require('./scripts/sqlMerge');
const Test = require('./scripts/testing');
const Metrics = require('./scripts/metrics');

//Global variables
let InitializationTime = new Date().getTime();
let LastScanTime = new Date().getTime();
let Season = 0;
let APIDisabled = false;
let Restarting = false;
let RT_Restarting = false;
let ScanSpeed = 10;
let ClanScans = 0;
let ScanLength = 0;
let isConnecting = false;
let ran = false;

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.

let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.BackendConnect(); }
  if(Database.checkDBConnection() && GlobalItemsHandler.checkGlobalItems() && ManifestHandler.checkManifestMounted()) {
    //Initialize the backend and start running!
    clearInterval(startupCheck);
    init();

    //Testing Below
    //Test.getClanInfo();
    //Merge.addNewGuilds();
    //Merge.addNewClans();
    //Merge.addNewRegisteredUsers();
    //Merge.addNewBroadcasts();
  }
}, 1000);

async function init() {
  //Clear console if in debug mode
  //if(Config.enableDebug){ console.clear(); }
  
  //Do initialization checks
  await Checks.UpdateScanSpeed(ScanSpeed, (Speed) => { ScanSpeed = Speed });
  await doChecks();

  //Define variables
  var allClans = []; 
  var clans = [];
  var startTime = new Date().getTime();
  var processing = [];
  var index = 0;
  var rt_allClans = []; 
  var rt_clans = [];
  var rt_processing = [];
  var rt_index = 0;
  var rt_tempSpeed = 15000;
  var rt_scanSpeed = 5;

  new Promise(resolve => {
    Database.getTrackedClans((isError, isFound, data) => {
      if(!isError) {
        allClans = data.filter(e => !e.realtime);
        clans = data.filter(e => !e.realtime);
        rt_allClans = data.filter(e => e.realtime);
        rt_clans = data.filter(e => e.realtime);
      }
      resolve(true);
    });
  });

  //Loops
	setInterval(() => { Log.SaveBackendStatus(APIDisabled, ScanSpeed, ClanScans, ScanLength, LastScanTime, InitializationTime, processing); }, 1000 * 10); //10 Second Interval
  setInterval(() => { LogCookies(); }, 1000 * 60 * 10); //10 Minute Interval
  setInterval(() => { doChecks(); }, 1000 * 60 * 1); //1 Minute Interval
  setInterval(() => { GlobalItemsHandler.updateGlobalItems(); }, 1000 * 60 * 1); //1 Minute Interval
  setInterval(() => { ManifestHandler.checkManifestUpdate(); }, 1000 * 60 * 10); //10 Minute Interval
  setInterval(() => { Metrics.setMetrics(APIDisabled, index, rt_index, allClans.length, rt_allClans.length, processing.length, rt_processing.length) }, 1000); // 1 Second Interval
  setInterval(() => { Log.LogBackendStatus(index, rt_index, allClans.length, rt_allClans.length, processing.length, rt_processing.length, (new Date().getTime() - InitializationTime), ScanSpeed, !APIDisabled); }, 1000); // 1 Second Interval

  //Console Log
  Log.SaveLog("Backend", "Startup", `Backend server has started.`);
  Log.SaveLog("Backend", "Info", `Tracking ${ Config.enableTracking ? "Enabled." : "Disabled." }`);

  //Clan scanner function, this is the main heart of the backend. It will scan for clan members, then update them or add them accordingly.
  clanScanner = async ()  => {
    //Check if the API is disabled or not
    if(!APIDisabled) {
      //Set loop speed to 100ms
      setTimeout(clanScanner, 100);

      //Check if the max amount of clans are being scanned or if there is room for another.
      if(processing.length < ScanSpeed) {
        //Start data grabbing.
        if(index <= clans.length-1) {
          //Add clan to processing queue.
          processing.push({ "clanID": clans[index].clanID, "added": new Date().getTime() });

          //Get clan members
          Tracking.UpdateClan(clans[index], Season, function UpdateClan(clan, isError, severity, err) {
            if(isError) { ErrorHandler(severity, err); }
            //Remove it from queue as clan update has finished.
            processing.splice(processing.indexOf(processing.find(e => e.clanID === clan.clanID)), 1);
          });
        }
        else {
          //Restart when processing length is lower than scanspeed. Allow 10 seconds for restart.
          if(!APIDisabled && !Restarting) {
            //If there are only a few clans left, restart the scanning.
            if(processing.length <= Math.round(ScanSpeed * 0.6)) {
              Restarting = true;
              restartTracking();
            }
            else { processing = processing.filter(e => (new Date().getTime() - e.added) < (1000 * 60 * 15)); }
          }
        }

        index++;
      }
    }
    else {
      //If the API is down, there is no need to scan at such a fast rate, retry every minute.
      setTimeout(clanScanner, (1000 * 60));
    }
  };

  //Reset function, this will restart the scanning process if marvin has scanned mostly all clans. Again trying to keep above 20 so it will rescan before it is finished the previous scan.
  restartTracking = async () => {
    Database.getTrackedClans(async (isError, isFound, data) => {
      if(!isError) {
        var onlineMembers = 0;
        for(let i in clans) { onlineMembers += clans[i].onlineMembers; }
        Log.SaveLog("Backend", "Scan", `Scan took: ${ Misc.formatTime("small", (new Date().getTime() - startTime) / 1000) } to scan ${ clans.length } clans. Which was a total of ${ onlineMembers } players. Each: ~(${ (Math.round((new Date().getTime() - startTime) / 1000) / onlineMembers).toFixed(2) }s) @ Scanspeed: ${ ScanSpeed }`);
        LastScanTime = new Date().getTime(); //Log last scan time.
        ScanLength = new Date().getTime() - startTime; //Get timing of last scan. This is for tracking purposes.
        allClans = data.filter(e => !e.realtime);
        clans = []; //Reset clans array to be empty.
    
        //Check processing clans, If any are taking longer than 15 minutes, remove from processing queue and re-add.    
        processing = processing.filter(e => (new Date().getTime() - e.added) < (1000 * 60 * 15));

        //Create a new array with clans to scan that are not already being scanned.
        clans = allClans.filter(e => !processing.find(f => f.clanID === e.clanID));

        //Reset start time and index.
        await Checks.UpdateScanSpeed(ScanSpeed, (Speed) => { ScanSpeed = Speed });
        startTime = new Date().getTime();
        index = 0;
        Restarting = false;
      }
    })
  }

  //Realtime Clan scanner, this tracks clans that pay for the quicker broadcasts. Basically a smaller pool of clans = quicker broadcasts.
  rt_clanScanner = async ()  => {//Check if the API is disabled or not
    if(!APIDisabled) {
      //Set loop speed to 100ms
      setTimeout(rt_clanScanner, 1000);

      //Check if the max amount of clans are being scanned or if there is room for another.
      if(rt_processing.length < rt_scanSpeed) {
        //Start data grabbing.
        if(rt_index <= rt_clans.length-1) {
          //Add clan to realtimeProcessing queue.
          rt_processing.push({ "clanID": rt_clans[rt_index].clanID, "added": new Date().getTime() });

          //Get clan members
          Tracking.UpdateClan(rt_clans[rt_index], Season, function UpdateClan(clan, isError, severity, err) {
            if(isError) { Log.SaveLog("Backend", "Error", err); ErrorHandler(severity, err); }
            //Remove it from queue as clan update has finished.
            rt_processing.splice(rt_processing.indexOf(rt_processing.find(e => e.clanID === clan.clanID)), 1);
          });
        }
        else {
          if(!APIDisabled && !RT_Restarting) {
            //If there are no clans left, restart the scanning.
            if(rt_processing.length <= 2) {
              RT_Restarting = true;
              rt_restart();
            }
            else { rt_processing = rt_processing.filter(e => (new Date().getTime() - e.added) < (1000 * 60 * 5)); }
          }
        }

        rt_index++;
      }
    }
    else {
      //If the API is down, there is no need to scan at such a fast rate, retry every minute.
      setTimeout(rt_clanScanner, (1000 * 60));
    }
  }

  //Reset function, this will restart the scanning process if marvin has scanned all realtime clans.
  rt_restart = async () => {
    Database.getTrackedClans(async (isError, isFound, data) => {
      if(!isError) {
        var onlineMembers = 0;
        for(let i in rt_clans) { onlineMembers += rt_clans[i].onlineMembers; }
        Log.SaveLog("Backend", "Scan", `Realtime Scanned: ${ rt_clans.length } clans. Which was a total of ${ onlineMembers } players. @ Scanspeed: ${ rt_scanSpeed }`);
        rt_allClans = data.filter(e => e.realtime);
        rt_clans = []; //Reset rt_clans array to be empty.

        //Check rt_processing clans, If any are taking longer than 15 minutes, remove from rt_processing queue and re-add.
        rt_processing = rt_processing.filter(e => (new Date().getTime() - e.added) < (1000 * 60 * 15));
            
        //Create a new array with clans to scan that are not already being scanned.
        rt_clans = rt_allClans.filter(e => !rt_processing.find(f => f.clanID === e.clanID));

        //Reset start time and rt_index.
        rt_index = 0;
        RT_Restarting = false;
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
        rt_clanScanner();
      }
    }, 1000);
  }
};

async function doChecks() {
  await GlobalItemsHandler.updateGlobalItems();
  await Checks.CheckMaintenance(APIDisabled, (isDisabled) => { APIDisabled = isDisabled });
  await Checks.UpdateSeason(Season, (NSeason) => { Season = NSeason });
}

async function LogCookies() {
  //This one is to update the cookies leaderboard
  try {
    APIRequest.GetCookies((isError, Data) => {
      if(!isError) {
        try {
          let Cookies = Data.Response.characterProgressions.data["2305843009405310126"].uninstancedItemObjectives[1867822656][0].progress;
          Database.addCookieLog({ cookies: Cookies });
        }
        catch (err) { ErrorHandler("Med", `Failed to get cookies data: ${ err }`) }
      }
    });
  }
  catch (err) { ErrorHandler("High", err); }
}