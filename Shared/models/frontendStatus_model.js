var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var frontendStatusSchema = new Schema({
  users: Number,
  servers: Number,
  commandsInput: Number,
  uptime: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('frontend_logs', frontendStatusSchema); 