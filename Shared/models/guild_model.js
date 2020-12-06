var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var guildSchema = new Schema({
  guildID: String,
  guildName: String,
  ownerID: String,
  ownerAvatar: String,
  clans: Array,
  isTracking: { type: Boolean, default: true },
  joinedOn: { type: Date, default: Date.now },
  region: String,
  prefix: { type: String, default: "~" },
  broadcasts: {
    channel: { type: String, default: "0" },
    mode: { type: String, default: "Auto" },
    extraItems: { type: Array, default: [] },
    items: { type: Boolean, default: true },
    titles: { type: Boolean, default: true },
    clans: { type: Boolean, default: true },
    dungeons: { type: Boolean, default: true },
    triumphs: { type: Boolean, default: true },
    catalysts: { type: Boolean, default: true },
    others: { type: Boolean, default: true },
    gunsmith: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('guilds', guildSchema); 