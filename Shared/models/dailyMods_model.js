var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dailyModsSchema = new Schema({
  vendor: { type: String, default: "Unknown" },
  mods: { type: Array, default: [] },
  items: { type: Array, default: [] },
  location: { type: Number, default: -1 },
  nextRefreshDate: { type: Date, default: new Date(new Date().getTime() + 86400000) },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('daily_mods', dailyModsSchema); 