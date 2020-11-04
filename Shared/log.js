//Required Libraraies
const fs = require('fs');
var Misc = require("./misc.js");
var Database = require("./database.js");
var { ErrorHandler } = require("./handlers/errorHandler.js");

//Exports
module.exports = { SaveLog, SaveBackendStatus, LogBackendStatus };

//Functions
function SaveLog(location, type, log) {
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
  Database.addBackendStatusLog({
    index, rt_index,
    clans, rt_clans,
    processing, rt_processing,
    uptime, speed, APIStatus,
  },
  function AddBackendStatusLog(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}