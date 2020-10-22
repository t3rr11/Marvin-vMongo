const Discord = require('discord.js');
const Database = require('../../../Shared/database');
const Misc = require('../../../Shared/misc');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');
const ManifestHandler = require('../../../Shared/handlers/manifestHandler');
const RequestHandler = require('../../../Shared/handlers/requestHandler');
const Config = require('../../../Shared/configs/Config.json');
const DiscordConfig = require(`../../../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);

function MessageHandler(client, message, guilds, users) {
  //TODO
  if(message.guild) {
    var guild = guilds.find(e => e.guildID == message.guild.id);
    var prefix = guild ? guild.prefix : "~";
    if(message.guild.id === "110373943822540800" || message.guild.id === "264445053596991498") return;
    if(!message.guild.me.permissionsIn(message.channel.id).has('SEND_MESSAGES')) return;
    if(!message.content.startsWith(prefix) || message.author.bot) { return; }

    const args = message.content.slice(prefix.length);
    const command = args.toString().toLowerCase();
    let registeredUser = null;

    if(message.mentions.users.first()) {
      if(users.find(e => e.discordID === message.mentions.users.first().id)) { registeredUser = (users.find(e => e.discordID === message.mentions.users.first().id)) }
      else { registeredUser = "NoUser"; }
    }
    else { if(users.find(e => e.discordID === message.author.id)) { registeredUser = (users.find(e => e.discordID === message.author.id)) } }

    try {
      switch(true) {
        case command.startsWith("valor"): case command.startsWith("glory"): case command.startsWith("infamy"): 
        case command.startsWith("levi"): case command.startsWith("leviathan"):
        case command.startsWith("eow"): case command.startsWith("eater of worlds"):
        case command.startsWith("sos"): case command.startsWith("spire of stars"):
        case command.startsWith("lw"): case command.startsWith("last wish"):
        case command.startsWith("scourge"): case command.startsWith("scourge of the past"):
        case command.startsWith("sorrows"): case command.startsWith("crown of sorrows"):
        case command.startsWith("garden"): case command.startsWith("garden of salvation"):
        case command.startsWith("sr"): case command.startsWith("season rank"):
        case command.startsWith("power"): case command.startsWith("light"): case command.startsWith("highest power"): case command.startsWith("max power"): case command.startsWith("max light"):
        case command.startsWith("throne"): case command.startsWith("shattered throne"): case command.startsWith("pit"): case command.startsWith("pit of heresy"): case command.startsWith("prophecy"): 
        case command.startsWith("triumph score"): case command.startsWith("triumph"): case command.startsWith("triumphs"):
        case command.startsWith("time"): case command.startsWith("time played"): case command.startsWith("total time"):
        case command.startsWith("raids total"): case command.startsWith("total raids"):
        case command.startsWith("trials weekly win streak"): case command.startsWith("trials seasonal win streak"): 
        case command.startsWith("trials weekly wins"): case command.startsWith("trials seasonal wins"): case command.startsWith("trials overall wins"): 
        case command.startsWith("trials weekly flawless"): case command.startsWith("trials seasonal flawless"): case command.startsWith("trials overall flawless"): 
        case command.startsWith("trials weekly final blows"): case command.startsWith("trials seasonal final blows"): case command.startsWith("trials overall final blows"): 
        case command.startsWith("trials weekly post wins"): case command.startsWith("trials seasonal post wins"): 
        case command.startsWith("trials weekly carries"): case command.startsWith("trials overall post wins"): 
        case command.startsWith("trials seasonal carries"): case command.startsWith("trials overall carries"):
          { GetLeaderboard(message, command, users, registeredUser); break; }
        case command.startsWith("titles total"): case command.startsWith("total titles"):
          { GetTitleLeaderboard(message, command, users, registeredUser); break; }
        case command.startsWith("trials profile"): case command.startsWith("trials profile weekly"):
        case command.startsWith("trials profile seasonal"):
        case command.startsWith("trials profile overall"):
          { GetProfile(message, command, "trials", users, registeredUser); break; }
        case command.startsWith("profile"):
          { GetProfile(message, command, "profile", users, registeredUser); break; }
        case command.startsWith("clanwars"): { GetClanWars(message, command, users, registeredUser); break; }
        case command.startsWith("item"): { GetObtainedItems(message, command, "obtained", users, registeredUser); break; }
        case command.startsWith("!item"): { GetObtainedItems(message, command, "not", users, registeredUser); break; }
        case command.startsWith("title"): { GetObtainedTitles(message, command, "obtained", users, registeredUser); break; }
        case command.startsWith("!title"): { GetObtainedTitles(message, command, "not", users, registeredUser); break; }
        default: { message.channel.send('I\'m not sure what that commands is sorry. Use `~help` to see commands.').then(msg => { msg.delete({ timeout: 3000 }) }).catch(); break; }
      }
    }
    catch (err) { ErrorHandler("High", err); }
  }
}

async function GetLeaderboard(message, command, users, registeredUser) {
  let players = [];
  let privatePlayers = [];
  let registeredPlayer;

  //Get players
  var GetGuildPlayers = new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); privatePlayers = data.filter(e => e.isPrivate); } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Get registered user info
  var GetRegisteredUserInfo = new Promise(resolve =>
    Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
      if(!isError) { if(isFound) { if(!players.find(e => e.membershipID === registeredUser.membershipID)) { players.push(data.User); } registeredPlayer = data; } }
      resolve(true);
    })
  );

  //Promise all
  if(registeredUser !== null || registeredUser !== "NoUser") { await Promise.all([await GetGuildPlayers, await GetRegisteredUserInfo]); }
  else { await Promise.all([await GetGuildPlayers]); }

  SendLeaderboard(message, command, players, privatePlayers, registeredUser, registeredPlayer);
}
async function GetTitleLeaderboard(message, command, users, registeredUser) {
  let players = [];
  let playerTitles = [];
  let privatePlayers = [];
  let registeredPlayer;
  let registeredPlayerTitles;

  //Get players
  var GetGuildPlayers = new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); privatePlayers = data.filter(e => e.isPrivate); } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Get player titles
  var GetGuildTitles = new Promise(resolve => Database.getGuildTitles(message.guild.id, function GetGuildTitles(isError, isFound, data) {
    if(!isError) { if(isFound) { playerTitles = data; } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Get registered user info
  var GetRegisteredUserInfo = new Promise(resolve =>
    Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
      if(!isError) { if(isFound) { if(!players.find(e => e.membershipID === registeredUser.membershipID)) { players.push(data.User); } registeredPlayer = data; } }
      resolve(true);
    })
  );

  //Promise all
  if(registeredUser !== null || registeredUser !== "NoUser") { await Promise.all([await GetGuildPlayers, await GetGuildTitles, await GetRegisteredUserInfo]); }
  else { await Promise.all([await GetGuildPlayers, await GetGuildTitles]); }

  SendLeaderboard(message, command, players, privatePlayers, registeredUser, registeredPlayer, playerTitles, registeredPlayerTitles);
}
async function GetObtainedItems(message, command, type, users, registeredUser) {
  let players = [];
  let playerItems = [];
  let obtained = [];
  let msg = await message.channel.send(new Discord.MessageEmbed().setColor(0x0099FF).setAuthor("Processing...").setDescription("This command takes a little to process. It will update in a few seconds.").setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp());

  //Get item
  var requestedItemName = type === "obtained" ? command.substr("item ".length) : command.substr("!item ".length);
  var item;
  if(isNaN(requestedItemName)) { item = ManifestHandler.getManifestItemByName(requestedItemName); }
  else {
    item = ManifestHandler.getManifestItemByHash(requestedItemName);
    if(!item) { item = ManifestHandler.getManifestItemByCollectibleHash(requestedItemName); }
  }

  //Get players
  var GetGuildPlayers = new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Get player items
  var GetGuildItems = new Promise(resolve => Database.getGuildItems(message.guild.id, function GetGuildItems(isError, isFound, data) {
    if(!isError) { if(isFound) { playerItems = data; } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Promise all
  if(item) {
    await Promise.all([await GetGuildPlayers, await GetGuildItems]);

    for(var i in playerItems) {
      let user = players.find(e => e.membershipID === playerItems[i].membershipID);
      let itemState = (playerItems[i].items.find(e => e.hash == item.collectibleHash)).state;
      if(type === "obtained") { if(!Misc.GetItemState(itemState).notAcquired) { obtained.push(user.displayName); } }
      else { if(Misc.GetItemState(itemState).notAcquired) { obtained.push(user.displayName); } }
    }
  }

  SendItemsLeaderboard(msg, command, type, players, obtained, item);
}
async function GetObtainedTitles(message, command, type, users, registeredUser) {
  let players = [];
  let playerTitles = [];
  let obtained = [];
  let msg = await message.channel.send(new Discord.MessageEmbed().setColor(0x0099FF).setAuthor("Processing...").setDescription("This command takes a little to process. It will update in a few seconds.").setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp());

  //Get title
  var requestedTitleName = type === "obtained" ? command.substr("title ".length) : command.substr("!title ".length);
  var title = ManifestHandler.getManifestTitleByName(requestedTitleName);

  //Get players
  var GetGuildPlayers = new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Get player items
  var GetGuildTitles = new Promise(resolve => Database.getGuildTitles(message.guild.id, function GetGuildTitles(isError, isFound, data) {
    if(!isError) { if(isFound) { playerTitles = data; } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Promise all
  if(title) {
    await Promise.all([await GetGuildPlayers, await GetGuildTitles]);

    for(var i in playerTitles) {
      let user = players.find(e => e.membershipID === playerTitles[i].membershipID);
      if(type === "obtained") { if(playerTitles[i].titles.find(e => e === title.hash.toString())) { obtained.push(user.displayName); } }
      else { if(!playerTitles[i].titles.find(e => e === title.hash)) { obtained.push(user.displayName); } }
    }
  }

  SendTitlesLeaderboard(msg, command, type, players, obtained, title);
}
async function GetProfile(message, command, type, users, registeredUser) {
  let players = [];
  let playerTitles = [];
  let registeredPlayer;
  let registeredPlayerStats = [];
  let registeredPlayerBroadcasts = [];

  //Get players
  var GetGuildPlayers = new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Get player titles
  var GetGuildTitles = await new Promise(resolve => Database.getGuildTitles(message.guild.id, function GetGuildTitles(isError, isFound, data) {
    if(!isError) { if(isFound) { playerTitles = data; } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Get registered user info
  var GetRegisteredUserInfo = await new Promise(resolve =>
    Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
      if(!isError) {
        if(isFound) {
          if(!players.find(e => e.membershipID === registeredUser.membershipID)) { players.push(data.User); }
          if(!playerTitles.find(e => e.membershipID === registeredUser.membershipID)) { playerTitles.push(data.Titles); }
          registeredPlayer = data;
          registeredPlayerStats = {
            timePlayed: { "data": data.User.timePlayed, "rank": players.sort(function(a, b) { return b.timePlayed - a.timePlayed; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            infamy: { "data": data.User.infamy.current, "rank": players.sort(function(a, b) { return b.infamy.current - a.infamy.current; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            valor: { "data": data.User.valor.current, "rank": players.sort(function(a, b) { return b.valor.current - a.valor.current; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            glory: { "data": data.User.glory, "rank": players.sort(function(a, b) { return b.glory - a.glory; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            triumphScore: { "data": data.User.triumphScore, "rank": players.sort(function(a, b) { return b.triumphScore - a.triumphScore; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            seasonRank: { "data": data.User.seasonRank, "rank": players.sort(function(a, b) { return b.seasonRank - a.seasonRank; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            titles: { "data": data.Titles.titles.length, "rank": playerTitles.sort(function(a, b) { return b.titles.length - a.titles.length; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            lastPlayed: data.User.lastPlayed,
            highestPower: { "data": data.User.highestPower, "rank": players.sort(function(a, b) { return b.highestPower - a.highestPower; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            levi: { "data": data.User.raids.levi, "rank": players.sort(function(a, b) { return b.raids.levi - a.raids.levi; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            eow: { "data": data.User.raids.eow, "rank": players.sort(function(a, b) { return b.raids.eow - a.raids.eow; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            sos: { "data": data.User.raids.sos, "rank": players.sort(function(a, b) { return b.raids.sos - a.raids.sos; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            prestige_levi: { "data": data.User.raids.prestige_levi, "rank": players.sort(function(a, b) { return b.raids.prestige_levi - a.raids.prestige_levi; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            prestige_eow: { "data": data.User.raids.prestige_eow, "rank": players.sort(function(a, b) { return b.raids.prestige_eow - a.raids.prestige_eow; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            prestige_sos: { "data": data.User.raids.prestige_sos, "rank": players.sort(function(a, b) { return b.raids.prestige_sos - a.raids.prestige_sos; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            lastWish: { "data": data.User.raids.lastWish, "rank": players.sort(function(a, b) { return b.raids.lastWish - a.raids.lastWish; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            scourge: { "data": data.User.raids.scourge, "rank": players.sort(function(a, b) { return b.raids.scourge - a.raids.scourge; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            sorrows: { "data": data.User.raids.sorrows, "rank": players.sort(function(a, b) { return b.raids.sorrows - a.raids.sorrows; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            garden: { "data": data.User.raids.garden, "rank": players.sort(function(a, b) { return b.raids.garden - a.raids.garden; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },     
            totalRaids: { "data": data.User.totalRaids, "rank": players.sort(function(a, b) { return b.totalRaids - a.totalRaids; }).findIndex(e => e.membershipID === data.User.membershipID) +1 }                    
          }
        }
      }
      resolve(true);
    })
  );

  //Get broadcasts for user
  var GetUserBroadcasts = await new Promise(resolve => 
    Database.getUserBroadcasts(registeredUser.membershipID, function GetUserBroadcasts(isError, isFound, data) {
      if(!isError) { if(isFound) { registeredPlayerBroadcasts = data; } }
      resolve(true);
    })
  );

  //Promise all
  if(registeredUser !== null || registeredUser !== "NoUser") {
    if(type === "profile") { await Promise.all([await GetGuildPlayers, await GetGuildTitles]); }
  }
  else {
    if(type === "profile") { await Promise.all([await GetGuildPlayers, await GetGuildTitles, await GetRegisteredUserInfo, await GetUserBroadcasts]); }
    else if(type === "trials") { await Promise.all([await GetRegisteredUserInfo]); }
  }

  SendProfile(message, command, registeredUser, registeredPlayer, registeredPlayerStats, registeredPlayerBroadcasts, players.length);
}
async function GetClanWars(message, command, users, registeredUser) {
  RequestHandler.GetClanWars(async (isError, clanData) => {
    if(!isError) {
      let registeredPlayer;

      //Add registered user to players if not there already
      if(registeredUser !== null || registeredUser !== "NoUser") {
        await new Promise(resolve =>
          Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
            if(!isError) { if(isFound) { registeredPlayer = data; } }
            resolve(true);
          })
        );
      }

      SendClanWarsLeaderboard(message, command, registeredUser, registeredPlayer, clanData);
    }
    else {
      if(clanData.code === "ECONNREFUSED") { message.channel.send("The server that processes this information is offline. Feel free to let me know using `~request`"); }
      else { message.channel.send("Failed to generate clanwars leaderboards... Uhh report using: `~request`"); }
    }
  });
}

function SendLeaderboard(message, command, players, privatePlayers, registeredUser, registeredPlayer, playerTitles, registeredPlayerTitles) {
  let leaderboard = { names: [], first: [], second: [] }
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  switch(true) {
    //Pvp
    case command.startsWith("valor"): {
      let top = players.sort((a, b) => { return b.valor.current - a.valor.current }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.valor.current) }` });
      leaderboard.second = top.map((e, index) => { return `${ ~~(e.valor.current/2000) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.valor.current) }`);
        leaderboard.second.push("", `${ ~~(registeredPlayer.User.valor.current/2000) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Seasonal Valor Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Valor", leaderboard.first, true);
      embed.addField("Resets", leaderboard.second, true);
      break;
    }
    case command.startsWith("infamy"): {
      let top = players.sort((a, b) => { return b.infamy.current - a.infamy.current }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.infamy.current) }` });
      leaderboard.second = top.map((e, index) => { return `${ ~~(e.infamy.current/15000) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.infamy.current) }`);
        leaderboard.second.push("", `${ ~~(registeredPlayer.User.infamy.current/15000) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Seasonal Infamy Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Infamy", leaderboard.first, true);
      embed.addField("Resets", leaderboard.second, true);
      break;
    }
    case command.startsWith("glory"): {
      let top = players.sort((a, b) => { return b.glory - a.glory }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.glory) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.glory) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Seasonal Glory Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Glory", leaderboard.first, true);
      break;
    }

    //Raids
    case command.startsWith("levi"): case command.startsWith("leviathan"): {
      let top = players.sort((a, b) => { return (b.raids.levi+b.raids.prestige_levi) - (a.raids.levi+a.raids.prestige_levi) }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.raids.levi } - ${ e.raids.prestige_levi }` });
      leaderboard.second = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.levi + e.raids.prestige_levi) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.levi } - ${ registeredPlayer.User.raids.prestige_levi }`);
        leaderboard.second.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.levi + registeredPlayer.User.raids.prestige_levi) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Leviathan Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Norm | Pres", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    case command.startsWith("eow"): case command.startsWith("eater of worlds"): {
      let top = players.sort((a, b) => { return (b.raids.eow+b.raids.prestige_eow) - (a.raids.eow+a.raids.prestige_eow) }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.raids.eow } - ${ e.raids.prestige_eow }` });
      leaderboard.second = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.eow + e.raids.prestige_eow) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.eow } - ${ registeredPlayer.User.raids.prestige_eow }`);
        leaderboard.second.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.eow + registeredPlayer.User.raids.prestige_eow) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Eater of Worlds Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Norm | Pres", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    case command.startsWith("sos"): case command.startsWith("spire of stars"): {
      let top = players.sort((a, b) => { return (b.raids.sos+b.raids.prestige_sos) - (a.raids.sos+a.raids.prestige_sos) }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.raids.sos } - ${ e.raids.prestige_sos }` });
      leaderboard.second = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.sos + e.raids.prestige_sos) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.sos } - ${ registeredPlayer.User.raids.prestige_sos }`);
        leaderboard.second.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.sos + registeredPlayer.User.raids.prestige_sos) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Spire of Stars Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Norm | Pres", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    case command.startsWith("lw"): case command.startsWith("last wish"): {
      let top = players.sort((a, b) => { return b.raids.lastWish - a.raids.lastWish }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.lastWish) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.lastWish) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Last Wish Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("scourge"): case command.startsWith("scourge of the past"): {
      let top = players.sort((a, b) => { return b.raids.scourge - a.raids.scourge }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.scourge) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.scourge) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Scourge of the Past Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("sorrows"): case command.startsWith("crown of sorrows"): {
      let top = players.sort((a, b) => { return b.raids.sorrows - a.raids.sorrows }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.sorrows) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.sorrows) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Crown of Sorrows Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("garden"): case command.startsWith("garden of salvation"): {
      let top = players.sort((a, b) => { return b.raids.garden - a.raids.garden }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.garden) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.garden) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Garden of Salvation Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }

    //Items and Titles


    //Seasonal - seasonRank, maxPower
    case command.startsWith("sr"): case command.startsWith("season rank"): {
      let top = players.sort((a, b) => { return b.seasonRank - a.seasonRank }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.seasonRank) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.seasonRank) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Season Ranks");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Season Rank", leaderboard.first, true);
      break;
    }
    case command.startsWith("power"): case command.startsWith("light"): case command.startsWith("highest power"): case command.startsWith("max power"): case command.startsWith("max light"): {
      let top = players.sort((a, b) => { return b.highestPower - a.highestPower }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.highestPower) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.highestPower) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Highest Power");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Highest Power", leaderboard.first, true);
      break;
    }
    //Dungeons - shatteredThrone, pitOfHeresy, prophecy
    case command.startsWith("throne"): case command.startsWith("shattered throne"): {
      let top = players.sort((a, b) => { return (b.dungeons.shatteredThrone.completions + b.dungeons.shatteredThrone.flawless) - (a.dungeons.shatteredThrone.completions + a.dungeons.shatteredThrone.flawless) }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.dungeons.shatteredThrone.completions } - ${ e.dungeons.shatteredThrone.flawless }` });
      leaderboard.second = top.map((e, index) => { return `${ e.dungeons.shatteredThrone.completions + e.dungeons.shatteredThrone.flawless }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.dungeons.shatteredThrone.completions } - ${ registeredPlayer.User.dungeons.shatteredThrone.flawless }`);
        leaderboard.second.push("", `${ registeredPlayer.User.dungeons.shatteredThrone.completions + registeredPlayer.User.dungeons.shatteredThrone.flawless }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Shattered Throne Completions");
      embed.setDescription("Completions (Normal - Flawless)");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    case command.startsWith("pit"): case command.startsWith("pit of heresy"): {
      let top = players.sort((a, b) => { return (b.dungeons.pitOfHeresy.completions + b.dungeons.pitOfHeresy.flawless) - (a.dungeons.pitOfHeresy.completions + a.dungeons.pitOfHeresy.flawless) }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.dungeons.pitOfHeresy.completions } - ${ e.dungeons.pitOfHeresy.flawless }` });
      leaderboard.second = top.map((e, index) => { return `${ e.dungeons.pitOfHeresy.completions + e.dungeons.pitOfHeresy.flawless }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.dungeons.pitOfHeresy.completions } - ${ registeredPlayer.User.dungeons.pitOfHeresy.flawless }`);
        leaderboard.second.push("", `${ registeredPlayer.User.dungeons.pitOfHeresy.completions + registeredPlayer.User.dungeons.pitOfHeresy.flawless }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Pit of Heresy Completions");
      embed.setDescription("Completions (Normal - Flawless)");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    case command.startsWith("prophecy"): {
      let top = players.sort((a, b) => { return (b.dungeons.prophecy.completions + b.dungeons.prophecy.flawless) - (a.dungeons.prophecy.completions + a.dungeons.prophecy.flawless) }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.dungeons.prophecy.completions } - ${ e.dungeons.prophecy.flawless }` });
      leaderboard.second = top.map((e, index) => { return `${ e.dungeons.prophecy.completions + e.dungeons.prophecy.flawless }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.dungeons.prophecy.completions } - ${ registeredPlayer.User.dungeons.prophecy.flawless }`);
        leaderboard.second.push("", `${ registeredPlayer.User.dungeons.prophecy.completions + registeredPlayer.User.dungeons.prophecy.flawless }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Prophecy Completions");
      embed.setDescription("Completions (Normal - Flawless)");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    
    //Trials
    case command.startsWith("trials weekly wins"): {
      let top = players.sort((a, b) => { return b.trials.weekly.wins - a.trials.weekly.wins }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.weekly.wins) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.weekly.wins) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Weekly Wins");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials weekly win streak"): {
      let top = players.sort((a, b) => { return b.trials.weekly.winStreak - a.trials.weekly.winStreak }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.weekly.winStreak) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.weekly.winStreak) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Weekly Win Streak");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials weekly flawless"): {
      let top = players.sort((a, b) => { return b.trials.weekly.flawlessTickets - a.trials.weekly.flawlessTickets }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.weekly.flawlessTickets) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.weekly.flawlessTickets) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Weekly Flawless Tickets");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials weekly final blows"): {
      let top = players.sort((a, b) => { return b.trials.weekly.finalBlows - a.trials.weekly.finalBlows }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.weekly.finalBlows) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.weekly.finalBlows) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Weekly Final Blows");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials weekly post wins"): {
      let top = players.sort((a, b) => { return b.trials.weekly.postFlawlessWins - a.trials.weekly.postFlawlessWins }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.weekly.postFlawlessWins) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.weekly.postFlawlessWins) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Weekly Post Flawless Wins");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials weekly carries"): {
      let top = players.sort((a, b) => { return b.trials.weekly.carries - a.trials.weekly.carries }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.weekly.carries) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.weekly.carries) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Weekly Carries");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials seasonal wins"): {
      let top = players.sort((a, b) => { return b.trials.seasonal.wins - a.trials.seasonal.wins }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.seasonal.wins) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.seasonal.wins) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Seasonal Wins");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials seasonal win streak"): {
      let top = players.sort((a, b) => { return b.trials.seasonal.winStreak - a.trials.seasonal.winStreak }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.seasonal.winStreak) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.seasonal.winStreak) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Seasonal Win Streak");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials seasonal flawless"): {
      let top = players.sort((a, b) => { return b.trials.seasonal.flawlessTickets - a.trials.seasonal.flawlessTickets }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.seasonal.flawlessTickets) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.seasonal.flawlessTickets) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Seasonal Flawless Tickets");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials seasonal final blows"): {
      let top = players.sort((a, b) => { return b.trials.seasonal.finalBlows - a.trials.seasonal.finalBlows }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.seasonal.finalBlows) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.seasonal.finalBlows) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Seasonal Final Blows");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials seasonal post wins"): {
      let top = players.sort((a, b) => { return b.trials.seasonal.postFlawlessWins - a.trials.seasonal.postFlawlessWins }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.seasonal.postFlawlessWins) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.seasonal.postFlawlessWins) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Seasonal Post Flawless Wins");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials seasonal carries"): {
      let top = players.sort((a, b) => { return b.trials.seasonal.carries - a.trials.seasonal.carries }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.seasonal.carries) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.seasonal.carries) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Seasonal Carries");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials overall wins"): {
      let top = players.sort((a, b) => { return b.trials.overall.wins - a.trials.overall.wins }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.overall.wins) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.overall.wins) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Overall Wins");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials overall flawless"): {
      let top = players.sort((a, b) => { return b.trials.overall.flawlessTickets - a.trials.overall.flawlessTickets }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.overall.flawlessTickets) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.overall.flawlessTickets) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Overall Flawless Tickets");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials overall final blows"): {
      let top = players.sort((a, b) => { return b.trials.overall.finalBlows - a.trials.overall.finalBlows }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.overall.finalBlows) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.overall.finalBlows) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Overall Final Blows");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials overall post wins"): {
      let top = players.sort((a, b) => { return b.trials.overall.postFlawlessWins - a.trials.overall.postFlawlessWins }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.overall.postFlawlessWins) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.overall.postFlawlessWins) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Overall Post Flawless Wins");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }
    case command.startsWith("trials overall carries"): {
      let top = players.sort((a, b) => { return b.trials.overall.carries - a.trials.overall.carries }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.trials.overall.carries) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.trials.overall.carries) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Trials Overall Carries");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }

    //Others - triumphScore, totalTime, totalRaids, totalTitles
    case command.startsWith("triumph score"): case command.startsWith("triumphscore"): case command.startsWith("triumph"): case command.startsWith("triumphs"): {
      let top = players.sort((a, b) => { return b.triumphScore - a.triumphScore }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.triumphScore) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.triumphScore) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Triumph Score Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Score", leaderboard.first, true);
      break;
    }
    case command.startsWith("time"): case command.startsWith("time played"): case command.startsWith("total time"): {
      let top = players.sort((a, b) => { return b.timePlayed - a.timePlayed }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(Math.round(e.timePlayed/60)) } Hrs` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(Math.round(registeredPlayer.User.timePlayed/60)) } Hrs`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Most Time Played");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Hours", leaderboard.first, true);
      break;
    }
    case command.startsWith("raids total"): case command.startsWith("total raids"): {
      let top = players.sort((a, b) => { return b.totalRaids - a.totalRaids }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.totalRaids) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.totalRaids) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Total Raid Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Raids", leaderboard.first, true);
      break;
    }
    case command.startsWith("titles total"): case command.startsWith("total titles"): {
      let top = playerTitles.sort((a, b) => { return b.titles.length - a.titles.length }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ players.find(player => player.membershipID === e.membershipID).displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.titles.length) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.Titles.titles.length) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      console.log(leaderboard.first.toString().length);
      embed.setAuthor("Top 10 Total Titles");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }

    //Default
    default: {
      embed.setAuthor("Uhh oh...");
      embed.setDescription("So something went wrong and this command just didn't work. It dun broke. Please report using `~request`");
      break;
    }
  }

  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { console.log(err); }
  });
}
function SendItemsLeaderboard(message, command, type, players, playerItems, item) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  var chunkArray = playerItems.slice(0, 100).reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index / 15);
    if(!resultArray[chunkIndex]) { resultArray[chunkIndex] = []; }
    resultArray[chunkIndex].push(item)
    return resultArray
  }, []);

  if(item) {
    if(playerItems.length > 0) {
      embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ item.displayProperties.name }`);
      embed.setDescription(`This list can only show 100 players. There may be more not on this list depending on how many clans are tracked. ${ playerItems.length > 100 ? `100 / ${ playerItems.length }` : ` ${ playerItems.length } / 100` }`);
      for(var i in chunkArray) { embed.addField(`${ type === "obtained" ? "Obtained" : "Missing" }`, chunkArray[i], true); }
    }
    else { embed.setAuthor(`Nobody has it yet.`); }
  }
  else {
    embed.setAuthor("Uhh oh...");
    embed.setDescription(`Could not find the item requested.`);
  }

  message.edit(embed);
}
function SendTitlesLeaderboard(message, command, type, players, playerTitles, title) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  var chunkArray = playerTitles.slice(0, 100).reduce((resultArray, title, index) => { 
    const chunkIndex = Math.floor(index / 15);
    if(!resultArray[chunkIndex]) { resultArray[chunkIndex] = []; }
    resultArray[chunkIndex].push(title)
    return resultArray
  }, []);

  if(title) {
    if(playerTitles.length > 0) {
      embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ title.titleInfo.titlesByGender.Male }`);
      embed.setDescription(`This list can only show 100 players. There may be more not on this list depending on how many clans are tracked. ${ playerTitles.length > 100 ? `100 / ${ playerTitles.length }` : ` ${ playerTitles.length } / 100` }`);
      for(var i in chunkArray) { embed.addField(`${ type === "obtained" ? "Obtained" : "Missing" }`, chunkArray[i], true); }
    }
    else { embed.setAuthor(`Nobody has it yet.`); }
  }
  else {
    embed.setAuthor("Uhh oh...");
    embed.setDescription(`Could not find the title requested. If trying to search for Flawless or Conqourer use: Flawless S10, Conqourer S11, Etc.`);
  }

  message.edit(embed);
}
function SendClanWarsLeaderboard(message, command, registeredUser, registeredPlayer, clanData) {
  let leaderboard = { names: [], first: [], second: [] }
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  switch(true) {
    case command.startsWith("clanwars time"): case command.startsWith("clanwars time played"): {
      let top = clanData.sort((a, b) => { return b.data.timePlayed - a.data.timePlayed }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(Math.round(e.data.timePlayed/60)) } Hrs` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(Math.round(clan.data.timePlayed/60)) } Hrs`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Total Time Played");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Hours", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars triumph"): case command.startsWith("clanwars triumphs"): case command.startsWith("clanwars triumph score"): {
      let top = clanData.sort((a, b) => { return b.data.triumphScore - a.data.triumphScore }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.triumphScore) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.triumphScore) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Total Triumph Score");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Score", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars levi"): case command.startsWith("clanwars leviathan"): {
      let top = clanData.sort((a, b) => { return b.data.leviCompletions - a.data.leviCompletions }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.leviCompletions) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.leviCompletions) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Leviathan Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars eow"): case command.startsWith("clanwars eater"): case command.startsWith("clanwars eater of worlds"): {
      let top = clanData.sort((a, b) => { return b.data.eowCompletions - a.data.eowCompletions }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.eowCompletions) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.eowCompletions) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Eater of Worlds Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars sos"): case command.startsWith("clanwars spire of stars"): {
      let top = clanData.sort((a, b) => { return b.data.sosCompletions - a.data.sosCompletions }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.sosCompletions) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.sosCompletions) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Spire of Stars Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars lw"): case command.startsWith("clanwars last wish"): {
      let top = clanData.sort((a, b) => { return b.data.lwCompletions - a.data.lwCompletions }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.lwCompletions) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.lwCompletions) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Last Wish Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars scourge"): case command.startsWith("clanwars scourge of the past"): {
      let top = clanData.sort((a, b) => { return b.data.scourgeCompletions - a.data.scourgeCompletions }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.scourgeCompletions) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.scourgeCompletions) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Scourge of the Past Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars sorrows"): case command.startsWith("clanwars crown"): case command.startsWith("clanwars crown of sorrows"): {
      let top = clanData.sort((a, b) => { return b.data.sorrowsCompletions - a.data.sorrowsCompletions }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.sorrowsCompletions) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.sorrowsCompletions) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Crown of Sorrows Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars garden"): case command.startsWith("clanwars garden of salvation"): {
      let top = clanData.sort((a, b) => { return b.data.gardenCompletions - a.data.gardenCompletions }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.gardenCompletions) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.gardenCompletions) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Garden of Salvation Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars raids"): case command.startsWith("clanwars total raids"): case command.startsWith("clanwars raid completions"): {
      let top = clanData.sort((a, b) => { return b.data.totalRaids - a.data.totalRaids }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.totalRaids) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.totalRaids) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Total Raid Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars season ranks"): case command.startsWith("clanwars sr"): case command.startsWith("clanwars season rank"): {
      let top = clanData.sort((a, b) => { return b.data.seasonRanks - a.data.seasonRanks }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.data.seasonRanks) }` });
      if(registeredPlayer) {
        var clan = clanData.find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = clanData.indexOf(clan);
        console.log(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.seasonRanks) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Total Season Ranks");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Ranks", leaderboard.first, true);
      break;
    }
    default: { message.channel.send('I\'m not sure what that commands is sorry. Use `~help` to see commands.').then(msg => { msg.delete({ timeout: 3000 }) }).catch(); break; }
  }
  
  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { console.log(err); }
  });
}
function SendProfile(message, command, registeredUser, registeredPlayer, registeredPlayerStats, registeredPlayerBroadcasts, leaderboardLength) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  switch(true) {
    case command.startsWith("profile"): {
      switch(true) {
        case command.startsWith("profile -r"): case command.startsWith("profile -raids"): {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              embed.setAuthor(`Viewing Profile for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
              embed.setDescription(`Ranks are based on all tracked clans for this server. (Rank / ${ leaderboardLength }) players!`);
              embed.addField("Leviathan", `${ Misc.AddCommas(registeredPlayerStats.levi.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.levi.rank) })*`, true);
              embed.addField("Leviathan (PRESTIGE)", `${ Misc.AddCommas(registeredPlayerStats.prestige_levi.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.prestige_levi.rank) })*`, true);
              embed.addField("Eater of Worlds", `${ Misc.AddCommas(registeredPlayerStats.eow.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.eow.rank) })*`, true);
              embed.addField("Eater of Worlds (PRESTIGE)", `${ Misc.AddCommas(registeredPlayerStats.prestige_eow.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.prestige_eow.rank) })*`, true);
              embed.addField("Spire of Stars", `${ Misc.AddCommas(registeredPlayerStats.sos.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.sos.rank) })*`, true);
              embed.addField("Spire of Stars (PRESTIGE)", `${ Misc.AddCommas(registeredPlayerStats.prestige_sos.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.prestige_sos.rank) })*`, true);
              embed.addField("Last Wish", `${ Misc.AddCommas(registeredPlayerStats.lastWish.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.lastWish.rank) })*`, true);
              embed.addField("Scourge of the Past", `${ Misc.AddCommas(registeredPlayerStats.scourge.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.scourge.rank) })*`, true);
              embed.addField("Crown of Sorrows", `${ Misc.AddCommas(registeredPlayerStats.sorrows.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.sorrows.rank) })*`, true);
              embed.addField("Garden of Salvation", `${ Misc.AddCommas(registeredPlayerStats.garden.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.garden.rank) })*`, true);
              embed.addField("See more at", `https://guardianstats.com/profile/${ registeredUser.membershipID }`);
              break;
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription("The person you have @ has not registered. Get them to register\nThey can do this by using `~register`");
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription("In order to view your profile i need to know who you are. I cannot know without you registering first. Use: `~register`");
            break;
          }
        }
        case command.startsWith("profile -b"): case command.startsWith("profile -broadcasts"): {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              if(registeredPlayerBroadcasts.length > 0) {
                registeredPlayerBroadcasts.sort((a, b) => { return b.date - a.date }).slice(0, 15);
                embed.setAuthor(`Viewing Profile for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
                embed.setDescription("This only shows broadcasts whilst Marvin was tracking your clan. (Capped at 15 newest broadcasts)");
                embed.addField("Name", registeredPlayerBroadcasts.map(e => { return e.broadcast }), true);
                embed.addField("Date", registeredPlayerBroadcasts.map(e => { return `${ new Date(e.date).getDate() }-${ new Date(e.date).getMonth()+1 }-${ new Date(e.date).getFullYear() }` }), true);
                break;
              }
              else {
                embed.setAuthor("Uhh oh...");
                embed.setDescription("Could not find any broadcasts for your registered account. Have you obtained any since Marvin has started tracking your clan?");
                break;
              }
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription("The person you have @ has not registered. Get them to register\nThey can do this by using `~register`");
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription("In order to view your profile i need to know who you are. I cannot know without you registering first. Use: `~register`");
            break;
          }
        }
        default: {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              embed.setAuthor(`Viewing Profile for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
              embed.setDescription(`Ranks are based on all tracked clans for this server. (Rank / ${ leaderboardLength }) players!`);
              embed.addField("Name (SR)", `${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) } (${ registeredPlayerStats.seasonRank.data })`, true);
              embed.addField("Time Played", `${ Misc.AddCommas(Math.round(registeredPlayerStats.timePlayed.data/60)) } Hrs *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.timePlayed.rank) })*`, true);
              embed.addField("Last Played", `${ new Date(registeredPlayerStats.lastPlayed).getDate() }-${ new Date(registeredPlayerStats.lastPlayed).getMonth()+1 }-${ new Date(registeredPlayerStats.lastPlayed).getFullYear() }`, true);
              embed.addField("Valor", `${ Misc.AddCommas(registeredPlayerStats.valor.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.valor.rank) })*`, true);
              embed.addField("Glory", `${ Misc.AddCommas(registeredPlayerStats.glory.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.glory.rank) })*`, true);
              embed.addField("Infamy", `${ Misc.AddCommas(registeredPlayerStats.infamy.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.infamy.rank) })*`, true);
              embed.addField("Triumph Score", `${ Misc.AddCommas(registeredPlayerStats.triumphScore.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.triumphScore.rank) })*`, true);
              embed.addField("Raids", `${ Misc.AddCommas(registeredPlayerStats.totalRaids.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.totalRaids.rank) })*`, true);
              embed.addField("Titles", `${ Misc.AddCommas(registeredPlayerStats.titles.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.titles.rank) })*`, true);
              embed.addField("Highest Power", `${ Misc.AddCommas(registeredPlayerStats.highestPower.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.highestPower.rank) })*`, true);
              embed.addField("See more at", `https://guardianstats.com/profile/${ registeredUser.membershipID }`);
              break;
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription("The person you have @ has not registered. Get them to register\nThey can do this by using `~register`");
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription("In order to view your profile i need to know who you are. I cannot know without you registering first. Use: `~register`");
            break;
          }
        }
      }
      break;
    }
    case command.startsWith("trials profile"): {
      switch(true) {
        case command.startsWith("trials profile weekly"): {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              embed.setAuthor(`Viewing Weekly Trials Statistics for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
              embed.addField("Name", `${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`, true)
              embed.addField("Wins", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.wins)) }`, true)
              embed.addField("Flawless", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.flawlessTickets)) }`, true)
              embed.addField("Final Blows", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.finalBlows)) }`, true)
              embed.addField("Post Flawless Wins", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.postFlawlessWins)) }`, true)
              embed.addField("Carries", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.carries)) }`, true)
              break;
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription("The person you have @ has not registered. Get them to register\nThey can do this by using `~register`");
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription("In order to view your trials profile i need to know who you are. I cannot know without you registering first. Use: `~register`");
            break;
          }
        }
        case command.startsWith("trials profile seasonal"): {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              embed.setAuthor(`Viewing Seasonal Trials Statistics for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
              embed.addField("Name", `${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`, true)
              embed.addField("Wins", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.seasonal.wins)) }`, true)
              embed.addField("Flawless", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.seasonal.flawlessTickets)) }`, true)
              embed.addField("Final Blows", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.seasonal.finalBlows)) }`, true)
              embed.addField("Post Flawless Wins", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.seasonal.postFlawlessWins)) }`, true)
              embed.addField("Carries", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.seasonal.carries)) }`, true)
              break;
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription("The person you have @ has not registered. Get them to register\nThey can do this by using `~register`");
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription("In order to view your trials profile i need to know who you are. I cannot know without you registering first. Use: `~register`");
            break;
          }
        }
        case command.startsWith("trials profile overall"): {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              embed.setAuthor(`Viewing Overall Trials Statistics for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
              embed.addField("Name", `${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`, true)
              embed.addField("Wins", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.overall.wins)) }`, true)
              embed.addField("Flawless", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.overall.flawlessTickets)) }`, true)
              embed.addField("Final Blows", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.overall.finalBlows)) }`, true)
              embed.addField("Post Flawless Wins", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.overall.postFlawlessWins)) }`, true)
              embed.addField("Carries", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.overall.carries)) }`, true)
              break;
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription("The person you have @ has not registered. Get them to register\nThey can do this by using `~register`");
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription("In order to view your trials profile i need to know who you are. I cannot know without you registering first. Use: `~register`");
            break;
          }
        }
        default: {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              embed.setAuthor(`Viewing Weekly Trials Statistics for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
              embed.addField("Name", `${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`, true)
              embed.addField("Wins", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.wins)) }`, true)
              embed.addField("Flawless", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.flawlessTickets)) }`, true)
              embed.addField("Final Blows", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.finalBlows)) }`, true)
              embed.addField("Post Flawless Wins", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.postFlawlessWins)) }`, true)
              embed.addField("Carries", `${ Misc.AddCommas(Math.round(registeredPlayer.User.trials.weekly.carries)) }`, true)
              break;
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription("The person you have @ has not registered. Get them to register\nThey can do this by using `~register`");
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription("In order to view your trials profile i need to know who you are. I cannot know without you registering first. Use: `~register`");
            break;
          }
        }
      }
      break;
    }
  }
  
  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { console.log(err); }
  });
}

module.exports = { MessageHandler }