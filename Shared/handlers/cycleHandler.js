const resetTime = '17:00 UTC';
const msPerWk = 604800000;
const msPerDay = 86400000;

const cycleInfo = {
  epoch: {
    zeroHour: new Date(`May 7 2019 ${ resetTime }`).getTime(),
    lostSector: new Date(`Feb 15 2021 ${ resetTime }`).getTime(),
    grandMaster: new Date(`December 22 2020 ${ resetTime }`).getTime(),
  },
  cycle: {
    zeroHour: 3,
    lostSector: 20,
    grandMaster: 6
  },
  elapsed: { },
  week: { },
  day: { }
};

const getLoot = (type) => {
  switch(type) {
    case 0: { return { type: "Helmet", loot: [] } }
    case 1: { return { type: "Legs", loot: [] } }
    case 2: { return { type: "Arms", loot: [] } }
    case 3: { return { type: "Chest", loot: [] } }
  }
}

const getSector = (type) => {
  switch(type) {
    case 0: { return { name: "K1 Revelations", masterHash: 3911969238, legendHash: 3911969233, planet: "Moon" } }
    case 1: { return { name: "Consealed Void", masterHash: 912873274, legendHash: 912873277, planet: "Europa" } }
    case 2: { return { name: "Bunker E15", masterHash: 1648125538, legendHash: 1648125541, planet: "Europa" } }
    case 3: { return { name: "Perdition", masterHash: 1070981425, legendHash: 1070981430, planet: "Europa" } }
    case 4: { return { name: "Exodus Garden 2A", masterHash: 2936791995, legendHash: 2936791996, planet: "Cosmodrome" } }
    case 5: { return { name: "Veles Labyrinth", masterHash: 3094493727, legendHash: 3094493720, planet: "Cosmodrome" } }
    case 6: { return { name: "K1 Logistics", masterHash: 567131519, legendHash: 567131512, planet: "Moon" } }
    case 7: { return { name: "K1 Communion", masterHash: 2829206720, legendHash: 2829206727, planet: "Moon" } }
    case 8: { return { name: "K1 Crew Quarters", masterHash: 184186578, legendHash: 184186581, planet: "Moon" } }
  }
}

const rotations = {
  lostSector: {
    0:  { sector: getSector(0), loot: getLoot(0) },
    1:  { sector: getSector(1), loot: getLoot(1) },
    2:  { sector: getSector(2), loot: getLoot(2) },
    3:  { sector: getSector(3), loot: getLoot(3) },
    4:  { sector: getSector(4), loot: getLoot(0) },
    5:  { sector: getSector(5), loot: getLoot(1) },
    6:  { sector: getSector(6), loot: getLoot(2) },
    7:  { sector: getSector(7), loot: getLoot(3) },
    8:  { sector: getSector(8), loot: getLoot(0) },
    9:  { sector: getSector(0), loot: getLoot(1) },
    10:  { sector: getSector(1), loot: getLoot(2) },
    11:  { sector: getSector(2), loot: getLoot(3) },
    12:  { sector: getSector(3), loot: getLoot(0) },
    13:  { sector: getSector(4), loot: getLoot(1) },
    14:  { sector: getSector(5), loot: getLoot(2) },
    15:  { sector: getSector(6), loot: getLoot(3) },
    16:  { sector: getSector(7), loot: getLoot(0) },
    17:  { sector: getSector(8), loot: getLoot(1) },
    18:  { sector: getSector(0), loot: getLoot(2) },
    19:  { sector: getSector(1), loot: getLoot(3) },
    20:  { sector: getSector(2), loot: getLoot(0) },
    21:  { sector: getSector(3), loot: getLoot(1) },
    22:  { sector: getSector(4), loot: getLoot(2) },
    23:  { sector: getSector(5), loot: getLoot(3) },
    24:  { sector: getSector(6), loot: getLoot(0) },
    25:  { sector: getSector(7), loot: getLoot(1) },
    26:  { sector: getSector(8), loot: getLoot(2) },
    27:  { sector: getSector(0), loot: getLoot(3) },
    28:  { sector: getSector(1), loot: getLoot(0) },
    29:  { sector: getSector(2), loot: getLoot(1) },
    30:  { sector: getSector(3), loot: getLoot(2) },
    31:  { sector: getSector(4), loot: getLoot(3) },
    32:  { sector: getSector(5), loot: getLoot(0) },
    33:  { sector: getSector(6), loot: getLoot(1) },
    34:  { sector: getSector(7), loot: getLoot(2) },
    35:  { sector: getSector(8), loot: getLoot(3) }
  },
  zeroHour: {
    1: { burn: 'Void' },
    2: { burn: 'Arc' },
    3: { burn: 'Solar' }
  },
  grandMaster: {
    1: { name: "Exodus Crash", recordHash: 3505377076, activityHash: 54961125 },
    2: { name: "The Glassway", recordHash: 3250442757, activityHash: 4197461112 },
    3: { name: "The Scarlet Keep", recordHash: 3426594834, activityHash: 3449817631 },
    4: { name: "Broodhold", recordHash: 1445611700, activityHash: 89113250 },
    5: { name: "The Inverted Spire", recordHash: 164162423, activityHash: 281497220 },
    6: { name: "The Disgraced", recordHash: 3694149830, activityHash: 3381711459 }
  }
}

const dailyCycleInfo = (type) => {
  const time = new Date().getTime();
  for(var cycle in cycleInfo.cycle) {
    cycleInfo.elapsed[cycle] = time - cycleInfo.epoch[cycle];
    cycleInfo.week[cycle] = Math.floor((cycleInfo.elapsed[cycle] / msPerWk) % cycleInfo.cycle[cycle]);
    cycleInfo.day[cycle] = Math.floor((cycleInfo.elapsed[cycle] / msPerDay) % cycleInfo.cycle[cycle]);
  }
  switch(type) {
    case "legendLostSector": { return rotations.lostSector[cycleInfo.day.lostSector]; }
    case "masterLostSector": { return rotations.lostSector[cycleInfo.day.lostSector-1 >= 0 ? cycleInfo.day.lostSector-1 : 35]; }
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
