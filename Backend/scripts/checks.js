//Required Libraries and Files
const fs = require("fs");
const Log = require("./log.js");
const APIRequest = require('./requestHandler');
const { ErrorHandler } = require('./errorHandler');

module.exports = { CheckMaintenance, UpdateScanSpeed }

async function CheckMaintenance(APIDisabled, callback) {
  await APIRequest.GetClan({ clanID: 3917089 }, (clan, isError, data) => {
    //Check if response is the maintenance error code.
    if(data.isError && data.ErrorCode === 5) {
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

async function UpdateScanSpeed(currSpeed, callback) {
  //Since fs does not await. I had to contain it in a promise.
  await new Promise((resolve) => {
    fs.readFile('../Configs/Config.json', (err, data) => {
      var NConfig = JSON.parse(data);
      if(NConfig) { callback(NConfig.scanSpeed); }
      else { callback(currSpeed); }
      resolve(true);
    });
  });
}

