//Required Libraries and Files
var Log = require("./log.js");

module.exports = { CheckMaintenance, UpdateScanSpeed }

async function CheckMaintenance(APIDisabled, callback) {
  await ClanData.GetClanDetails("3917089").then(function(response) {
    //Check if response is the maintenance error code.
    if(response.error && response.reason.ErrorCode === 5) {
      if(APIDisabled === false) {
        Log.SaveError("The Bungie API is temporarily disabled for maintenance.");
        callback(true);
      }
    }
    else {
      if(APIDisabled === true) {
        Log.SaveError("The Bungie API is back online!");
        callback(false);
      }
    }
  });
}

function UpdateScanSpeed(currSpeed, callback) {
  var NConfig = JSON.parse(fs.readFileSync('../Configs/Config.json').toString());
  if(NConfig) { callback(NConfig.scan_speed); }
  else { callback(currSpeed); }
}

