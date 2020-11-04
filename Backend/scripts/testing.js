const Database = require('../../Shared/database');
const APIRequest = require('../../Shared/handlers/requestHandler');
const { ErrorHandler } = require('../../Shared/handlers/errorHandler');

function findUser(membershipID) {
  Database.findUserByID(membershipID, (isError, isFound, data) => {
    if(!isError) {
      if(isFound) {
      } else { ErrorHandler("Low", `Failed to find user: ${ membershipID }`); }
    } else { ErrorHandler("High", data); }
  });
}
function addGuild() {
  Database.addGuild({
    guildID: "305561313675968513",
    guildName: "Test Server",
    ownerID: "194972321168097280",
    ownerAvatar: "5d26991834b1477572ba55aa47689d02",
    clans: [3917089],
    region: "sydney",
  }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
}
function addClan() {
  Database.addClan({
    clanID: 3917089,
    clanName: "Marvins Minions",
    clanCallsign: "MM",
    clanLevel : 6,
		memberCount : 52,
		onlineMembers : 3,
		firstScan : true,
		forcedScan : false,
		isTracking : true,
		joinedOn : new Date(1578516437149),
    lastScan : new Date(1602241336579),
    realtime: false
  }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
}
function addBannedUser() {
  Database.addBannedUser({
    discordID: "1",
    reason: "Test"
  }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
}

async function getUserInfo() {
  console.log(await APIRequest.GetProfile("3", "4611686018471334813", "100"));
}
async function getManifest() {
  const url = (await APIRequest.GetManifestVersion()).Data.Response.jsonWorldComponentContentPaths['en'].DestinyInventoryItemLiteDefinition;
  const inventoryItemManifest = await APIRequest.GetManifest(url);
}
async function getClanInfo() {
  let start = Date.now();
  let clanData = await APIRequest.GetClanById(3917089);
  let end = Date.now();

  console.log(`${ end - start }ms`);
}

module.exports = { findUser, addGuild, addClan, addBannedUser, getUserInfo, getManifest, getClanInfo }