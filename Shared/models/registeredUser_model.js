var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var registeredUserSchema = new Schema({
  discordID: String,
  username: String,
  membershipID: String,
  platform: Number
});

module.exports = mongoose.model('registered_users', registeredUserSchema); 