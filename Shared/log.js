//Required Libraraies
const fs = require('fs');
const Misc = require("./misc");

//Exports
module.exports = { SaveLog, SaveBackendStatus, LogBackendStatus, LogFrontendStatus };

//Functions
function SaveLog(location, type, log) {
  const Database = require("./database");
  if(location !== "ErrorHandler") { console.log(Misc.GetReadableDateTime() + " - " + log); }
  Database.addLog({ location, type, log }, function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
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
  const Database = require("./database");
  Database.addBackendStatusLog({
    index, rt_index,
    clans, rt_clans,
    processing, rt_processing,
    uptime, speed, APIStatus,
  },
  function AddBackendStatusLog(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}

function LogFrontendStatus(users, servers, commandsInput, uptime) {
  const Database = require("./database");
  Database.addFrontendStatusLog({ users, servers, commandsInput, uptime },
  function AddFrontendStatusLog(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}

function ErrorHandler(severity, error) {
  if(severity === "High") { console.log('\x1b[1;31m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else if(severity === "Med") { console.log('\x1b[1;33m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else if(severity === "Low") { console.log('\x1b[1;33m%s\x1b[0m', `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  else { console.log(`Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`); }
  SaveLog("ErrorHandler", "Error", `Severity: ${ severity }, Caller: ${ arguments.callee.caller.name }, Error: ${ JSON.stringify(error) }`);
}