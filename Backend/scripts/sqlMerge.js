const Database = require('../../Shared/database');
const { ErrorHandler } = require('../../Shared/handlers/errorHandler');
const Guilds = require('../data/guilds.json').guilds;
const Clans = require('../data/clans.json').clans;
const Definitions = require('../data/definitions.json').definitions;
const RegisteredUsers = require('../data/regUsers.json').users;
const Broadcasts = require('../data/broadcasts.json').broadcasts;

async function addNewGuilds() {
  for(let i in Guilds) {
    let guild = Guilds[i];
    Database.addGuild({
      guildID: guild.guild_id,
      guildName: guild.guild_name,
      ownerID: guild.owner_id,
      ownerAvatar: guild.owner_avatar,
      clans: guild.clans.split(',').filter(e => e !== ''),
      isTracking: guild.isTracking,
      joinedOn: new Date(JSON.parse(guild.joinedOn)),
      region: guild.region,
      broadcasts: {
        channel: guild.broadcasts_channel !== "null" ? guild.broadcasts_channel : "0",
        extraItems: guild.whitelist.split(',').filter(e => e !== ''),
        items: guild.enable_broadcasts_items,
        titles: guild.enable_broadcasts_titles,
        clans: guild.enable_broadcasts_clans,
        dungeons: guild.enable_broadcasts_dungeons,
        triumphs: guild.enable_broadcasts_triumphs,
        catalysts: guild.enable_broadcasts_catalysts,
        others: guild.enable_broadcasts_others
      }
    }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
  }
}
async function addNewClans() {
  for(let i in Clans) {
    let clan = Clans[i];
    Database.addClan({
      clanID: clan.clan_id,
      clanName: clan.clan_name,
      clanCallsign: clan.clan_callsign,
      clanLevel: clan.clan_level,
      memberCount: clan.member_count,
      onlineMembers: clan.online_players,
      firstScan: clan.firstScan,
      forcedScan: clan.forcedScan,
      isTracking: clan.isTracking,
      joinedOn: new Date(JSON.parse(clan.joinedOn)),
      lastScan: new Date(JSON.parse(clan.lastScan))
    }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
  }
}
async function addNewDefintions() {
  for(let i in Definitions) {
    let definition = Definitions[i];
    Database.addGlobalItem({
      name: definition.name,
      fname: definition.fname,
      type: definition.type,
      advancedType: definition.advanced_type,
      season: definition.season,
      description: definition.description,
      imageUrl: definition.imageUrl,
      hash: definition.hash,
      trackingEnabled: definition.tracking_enabled,
      broadcastEnabled: definition.broadcast_enabled
    }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } else { console.log(`Added: ${ Definitions[i].name }`); } });
  }
}
async function addNewRegisteredUsers() {
  for(let i in RegisteredUsers) {
    let user = RegisteredUsers[i];
    Database.addRegisteredUser({
      discordID: user.discord_id,
      username: user.username,
      membershipID: user.membershipId,
      platform: user.platform,
    }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
  }
}
async function addNewBroadcasts() {
  console.log(Broadcasts.length);
  for(let i in Broadcasts) {
    let bc = Broadcasts[i];
    Database.addBroadcast({
      clanID: bc.clanId,
      guildID: "0",
      displayName: bc.displayName,
      membershipID: bc.membershipId,
      season: bc.season,
      type: bc.type,
      broadcast: bc.broadcast,
      hash: bc.hash,
      count: bc.count,
      date: new Date(JSON.parse(bc.date))
    }, (isError, severity, err) => { if(isError) { ErrorHandler(severity, err) } });
  }
}


module.exports = { addNewGuilds, addNewClans, addNewDefintions, addNewRegisteredUsers, addNewBroadcasts }