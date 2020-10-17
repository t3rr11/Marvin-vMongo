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
  count: { type: Number, default: -1 },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('awaiting_broadcasts', broadcastsSchema); 