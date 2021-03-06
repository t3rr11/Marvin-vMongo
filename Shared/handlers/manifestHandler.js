const Database = require('../database');
const Log = require('../log');
const { ErrorHandler } = require('./errorHandler');
const APIRequest = require('./requestHandler');
const Config = require('../configs/Config.json');
const fs = require('fs');

let Manifest = { };
let ManifestVersion = null;

function checkManifestMounted() {
  if(Object.keys(Manifest).length > 0) { return true; }
  else { return false; }
}

getManifest = () => { return Manifest; }
getManifestVersion = () => { return ManifestVersion; }
getManifestItemByName = (name) => {
  let searchResults = Object.values(Manifest.DestinyInventoryItemDefinition).filter(e => e.displayProperties.name.toUpperCase() === name.toUpperCase());
  let filterCollectibles = searchResults.filter(e => e.collectibleHash);
  return filterCollectibles[0];
}
getManifestItemByHash = (hash) => { return Manifest.DestinyInventoryItemDefinition[hash] }
getManifestItemByCollectibleHash = (collectibleHash) => {
  let collectible = Manifest.DestinyCollectibleDefinition[collectibleHash];
  let item = Manifest.DestinyInventoryItemDefinition[collectible?.itemHash]
  return item ? item : collectible;
}
getManifestTitleByName = (name) => {
  const legacySealsNode = getManifest().DestinyPresentationNodeDefinition[1881970629];
  const legacysealsParents = legacySealsNode.children.presentationNodes.map(e => { return e.presentationNodeHash });
  const sealsNode = getManifest().DestinyPresentationNodeDefinition[616318467];
  const sealsParents = sealsNode.children.presentationNodes.map(e => { return e.presentationNodeHash });
  let seals = sealsParents.map(e => { return getManifest().DestinyRecordDefinition[getManifest().DestinyPresentationNodeDefinition[e].completionRecordHash] });
  let legacySeals = legacysealsParents.map(e => { return getManifest().DestinyRecordDefinition[getManifest().DestinyPresentationNodeDefinition[e].completionRecordHash] });
  let gildedSeals = seals.map(e => { return getManifest().DestinyRecordDefinition[getManifest().DestinyRecordDefinition[e.hash].titleInfo.gildingTrackingRecordHash] });
  let legacyGildedSeals = legacySeals.map(e => { return getManifest().DestinyRecordDefinition[getManifest().DestinyRecordDefinition[e.hash].titleInfo.gildingTrackingRecordHash] });
  let allSeals = seals.concat(legacySeals);
  let allGildedSeals = gildedSeals.concat(legacyGildedSeals.filter(e => e !== undefined));
  let allSealsCombined = allSeals.concat(allGildedSeals.filter(e => e !== undefined));

  return allSealsCombined.filter(e => e.titleInfo.titlesByGender.Male.toUpperCase() === name.toUpperCase());
}


