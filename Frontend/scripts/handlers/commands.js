const Commands = [
  // Valor
  { 
    name: 'Valor',
    size: 10,
    title: 'Top 10 Seasonal Valor Rankings',
    leaderboardURL: 'valor',
    sorting: 'valor.current',
    commands: ['valor'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Valor', type: 'Leaderboard', data: 'valor.current', inline: true },
      { name: 'Resets', type: 'Reset', data: 'valor.current', divisibleBy: 2000, inline: true }
    ]
  },

  // Infamy
  { 
    name: 'Infamy',
    size: 10,
    title: 'Top 10 Seasonal Infamy Rankings',
    leaderboardURL: 'infamy',
    sorting: 'infamy.current',
    commands: ['infamy'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Infamy', type: 'Leaderboard', data: 'infamy.current', inline: true },
      { name: 'Resets', type: 'Reset', data: 'infamy.current', divisibleBy: 2000, inline: true }
    ]
  },

  // Glory
  { 
    name: 'Glory',
    size: 10,
    title: 'Top 10 Seasonal Glory Rankings',
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
    leaderboardURL: 'vog',
    sorting: 'raids.vog',
    commands: ['vog', 'vault of glass'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Completions', type: 'Leaderboard', data: 'raids.vog', inline: true }
    ]
  },

  // Season rank
  { 
    name: 'Season Rank',
    size: 10,
    title: 'Top 10 Season Rank Rankings',
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
    leaderboardURL: 'prophecy',
    sorting: ['dungeons.prophecy.completions', 'dungeons.prophecy.flawless'],
    commands: ['prophecy'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
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
    leaderboardURL: 'totalRaids',
    sorting: 'totalRaids',
    commands: ['raids total', 'total raids'],
    fields: [
      { name: 'Name', type: 'Name', inline: true },
      { name: 'Raids', type: 'Leaderboard', data: 'totalRaids', inline: true }
    ]
  },

];

module.exports = Commands