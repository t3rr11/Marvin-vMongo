//Required Libraraies
const fs = require('fs');
const Misc = require("./misc");
const Config = require("./configs/Config.json");

//Exports
module.exports = { SaveLog, SaveDiscordLog, SaveBackendStatus, LogBackendStatus, LogHourlyBackendStatus, LogFrontendStatus, LogHourlyFrontendStatus, LogScanTime };

//Functions
function SaveLog(location, type, log) {
  const Database = require("./database");
  if(location !== "ErrorHandler") { console.log(Misc.GetReadableDateTime() + " - " + log); }
  if(!Config.isLocal) { Database.addLog({ location, type, log }, function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } }); }
}

function SaveDiscordLog(location, message) {
  const Database = require("./database");
  console.log(Misc.GetReadableDateTime() + " - " + `User: ${ message.member.user.tag }, Command: ${ message.content.slice(0, 100) }`);
  if(!Config.isLocal) {
    Database.addLog({
      location,
      type: "Command",
      log: `User: ${ message.member.user.tag }, Command: ${ message.content.slice(0, 100) }`,
      discordID: message.author.id,
      discordUser: message.member.user.tag,
      guildID: message.guild.id,
      command: message.content.slice(0, 100)
    }, function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
  }
}

function SaveBackendStatus(APIDisabled, ScanSpeed, ClanScans, ScanLength, LastScanTime, InitializationTime, Processing) {
  var thisTime = new Date().getTime();
  var totalTime = thisTime - InitializationTime;
  var lastScan = thisTime - LastScanTime;
  var status = {
    "scanSpeed": ScanSpeed,
    "processingClans": Processing,
    "uptime": totalTime,
    "scans": ClanScans,
    "scanTime": ScanLength,
    "lastScan": lastScan,
    "APIDisabled": APIDisabled
  }
  fs.writeFile('./data/backend_status.json', JSON.stringify(status), (err) => {  });
}

function LogBackendStatus(index, rt_index, clans, rt_clans, processing, rt_processing, uptime, speed, APIStatus) {
  if(!Config.isLocal) { 
    const Database = require("./database");
    Database.addBackendStatusLog({
      index, rt_index,
      clans, rt_clans,
      processing, rt_processing,
      uptime, speed, APIStatus,
    },
    function AddBackendStatusLog(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
  }
}

function LogHourlyBackendStatus(index, rt_index, clans, rt_clans, processing, rt_processing, uptime, speed, APIStatus) {
  if(!Config.isLocal) { 
    const Database = require("./database");
    Database.addHourlyBackendStatusLog({
      index, rt_index,
      clans, rt_clans,
      processing, rt_processing,
      uptime, speed, APIStatus,
    },
    function AddHourlyBackendStatusLog(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
  }
}

function LogScanTime(type, time, clans, players, scanspeed) {
  if(!Config.isLocal) { 
    const Database = require("./database");
    Database.addTimeLog({ type, time, clans, players, scanspeed },
    function AddHourlyBackendStatusLog(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
  }
}

function LogFrontendStatus(users, servers, commandsInput, uptime) {
  if(!Config.isLocal) { 
    const Database = require("./database");
    Database.addFrontendStatusLog({ users, servers, commandsInput, uptime },
    function AddFrontendStatusLog(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
  }
}

function LogHourlyFrontendStatus(users, servers, commandsInput, uptime) {
  if(!Config.isLocal) { 
    const Database = require("./database");
    Database.addHourlyFrontendStatusLog({ users, servers, commandsInput, uptime },
    function AddHourlyFrontendStatusLog(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
  }
}

function ErrorHandler(severity, error) {
  if(severity === "High") { console.log('\x1b[1;31m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else if(severity === "Med") { console.log('\x1b[1;33m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else if(severity === "Low") { console.log('\x1b[1;33m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else { console.log(`Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  SaveLog("ErrorHandler", "Error", `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`);
}