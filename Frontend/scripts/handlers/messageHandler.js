const Discord = require('discord.js');
const Database = require('../../../Shared/database');
const Misc = require('../../../Shared/misc');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');
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

    const args = message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift().toString().toLowerCase();

    console.log(command);
    if(["valor", "glory", "infamy"].includes(command)) { try { GetLeaderboard(message, command, users); } catch (err) { ErrorHandler("High", err); } }
    else if(["levi", "leviathan"].includes(command)) { try { GetLeaderboard(message, command, users); } catch (err) { ErrorHandler("High", err); } }
    else if(["eow", "eater of worlds"].includes(command)) { try { GetLeaderboard(message, command, users); } catch (err) { ErrorHandler("High", err); } }
    else if(["sos", "spire of stars"].includes(command)) { try { GetLeaderboard(message, command, users); } catch (err) { ErrorHandler("High", err); } }
    else if(["lw", "last wish"].includes(command)) { try { GetLeaderboard(message, command, users); } catch (err) { ErrorHandler("High", err); } }
    else if(["scourge", "scourge of the past"].includes(command)) { try { GetLeaderboard(message, command, users); } catch (err) { ErrorHandler("High", err); } }
    else if(["sorrows", "crown of sorrows"].includes(command)) { try { GetLeaderboard(message, command, users); } catch (err) { ErrorHandler("High", err); } }
    else if(["garden", "garden of salvation"].includes(command)) { try { GetLeaderboard(message, command, users); } catch (err) { ErrorHandler("High", err); } }
  }
}

async function GetLeaderboard(message, type, users) {
  let players = [];
  let privatePlayers = [];
  let registeredUser = users.find(e => e.discordID === message.author.id);
  let registeredPlayer;

  //Get players
  await new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); privatePlayers = data.filter(e => e.isPrivate); } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Add registered user to players if not there already
  if(registeredUser) {
    await new Promise(resolve =>
      Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
        if(!isError) { if(isFound) { if(!players.find(e => e.membershipID === registeredUser.membershipID)) { players.push(data); } registeredPlayer = data; } }
        resolve(true);
      })
    );
  }

  SendLeaderboard(message, type, players, privatePlayers, registeredUser, registeredPlayer);
}

function SendLeaderboard(message, type, players, privatePlayers, registeredUser, registeredPlayer) {
  let leaderboard = { names: [], first: [], second: [] }
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  switch(type) {
    //Pvp
    case "valor": {
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
      embed.setAuthor("Top 10 Seasonal Valor Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Valor", leaderboard.first, true);
      embed.addField("Resets", leaderboard.second, true);
      break;
    }
    case "infamy": {
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
      embed.setAuthor("Top 10 Seasonal Infamy Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Infamy", leaderboard.first, true);
      embed.addField("Resets", leaderboard.second, true);
      break;
    }
    case "glory": {
      let top = players.sort((a, b) => { return b.glory - a.glory }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.glory) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.glory) }`);
      }
      embed.setAuthor("Top 10 Seasonal Glory Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Glory", leaderboard.first, true);
      break;
    }
    
    //Raids
    case "levi": case "leviathan": {
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
      embed.setAuthor("Top 10 Leviathan Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Norm | Pres", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    case "eow": case "eater of worlds": {
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
      embed.setAuthor("Top 10 Eater of Worlds Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Norm | Pres", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    case "sos": case "spire of stars": {
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
      embed.setAuthor("Top 10 Spire of Stars Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Norm | Pres", leaderboard.first, true);
      embed.addField("Total", leaderboard.second, true);
      break;
    }
    case "lw": case "last wish": {
      let top = players.sort((a, b) => { return b.raids.lastWish - a.raids.lastWish }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.lastWish) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.lastWish) }`);
      }
      embed.setAuthor("Top 10 Last Wish Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case "scourge": case "scourge of the past": {
      let top = players.sort((a, b) => { return b.raids.scourge - a.raids.scourge }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.scourge) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.scourge) }`);
      }
      embed.setAuthor("Top 10 Scourge of the Past Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case "sorrows": case "crown of sorrows": {
      let top = players.sort((a, b) => { return b.raids.sorrows - a.raids.sorrows }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.sorrows) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.sorrows) }`);
      }
      embed.setAuthor("Top 10 Crown of Sorrows Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case "garden": case "garden of salvation": {
      let top = players.sort((a, b) => { return b.raids.garden - a.raids.garden }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.garden) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.garden) }`);
      }
      embed.setAuthor("Top 10 Garden of Salvation Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }

    //Items and Titles
    //Seasonal - seasonRank, maxPower
    //Dungeons - shatteredThrone, pitOfHeresy, prophecy
    //Others - triumphScore, totalTime, totalTitles, totalRaids

    default: {
      embed.setAuthor("Uhh oh...");
      embed.setDescription("So something went wrong and this command just didn't work. It dun broke. Please report using `~request`");
      break;
    }
  }

  message.channel.send({embed});
}

module.exports = { MessageHandler }