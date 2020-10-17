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
  }
}

async function GetLeaderboard(message, type, users) {
  let Players = [];
  let PrivatePlayers = [];
  let User = users.find(e => e.discordID === message.author.id);
  let Player;

  //Get players
  await new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { Players = data.filter(e => !e.isPrivate); PrivatePlayers = data.filter(e => e.isPrivate); } else { message.channel.send("Not found"); } }
    else { message.channel.send(data); }
    resolve(true);
  }));

  //Add registered user to players if not there already
  if(User) {
    await new Promise(resolve =>
      Database.findUserByID(User.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
        if(!isError) { if(isFound) { if(!Players.find(e => e.membershipID === User.membershipID)) { Players.push(data); } Player = data; } }
        resolve(true);
      })
    );
  }

  if(type === "valor") {
    var leaderboard = { "names": [], "valor": [], "resets": [] };
    Players.sort((a, b) => { return b.valor.current - a.valor.current; });
    top = Players.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.valor.push(Misc.AddCommas(top[i].valor.current));
      leaderboard.resets.push(~~(top[i].valor.current/2000));
    }

    if(Player) {
      var rank = Players.indexOf(Players.find(e => e.membershipID === Player.User.membershipID));
      leaderboard.names.push("", `${ rank+1 }: ${ Player.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.valor.push("", Misc.AddCommas(Player.User.valor.current));
      leaderboard.resets.push("", ~~(Player.User.valor.current/2000));
    }

    const embed = new Discord.MessageEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Seasonal Valor Rankings")
    .addField("Name", leaderboard.names, true)
    .addField("Valor", leaderboard.valor, true)
    .addField("Resets", leaderboard.resets, true)
    .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  if(type === "infamy") {
    var leaderboard = { "names": [], "infamy": [], "resets": [] };
    Players.sort((a, b) => { return b.infamy.current - a.infamy.current; });
    top = Players.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.infamy.push(Misc.AddCommas(top[i].infamy.current));
      leaderboard.resets.push(~~(top[i].infamy.current/15000));
    }

    if(Player) {
      var rank = Players.indexOf(Players.find(e => e.membershipID === Player.User.membershipID));
      leaderboard.names.push("", `${ rank+1 }: ${ Player.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.infamy.push("", Misc.AddCommas(Player.User.infamy.current));
      leaderboard.resets.push("", ~~(Player.User.infamy.current/15000));
    }

    const embed = new Discord.MessageEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Seasonal Infamy Rankings")
    .addField("Name", leaderboard.names, true)
    .addField("Infamy", leaderboard.infamy, true)
    .addField("Resets", leaderboard.resets, true)
    .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
  if(type === "glory") {
    var leaderboard = { "names": [], "glory": [] };
    Players.sort((a, b) => { return b.glory - a.glory; });
    top = Players.slice(0, 10);
    for(var i in top) {
      leaderboard.names.push(`${parseInt(i)+1}: ${ top[i].displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.glory.push(Misc.AddCommas(top[i].glory));
    }

    if(Player) {
      var rank = Players.indexOf(Players.find(e => e.membershipID === Player.User.membershipID));
      leaderboard.names.push("", `${ rank+1 }: ${ Player.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      leaderboard.glory.push("", Misc.AddCommas(Player.User.glory));
    }

    const embed = new Discord.MessageEmbed()
    .setColor(0x0099FF)
    .setAuthor("Top 10 Seasonal Glory Rankings")
    .addField("Name", leaderboard.names, true)
    .addField("Glory", leaderboard.glory, true)
    .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
    .setTimestamp()
    message.channel.send({embed});
  }
}

module.exports = { MessageHandler }