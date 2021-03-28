const Database = require('../../../Shared/database.js');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');
const ManifestHandler = require('../../../Shared/handlers/manifestHandler');
const GlobalItemsHandler = require('../../../Shared/handlers/globalItemsHandler');
const Log = require("../../../Shared/log.js");

function sendClanBroadcast(clan, guild, clanDetails, type, season) {
  var BroadcastMessage = null;
  if(type === "name_change") { BroadcastMessage = `The clan name has been changed from ${ clan.clanName } to ${ clanDetails.name }` }
  if(type === "tag_change") { BroadcastMessage = `The clan tag has been changed from ${ clan.clanCallsign } to ${ clanDetails.clanInfo.clanCallsign }` }
  if(type === "level_up") {
    var clanPerks = "None";
    var clanLevel = clanDetails.clanInfo.d2ClanProgressions["584850370"].level;

    if(clanLevel === 2) {
      clanPerks = `Increased public event rewards.`;
    }
    else if(clanLevel === 3) {
      clanPerks = `Increased public event rewards.\nCompleteting weekly Hawthorne bounties rewards mod components.`;
    }
    else if(clanLevel === 4) {
      clanPerks = `Increased public event rewards.\nCompleteting weekly Hawthorne bounties rewards mod components.\nCompleting clan vendor challenges rewards enhancement cores.`;
    }
    else if(clanLevel === 5) {
      clanPerks = `Increased public event rewards.\nCompleteting weekly Hawthorne bounties rewards mod components.\nCompleting clan vendor challenges rewards enhancement cores.\nEarn a bonus trials token when winning trials matches with clanmates.`;
    }
    else if(clanLevel === 6) {
      clanPerks = `Increased public event rewards.\nCompleteting weekly Hawthorne bounties rewards mod components.\nCompleting clan vendor challenges rewards enhancement cores.\nEarn a bonus trials token when winning trials matches with clanmates.\nUnlocked an additional weekly bounty from Hawthorne.`;
    }
    BroadcastMessage = `${ clan.clanName } has leveled up from level: ${ clan.clanLevel } to ${ clanLevel }\n\n**Clan Perks:**\n${ clanPerks }`;
  }
  Database.addAwaitingBroadcast({
    clanID: clan.clanID,
    guildID: guild.guildID,
    season: season,
    type: "clan",
    broadcast: BroadcastMessage,
  }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}
function sendItemBroadcast(clan, guild, itemHash, playerData, season) {
  var itemDef = ManifestHandler.getManifest().DestinyCollectibleDefinition[itemHash];
  var count = -1;
  if(itemHash === 199171385) { count = playerData.User.raids.lastWish; console.log(playerData.User.raids.lastWish); } // 1000 Voices
  else if(itemHash === 753200559) { count = playerData.User.raids.dsc; console.log(playerData.User.raids.dsc); } // Eyes of Tomorrow
  if(itemDef) {
    console.log(`itemName: ${ itemDef.displayProperties.name }, itemHash: ${ itemHash }, Count: ${ count }`);
    Database.addAwaitingBroadcast({
      clanID: clan.clanID,
      guildID: guild.guildID,
      displayName: playerData.User.displayName,
      membershipID: playerData.User.membershipID,
      season: season,
      type: "item",
      broadcast: itemDef.displayProperties.name,
      hash: itemHash,
      count: count,
    }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
  }
  else { ErrorHandler("Med", `ItemDef not found: ${ itemHash }`) }
}
function sendTitleBroadcast(clan, guild, titleHash, playerData, season) {
  let titleDef = ManifestHandler.getManifest().DestinyRecordDefinition[titleHash];
  if(titleDef.forTitleGilding) {
    const GlobalItems = GlobalItemsHandler.getGlobalItems();
    const globalTitleDef = GlobalItems.find(e => e.hash == titleHash);
    console.log(globalTitleDef.parentHash);
    console.log(globalTitleDef["_doc"].parentHash);
    if(globalTitleDef) {
      Database.addAwaitingBroadcast({
        clanID: clan.clanID,
        guildID: guild.guildID,
        displayName: playerData.User.displayName,
        membershipID: playerData.User.membershipID,
        season: season,
        type: "gildedTitle",
        broadcast: titleDef.titleInfo.titlesByGender.Male,
        hash: titleHash,
        parentHash: globalTitleDef["_doc"].parentHash
      }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
    }
    else { ErrorHandler("High", `Failed to find and send broadcast for title: ${ titleHash } for user: ${ playerData.User.displayName } (${ playerData.User.membershipID })`); }
  }
  else {
    Database.addAwaitingBroadcast({
      clanID: clan.clanID,
      guildID: guild.guildID,
      displayName: playerData.User.displayName,
      membershipID: playerData.User.membershipID,
      season: season,
      type: "title",
      broadcast: titleDef.titleInfo.titlesByGender.Male,
      hash: titleHash,
    }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
  }
}
function sendTriumphBroadcast(clan, guild, recordHash, playerData, season) {
  let recordDef = ManifestHandler.getManifest().DestinyRecordDefinition[recordHash];
  Database.addAwaitingBroadcast({
    clanID: clan.clanID,
    guildID: guild.guildID,
    displayName: playerData.User.displayName,
    membershipID: playerData.User.membershipID,
    season: season,
    type: "triumph",
    broadcast: recordDef.displayProperties.name,
    hash: recordHash,
  }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}
function sendCustomBroadcast(clan, guild, hash, playerData, season) {
  Database.addAwaitingBroadcast({
    clanID: 2603670,
    guildID: "630967941076221954",
    displayName: "BARRY McCOCKINNER",
    membershipID: "4611686018475621200",
    season: 13,
    type: "custom",
    broadcast: `BARRY McCOCKINNER has done ${ parseInt(playerData.User.raids.dsc)-8 } raids without getting Eyes Of Tomorrow, what a scrub.`,
    hash: 753200559,
  }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}

module.exports = { sendClanBroadcast, sendItemBroadcast, sendTitleBroadcast, sendTriumphBroadcast, sendCustomBroadcast }