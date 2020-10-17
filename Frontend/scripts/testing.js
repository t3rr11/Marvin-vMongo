const Database = require('../../Shared/database');
const APIRequest = require('../../Shared/handlers/requestHandler');
const { ErrorHandler } = require('../../Shared/handlers/errorHandler');
const BroadcastHandler = require('./handlers/broadcastsHandler');

function addTestBroadcast() {
  Database.addAwaitingBroadcast({
    clanID: 3917089,
    displayName: "Terrii",
    membershipID: "4611686018471334813",
    season: 11,
    type: "item",
    broadcast: "Fake1kv",
    hash: "199171385",
    count: 1
  }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } })
}

function testBroadcast(client) {
  BroadcastHandler.processBroadcast(client, {
    clanID: 3917089,
    displayName: "Terrii",
    membershipID: "4611686018471334813",
    season: 11,
    type: "other",
    broadcast: "Allegro-34",
    hash: "120446964"
  });
}

function testFirstscan(client) {
  BroadcastHandler.sendFinishedLoadingAnnouncement(client, {
    clanID: 3917089,
    clanName: "Marvins Minions"
  });
}

module.exports = { addTestBroadcast, testBroadcast, testFirstscan }