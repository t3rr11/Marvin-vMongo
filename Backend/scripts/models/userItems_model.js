var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userItemsSchema = new Schema({
  clanID: Number,
  membershipID: String,
  recentItems: { type: Array, default: [] },
  items: { type: Array, default: [] }
});

module.exports = mongoose.model('items', userItemsSchema);