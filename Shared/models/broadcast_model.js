var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var broadcastsSchema = new Schema({
  clanID: String,
  guildID: String,
  displayName: String,
  membershipID: String,
  season: Number,
  type: String,
  broadcast: String,
  hash: String,
  parentHash: { type: String, default: "" },
  count: { type: Number, default: -1 },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('broadcasts', broadcastsSchema); 