var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var logSchema = new Schema({
  log: String,
  type: String,
  location: String,
  discordUser: { type: String, default: "" },
  discordID: { type: String, default: "" },
  guildID: { type: String, default: "" },
  command: { type: String, default: "" },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('logs', logSchema); 