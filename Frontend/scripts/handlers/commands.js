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

];

module.exports = Commands