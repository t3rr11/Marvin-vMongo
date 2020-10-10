var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const DefaultNumber = { type: Number, default: 0 };

var userSchema = new Schema({
  clanID: Number,
  displayName: String,
  membershipID: String,
  currentClass: String,
  highestPower: DefaultNumber,
  timePlayed: DefaultNumber,
  infamy: { current: DefaultNumber, resets: DefaultNumber },
  valor: { current: DefaultNumber, resets: DefaultNumber },
  glory: DefaultNumber,
  triumphScore: DefaultNumber,
  seasonRank: DefaultNumber,
  powerBonus: DefaultNumber,
  items: { type: Array, default: [] },
  titles: { type: Array, default: [] },
  lightLevels: { type: Array, default: [] },
  ironBanner: {
    kills: DefaultNumber,
    wins: DefaultNumber
  },
  raids: {
    levi: DefaultNumber,
    eow: DefaultNumber,
    sos: DefaultNumber,
    prestige_levi: DefaultNumber,
    prestige_eow: DefaultNumber,
    prestige_sos: DefaultNumber,
    lastWish: DefaultNumber,
    scourge: DefaultNumber,
    sorrows: DefaultNumber,
    garden: DefaultNumber,
  },
  totalRaids: DefaultNumber,
  xp: {
    dailyXP: DefaultNumber,
    weeklyXP: DefaultNumber,
    overallXP: DefaultNumber
  },
  dungeons: {
    shatteredThrone: {
      completions: DefaultNumber,
      flawless: DefaultNumber
    },
    pitOfHeresy: {
      completions: DefaultNumber,
      flawless: DefaultNumber
    },
    prophecy: {
      completions: DefaultNumber,
      flawless: DefaultNumber
    }
  },
  trials: {
    overall: {
      wins: DefaultNumber,
      flawlessTickets: DefaultNumber,
      finalBlows: DefaultNumber,
      postFlawlessWins: DefaultNumber,
      carries: DefaultNumber
    },
    seasonal: {
      wins: DefaultNumber,
      winStreak: DefaultNumber,
      flawlessTickets: DefaultNumber,
      finalBlows: DefaultNumber,
      postFlawlessWins: DefaultNumber,
      carries: DefaultNumber
    },
    weekly: {
      wins: DefaultNumber,
      winStreak: DefaultNumber,
      flawlessTickets: DefaultNumber,
      finalBlows: DefaultNumber,
      postFlawlessWins: DefaultNumber,
      carries: DefaultNumber
    }
  },
  joinDate: Date,
  lastPlayed: Date,
  lastUpdated: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  firstLoad: { type: Boolean, default: true }
});

module.exports = mongoose.model('users', userSchema); 