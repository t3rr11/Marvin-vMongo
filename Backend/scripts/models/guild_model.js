var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var guildSchema = new Schema({
  guildID: String,
  guildName: String,
  ownerID: String,
  ownerAvatar: String,
  broadcastsChannel: { type: String, default: "0" },
  enableWhitelist: { type: Boolean, default: false },
  whitelist: { type: Array, default: [] },
  blacklist: { type: Array, default: [] },
  clans: Array,
  isTracking: { type: Boolean, default: true },
  joinedOn: { type: Date, default: Date.now },
  region: String,
  broadcasts: {
    items: { type: Boolean, default: true },
    titles: { type: Boolean, default: true },
    clans: { type: Boolean, default: true },
    dungeons: { type: Boolean, default: true },
    triumphs: { type: Boolean, default: true },
    catalysts: { type: Boolean, default: true },
    others: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('guilds', guildSchema); 