storeManifest = async function StoreManifest() {
  await Database.getManifestVersion((isError, isFound, data) => {
    if(!isError) {
      if(isFound) {
        ManifestVersion = data[0].version;
        Manifest = {
          DestinyActivityDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyActivityDefinition.json')),
          DestinyActivityTypeDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyActivityTypeDefinition.json')),
          DestinyActivityModeDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyActivityModeDefinition.json')),
          DestinyActivityModifierDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyActivityModifierDefinition.json')),
          DestinyCollectibleDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyCollectibleDefinition.json')),
          DestinyPresentationNodeDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyPresentationNodeDefinition.json')),
          DestinyRecordDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyRecordDefinition.json')),
          DestinyInventoryItemDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyInventoryItemDefinition.json')),
          DestinyInventoryBucketDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyInventoryBucketDefinition.json')),
          DestinyObjectiveDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyObjectiveDefinition.json')),
          DestinyProgressionDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyProgressionDefinition.json')),
          DestinyTalentGridDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyTalentGridDefinition.json')),
          DestinyVendorDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyVendorDefinition.json'))
        };
      }
      else { ErrorHandler("High", `Failed to get manifest version as there is not one in the database.`) }
    }
    else { ErrorHandler("High", `Failed to get manifest version: ${ data }`); }
  });
}
//Backend manages this check, it runs every 10 minutes. Neither frontend nor Express should interact with this function to avoid multiple updates.
checkManifestUpdate = async function CheckManifestUpdate(location) {
  await Database.getManifestVersion(function GetOldManifestVersion(isError, isFound, version) {
    if(!isError) {
      if(isFound) {
        if(location === "frontend") {
          //If frontend, check if manifest has been updated and restore.
          if(getManifestVersion() !== version[0].version) {
            Log.SaveLog("Frontend", "Info", `Frontend: Manifest is different re-storing... (${ getManifestVersion() }) to (${ version[0].version })`);
            storeManifest();
          }
        }
        else {
          //If backend, check if manifest needs an update
          APIRequest.GetManifestVersion(function GetNewManifestVersion(isError, newVersion) {
            if(!isError) {
              if(version[0].version !== newVersion.Response.version) {
                Log.SaveLog("Backend", "Info", `Frontend: Manifest is different updating... (${ version[0].version }) to (${ newVersion.Response.version })`);
                updateManifest(false);
              }
              else { if(!checkManifestMounted()) { storeManifest(); } }
            }
            else { ErrorHandler("High", `Failed to get new manifest version: ${ newVersion }`) }
          });
        }
      }
      else { updateManifest(false); }
    }
    else { ErrorHandler("High", `Failed to get manifest version: ${ version }`) }
  });
}
updateManifest = async function UpdateManifest(retried) {
  APIRequest.GetManifestVersion(function GetManifestVersion(isError, data) {
    const manifest = data.Response;
    const manifestVersion = manifest.version;
    if(!isError) {
      Promise.all([
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyActivityDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyActivityTypeDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyActivityModeDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyActivityModifierDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyCollectibleDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyPresentationNodeDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyRecordDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyInventoryItemDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyInventoryBucketDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyObjectiveDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyProgressionDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyTalentGridDefinition + "?43q65jngqgab4jg"),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyVendorDefinition + "?43q65jngqgab4jg")
      ]).then(async (values) => {
        let didValidateError = false;
        let didError = false;

        //Validate the values
        values.map((e, index) => {
          if(Object.keys(e.Data).length > 0) {}
          else { didValidateError = true }
        });

        //If no validation errors then write the files
        if(!didValidateError) {
          fs.writeFile('../Shared/manifest/DestinyActivityDefinition.json', JSON.stringify(values[0].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyActivityTypeDefinition.json', JSON.stringify(values[1].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyActivityModeDefinition.json', JSON.stringify(values[2].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyActivityModifierDefinition.json', JSON.stringify(values[3].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyCollectibleDefinition.json', JSON.stringify(values[4].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyPresentationNodeDefinition.json', JSON.stringify(values[5].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyRecordDefinition.json', JSON.stringify(values[6].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyInventoryItemDefinition.json', JSON.stringify(values[7].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyInventoryBucketDefinition.json', JSON.stringify(values[8].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyObjectiveDefinition.json', JSON.stringify(values[9].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyProgressionDefinition.json', JSON.stringify(values[10].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyTalentGridDefinition.json', JSON.stringify(values[11].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
          fs.writeFile('../Shared/manifest/DestinyVendorDefinition.json', JSON.stringify(values[12].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        }
        else { ErrorHandler("High", "Failed to update Manifest, Validation Error"); }

        //Update version in database
        if(!didError && !didValidateError) {
          //Check if isLocal before updating records.
          if(!Config.isLocal) {
            Database.updateManifestVersion("Version", { name: "Version", version: manifestVersion }, 
            function UpdateManifestVersion(isError, severity, data) {
              if(isError) { ErrorHandler(severity, data); }
              else { storeManifest(); }
            });
          }
          else { storeManifest(); }
        }
        else {
          ErrorHandler("High", `Failed to update Manifest - Validation: ${ didValidateError ? 'failed' : 'passed' }, WriteError: ${ didError ? 'failed' : 'passed' } - ${ retried ? 'Not Retrying' : 'Retrying' }`);
          if(!retried) { updateManifest(true); }
        }
      }).catch((error) => { ErrorHandler("High", error); });
    }
    else { ErrorHandler("High", data) }
  });
}

verifyManifest = (callback) => {
  let validation = Object.keys(Manifest).map(e => {
    if(Manifest[e]) {
      if(Object.keys(Manifest[e]).length > 0) { return { component: e, passed: true } }
      else { return { component: e, passed: false } }
    }
    else { return { component: e, passed: false } }
  });
  callback(validation);
}

checkManifestUpdate();

module.exports = {
  getManifest, getManifestVersion, getManifestItemByName, getManifestItemByHash, getManifestItemByCollectibleHash,
  getManifestTitleByName, checkManifestMounted, checkManifestUpdate, updateManifest, verifyManifest
}