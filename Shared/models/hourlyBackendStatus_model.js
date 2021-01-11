var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hourlyBackendStatusSchema = new Schema({
  index: Number,
  rt_index: Number,
  clans: Number,
  rt_clans: Number,
  processing: Number,
  rt_processing: Number,
  uptime: Number,
  speed: Number,
  APIStatus: Boolean,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('hourly_backend_logs', hourlyBackendStatusSchema); 