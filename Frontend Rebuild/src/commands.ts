export const Commands = [
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
      { name: 'Resets', type: 'Reset', data: 'valor.resets', inline: true },
      { name: 'Valor', type: 'Leaderboard', data: 'valor.seasonal', inline: true }
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
      { name: 'Resets', type: 'Reset', data: 'infamy.resets', inline: true },
      { name: 'Infamy', type: 'Leaderboard', data: 'infamy.seasonal', inline: true }
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
      { name: 'Resets', type: 'Reset', data: 'trialsRank.resets', inline: true },
      { name: 'Trials Rank', type: 'Leaderboard', data: 'trialsRank.seasonal', inline: true }
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
      { name: 'Kills', type: 'Leaderboard', data: 'ironBanner.kills', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'ironBanner.wins', inline: true }
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
      { name: 'Completions', type: 'SplitLeaderboard', data: ['dungeons.prophecy.completions', 'dungeons.prophecy.flawless'], inline: true },
      { name: 'Total', type: 'SplitTotal', data: ['dungeons.prophecy.completions', 'dungeons.prophecy.flawless'], inline: true }
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
      { name: 'Carries', type: 'Leaderboard', data: 'trials.overall.carries', inline: true }
    ]
  },

];