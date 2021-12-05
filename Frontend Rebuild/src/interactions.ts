export const Interactions = [
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
    name: 'infamy',
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
    name: 'glory',
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
]