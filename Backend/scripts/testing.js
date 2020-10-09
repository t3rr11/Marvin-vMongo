const database = require('./database');
const APIRequest = require('./requestHandler');
const { ErrorHandler } = require('./errorHandler');

function addUsers() {
  let i;
  for(i = 0; i < 10; i++) {
    database.addUser({ name: name.generateName(), sr: Math.floor(Math.random() * 2000), valor: Math.floor(Math.random() * 2000), glory: Math.floor(Math.random() * 5500) });
  }
}

function findUser(membershipID) {
  database.findUserByID(membershipID, (isError, isFound, data) => {
    if(!isError) {
      if(isFound) {
        console.log(data);
      } else { ErrorHandler("Low", `Failed to find user: ${ membershipID }`); }
    } else { ErrorHandler("High", data); }
  });
}

function addUser() {
  database.addUser({
    clanID: 3917089,
    displayName: "Terrii",
    membershipID: "4611686018471334813",
    currentClass: "Titan",
    joinDate: new Date("2019-10-08T01:40:21Z"),
    lastPlayed: new Date(1600514192000)
  }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
}

function addGuild() {
  database.addGuild({
    guildID: "305561313675968513",
    guildName: "Test Server",
    ownerID: "194972321168097280",
    ownerAvatar: "5d26991834b1477572ba55aa47689d02",
    clans: [3917089],
    region: "sydney",
  });
}

function addClan() {
  database.addClan({
    clanID: 3917089,
    clanName: "Marvins Minions",
    clanCallsign: "MM",
  });
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

module.exports = { addUsers, findUser, addUser, addGuild, addClan, getUserInfo, getManifest, getClanInfo }