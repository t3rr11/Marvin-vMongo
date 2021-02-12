var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var logTimeSchema = new Schema({
  type: String,
  time: String,
  clans: Number,
  players: Number,
  scanspeed: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('scan_times', logTimeSchema); 