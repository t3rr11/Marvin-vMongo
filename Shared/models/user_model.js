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
  infamy: { current: DefaultNumber, resets: DefaultNumber, seasonal: DefaultNumber },
  valor: { current: DefaultNumber, resets: DefaultNumber, seasonal: DefaultNumber },
  trialsRank: { current: DefaultNumber, resets: DefaultNumber, seasonal: DefaultNumber },
  ironBanner: { current: DefaultNumber, resets: DefaultNumber, seasonal: DefaultNumber },
  glory: DefaultNumber,
  triumphScore: {
    score: DefaultNumber,
    activeScore: DefaultNumber,
    legacyScore: DefaultNumber,
    lifetimeScore: DefaultNumber
  },
  seasonRank: DefaultNumber,
  powerBonus: DefaultNumber,
  lightLevels: { type: Array, default: [] },
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
    dsc: DefaultNumber,
    vog: DefaultNumber,
    vow: DefaultNumber
  },
  totalRaids: DefaultNumber,
  empireHunts: {
    theDarkPriestess: DefaultNumber,
    theWarrior: DefaultNumber,
    theTechnocrat: DefaultNumber,
    masterHunts: DefaultNumber,
    total: DefaultNumber
  },
  dawning2020: DefaultNumber,
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
    },
    grasp: {
      completions: DefaultNumber,
      flawless: DefaultNumber
    },
    duality: {
      completions: DefaultNumber,
      flawless: DefaultNumber
    }
  },
  containments: {
    tiers: DefaultNumber,
    bosses: DefaultNumber
  },
  presage: {
    normal: DefaultNumber,
    master: DefaultNumber
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
  challenges: {
    s13: { type: Boolean, default: false },
    s14: { type: Boolean, default: false },
    s15: { type: Boolean, default: false }
  },
  triumphs: {
    cabals: { type: Boolean, default: false }
  },
  grandmasters: {
    theDevilsLair: { type: Number, default: 0 },
    theArmsDealer: { type: Number, default: 0 },
    provingGrounds: { type: Number, default: 0 },
    wardenOfNothing: { type: Number, default: 0 },
    fallenSABER: { type: Number, default: 0 },
    theInsightTerminus: { type: Number, default: 0 },
    broodhold: { type: Number, default: 0 },
    theGlassway: { type: Number, default: 0 },
    invertedSpire: { type: Number, default: 0 },
    exodusCrash: { type: Number, default: 0 },
    theDisgraced: { type: Number, default: 0 },
    scarletKeep: { type: Number, default: 0 },
    theHollowedLair: { type: Number, default: 0 },
    lakeOfShadows: { type: Number, default: 0 },
    theCorruped: { type: Number, default: 0 },
    theLightblade: { type: Number, default: 0 },
    birthplaceOfTheVile: { type: Number, default: 0 }
  },
  lastActivity: {
    currentActivityHash: { type: Number, default: 0 },
    dateActivityStarted: Date
  },
  joinDate: Date,
  lastPlayed: Date,
  lastPlayedCharacterId: String,
  lastUpdated: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  firstLoad: { type: Boolean, default: true }
});

module.exports = mongoose.model('users', userSchema); 