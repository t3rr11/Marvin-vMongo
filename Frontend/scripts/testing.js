const Database = require('../../Shared/database');
const APIRequest = require('../../Shared/handlers/requestHandler');
const { ErrorHandler } = require('../../Shared/handlers/errorHandler');
const BroadcastHandler = require('./handlers/broadcastsHandler');

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

module.exports = { testBroadcast, testFirstscan }