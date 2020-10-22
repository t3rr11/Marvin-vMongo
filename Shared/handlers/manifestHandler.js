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
getManifestItemByName = (name) => { return Object.values(Manifest.DestinyInventoryItemLiteDefinition).find(e => e.displayProperties.name.toUpperCase() === name.toUpperCase()) }
getManifestItemByHash = (hash) => { return Manifest.DestinyInventoryItemLiteDefinition[hash] }
getManifestItemByCollectibleHash = (collectibleHash) => { return Manifest.DestinyInventoryItemLiteDefinition[Manifest.DestinyCollectibleDefinition[collectibleHash]?.itemHash]; }
getManifestTitleByName = (name) => {
  const sealsNode = Manifest.DestinyPresentationNodeDefinition[1652422747];
  const sealsParents = sealsNode.children.presentationNodes.map(e => { return e.presentationNodeHash });
  const sealsCompletionHashes = sealsParents.map(e => { return Manifest.DestinyPresentationNodeDefinition[e].completionRecordHash });
  const seals = sealsCompletionHashes.map(e => Manifest.DestinyRecordDefinition[e]);

  if(name === "conquorer s10") { return seals.find(e => e.hash === 1983630873); }
  else if(name === "conquorer s11") { return seals.find(e => e.hash === 4081738395); }
  else if(name === "flawless s10") { return seals.find(e => e.hash === 2945528800); }
  else if(name === "flawless s11") { return seals.find(e => e.hash === 1547272082); }
  else { return seals.find(e => e.titleInfo.titlesByGender.Male.toUpperCase() === name.toUpperCase()); }
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
          DestinyInventoryItemLiteDefinition: JSON.parse(fs.readFileSync('../Shared/manifest/DestinyInventoryItemLiteDefinition.json')),
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
checkManifestUpdate = async function CheckManifestUpdate() {
  await Database.getManifestVersion(function GetOldManifestVersion(isError, isFound, version) {
    if(!isError) {
      if(isFound) {
        APIRequest.GetManifestVersion(function GetNewManifestVersion(isError, newVersion) {
          if(!isError) {
            if(version[0].version !== newVersion.Response.version) {
              console.log("Manifest is different updating...");
              updateManifest();
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
        APIRequest.GetManifest(manifest.jsonWorldComponentContentPaths['en'].DestinyInventoryItemLiteDefinition),
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
        fs.writeFile('../Shared/manifest/DestinyInventoryItemLiteDefinition.json', JSON.stringify(values[6].Data), function (err) { if (err) { ErrorHandler("High", err); didError = true; } });
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