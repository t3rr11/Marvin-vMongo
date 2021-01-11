var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hourlyFrontendStatusSchema = new Schema({
  users: Number,
  servers: Number,
  commandsInput: Number,
  uptime: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('hourly_frontend_logs', hourlyFrontendStatusSchema); 