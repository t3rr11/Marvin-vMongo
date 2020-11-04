var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var logSchema = new Schema({
  log: String,
  type: String,
  location: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('logs', logSchema); 