var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gunsmithModsSchema = new Schema({
  mods: { type: Array, default: [] },
  nextRefreshDate: { type: Date, default: new Date(new Date().getTime() + 86400000) },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('gunsmith_mods', gunsmithModsSchema); 