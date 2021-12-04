import { Schema } from 'mongoose';

export const clanSchema = new Schema({
  clanID: Number,
  clanName: String,
  clanCallsign: String,
  clanBanner: {
    decalId: Number,
    decalColorId: Number,
    decalBackgroundColorId: Number,
    gonfalonId: Number,
    gonfalonColorId: Number,
    gonfalonDetailId: Number,
    gonfalonDetailColorId: Number
  },
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