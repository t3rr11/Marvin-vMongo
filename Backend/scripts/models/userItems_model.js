var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userItemsSchema = new Schema({
  membershipID: String,
  items: { type: Array, default: [] }
});

module.exports = mongoose.model('items', userItemsSchema); 