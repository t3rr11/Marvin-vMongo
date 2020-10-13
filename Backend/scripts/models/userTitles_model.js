var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userTitlesSchema = new Schema({
  clanID: Number,
  membershipID: String,
  titles: { type: Array, default: [] }
});

module.exports = mongoose.model('titles', userTitlesSchema); 