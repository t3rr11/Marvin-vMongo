const Commands = [
  // Valor
  { 
    name: 'Valor',
    size: 10,
    title: 'Top 10 Seasonal Valor Rankings',
    helpMenus: ['Rankings'],
    leaderboardURL: 'valor',
    sorting: 'valor.seasonal',
    commands: ['valor'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Valor', type: 'Leaderboard', data: 'valor.seasonal', inline: true },
      { name: 'Resets', type: 'Reset', data: 'valor.resets', inline: true }
    ]
  },

  // Infamy
  { 
    name: 'Infamy',
    size: 10,
    title: 'Top 10 Seasonal Infamy Rankings',
    helpMenus: ['Rankings'],
    leaderboardURL: 'infamy',
    sorting: 'infamy.seasonal',
    commands: ['infamy'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Infamy', type: 'Leaderboard', data: 'infamy.seasonal', inline: true },
      { name: 'Resets', type: 'Reset', data: 'infamy.resets', inline: true }
    ]
  },

  // Trials Rank
  { 
    name: 'Trials Rank',
    size: 10,
    title: 'Top 10 Seasonal Trials Rank Rankings',
    helpMenus: ['Rankings', 'Trials'],
    leaderboardURL: 'trialsRank',
    sorting: 'trialsRank.seasonal',
    commands: ['trials rank', 'trialsRank'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Trials Rank', type: 'Leaderboard', data: 'trialsRank.seasonal', inline: true },
      { name: 'Resets', type: 'Reset', data: 'trialsRank.resets', inline: true }
    ]
  },

  // Glory
  { 
    name: 'Glory',
    size: 10,
    title: 'Top 10 Seasonal Glory Rankings',
    helpMenus: ['Rankings'],
    leaderboardURL: 'glory',
    sorting: 'glory',
    commands: ['glory'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Glory', type: 'Leaderboard', data: 'glory', inline: true }
    ]
  },

  // Iron banner
  { 
    name: 'Iron Banner',
    description: 'Seasonal Iron Banner stats are not available, so overall stats it is.',
    size: 10,
    title: 'Top 10 Overall Iron Banner Rankings',
    helpMenus: ['Rankings'],
    leaderboardURL: 'ironBanner',
    sorting: 'ironBanner.kills',
    commands: ['iron banner'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Kills', type: 'Leaderboard', data: 'ironBanner.kills', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'ironBanner.wins', inline: true }
    ]
  },

  // Levi
  { 
    name: 'Leviathan',
    size: 10,
    title: 'Top 10 Leviathan Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'levi',
    sorting: ['raids.levi', 'raids.prestige_levi'],
    commands: ['levi', 'leviathan'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Norm | Pres', type: 'SplitLeaderboard', data: ['raids.levi', 'raids.prestige_levi'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['raids.levi', 'raids.prestige_levi'], inline: true }
    ]
  },

  // Eater of worlds
  { 
    name: 'Eater of Worlds',
    size: 10,
    title: 'Top 10 Eater of Worlds Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'eow',
    sorting: ['raids.eow', 'raids.prestige_eow'],
    commands: ['eow', 'eater', 'eater of worlds'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Norm | Pres', type: 'SplitLeaderboard', data: ['raids.eow', 'raids.prestige_eow'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['raids.eow', 'raids.prestige_eow'], inline: true }
    ]
  },

  // Spire of stars
  { 
    name: 'Spire of Stars',
    size: 10,
    title: 'Top 10 Spire of Stars Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'sos',
    sorting: ['raids.sos', 'raids.prestige_sos'],
    commands: ['sos', 'spire', 'spire of stars'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Norm | Pres', type: 'SplitLeaderboard', data: ['raids.sos', 'raids.prestige_sos'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['raids.sos', 'raids.prestige_sos'], inline: true }
    ]
  },

  // Last wish
  { 
    name: 'Last Wish',
    size: 10,
    title: 'Top 10 Last Wish Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'lastWish',
    sorting: 'raids.lastWish',
    commands: ['lw', 'last wish'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'Leaderboard', data: 'raids.lastWish', inline: true }
    ]
  },

  // Scourge of the past
  { 
    name: 'Scourge of the Past',
    size: 10,
    title: 'Top 10 Scourge of the Past Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'scourge',
    sorting: 'raids.scourge',
    commands: ['scourge', 'sotp', 'scourge of the past'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'Leaderboard', data: 'raids.scourge', inline: true }
    ]
  },

  // Crown of sorrows
  { 
    name: 'Crown of Sorrows',
    size: 10,
    title: 'Top 10 Crown of Sorrows Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'sorrows',
    sorting: 'raids.sorrows',
    commands: ['crown', 'sorrows', 'cos', 'crown of sorrows'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'Leaderboard', data: 'raids.sorrows', inline: true }
    ]
  },

  // Garden of salvation
  { 
    name: 'Garden of Salvation',
    size: 10,
    title: 'Top 10 Garden of Salvation Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'garden',
    sorting: 'raids.garden',
    commands: ['garden', 'gos', 'garden of salvation'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'Leaderboard', data: 'raids.garden', inline: true }
    ]
  },

  // Deep stone crypt
  { 
    name: 'Deep Stone Crypt',
    size: 10,
    title: 'Top 10 Deep Stone Crypt Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'dsc',
    sorting: 'raids.dsc',
    commands: ['dsc', 'deep stone crypt'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'Leaderboard', data: 'raids.dsc', inline: true }
    ]
  },

  // Vault of glass
  { 
    name: 'Vault of Glass',
    size: 10,
    title: 'Top 10 Vault of Glass Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'vog',
    sorting: 'raids.vog',
    commands: ['vog', 'vault of glass'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'Leaderboard', data: 'raids.vog', inline: true }
    ]
  },

  // Vow of the Disciple
  { 
    name: 'Vow of the Disciple',
    size: 10,
    title: 'Top 10 Vow of the Disciple Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'vow',
    sorting: 'raids.vow',
    commands: ['vow', 'Vow of the Disciple'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'Leaderboard', data: 'raids.vow', inline: true }
    ]
  },

  // Season rank
  { 
    name: 'Season Rank',
    size: 10,
    title: 'Top 10 Season Rank Rankings',
    helpMenus: ['Rankings', 'Seasonal'],
    leaderboardURL: 'seasonRank',
    sorting: 'seasonRank',
    commands: ['sr', 'season rank'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Rank', type: 'Leaderboard', data: 'seasonRank', inline: true }
    ]
  },

  // Highest power
  { 
    name: 'Highest Power',
    size: 10,
    title: 'Top 10 Highest Power',
    helpMenus: ['Rankings', 'Seasonal'],
    leaderboardURL: 'highestPower',
    sorting: ['highestPower', 'powerBonus'],
    commands: ['power', 'light', 'max power', 'max light', 'highest power', 'highest light'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Power + Artifact', type: 'PowerLeaderboard', data: ['highestPower', 'powerBonus'], inline: true }
    ]
  },

  // Highest base power
  { 
    name: 'Highest Base Power',
    size: 10,
    title: 'Top 10 Highest Base Power',
    helpMenus: ['Rankings', 'Seasonal'],
    leaderboardURL: 'highestPower',
    sorting: 'highestPower',
    commands: ['power -a', 'light -a', 'max power -a', 'max light -a', 'highest power -a', 'highest light -a'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Power', type: 'Leaderboard', data: 'highestPower', inline: true }
    ]
  },

  // Shattered throne
  { 
    name: 'Shattered Throne',
    description: 'Completions (Normal - Flawless)',
    size: 10,
    title: 'Top 10 Shattered Throne Completions',
    helpMenus: ['Dungeons'],
    leaderboardURL: 'shatteredThrone',
    sorting: ['dungeons.shatteredThrone.completions', 'dungeons.shatteredThrone.flawless'],
    commands: ['shattered throne', 'throne'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'SplitLeaderboard', data: ['dungeons.shatteredThrone.completions', 'dungeons.shatteredThrone.flawless'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['dungeons.shatteredThrone.completions', 'dungeons.shatteredThrone.flawless'], inline: true }
    ]
  },

  // Pit of heresy
  { 
    name: 'Pit of Heresy',
    description: 'Completions (Normal - Flawless)',
    size: 10,
    title: 'Top 10 Pit of Heresy Completions',
    helpMenus: ['Dungeons'],
    leaderboardURL: 'pitOfHeresy',
    sorting: ['dungeons.pitOfHeresy.completions', 'dungeons.pitOfHeresy.flawless'],
    commands: ['pit', 'pit of heresy'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'SplitLeaderboard', data: ['dungeons.pitOfHeresy.completions', 'dungeons.pitOfHeresy.flawless'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['dungeons.pitOfHeresy.completions', 'dungeons.pitOfHeresy.flawless'], inline: true }
    ]
  },

  // Prophecy
  { 
    name: 'Prophecy',
    description: 'Completions (Normal - Flawless)',
    size: 10,
    title: 'Top 10 Prophecy Completions',
    helpMenus: ['Dungeons'],
    leaderboardURL: 'prophecy',
    sorting: ['dungeons.prophecy.completions', 'dungeons.prophecy.flawless'],
    commands: ['prophecy'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'SplitLeaderboard', data: ['dungeons.prophecy.completions', 'dungeons.prophecy.flawless'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['dungeons.prophecy.completions', 'dungeons.prophecy.flawless'], inline: true }
    ]
  },

  // Grasp of Avarice
  { 
    name: 'Grasp of Avarice',
    description: 'Completions (Normal - Flawless)',
    size: 10,
    title: 'Top 10 Grasp of Avarice Completions',
    helpMenus: ['Dungeons'],
    leaderboardURL: 'grasp',
    sorting: ['dungeons.grasp.completions', 'dungeons.grasp.flawless'],
    commands: ['grasp'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'SplitLeaderboard', data: ['dungeons.grasp.completions', 'dungeons.grasp.flawless'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['dungeons.grasp.completions', 'dungeons.grasp.flawless'], inline: true }
    ]
  },

  // Duality
  { 
    name: 'Duality',
    description: 'Completions (Normal - Flawless)',
    size: 10,
    title: 'Top 10 Duality Completions',
    helpMenus: ['Dungeons'],
    leaderboardURL: 'duality',
    sorting: ['dungeons.duality.completions', 'dungeons.duality.flawless'],
    commands: ['duality'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'SplitLeaderboard', data: ['dungeons.duality.completions', 'dungeons.duality.flawless'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['dungeons.duality.completions', 'dungeons.duality.flawless'], inline: true }
    ]
  },

  // Presage
  { 
    name: 'Presage',
    description: 'Completions (Normal - Master)',
    size: 10,
    title: 'Top 10 Presage Completions',
    helpMenus: ['Dungeons'],
    leaderboardURL: 'presage',
    sorting: ['presage.normal', 'presage.master'],
    commands: ['presage', 'master presage', 'presage master'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'SplitLeaderboard', data: ['presage.normal', 'presage.master'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['presage.normal', 'presage.master'], inline: true }
    ]
  },

  // Active triumph score
  { 
    name: 'Active Triumph Score',
    size: 10,
    title: 'Top 10 Active Triumph Score Rankings',
    helpMenus: ['Rankings'],
    leaderboardURL: 'activeScore',
    sorting: 'triumphScore.activeScore',
    commands: ['triumph score', 'triumphscore', 'triumph score -active', 'triumphscore -active'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Score', type: 'Leaderboard', data: 'triumphScore.activeScore', inline: true }
    ]
  },

  // Legacy triumph score
  { 
    name: 'Legacy Triumph Score',
    size: 10,
    title: 'Top 10 Legacy Triumph Score Rankings',
    helpMenus: ['Rankings'],
    leaderboardURL: 'legacyScore',
    sorting: 'triumphScore.legacyScore',
    commands: ['triumph score -legacy', 'triumphscore -legacy'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Score', type: 'Leaderboard', data: 'triumphScore.legacyScore', inline: true }
    ]
  },

  // Lifetime triumph score
  { 
    name: 'Legacy Triumph Score',
    size: 10,
    title: 'Top 10 Lifetime Triumph Score Rankings',
    helpMenus: ['Rankings'],
    leaderboardURL: 'lifetimeScore',
    sorting: 'triumphScore.lifetimeScore',
    commands: ['triumph score -lifetime', 'triumphscore -lifetime'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Score', type: 'Leaderboard', data: 'triumphScore.lifetimeScore', inline: true }
    ]
  },

  // Time played
  { 
    name: 'Time Played',
    size: 10,
    title: 'Top 10 Most Time Played',
    helpMenus: ['Rankings'],
    leaderboardURL: 'timePlayed',
    sorting: 'timePlayed',
    commands: ['time', 'time played', 'total time'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Hours', type: 'TimeLeaderboard', data: 'timePlayed', inline: true }
    ]
  },

  // Total raids
  { 
    name: 'Total Raids',
    size: 10,
    title: 'Top 10 Total Raid Completions',
    helpMenus: ['Raids'],
    leaderboardURL: 'totalRaids',
    sorting: 'totalRaids',
    commands: ['raids total', 'total raids'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Raids', type: 'Leaderboard', data: 'totalRaids', inline: true }
    ]
  },

  // Trials wins
  { 
    name: 'Trials Weekly Wins',
    size: 10,
    title: 'Top 10 Trials Weekly Wins',
    helpMenus: ['Trials'],
    sorting: 'trials.weekly.wins',
    commands: ['trials wins', 'trials weekly wins'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'trials.weekly.wins', inline: true }
    ]
  },

  // Trials win streak
  { 
    name: 'Trials Weekly Win Streak',
    size: 10,
    title: 'Top 10 Trials Weekly Win Streak',
    helpMenus: ['Trials'],
    sorting: 'trials.weekly.winStreak',
    commands: ['trials win streak', 'trials weekly win streak'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Streak', type: 'Leaderboard', data: 'trials.weekly.winStreak', inline: true }
    ]
  },

  // Trials flawless
  { 
    name: 'Trials Weekly Flawless',
    size: 10,
    title: 'Top 10 Trials Weekly Flawless Tickets',
    helpMenus: ['Trials'],
    sorting: 'trials.weekly.flawlessTickets',
    commands: ['trials flawless', 'trials weekly flawless'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Total', type: 'Leaderboard', data: 'trials.weekly.flawlessTickets', inline: true }
    ]
  },

  // Trials final blows
  { 
    name: 'Trials Weekly Final Blows',
    size: 10,
    title: 'Top 10 Trials Weekly Final Blows',
    helpMenus: ['Trials'],
    sorting: 'trials.weekly.finalBlows',
    commands: ['trials final blows', 'trials weekly final blows'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Total', type: 'Leaderboard', data: 'trials.weekly.finalBlows', inline: true }
    ]
  },

  // Trials post wins
  { 
    name: 'Trials Weekly Post Flawless Wins',
    size: 10,
    title: 'Top 10 Trials Weekly Post Flawless Wins',
    helpMenus: ['Trials'],
    sorting: 'trials.weekly.postFlawlessWins',
    commands: ['trials post wins', 'trials weekly post wins'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'trials.weekly.postFlawlessWins', inline: true }
    ]
  },

  // Trials carries
  { 
    name: 'Trials Weekly Carries',
    size: 10,
    title: 'Top 10 Trials Weekly Carries',
    helpMenus: ['Trials'],
    sorting: 'trials.weekly.carries',
    commands: ['trials carries', 'trials weekly carries'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Carries', type: 'Leaderboard', data: 'trials.weekly.carries', inline: true }
    ]
  },

  // Trials seasonal wins
  { 
    name: 'Trials Seasonal Wins',
    size: 10,
    title: 'Top 10 Trials Seasonal Wins',
    helpMenus: ['Trials'],
    sorting: 'trials.seasonal.wins',
    commands: ['trials seasonal wins'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'trials.seasonal.wins', inline: true }
    ]
  },

  // Trials seasonal win streak
  { 
    name: 'Trials Seasonal Win Streak',
    size: 10,
    title: 'Top 10 Trials Seasonal Win Streak',
    helpMenus: ['Trials'],
    sorting: 'trials.seasonal.winStreak',
    commands: ['trials seasonal win streak'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Streak', type: 'Leaderboard', data: 'trials.seasonal.winStreak', inline: true }
    ]
  },

  // Trials seasonal flawless
  { 
    name: 'Trials Seasonal Flawless',
    size: 10,
    title: 'Top 10 Trials Seasonal Flawless Tickets',
    helpMenus: ['Trials'],
    sorting: 'trials.seasonal.flawlessTickets',
    commands: ['trials seasonal flawless'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Total', type: 'Leaderboard', data: 'trials.seasonal.flawlessTickets', inline: true }
    ]
  },

  // Trials seasonal final blows
  { 
    name: 'Trials Seasonal Final Blows',
    size: 10,
    title: 'Top 10 Trials Seasonal Final Blows',
    helpMenus: ['Trials'],
    sorting: 'trials.seasonal.finalBlows',
    commands: ['trials seasonal final blows'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Total', type: 'Leaderboard', data: 'trials.seasonal.finalBlows', inline: true }
    ]
  },

  // Trials seasonal post wins
  { 
    name: 'Trials Seasonal Post Flawless Wins',
    size: 10,
    title: 'Top 10 Trials Seasonal Post Flawless Wins',
    helpMenus: ['Trials'],
    sorting: 'trials.seasonal.postFlawlessWins',
    commands: ['trials seasonal post wins'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'trials.seasonal.postFlawlessWins', inline: true }
    ]
  },

  // Trials seasonal carries
  { 
    name: 'Trials Seasonal Carries',
    size: 10,
    title: 'Top 10 Trials Seasonal Carries',
    helpMenus: ['Trials'],
    sorting: 'trials.seasonal.carries',
    commands: ['trials seasonal carries'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Carries', type: 'Leaderboard', data: 'trials.seasonal.carries', inline: true }
    ]
  },

  // Trials overall wins
  { 
    name: 'Trials Overall Wins',
    size: 10,
    title: 'Top 10 Trials Overall Wins',
    helpMenus: ['Trials'],
    sorting: 'trials.overall.wins',
    commands: ['trials overall wins'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'trials.overall.wins', inline: true }
    ]
  },

  // Trials overall flawless
  { 
    name: 'Trials Overall Flawless',
    size: 10,
    title: 'Top 10 Trials Overall Flawless Tickets',
    helpMenus: ['Trials'],
    sorting: 'trials.overall.flawlessTickets',
    commands: ['trials overall flawless'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Total', type: 'Leaderboard', data: 'trials.overall.flawlessTickets', inline: true }
    ]
  },

  // Trials overall final blows
  { 
    name: 'Trials Overall Final Blows',
    size: 10,
    title: 'Top 10 Trials Overall Final Blows',
    helpMenus: ['Trials'],
    sorting: 'trials.overall.finalBlows',
    commands: ['trials overall final blows'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Total', type: 'Leaderboard', data: 'trials.overall.finalBlows', inline: true }
    ]
  },

  // Trials overall post wins
  { 
    name: 'Trials Overall Post Flawless Wins',
    size: 10,
    title: 'Top 10 Trials Overall Post Flawless Wins',
    helpMenus: ['Trials'],
    sorting: 'trials.overall.postFlawlessWins',
    commands: ['trials overall post wins'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'trials.overall.postFlawlessWins', inline: true }
    ]
  },

  // Trials overall carries
  { 
    name: 'Trials Overall Carries',
    size: 10,
    title: 'Top 10 Trials Overall Carries',
    helpMenus: ['Trials'],
    sorting: 'trials.overall.carries',
    commands: ['trials overall carries'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Carries', type: 'Leaderboard', data: 'trials.overall.carries', inline: true }
    ]
  },

];

module.exports = Commands