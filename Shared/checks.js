//Required Libraries and Files
const fs = require("fs");
const Log = require("./log.js");
const APIRequest = require('./handlers/requestHandler');
const { ErrorHandler } = require('./handlers/errorHandler');

module.exports = { CheckMaintenance, UpdateScanSpeed, UpdateSeason }

async function CheckMaintenance(APIDisabled, callback) {
  await APIRequest.GetSettings((isError, data) => {
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
    fs.readFile('../Shared/configs/Config.json', (err, data) => {
      var NConfig = JSON.parse(data);
      if(NConfig) { callback(NConfig.scanSpeed); }
      else { callback(currSpeed); }
      resolve(true);
    });
  });
}

async function UpdateSeason(currentSeason, callback) {
  //Since fs does not await. I had to contain it in a promise.
  await new Promise((resolve) => {
    fs.readFile('../Shared/configs/Config.json', (err, data) => {
      var NConfig = JSON.parse(data);
      if(NConfig) {
        if(currentSeason !== 0) {
          if(new Date(NConfig.newSeasonDate) - new Date() < 0) {
            NConfig.newSeasonDate = new Date(new Date(NConfig.newSeasonDate).getTime() + 7776000000).toISOString();
            NConfig.currentSeason = NConfig.currentSeason + 1;
            fs.writeFile('../Shared/configs/Config.json', JSON.stringify(NConfig), (err) => { if (err) console.error(err) });
            console.log(`A new season is upon us. The current season has been changed from ${ NConfig.currentSeason-1 } to ${ NConfig.currentSeason }`);
            callback(NConfig.currentSeason);
          }
          else { callback(NConfig.currentSeason); }
        }
        else { callback(NConfig.currentSeason); }
      }
      else { callback(currentSeason); }
      resolve(true);
    });
  });
}
