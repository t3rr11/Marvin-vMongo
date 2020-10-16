var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bannedUserSchema = new Schema({
  discordID: String,
  reason: { type: String, default: "" }
});

module.exports = mongoose.model('banned_users', bannedUserSchema); 