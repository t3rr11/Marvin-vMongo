var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var authTokenSchema = new Schema({
  access_token: String,
  refresh_token: String,
  scope: String,
  token_type: String,
  expires_in: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('auth_tokens', authTokenSchema);