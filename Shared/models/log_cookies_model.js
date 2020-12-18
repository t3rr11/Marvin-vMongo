var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var logSchema = new Schema({
  cookies: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('cookies', logSchema);