var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var defaultItemSchema = new Schema({
  name: String,
  fname: String,
  type: String,
  advancedType: String,
  season: Number,
  description: String,
  imageUrl: String,
  hash: String,
  trackingEnabled: Boolean,
  broadcastEnabled: Boolean
});

module.exports = mongoose.model('global_items', defaultItemSchema); 