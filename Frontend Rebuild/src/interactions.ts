export const Rankings = [
  // Valor
  { 
    name: 'Valor',
    size: 10,
    title: 'Top 10 Seasonal Valor Rankings',
    description: null,
    helpMenus: ['rankings'],
    leaderboardURL: 'valor',
    sorting: 'valor.seasonal',
    commands: ['valor'],
    fields: [
      { name: 'Valor (Resets)', type: 'Leaderboard', data: 'valor.seasonal', resetInterval: 10000, inline: true }
    ]
  },

  // Infamy
  { 
    name: 'Infamy',
    size: 10,
    title: 'Top 10 Seasonal Infamy Rankings',
    description: null,
    helpMenus: ['rankings'],
    leaderboardURL: 'infamy',
    sorting: 'infamy.seasonal',
    commands: ['infamy'],
    fields: [
      { name: 'Infamy (Resets)', type: 'Leaderboard', data: 'infamy.seasonal', resetInterval: 10000, inline: true }
    ]
  },

  // Glory
  { 
    name: 'Glory',
    size: 10,
    title: 'Top 10 Seasonal Glory Rankings',
    description: null,
    helpMenus: ['rankings'],
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
    commands: ['ib'],
    fields: [
      { name: 'Kills', type: 'Leaderboard', data: 'ironBanner.kills', inline: true },
      { name: 'Wins', type: 'Leaderboard', data: 'ironBanner.wins', inline: true }
    ]
  }
]

export const Raids = [
  // Levi
  { 
    name: 'Leviathan',
    size: 10,
    title: 'Top 10 Leviathan Completions',
    interaction_desc: 'Create a leviathan leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'levi',
    sorting: ['raids.levi', 'raids.prestige_levi'],
    commands: ['levi', 'leviathan'],
    fields: [
      { name: 'Total (Norm | Pres)', type: 'SplitTotal', data: ['raids.levi', 'raids.prestige_levi'], inline: true }
    ]
  },

  // Eater of worlds
  { 
    name: 'Eater of Worlds',
    size: 10,
    title: 'Top 10 Eater of Worlds Completions',
    interaction_desc: 'Create an eater of worlds leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'eow',
    sorting: ['raids.eow', 'raids.prestige_eow'],
    commands: ['eow', 'eaterofworlds'],
    fields: [
      { name: 'Total (Norm | Pres)', type: 'SplitTotal', data: ['raids.eow', 'raids.prestige_eow'], inline: true }
    ]
  },

  // Spire of stars
  { 
    name: 'Spire of Stars',
    size: 10,
    title: 'Top 10 Spire of Stars Completions',
    interaction_desc: 'Create a spire of stars leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'sos',
    sorting: ['raids.sos', 'raids.prestige_sos'],
    commands: ['sos', 'spireofstars'],
    fields: [
      { name: 'Total (Norm | Pres)', type: 'SplitTotal', data: ['raids.sos', 'raids.prestige_sos'], inline: true }
    ]
  },

  // Last wish
  { 
    name: 'Last Wish',
    size: 10,
    title: 'Top 10 Last Wish Completions',
    interaction_desc: 'Create a last wish leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'lastWish',
    sorting: 'raids.lastWish',
    commands: ['lw', 'lastwish'],
    fields: [
      { name: 'Completions', type: 'Leaderboard', data: 'raids.lastWish', inline: true }
    ]
  },

  // Scourge of the past
  { 
    name: 'Scourge of the Past',
    size: 10,
    title: 'Top 10 Scourge of the Past Completions',
    interaction_desc: 'Create a scourge of the past leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'scourge',
    sorting: 'raids.scourge',
    commands: ['sotp', 'scourgeofthepast'],
    fields: [
      { name: 'Completions', type: 'Leaderboard', data: 'raids.scourge', inline: true }
    ]
  },

  // Crown of sorrows
  { 
    name: 'Crown of Sorrows',
    size: 10,
    title: 'Top 10 Crown of Sorrows Completions',
    interaction_desc: 'Create a crown of sorrows leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'sorrows',
    sorting: 'raids.sorrows',
    commands: ['cos', 'crownofsorrows'],
    fields: [
      { name: 'Completions', type: 'Leaderboard', data: 'raids.sorrows', inline: true }
    ]
  },

  // Garden of salvation
  { 
    name: 'Garden of Salvation',
    size: 10,
    title: 'Top 10 Garden of Salvation Completions',
    interaction_desc: 'Create a garden of salvation leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'garden',
    sorting: 'raids.garden',
    commands: ['gos', 'gardenofsalvation'],
    fields: [
      { name: 'Completions', type: 'Leaderboard', data: 'raids.garden', inline: true }
    ]
  },

  // Deep stone crypt
  { 
    name: 'Deep Stone Crypt',
    size: 10,
    title: 'Top 10 Deep Stone Crypt Completions',
    interaction_desc: 'Create a deep stone crypt leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'dsc',
    sorting: 'raids.dsc',
    commands: ['dsc', 'deepstonecrypt', 'stoney'],
    fields: [
      { name: 'Completions', type: 'Leaderboard', data: 'raids.dsc', inline: true }
    ]
  },

  // Vault of glass
  { 
    name: 'Vault of Glass',
    size: 10,
    title: 'Top 10 Vault of Glass Completions',
    interaction_desc: 'Create a vault of glass leaderboard',
    helpMenus: ['Raids'],
    leaderboardURL: 'vog',
    sorting: 'raids.vog',
    commands: ['vog', 'vaultofglass', 'voggers'],
    fields: [
      { name: 'Completions', type: 'Leaderboard', data: 'raids.vog', inline: true }
    ]
  },
];