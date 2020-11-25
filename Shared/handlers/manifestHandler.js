const Database = require('../database');
const { ErrorHandler } = require('./errorHandler');
const APIRequest = require('./requestHandler');
const fs = require('fs');

let Manifest = { };
let ManifestVersion = null;

function checkManifestMounted() {
  if(Object.keys(Manifest).length > 0) { return true; }
  else { return false; }
}

getManifest = () => { return Manifest; }
getManifestVersion = () => { return ManifestVersion; }
getManifestItemByName = (name) => { return Object.values(Manifest.DestinyInventoryItemDefinition).find(e => e.displayProperties.name.toUpperCase() === name.toUpperCase()) }
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
  let allSeals = seals.concat(legacySeals);

  if(name === "conqueror s10") { return allSeals.filter(e => e.hash === 1983630873); }
  else if(name === "conqueror s11") { return allSeals.filter(e => e.hash === 4081738395); }
  else if(name === "flawless s10") { return allSeals.filter(e => e.hash === 2945528800); }
  else if(name === "flawless s11") { return allSeals.filter(e => e.hash === 1547272082); }
  else { return allSeals.filter(e => e.titleInfo.titlesByGender.Male.toUpperCase() === name.toUpperCase()); }
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
        APIRequest.GetManifestVersion(function GetNewManifestVersion(isError, newVersion) {
          if(!isError) {
            if(version[0].version !== newVersion.Response.version) {
              console.log("Manifest is different updating...");
              if(location === "frontend") { storeManifest(); }
              else { updateManifest(); }
            }
            else { if(!checkManifestMounted()) { storeManifest(); } }
          }
          else { ErrorHandler("High", `Failed to get new manifest version: ${ newVersion }`) }
        });
      }
      else { updateManifest(); }
    }
    else { ErrorHandler("High", `Failed to get manifest version: ${ version }`) }
  });
}
updateManifest = async function UpdateManifest() {
  APIRequest.GetManifestVersion(function GetManifestVersion(isError, data) {
    const manifest = data.Response;
    const manifestVersion = manifest.version;
    if(!isError) {
      Promise.all([
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyActivityDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyActivityTypeDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyActivityModeDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyCollectibleDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyPresentationNodeDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyRecordDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyInventoryItemDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyInventoryBucketDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyObjectiveDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyProgressionDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyTalentGridDefinition),
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyVendorDefinition)
      ]).then(async (values) => {
        //Write the files
        let didError = false;
        fs.writeFile('../Shared/manifest/DestinyActivityDefinition.json', JSON.stringify(values[0].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyActivityTypeDefinition.json', JSON.stringify(values[1].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyActivityModeDefinition.json', JSON.stringify(values[2].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyCollectibleDefinition.json', JSON.stringify(values[3].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyPresentationNodeDefinition.json', JSON.stringify(values[4].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyRecordDefinition.json', JSON.stringify(values[5].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyInventoryItemDefinition.json', JSON.stringify(values[6].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyInventoryBucketDefinition.json', JSON.stringify(values[7].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyObjectiveDefinition.json', JSON.stringify(values[8].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyProgressionDefinition.json', JSON.stringify(values[9].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyTalentGridDefinition.json', JSON.stringify(values[10].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
        fs.writeFile('../Shared/manifest/DestinyVendorDefinition.json', JSON.stringify(values[11].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });

        //Update version in database
        if(!didError) {
          Database.updateManifestVersion("Version", { name: "Version", version: manifestVersion }, 
          function UpdateManifestVersion(isError, severity, data) {
            if(isError) { ErrorHandler(severity, data); }
            else {
              //Set manifest
              storeManifest();
            }
          });
        }
      }).catch((error) => { ErrorHandler("High", error); });
    }
    else { ErrorHandler("High", data) }
  });
}

checkManifestUpdate();

module.exports = {
  getManifest, getManifestVersion, getManifestItemByName, getManifestItemByHash, getManifestItemByCollectibleHash,
  getManifestTitleByName, checkManifestMounted, checkManifestUpdate, updateManifest
}