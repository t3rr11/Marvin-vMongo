const Database = require('../../../Shared/database.js');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');
const ManifestHandler = require('../../../Shared/handlers/manifestHandler');
const Log = require("../../../Shared/log.js");
const Config = require('../../../Shared/configs/Config.json');

function sendClanBroadcast(clan, guild, clanDetails, type) {
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
    season: Config.currentSeason,
    type: "clan",
    broadcast: BroadcastMessage,
  }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}
function sendItemBroadcast(clan, guild, itemHash, playerData) {
  let itemDef = ManifestHandler.getManifest().DestinyCollectibleDefinition[itemHash];
  let count = -1;
  if(itemHash === "199171385") { count = Data.Raids.lastWish; } // 1000 Voices
  else if(itemHash === "2220014607") { count = Data.Raids.scourge; } // Anarchy
  else if(itemHash === "1903459810") { count = Data.Raids.scourge; } // Always On Time
  else if(itemHash === "2329697053") { count = Data.Raids.sorrows; } // Tarrabah
  Database.addAwaitingBroadcast({
    clanID: clan.clanID,
    guildID: guild.guildID,
    displayName: playerData.User.displayName,
    membershipID: playerData.User.membershipID,
    season: Config.season,
    type: "item",
    broadcast: itemDef.displayProperties.name,
    hash: itemHash,
    count: count,
  }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}

function sendTitleBroadcast(clan, guild, titleHash, playerData) {
  let titleDef = ManifestHandler.getManifest().DestinyRecordDefinition[titleHash];
  Database.addAwaitingBroadcast({
    clanID: clan.clanID,
    guildID: guild.guildID,
    displayName: playerData.User.displayName,
    membershipID: playerData.User.membershipID,
    season: Config.season,
    type: "title",
    broadcast: titleDef.titleInfo.titlesByGender.Male,
    hash: titleHash,
  }, function(isError, severity, err) { if(isError) { ErrorHandler(severity, err) } });
}

module.exports = { sendClanBroadcast, sendItemBroadcast, sendTitleBroadcast }