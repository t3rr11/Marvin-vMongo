const { GetGlobalHighestPowerMinusArtifactLeaderboard } = require("./requestHandler");

const resetTime = '17:00 UTC';
const msPerWk = 604800000;
const msPerDay = 86400000;

const cycleInfo = {
  epoch: {
    zeroHour: new Date(`May 7 2019 ${ resetTime }`).getTime(),
    lostSector: new Date(`December 21 2020 ${ resetTime }`).getTime(),
    grandMaster: new Date(`December 22 2020 ${ resetTime }`).getTime(),
  },
  cycle: {
    zeroHour: 3,
    lostSector: 19,
    grandMaster: 6
  },
  elapsed: { },
  week: { },
  day: { }
};

const getLoot = (type) => {
  switch(type) {
    case 0: { return { type: "Chest", loot: [] } }
    case 1: { return { type: "Helmet", loot: [] } }
    case 2: { return { type: "Legs", loot: [] } }
    case 3: { return { type: "Arms", loot: [] } }
  }
}

const getSector = (type) => {
  switch(type) {
    case 0: { return { name: "Perdition", masterHash: 1070981425, legendHash: 1070981430, planet: "Europa" } }
    case 1: { return { name: "Exodus", masterHash: 2936791995, legendHash: 2936791996, planet: "EDZ" } }
    case 2: { return { name: "Veles", masterHash: 3094493727, legendHash: 3094493720, planet: "EDZ" } }
    case 3: { return { name: "Concealed", masterHash: 912873274, legendHash: 912873277, planet: "Europa" } }
    case 4: { return { name: "Bunker", masterHash: 1648125538, legendHash: 1648125541, planet: "Europa" } }
  }
}

const rotations = {
  lostSector: {
    1:  { sector: getSector(0), loot: getLoot(0) },
    2:  { sector: getSector(1), loot: getLoot(1) },
    3:  { sector: getSector(2), loot: getLoot(2) },
    4:  { sector: getSector(3), loot: getLoot(3) },
    5:  { sector: getSector(4), loot: getLoot(0) },
    6:  { sector: getSector(0), loot: getLoot(1) },
    7:  { sector: getSector(1), loot: getLoot(2) },
    8:  { sector: getSector(2), loot: getLoot(3) },
    9:  { sector: getSector(3), loot: getLoot(0) },
    10: { sector: getSector(4), loot: getLoot(1) },
    11: { sector: getSector(0), loot: getLoot(2) },
    12: { sector: getSector(1), loot: getLoot(3) },
    13: { sector: getSector(2), loot: getLoot(0) },
    14: { sector: getSector(3), loot: getLoot(1) },
    15: { sector: getSector(4), loot: getLoot(2) },
    16: { sector: getSector(0), loot: getLoot(3) },
    17: { sector: getSector(1), loot: getLoot(0) },
    18: { sector: getSector(2), loot: getLoot(1) },
    19: { sector: getSector(3), loot: getLoot(2) },
    20: { sector: getSector(4), loot: getLoot(3) }
  },
  zeroHour: {
    1: { burn: 'Void' },
    2: { burn: 'Arc' },
    3: { burn: 'Solar' }
  },
  grandMaster: {
    1: { name: "Exodus Crash", recordHash: 3505377076, activityHash: 54961125 },
    2: { name: "The Inverted Spire", recordHash: 164162423, activityHash: 281497220 },
    3: { name: "The Scarlet Keep", recordHash: 3426594834, activityHash: 3449817631 },
    4: { name: "Broodhold", recordHash: 1445611700, activityHash: 89113250 },
    5: { name: "The Glassway", recordHash: 3250442757, activityHash: 4197461112 },
    6: { name: "The Disgraced", recordHash: 3694149830, activityHash: 3381711459 }
  }
}

const dailyCycleInfo = (type) => {
  const time = new Date().getTime();
  for(var cycle in cycleInfo.cycle) {
    cycleInfo.elapsed[cycle] = time - cycleInfo.epoch[cycle];
    cycleInfo.week[cycle] = Math.floor((cycleInfo.elapsed[cycle] / msPerWk) % cycleInfo.cycle[cycle]) + 1;
    cycleInfo.day[cycle] = Math.floor((cycleInfo.elapsed[cycle] / msPerDay) % cycleInfo.cycle[cycle]) + 1;
  }
  switch(type) {
    case "legendLostSector": { return rotations.lostSector[cycleInfo.day.lostSector+1 <= 19 ? cycleInfo.day.lostSector+1 : 1]; }
    case "masterLostSector": { return rotations.lostSector[cycleInfo.day.lostSector]; }
  }
};


const weeklyCycleInfo = (type) => {
  const time = new Date().getTime();
  for(var cycle in cycleInfo.cycle) {
    cycleInfo.elapsed[cycle] = time - cycleInfo.epoch[cycle];
    cycleInfo.week[cycle] = Math.floor((cycleInfo.elapsed[cycle] / msPerWk) % cycleInfo.cycle[cycle]) + 1;
    cycleInfo.day[cycle] = Math.floor((cycleInfo.elapsed[cycle] / msPerDay) % cycleInfo.cycle[cycle]) + 1;
  }
  switch(type) {
    case "zeroHour": { return rotations.zeroHour }
    case "grandMaster": { return rotations.grandMaster[cycleInfo.week.grandMaster] }
  }
};

//Use: weeklyCycleInfo().zerohour[cycleInfo.week.zerohour].burn;
//Use: dailyCycleInfo().lostSector[cycleInfo.day.lostSector];

module.exports = { dailyCycleInfo, weeklyCycleInfo }
