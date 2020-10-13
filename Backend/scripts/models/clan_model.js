var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clanSchema = new Schema({
  clanID: Number,
  clanName: String,
  clanCallsign: String,
  clanLevel: { type: Number, default: 1 },
  memberCount: { type: Number, default: 0 },
  onlineMembers: { type: Number, default: 0 },
  firstScan: { type: Boolean, default: true },
  forcedScan: { type: Boolean, default: false },
  isTracking: { type: Boolean, default: true },
  joinedOn: { type: Date, default: Date.now },
  lastScan: { type: Date, default: 0 },
  realtime: { type: Boolean, default: false }
});

module.exports = mongoose.model('clans', clanSchema); 