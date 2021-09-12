const fs = require('fs');
const Discord = require('discord.js');
const Canvas = require('canvas');
const Register = require('./registerHandler.js');
const ClanHandler = require('./clanHandler.js');
const BroadcastHandler = require('./broadcastsHandler.js');
const AnnouncementsHandler = require('./announcementsHandler');
const Database = require('../../../Shared/database');
const Misc = require('../../../Shared/misc');
const Log = require('../../../Shared/log');
const { dailyCycleInfo, weeklyCycleInfo } = require('../../../Shared/handlers/cycleHandler');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');
const ManifestHandler = require('../../../Shared/handlers/manifestHandler');
const RequestHandler = require('../../../Shared/handlers/requestHandler');
const Config = require('../../../Shared/configs/Config.json');
const DiscordConfig = require(`../../../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);
const Commands = require('./commands');

Object.byString = function(o, s) {
  s = s.replace(/\[(\w+)\]/g, '.$1');       // convert indexes to properties
  s = s.replace(/^\./, '');                 // strip a leading dot
  var a = s.split('.');
  for (var i = 0, n = a.length; i < n; ++i) {
    var k = a[i];
    if (k in o) {
      o = o[k];
    } else {
      return;
    }
  }
  return o;
}

function MessageHandler(client, message, guilds, users, APIDisabled, callback) {
  let related = true;
  if(message.guild) {
    var guild = guilds.find(e => e.guildID == message.guild.id);
    var prefix = guild ? guild.prefix : "~";
    if(message.guild.id === "110373943822540800" || message.guild.id === "264445053596991498") return;
    if(!message.guild.me.permissionsIn(message.channel.id).has('VIEW_CHANNEL')) return;
    if(!message.guild.me.permissionsIn(message.channel.id).has('SEND_MESSAGES')) return;
    if(!message.content.startsWith(prefix) || message.author.bot && message.author.id !== "159985870458322944") return;
    if(message.content.startsWith("~~")) return;

    const args = message.content.slice(prefix.length);
    const lowercased = args.toString().toLowerCase();
    const command = lowercased.replace(/[\u2018\u2019]/g, "'");
    let registeredUser = null;

    Log.SaveDiscordLog("Frontend", message);

    if(message.mentions.users.first()) {
      if(users.find(e => e.discordID === message.mentions.users.first().id)) { registeredUser = (users.find(e => e.discordID === message.mentions.users.first().id)) }
      else { registeredUser = "NoUser"; }
    }
    else { if(users.find(e => e.discordID === message.author.id)) { registeredUser = (users.find(e => e.discordID === message.author.id)) } }

    try {
      switch(true) {
        //Admin
        case message.author.id === "194972321168097280" && command.startsWith("del"): { DeleteMessages(message, command.substr("del ".length)); break; }
        case message.author.id === "194972321168097280" && command.startsWith("mban"): { AddBannedUser(message, command); break; }
        case message.author.id === "194972321168097280" && command.startsWith("munban"): { RemoveBannedUser(message, command); break; }
        case message.author.id === "194972321168097280" && command.startsWith("mchange"): { ChangeBannedUser(message, command); break; }
        case message.author.id === "194972321168097280" && command.startsWith("view mbans"): { ViewBans(message); break; }
        case message.author.id === "194972321168097280" && command.startsWith("scanspeed"): { GetScanSpeed(message); break; }
        case message.author.id === "194972321168097280" && command.startsWith("set scanspeed"): { SetScanSpeed(message, command); break; }
        case message.author.id === "194972321168097280" && command.startsWith("broadcast test"): { BroadcastHandler.sendItemBroadcast(client, guild, "Test", { hash: 1258579677 }, { clanName: "Test" }); break; }
        case message.author.id === "194972321168097280" && command.startsWith("force manifest update"): { ManifestHandler.updateManifest(false); message.channel.send("Manifest Update Forced"); break; }
        case message.author.id === "194972321168097280" && command.startsWith("test sector"): { AnnouncementsHandler.sendDailyLostSectorBroadcasts(client, guilds); break; }
        case message.author.id === "194972321168097280" && command === "force rescan": {
          Database.forceFullRescan(function ForceFullRescan(isError, severity, err) {
            if(isError) { ErrorHandler(severity, err); message.channel.send("Failed to force a full rescan."); }
            else { message.channel.send("Forced a full rescan."); }
          });
          break;
        }
        case (message.author.id === "194972321168097280" || message.author.id === "289210933501493258") && command === "verify manifest": { VerifyManifest(prefix, message, false); break; }

        //Help
        case command.startsWith("help"): { GetHelp(prefix, message, command); break; }
        case command === "rankings": { GetHelp(prefix, message, command); break; }
        case command === "dungeons": { GetHelp(prefix, message, command); break; }
        case command === "raids": { GetHelp(prefix, message, command); break; }
        case command === "items": { GetHelp(prefix, message, command); break; }
        case command === "titles": { GetHelp(prefix, message, command); break; }
        case command === "seasonal": { GetHelp(prefix, message, command); break; }
        case command === "globals": { GetHelp(prefix, message, command); break; }
        case command === "trials": { GetHelp(prefix, message, command); break; }
        case command === "clanwars": { GetHelp(prefix, message, command); break; }
        case command === "others": { GetHelp(prefix, message, command); break; }
        case command === "clan": { GetHelp(prefix, message, command); break; }
        case command === "broadcasts": { GetHelp(prefix, message, command); break; }
        case command === "announcements": { GetHelp(prefix, message, command); break; }
        case command === "drystreaks": { GetHelp(prefix, message, command); break; }
        
        //Management
        case command === "current season": case command === "season": case command === "next season": { GetSeason(message); break; }
        case command.startsWith("register"): { Register(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("request"): { Request(prefix, client, message, command); break; }
        case command.startsWith("set clan"): { ClanHandler.RegisterClan(prefix, message, command); break; }
        case command.startsWith("add clan"): { ClanHandler.AddClan(prefix, message, command); break; }
        case command.startsWith("remove clan"): { ClanHandler.RemoveClan(prefix, message, command); break; }
        case command.startsWith("tracked clans"): case command.startsWith("clans tracked"): case command.startsWith("clans"): { ClanHandler.GetTrackedClans(prefix, message, command); break; }
        case command.startsWith("set prefix"): { ChangePrefix(prefix, message, command, guild); break; }
        case command.startsWith("set broadcasts"): { ManageBroadcasts(prefix, message, "set", command, guild); break; }
        case command.startsWith("remove broadcasts"): { ManageBroadcasts(prefix, message, "remove", command, guild); break; }
        case command.startsWith("manage broadcasts"): { ManageBroadcasts(prefix, message, "manage", command, guild); break; }
        case command.startsWith("toggle item broadcasts"): { ManageBroadcasts(prefix, message, "toggle", command, guild); break; }
        case command.startsWith("toggle title broadcasts"): { ManageBroadcasts(prefix, message, "toggle", command, guild); break; }
        case command.startsWith("toggle clan broadcasts"): { ManageBroadcasts(prefix, message, "toggle", command, guild); break; }
        case command.startsWith("set announcements"): { ManageAnnouncements(prefix, message, "set", command, guild); break; }
        case command.startsWith("remove announcements"): { ManageAnnouncements(prefix, message, "remove", command, guild); break; }
        case command.startsWith("manage announcements"): { ManageAnnouncements(prefix, message, "manage", command, guild); break; }
        case command.startsWith("toggle update announcements"): { ManageAnnouncements(prefix, message, "toggle", command, guild); break; }
        case command.startsWith("toggle gunsmith announcements"): case command.startsWith("toggle gunsmiths announcements"): { ManageAnnouncements(prefix, message, "toggle", command, guild); break; }
        case command.startsWith("toggle ada announcements"): case command.startsWith("toggle adas announcements"):
        case command.startsWith("toggle ada1 announcements"): case command.startsWith("toggle ada-1 announcements"): { ManageAnnouncements(prefix, message, "toggle", command, guild); break; }
        case command.startsWith("toggle lost sector announcements"): case command.startsWith("toggle lostsector announcements"): 
        case command.startsWith("toggle lost sectors announcements"): case command.startsWith("toggle lostsectors announcements"): { ManageAnnouncements(prefix, message, "toggle", command, guild); break; }
        case command.startsWith("data "): { ItemInfo(prefix, message, command); break; }
        case command.startsWith("track "): { BroadcastHandler.enableItemBroadcast(prefix, message, command, guild); break; }
        case command.startsWith("untrack "): { BroadcastHandler.disableItemBroadcast(prefix, message, command, guild); break; }
        case command.startsWith("nuke"): { message.channel.send("https://tenor.com/view/nuke-press-the-button-bomb-them-nuke-them-cat-gif-16361990"); break; }
        case command === "claninfo": { ClanInfo(prefix, message, command, guild); break; }
        case command === "playing": case command === "activity": case command === "clan activity": { ClanActivity(prefix, message, command, guild); break; }
        case command === "tools": case command === "things": { Tools(client, message); break; }

        //Vendors
        case command.startsWith("gunsmith"): { DailyMods(guild, message, "Gunsmith"); break; }
        case command.startsWith("ada"): case command.startsWith("ada-1"): case command.startsWith("ada1"): { DailyMods(guild, message, "Ada-1"); break; }

        //Rankings
        case command.startsWith("clan wars"): { message.channel.send(`The command is used without a space: \`${ prefix }Clanwars\`. It's for stability issues sorry.`); break; }
        case command.startsWith("clanwars "): { GetClanWars(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("global ") && !command.startsWith("globals"): { GetGlobal(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("item "): { GetObtainedItems(prefix, message, command, "obtained", users, registeredUser); break; }
        case command.startsWith("!item "): { GetObtainedItems(prefix, message, command, "not", users, registeredUser); break; }
        case command.startsWith("title "): { GetObtainedTitles(prefix, message, command, "obtained", users, registeredUser); break; }
        case command.startsWith("!title "): { GetObtainedTitles(prefix, message, command, "not", users, registeredUser); break; }
        case command.startsWith("profile"): { GetProfile(prefix, message, command, "profile", users, registeredUser); break; }
        case command.startsWith("drystreak "): { GetDrystreak(prefix, message, command); break; }
        case command.startsWith("when "): { GetBroadcastDates(prefix, message, command); break; }
        case command.startsWith("titles total"): case command.startsWith("total titles"): {
          GetTitleLeaderboard(prefix, message, command, users, registeredUser);
          break;
        }

        //Trials
        case command.startsWith("trials profile"):
        case command.startsWith("trials profile weekly"):
        case command.startsWith("trials profile seasonal"):
        case command.startsWith("trials profile overall"): { GetProfile(prefix, message, command, "trials", users, registeredUser); break; }

        //Others
        case command.startsWith("donate"): case command.startsWith("sponsor"): case command.startsWith("support"): { Donate(client, message); break; }
        case command.startsWith("checkapi"): { if(APIDisabled) { message.reply("API is offline."); } else { message.reply("API is online."); } break; }
        case command.startsWith("geo"): case command.startsWith("regions"): { GetGeolocationalData(client, message); break; }
        case command.startsWith("legend"): { LostSectors(message, "legendLostSector"); break; }
        case command.startsWith("master"): { LostSectors(message, "masterLostSector"); break; }
        //case command.startsWith("grandmaster"): { GrandMaster(message); break; }

        //Check if leaderboard
        case Commands.filter(c => c.commands.find(cm => command.startsWith(cm)))[0] !== undefined: { GetLeaderboard(prefix, message, command, users, registeredUser); break; }

        //Default - Unknown commands
        default: { related = false; message.channel.send(`I\'m not sure what that commands is sorry. Use \`${ prefix }help\` to see commands.`).then(msg => { msg.delete({ timeout: 3000 }) }).catch(); break; }
      }
      callback(related);
    }
    catch (err) { ErrorHandler("High", err); message.channel.send("Uhh something went really wrong... Sorry about that."); }
  }
}
async function Donate(client, message) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  embed.setThumbnail(DiscordConfig.defaultLogoURL);
  embed.setAuthor("Want to help support future updates?");
  embed.setDescription(`By becoming a Patreon for $2.50 USD/month, Your clan will be scanned by a more powerful version of Marvin.\n\nThis means leaderboards and broadcasts will update anywhere from instant to ~60 seconds rather than the usual scan times between 5-10 minutes.`);
  embed.addField("Patreon <:patreon:779549421851377665>", "https://www.patreon.com/Terrii");
  embed.addField("Ko-fi <:kofi:779548939975131157>", "https://ko-fi.com/terrii_dev");
  embed.addField("Paypal <:paypal:779549835522080768>", "https://paypal.me/guardianstats");
  message.channel.send(embed);
}
async function Tools(client, message) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  embed.setThumbnail(DiscordConfig.defaultLogoURL);
  embed.setAuthor("Want more? Here is a list of other cool things!");
  embed.setDescription(`Go check out these other cool things and tools.`);
  embed.addField("DIM", "https://destinyitemmanager.com");
  embed.addField("Charlemagne", "https://warmind.io");
  embed.addField("Braytech", "https://braytech.org");
  embed.addField("Power Bars", "https://destiny-power-bars.corke.dev/");
  embed.addField("Light.gg", "https://light.gg");
  embed.addField("Reports", "https://raid.report\nhttps://trials.report\nhttps://crucible.report\nhttps://grandmaster.report\nhttps://dungeon.report");
  embed.addField("Collection of other tools", "https://cosmodrome.page/");
  message.channel.send(embed);
}
async function Request(prefix, client, message, command) {
  const request = command.substr("request ".length);
  if(request.length > 1) {
    const embed = new Discord.MessageEmbed()
    .setColor(0x0099FF)
    .setAuthor(`New Request by ${ message.author.username }#${ message.author.discriminator }, ID: ${ message.author.id }`)
    .setDescription(request)
    .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
    .setTimestamp()
    client.guilds.cache.get('664237007261925404').channels.cache.get('664238376219836416').send({embed});
    message.reply("Your request has been sent, Thank your for your valuable feedback! Feel free to join the discord if you'd like to keep up to date about the status of this request. https://marvin.gg/Discord");
  }
  else { message.reply(`Please add some context along with the request, something like: \`${prefix}request please add season rank tracking\``); }
}
function DeleteMessages(message, amount) {
  message.channel.bulkDelete(amount, true).catch(err => {
    if(err) {
      console.log(err);
      if(err.code === 50013) { message.channel.send('I do not have permission to delete messages in this channel.'); }
      else { message.channel.send('There was an error trying to prune messages in this channel!'); }
    }
  });
}
function AddBannedUser(message, command) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let id = command.substr(5, 18);
  let reason = command.substr(`mban ${ id } `.length);
  Database.addBannedUser({ discordID: id, reason: reason.length > 4 ? reason : "You have been banned." },
  (isError, severity, err) => {
    if(isError) {
      ErrorHandler(severity, err);
      embed.setColor(0x0099FF);
      embed.setAuthor("Failed");
      embed.setDescription(err);
      message.channel.send({embed});
    }
    else {
      embed.setColor(0x0099FF);
      embed.setAuthor("User has been banned!");
      embed.setDescription(`**User:** ${ id }\n**Reason:** ${ reason.length > 4 ? reason : "You have been banned." }`);
      message.channel.send({embed});
    }
  });
}
function RemoveBannedUser(message, command) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let id = command.substr(`munban `.length);
  Database.removeBannedUser(id, (isError, severity, err) => {
    if(isError) {
      ErrorHandler(severity, err);
      embed.setColor(0x0099FF);
      embed.setAuthor("Failed");
      embed.setDescription(err !== null ? err : "User was not found");
      message.channel.send({embed});
    }
    else {
      embed.setColor(0x0099FF);
      embed.setAuthor("User has been unbanned!");
      embed.setDescription(`**User:** ${ id }`);
      message.channel.send({embed});
    }
  });
}
function ChangeBannedUser(message, command) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let id = command.substr(8, 18);
  let reason = command.substr(`mchange ${ id } `.length);
  Database.updateBannerUserByID(id, { discordID: id, reason: reason.length > 4 ? reason : "You have been banned." },
  (isError, severity, err) => {
    if(isError) {
      ErrorHandler(severity, err);
      embed.setColor(0x0099FF);
      embed.setAuthor("Failed");
      embed.setDescription(err);
      message.channel.send({embed});
    }
    else {
      embed.setColor(0x0099FF);
      embed.setAuthor("Banned user has been updated!");
      embed.setDescription(`**User:** ${ id }\n**Reason:** ${ reason.length > 4 ? reason : "You have been banned." }`);
      message.channel.send({embed});
    }
  });
}
function ViewBans(message) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setAuthor("Here lies a list of banned users. Who no longer have access to Marvins features.").setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  Database.getAllBannedUsers((isError, isFound, data) => {
    if(!isError) {
      if(isFound) {
        embed.setDescription(data.map((user) => { return `**User:** ${ user.discordID }, **Reason:** ${ user.reason }` }));
        message.channel.send({embed});
      }
      else { message.channel.send("There were no banned users found."); }
    }
    else { ErrorHandler("Low", "Failed to grab banned users"); message.channel.send("Failed to get banned users from db."); }
  });
}
function GetGeolocationalData(client, message) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let Regions = [];
  for(let g in client.guilds.cache.array()) {
    var guild = client.guilds.cache.array()[g];
    //Group some up.
    if(guild.region.startsWith("us")) { guild.region = "US" }
    if(guild.region.startsWith("eu") || guild.region.startsWith("london")) { guild.region = "europe" }
    
    //Add them up
    if(!Regions.find(e => e.name === guild.region)) { Regions.push({ "name": guild.region, "amount": 1 }); }
    else { Regions[Regions.findIndex(e => e.name === guild.region)].amount++ }
  }
  Regions.sort(function(a, b) { return b.amount - a.amount; });
  embed.setAuthor("Servers based on Region.")
  embed.setDescription(`**Total Servers: **${ client.guilds.cache.array().length }\n`)
  embed.addField("Region", Regions.map((region) => { return Misc.capitalize(region.name) }), true)
  embed.addField("Amount", Regions.map((region) => { return region.amount }), true)
  embed.addField("Percent", Regions.map((region) => { return `${ ((region.amount / client.guilds.cache.array().length) * 100).toFixed(2) }%` }), true)
  message.channel.send({embed});
}
function GetScanSpeed(message) {
  var backend_status = JSON.parse(fs.readFileSync('../Backend/data/backend_status.json').toString());
  message.channel.send(`ScanSpeed is scanning at a rate of ${ backend_status.scanSpeed } clans per second. With a slow down rate of ${ Math.round(backend_status.scanSpeed * 0.8) } and a reset of ${ Math.round(backend_status.scanSpeed * 0.6) }`);
}
function SetScanSpeed(message, command) {
  let speed = command.substr(`set scanspeed `.length);
  var backend_status = JSON.parse(fs.readFileSync('../Backend/data/backend_status.json').toString());
  backend_status.scanSpeed = parseInt(speed);
  fs.writeFile('../Backend/data/backend_status.json', JSON.stringify(backend_status), (err) => { if (err) console.error(err) });
  message.channel.send(`ScanSpeed is now scanning at a rate of ${ speed } clans per second. With a slow down rate of ${ Math.round(speed * 0.8) } and a reset of ${ Math.round(speed * 0.6) }`);
}
function GetSeason(message) {
  var config = JSON.parse(fs.readFileSync('../Shared/configs/Config.json').toString());
  message.channel.send(`Destiny 2 is currently in season ${ config.currentSeason }. Season ${ config.currentSeason+1 } starts in: ${ Misc.formatTime("big", (new Date(config.newSeasonDate) - new Date().getTime()) / 1000) }`);
}
function ChangePrefix(prefix, message, command, guild) {
  let newPrefix = command.substr("set prefix ".length);
  if(newPrefix.length > 0 && newPrefix !== " ") {
    if(guild) {
      if(guild.ownerID === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
        guild.prefix = newPrefix;
        Database.updateGuildByID(message.guild.id, { prefix: newPrefix },
          function updateGuildByID(isError, severity, err) {
            if(isError) { ErrorHandler(severity, err); message.channel.send(`There was an error trying to update the prefix. Please try again.`); }
            else {
              message.channel.send(`Too easy. Marvin will only react to your new prefix \`${newPrefix}\`, Example: \`${newPrefix}help\`.`);
              Log.SaveLog("Frontend", "Info", `Prefix for ${message.guild.id} was changed from ${prefix} to ${newPrefix}`);
            }
          }
        );
      }
    }
    else {
      if(message.member.hasPermission("ADMINISTRATOR")) {
        Database.addGuild({ guildID: message.guild.id, guildName: message.guild.name, ownerID: message.author.id, ownerAvatar: message.author.avatar, region: message.guild.region, prefix: newPrefix },
          function addGuild(isError, severity, err) {
            if(isError) { ErrorHandler(severity, err); message.channel.send(`There was an error trying to update the prefix. Please try again.`); }
            else {
              message.channel.send(`Too easy. In a few seconds Marvin will only react to the prefix \`${newPrefix}\`, Example: \`${newPrefix}help\``);
              Log.SaveLog("Frontend", "Info", `Prefix for ${message.guild.id} was changed from ${prefix} to ${newPrefix}`);
            }
          }
        );
      }
    }
  }
  else { message.channel.send(`In order to change the prefix use the command like this: \`${ prefix }set prefix {value}\`. Example: \`${ prefix }set prefix ~\``); }
}
function ManageBroadcasts(prefix, message, type, command, guild) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp().setAuthor(`Broadcasts Manager`);

  if(guild.ownerID === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
    switch(type) {
      case "set": {
        if(message.mentions.channels.first()) {
          if(guild) {
            Database.updateGuildByID(message.guild.id, { "broadcasts.channel": message.mentions.channels.first().id },
              function updateGuildByID(isError, severity, err) {
                if(isError) { ErrorHandler(severity, err); embed.setDescription(`There was an error trying to update the broadcasts channel. Please try again.`); }
                else {
                  guild.broadcasts.channel = message.guild.id;
                  embed.setDescription(`Successfully set <#${ message.mentions.channels.first().id }> as the broadcasts channel!`);
                  Log.SaveLog("Frontend", "Info", `${ message.guild.id } has set a broadcasts channel: ${ message.mentions.channels.first().id }`);
                }
                message.channel.send({embed});
              }
            );
          }
          else { embed.setDescription(`There are no clans tracked by this server, so i cannot set a broadcasts channel yet. Use: \`${ prefix }set clan\` first.`); message.channel.send({embed}); }
        }
        else { embed.setDescription(`In order to set the broadcasts channel use the command like this: \`${ prefix }set broadcasts {channelname}\`. Example: \`${ prefix }set broadcasts #general\``); message.channel.send({embed}); } 
        break;
      }
      case "remove": {
        if(guild) {
          Database.updateGuildByID(message.guild.id, { "broadcasts.channel": "0" },
            function updateGuildByID(isError, severity, err) {
              if(isError) { ErrorHandler(severity, err); embed.setDescription(`There was an error trying to update the broadcasts channel. Please try again.`); }
              else {
                guild.broadcasts.channel = "0";
                embed.setDescription(`Successfully removed the broadcasts channel!`);
                Log.SaveLog("Frontend", "Info", `${ message.guild.id } has removed the broadcasts channel.`);
              }
              message.channel.send({embed});
            }
          );
        }
        else { embed.setDescription(`There are no clans tracked by this server, so i cannot remove a broadcasts channel yet. So no need to use this command.`); message.channel.send({embed}); }
        break;
      }
      case "toggle": {
        if(guild) {
          let toggle = command.split('toggle ').pop().split(' broadcasts')[0];
          console.log(toggle);
          guild.broadcasts[`${ toggle }s`] = !guild.broadcasts[`${ toggle }s`];
          Database.updateGuildByID(message.guild.id, { broadcasts: guild.broadcasts }, function updateGuildByID(isError, severity, err) {
            if(isError) { ErrorHandler(severity, err); embed.setDescription(`There was an error trying to toggle broadcasts. Please try again.`); }
            else {
              if(guild.broadcasts[`${ toggle }s`]) {
                embed.setDescription(`Successfully enabled ${ toggle } broadcasts!`);
                Log.SaveLog("Frontend", "Info", `${ message.guild.id } has enabled ${ toggle } broadcasts.`);
              }
              else {
                embed.setDescription(`Successfully disabled ${ toggle } broadcasts!`);
                Log.SaveLog("Frontend", "Info", `${ message.guild.id } has disabled ${ toggle } broadcasts.`);
              }
              message.channel.send({embed});
            }
          });
        }
        else { embed.setDescription(`There are no clans tracked by this server, so i cannot remove a broadcasts channel yet. So no need to use this command.`); message.channel.send({embed}); }
        break;
      }
      case "manage": {
        if(guild.broadcasts.channel === "0") { embed.setDescription(`Broadcasts are currently disabled for this guild. If you would like to enable them please use: \`${prefix}Set Broadcasts #example\`.\nReplace example with whichever channel you would like to have the broadcasts be announced into.`); }
        else { embed.setDescription(`Broadcasts Channel: <#${ guild.broadcasts.channel }>\nBroadcasts Mode: **${ guild.broadcasts.mode }**\n\nItem Broadcasts: **${ guild.broadcasts.items ? "Enabled" : "Disabled" }**\nTitle Broadcasts: **${ guild.broadcasts.titles ? "Enabled" : "Disabled" }**\nClan Broadcasts: **${ guild.broadcasts.clans ? "Enabled" : "Disabled" }**\n\nTo edit these options please see: \n\`${prefix}help broadcasts\``); }
        message.channel.send({embed});
        break;
      }
      default: { GetHelp(prefix, message, "broadcasts"); break; }
    }
  }
  else { embed.setDescription(`Only discord administrators or the one who linked this server to the clan edit the clan.`); message.channel.send({embed}); }
}
function ManageAnnouncements(prefix, message, type, command, guild) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp().setAuthor(`Announcements Manager`);

  if(guild.ownerID === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
    switch(type) {
      case "set": {
        if(message.mentions.channels.first()) {
          if(guild) {
            Database.updateGuildByID(message.guild.id, { "announcements.channel": message.mentions.channels.first().id },
              function updateGuildByID(isError, severity, err) {
                if(isError) { ErrorHandler(severity, err); embed.setDescription(`There was an error trying to update the announcements channel. Please try again.`); }
                else {
                  guild.announcements.channel = message.guild.id;
                  embed.setDescription(`Successfully set <#${ message.mentions.channels.first().id }> as the announcements channel!`);
                  Log.SaveLog("Frontend", "Info", `${ message.guild.id } has set a announcements channel: ${ message.mentions.channels.first().id }`);
                }
                message.channel.send({embed});
              }
            );
          }
          else { embed.setDescription(`There are no clans tracked by this server, so i cannot set a announcements channel yet. Use: \`${ prefix }set clan\` first.`); message.channel.send({embed}); }
        }
        else { embed.setDescription(`In order to set the announcements channel use the command like this: \`${ prefix }set announcements {channelname}\`. Example: \`${ prefix }set announcements #general\``); message.channel.send({embed}); } 
        break;
      }
      case "remove": {
        if(guild) {
          Database.updateGuildByID(message.guild.id, { "announcements.channel": "0" },
            function updateGuildByID(isError, severity, err) {
              if(isError) { ErrorHandler(severity, err); embed.setDescription(`There was an error trying to update the announcements channel. Please try again.`); }
              else {
                guild.announcements.channel = "0";
                embed.setDescription(`Successfully removed the announcements channel!`);
                Log.SaveLog("Frontend", "Info", `${ message.guild.id } has removed the announcements channel.`);
              }
              message.channel.send({embed});
            }
          );
        }
        else { embed.setDescription(`There are no clans tracked by this server, so i cannot remove a announcements channel yet. So no need to use this command.`); message.channel.send({embed}); }
        break;
      }
      case "toggle": {
        if(guild) {
          let toggle = command.split('toggle ').pop().split(' announcements')[0];
          if(toggle === "lost sectors" || toggle === "lostsectors" || toggle === "lost sector" || toggle === "lostsector") { toggle = "lostSector" }
          else if(toggle === "ada" || toggle === "adas" || toggle === "ada1" || toggle === "ada-1") { toggle = "ada" }
          else if(toggle === "gunsmiths" || toggle === "gunsmith") { toggle = "gunsmith" }
          guild.announcements[`${ toggle }s`] = !guild.announcements[`${ toggle }s`];
          Database.updateGuildByID(message.guild.id, { announcements: guild.announcements }, function updateGuildByID(isError, severity, err) {
            if(isError) { ErrorHandler(severity, err); embed.setDescription(`There was an error trying to toggle announcements. Please try again.`); }
            else {
              if(guild.announcements[`${ toggle }s`]) {
                embed.setDescription(`Successfully enabled ${ toggle } announcements!`);
                Log.SaveLog("Frontend", "Info", `${ message.guild.id } has enabled ${ toggle } announcements.`);
              }
              else {
                embed.setDescription(`Successfully disabled ${ toggle } announcements!`);
                Log.SaveLog("Frontend", "Info", `${ message.guild.id } has disabled ${ toggle } announcements.`);
              }
              message.channel.send({embed});
            }
          });
        }
        else { embed.setDescription(`There are no clans tracked by this server, so i cannot remove a announcements channel yet. So no need to use this command.`); message.channel.send({embed}); }
        break;
      }
      case "manage": {
        if(guild.announcements.channel === "0") { embed.setDescription(`Announcements are currently disabled for this guild. If you would like to enable them please use: \`${prefix}Set Announcements #example\`.\nReplace example with whichever channel you would like to have the announcements be announced into.`); }
        else { embed.setDescription(`Announcements Channel: <#${ guild.announcements.channel }>\n\nUpdate Announcements: **${ guild.announcements.updates ? "Enabled" : "Disabled" }**\nGunsmiths Mod Announcements: **${ guild.announcements.gunsmiths ? "Enabled" : "Disabled" }**\nAda-1 Mod Announcements: **${ guild.announcements.adas ? "Enabled" : "Disabled" }**\nLost Sector Announcements: **${ guild.announcements.lostSectors ? "Enabled" : "Disabled" }**\n\nTo edit these options please see: \n\`${prefix}help announcements\``); }
        message.channel.send({embed});
        break;
      }
      default: { GetHelp(prefix, message, "announcements"); break; }
    }
  }
  else { embed.setDescription(`Only discord administrators or the one who linked this server to the clan edit the clan.`); message.channel.send({embed}); }
}
async function ClanInfo(prefix, message, command, guild) {
  let clanData = [];
  for(let i in guild.clans) {
    await new Promise(resolve =>
      Database.findClanByID(guild.clans[i], function(isError, isFound, clan) {
        if(!isError) {
          if(isFound) { clanData.push({ clanID: guild.clans[i], isError: false, isFound: true, data: clan }); }
          else { clanData.push({ clanID: guild.clans[i], isError: false, isFound: false, data: null }); }
        }
        else { clanData.push({ clanID: guild.clans[i], isError: true, isFound: false, data: null }); }
        resolve(true);
      })
    );
  }
  for(let i in clanData) {
    if(!clanData[i].isError) {
      if(clanData[i].isFound) {
        let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
        embed.setAuthor(`${ clanData[i].data.clanName } (${ clanData[i].data.clanID })`);
        embed.setDescription(`We have been tracking this clan for: ${ Misc.formatTime("big", (new Date() - clanData[i].data.joinedOn) / 1000) }.\nThe last time we scanned this clan was: ${ Misc.formatTime("small", (new Date() - clanData[i].data.lastScan) / 1000) } ago.`);
        embed.addField("Clan Level", clanData[i].data.clanLevel, true);
        embed.addField("Members", `${ clanData[i].data.memberCount } / 100`, true);
        embed.addField("Online", `${ clanData[i].data.onlineMembers }`, true);
        message.channel.send({embed});
      }
      else { embed.setDescription(`Failed to find clan information possibly due to clan no longer existing or have not finished scanning it yet. Clan ID: (${ clanData[i].clanID })`); message.channel.send({embed}); }
    }
    else { embed.setDescription(`Failed to find information on clan due to an error, please try again. Clan ID: (${ clanData[i].clanID })`); message.channel.send({embed}); }
  }
}
async function ItemInfo(prefix, message, command) {
  //Get item
  let msg = await message.channel.send(new Discord.MessageEmbed().setColor(0x0099FF).setAuthor("Please wait...").setDescription("Looking through the manifest for the specified item...").setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp());
  let requestedItemName = command.substr("data ".length);
  let item;
  if(isNaN(requestedItemName)) { item = ManifestHandler.getManifestItemByName(requestedItemName); }
  else {
    item = ManifestHandler.getManifestItemByHash(requestedItemName);
    if(!item) { item = ManifestHandler.getManifestItemByCollectibleHash(requestedItemName); }
  }

  //See if an item was found
  if(item) {
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

    embed.setAuthor(`${ item.displayProperties.name }`, null, `https://www.light.gg/db/items/${ item.hash }`);
    if(item.flavorText) { embed.setDescription(`${ item.flavorText }${ item.collectibleHash ? `\n\nTo enable server broadcasts for this item use: \`${prefix}track ${ item.hash }\`` : "" }`); }
    else { embed.setDescription(`There is no description for this item.${ item.collectibleHash ? `\n\nTo enable server broadcasts for this item use: \`${prefix}track ${ item.hash }\`` : "" }`); }
    embed.addField(`Item Hash`, item.hash ? item.hash : "None", true);
    embed.addField(`Collectible Hash`, item.collectibleHash ? item.collectibleHash : "None", true);
    embed.addField(`Trackable`, item.collectibleHash ? "Yes" : "No", true);
    embed.setThumbnail(`https://bungie.net${ item.displayProperties.icon }`);
    if(item.hash) { embed.setURL(`https://www.light.gg/db/items/${ item.hash }`); }
    if(item.screenshot) { embed.setImage(`https://bungie.net${ item.screenshot }`); }

    msg.edit(embed);
  }
  else {
    let errorEmbed = new Discord.MessageEmbed().setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    errorEmbed.setAuthor("Uhh oh...");
    errorEmbed.setDescription(`Could not find the item requested. Sorry!`);
    msg.edit(errorEmbed);
  }
}
async function DailyMods(guild, message, vendor) {
  var prefix = guild?.prefix ? guild?.prefix : "~";
  var embed = new Discord.MessageEmbed().setColor(0x0099FF).setAuthor(`Vendor - ${ vendor } - Daily Mods`).setFooter("Data provided by Braytech", "https://braytech.org/static/images/icons/icon-96.png").setTimestamp();

  function GetDailyMods() {
    function FormatText(string) {
      let name = string;
      if(string.split(" ").length > 3) {
        name = string.split(" ")[0] + " " + string.split(" ")[1] + " " + string.split(" ")[2] + "\n" + string.substr((string.split(" ")[0] + " " + string.split(" ")[1] + " " + string.split(" ")[2]).length, string.length);
      }
      return name;
    }
    function FormatHeight(string, defaultHeight) {
      let height = defaultHeight;
      if(string.split(" ").length > 3) { height = 130; }
      return height;
    }
    Database.getDailyMods(vendor, async function(isError, isFound, data) {    
      if(!isError && isFound) {
        //Canvasing the mod images
        const canvas = Canvas.createCanvas(500, 210);
        const ctx = canvas.getContext('2d');
    
        const background = await Canvas.loadImage(`./images/${ vendor }.png`);
        const mod1Image = await Canvas.loadImage(`https://bungie.net${ data.mods[0].icon }`);
        const mod2Image = await Canvas.loadImage(`https://bungie.net${ data.mods[1].icon }`);
    
        //Add Images
        ctx.drawImage(background, 0, 0, 500, 210);
        ctx.drawImage(mod1Image, (canvas.width / 2) - 20, 30, 64, 64);
        ctx.drawImage(mod2Image, (canvas.width / 2) - 20, 114, 64, 64);

        //Add Text Backgrounds
        ctx.beginPath();
        ctx.globalAlpha = 0.2;
        ctx.rect((canvas.width / 2) - 25, 25, (canvas.width / 2) + 10, 74);
        ctx.fill(0,0,0);
        ctx.globalAlpha = 0.2;
        ctx.rect((canvas.width / 2) - 25, 109, (canvas.width / 2) + 10, 74);
        ctx.fill(0,0,0);
        ctx.stroke();
    
        //Add Text
        ctx.globalAlpha = 1;
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(FormatText(data.mods[0].name), (canvas.width / 2) + 54, 60);
        ctx.fillText(FormatText(data.mods[1].name), (canvas.width / 2) + 54, 150);
    
        //Add Image to Embed
        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'mods.png');
        embed.attachFiles([attachment]);
        embed.setImage('attachment://mods.png');
        embed.setDescription(`To see who needs these mods use: \n\`${ prefix }!item ${ data.mods[0].name }\`\n\`${ prefix }!item ${ data.mods[1].name }\``);

        message.channel.send(embed);
      }
      else {
        let errorEmbed = new Discord.MessageEmbed().setAuthor("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
        errorEmbed.setDescription(`So something went wrong and this command just didn't work. Please report using \`${prefix}request\``);
        message.channel.send(errorEmbed);
      }
    });
  }

  GetDailyMods();
}
async function LostSectors(message, type) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  const lostSector = dailyCycleInfo(type);
  let sector = ManifestHandler.getManifest().DestinyActivityDefinition[lostSector.sector[type === "masterLostSector" ? "masterHash" : "legendHash"]];
  if(type === "masterLostSector") { sector.displayProperties.name = sector.displayProperties.name.replace("Legend", "Master") }
  
  //process description from lost sector
  let description = sector.displayProperties.description.match(/[^\r\n]+/g);
  let formattedDesc = description.map(e => { let arr = e.split(": "); return { key: arr[0], value: arr[1] } });
  let filteredDesc = formattedDesc.splice(1, formattedDesc.length-1);

  //Canvasing the mod images
  const canvas = Canvas.createCanvas(640, 360);
  const ctx = canvas.getContext('2d');

  //Add Background Image
  ctx.drawImage(await Canvas.loadImage(`https://bungie.net${ sector.pgcrImage }`), 0, 0, 640, 360);

  //Add Image to Embed
  const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'lostSector.png');
  embed.attachFiles([attachment]);
  embed.setImage('attachment://lostSector.png');

  embed.setAuthor(`${ sector.displayProperties.name } - ${ lostSector.sector.planet } (${ lostSector.loot.type })`);
  embed.setDescription(`${ formattedDesc[0].value }\n ${ filteredDesc.map(e => `**${ e.key }**: ${ e.value }\n`).join('') }`);

  message.channel.send(embed);
}
async function GrandMaster(message) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  const grandMaster = weeklyCycleInfo("grandMaster");
  const grandMasterActivity = ManifestHandler.getManifest().DestinyActivityDefinition[grandMaster.activityHash];
  const grandMasterMods = grandMasterActivity.modifiers.filter((e) => [3933343183,605585258,882588556].includes(e.activityModifierHash)).map((mod) => { return (ManifestHandler.getManifest().DestinyActivityModifierDefinition[mod.activityModifierHash]).displayProperties.name });

  //Canvasing the mod images
  const canvas = Canvas.createCanvas(640, 360);
  const ctx = canvas.getContext('2d');

  //Add Background Image
  ctx.drawImage(await Canvas.loadImage(`https://bungie.net${ grandMasterActivity.pgcrImage }`), 0, 0, 640, 360);

  //Add Image to Embed
  const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'grandMaster.png');
  embed.attachFiles([attachment]);
  embed.setImage('attachment://grandMaster.png');

  embed.setAuthor(`${ grandMasterActivity.displayProperties.name }`);
  embed.setDescription(grandMasterMods);

  message.channel.send(embed);
}
async function ClanActivity(prefix, message, command, guild) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  //Get players
  Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        let players = data.filter(e => !e.isPrivate);
        let activities = { names: [], first: [], second: [] }

        //Filter users who have an activityHash of 0 and have not played in the last 15 minutes.
        players = players.filter(e => e.lastActivity.currentActivityHash !== 0 && (new Date() - new Date(e.lastActivity.dateActivityStarted)) < (1000 * 60 * 60));
        players = players.sort((a, b) => { return b.lastActivity.dateActivityStarted - a.lastActivity.dateActivityStarted });

        //Check if anyone is online first
        if(players[0]) {
          activities.names = players.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
          activities.first = players.map((e, index) => {
            let activity = ManifestHandler.getManifest().DestinyActivityDefinition[e.lastActivity.currentActivityHash];
            return `${ e.lastActivity.currentActivityHash !== 82913930 ? (activity ? activity?.displayProperties?.name : "Unknown") : "Orbit" }`
          });
          activities.second = players.map((e, index) => { return `${ Misc.formatTime("small", (new Date() - new Date(e.lastActivity.dateActivityStarted)) / 1000) } ago` });

          embed.setAuthor("Servers Destiny 2 Activity");
          embed.setDescription(`This information was last updated: ${ Misc.formatTime("small", (new Date() - new Date(players[0].lastUpdated)) / 1000) } ago\nTo get quicker scans consider \`${prefix}supporting\``);
          embed.addField("Name", activities.names, true);
          embed.addField("Activity", activities.first, true);
          embed.addField("Last Seen", activities.second, true);
        }
        else {
          embed.setAuthor("Servers Destiny 2 Activity");
          embed.setDescription(`Nobody has been online in the last hour, so i got nothing.`);
        }
      }
      else {
        embed.setAuthor("Uhh oh...");
        embed.setDescription(`Failed to find any users for the clans tracked by this guild. Potentially due to it not having scanned them yet? Have you waited 5 minutes?`);
      }
    }
    else {
      embed.setAuthor("Uhh oh...");
      embed.setDescription(`So something went wrong and this command just didn't work. It dun broke. Please report using \`${prefix}request\``);
    }

    message.channel.send({embed}).catch(err => {
      if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
      else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
    });
  });
}
async function VerifyManifest(prefix, message, retried) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  ManifestHandler.verifyManifest((verification) => {
    let passedChecks = verification.filter(e => !e.passed).length > 0 ? false : true;
    embed.setAuthor(`Manifest Validation - ${ ManifestHandler.getManifestVersion() }`);
    embed.setDescription(`I've checked the Manifest for errors or issues, Here is the result.`);
    embed.addField("Manifest Component", verification.map(e => e.component), true);
    embed.addField("Status", verification.map(e => e.passed ? "Passed":"Failed"), true);
    embed.addField("Outcome", passedChecks ? "Passed all checks, Manifest is working as intended." : "Failed one or more checks, Fixing manifest now, re-validating in 30 seconds.");
    
    //Send validation check repsonse
    message.channel.send(embed);

    //Check if it passed all checks
    if(!passedChecks) {
      if(!retried) {
        ManifestHandler.updateManifest(false);
        message.channel.send("Manifest Update Forced");
  
        setTimeout(() => { VerifyManifest(prefix, message, true); }, 30000);
      }
      else {
        message.channel.send("Failed to restore Manifest after automatic repair attempt. Please contact @Terrii");
      }
    }
  });
}

async function GetHelp(prefix, message, command) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  switch(command) {
    case "help rankings": case "rankings": {
      embed.setAuthor("Rankings Help Menu");
      embed.setDescription(`Here is a list of ranking commands! Example: \`${prefix}Iron Banner\``);
      embed.addField("Commands", `\`${prefix}Valor\`\n\`${prefix}Glory\`\n\`${prefix}Infamy\`\n\`${prefix}Iron Banner\`\n\`${prefix}Max Power\`\n\`${prefix}Triumph Score\`\n\`${prefix}Triumph Score -legacy\`\n\`${prefix}Triumph Score -lifetime\`\n\`${prefix}Time Played\`\n\`${prefix}Season Rank\`\n\`${prefix}Empire Hunts\`\n\`${prefix}Presage\`\n\`${prefix}Master Presage\``);
      break;
    }
    case "help dungeons": case "dungeons": {
      embed.setAuthor("Dungeons Help Menu");
      embed.setDescription(`Here is a list of dungeon commands! Example: \`${prefix}Pit of Heresy\``);
      embed.addField("Commands", `\`${prefix}Shattered Throne\`\n\`${prefix}Pit of Heresy\`\n\`${prefix}Prophecy\``);
      break;
    }
    case "help raids": case "raids": {
      embed.setAuthor("Raids Help Menu");
      embed.setDescription(`Here is a list of raid commands! Example: \`${prefix}LW\``);
      embed.addField("Commands", `\`${prefix}Levi\`\n\`${prefix}EoW\`\n\`${prefix}SoS\`\n\`${prefix}LW\`\n\`${prefix}SoTP\`\n\`${prefix}CoS\`\n\`${prefix}GoS\`\n\`${prefix}DSC\``);
      break;
    }
    case "help items": case "items": {
      embed.setAuthor("Items Help Menu");
      embed.setDescription(`The way to use the item command has recently changed. You can now use it on any profile collectible that Destiny tracks for example:\n\`${prefix}item One Thousand Voices\` or to see who is missing the item use: \n\`${prefix}!item Anarchy\`.\n\nIf you are more versed in the API feel free to use hashes. The item command accepts itemHash or collectibleHash. \`${prefix}item 123456\` \n\nIt's a little funky as things are split between profile collectibles and character collectibles. It's alot of data and i only store profile collectibles so not all armors will work unfortunately.`);
      break;
    }
    case "help titles": case "titles": {
      embed.setAuthor("Titles Help Menu");
      embed.setDescription(`The way to use the title command has recently changed. You can now use it on any title that Destiny tracks for example:\n\`${prefix}title Rivensbane\` or to see who is missing the title use: \n\`${prefix}!title Chronicler\`.\n\nIf you are more versed in the API feel free to use hashes. The title command accepts the completion record hash for the title. \`${prefix}title 123456\``);
      break;
    }
    case "help seasonal": case "seasonal": {
      embed.setAuthor("Seasonal Help Menu");
      embed.setDescription(`Here is a list of seasonal commands! Example: \`${prefix}Season Rank\``);
      embed.addField("Commands", `\`${prefix}Season Rank\`\n\`${prefix}Max Power\``);
      break;
    }
    case "help clan": case "clan": {
      embed.setAuthor("Clans Help Menu");
      embed.setDescription(`Here is a list of clan commands! Example: \`${prefix}Set Clan\``);
      embed.addField("Commands", `\`${prefix}Tracked Clans\`\n\`${prefix}Set Clan\`\n\`${prefix}Add Clan\`\n\`${prefix}Remove Clan\``);
      break;
    }
    case "help broadcasts": case "broadcasts": { GetBroadcastItems(prefix, message, command); break; }
    case "help announcements": case "announcements": {
      embed.setAuthor("Globals Help Menu");
      embed.setDescription(`Here is a list of announcements commands! Example: \`${prefix}Set announcements #channel\``);
      embed.addField("Commands", `\`${prefix}Set announcements #channel\`\n\`${prefix}Remove announcements\`\n\`${prefix}Manage announcements\`\n\`${prefix}Toggle update announcements\`\n\`${prefix}Toggle gunsmith announcements\`\n\`${prefix}Toggle ada announcements\`\n\`${prefix}Toggle lost sector announcements\``); 
      break;
    }
    case "help globals": case "globals": {
      embed.setAuthor("Globals Help Menu");
      embed.setDescription(`Here is a list of global commands! Example: \`${prefix}Global Time Played\``);
      embed.addField("Commands", `\`${prefix}Global Time Played\`\n\`${prefix}Global Season Rank\`\n\`${prefix}Global Triumph Score\`\n\`${prefix}Global Valor\`\n\`${prefix}Global Infamy\`\n\`${prefix}Global Levi\`\n\`${prefix}Global EoW\`\n\`${prefix}Global SoS\`\n\`${prefix}Global Last Wish\`\n\`${prefix}Global Scourge\`\n\`${prefix}Global Sorrows\`\n\`${prefix}Global Garden\`\n\`${prefix}Global Total Raids\`\n\`${prefix}Global Power\``); 
      break;
    }
    case "help trials": case "trials": {
      embed.setAuthor("Trials Help Menu");
      embed.setDescription(`Here is a list of trials commands! Profile commands can be altered by @ing the person you wish to view: \`${prefix}Trials Profile @Someone\``);
      embed.addField("Profile Commands", `\`${prefix}Trials Profile\`, \`${prefix}Trials Profile Weekly\`, \`${prefix}Trials Profile Seasonal\`, \`${prefix}Trials Profile Overall\``);
      embed.addField("Weekly Rankings", `\`${prefix}Trials Wins\`, \`${prefix}Trials Flawless\`, \`${prefix}Trials Final Blows\`, \`${prefix}Trials Post Wins\`, \`${prefix}Trials Carries\``);
      embed.addField("Seasonal Rankings", `\`${prefix}Trials Seasonal Wins\`, \`${prefix}Trials Seasonal Flawless\`, \`${prefix}Trials Seasonal Final Blows\`, \`${prefix}Trials Seasonal Post Wins\`, \`${prefix}Trials Seasonal Carries\``);
      embed.addField("Overall Rankings", `\`${prefix}Trials Overall Wins\`, \`${prefix}Trials Overall Flawless\`, \`${prefix}Trials Overall Final Blows\`, \`${prefix}Trials Overall Post Wins\`, \`${prefix}Trials Overall Carries\``);
      break;
    }
    case "help clanwars": case "clanwars": {
      embed.setAuthor("Clanwars Help Menu");
      embed.setDescription(`Here is a list of Clanwars commands! Example: \`${prefix}Clanwars Time\``);
      embed.addField("Crucible", `\`${prefix}Clanwars Valor\`\n\`${prefix}Clanwars Glory\`\n\`${prefix}Clanwars Iron Banner Kills\`\n\`${prefix}Clanwars Iron Banner Wins\``);
      embed.addField("Raids", `\`${prefix}Clanwars Levi\`\n\`${prefix}Clanwars Eow\`\n\`${prefix}Clanwars Sos\`\n\`${prefix}Clanwars Last Wish\`\n\`${prefix}Clanwars Scourge\`\n\`${prefix}Clanwars Crown\`\n\`${prefix}Clanwars Garden\`\n\`${prefix}Clanwars Dsc\``);
      embed.addField("Others", `\`${prefix}Clanwars Season Rank\`\n\`${prefix}Clanwars Time Played\``);
      break;
    }
    case "help others": case "others": {
      embed.setAuthor("Others Help Menu");
      embed.setDescription(`Here is a list of other commands! Example: \`${prefix}Donate\``);
      embed.addField("Commands", `\`${prefix}Donate\`\n\`${prefix}Clan Activity\`\n\`${prefix}Profile\`\n\`${prefix}Profile -raids\`, \`${prefix}Profile -r\`\n\`${prefix}Profile -broadcasts\`, \`${prefix}Profile -b\`\n\`${prefix}Profile -grandmasters\`, \`${prefix}Profile -g\`\n\`${prefix}Triumph score -active\`\n\`${prefix}Triumph score -legacy\`\n\`${prefix}Triumph score -lifetime\`\n\`${prefix}Things\`\n\`${prefix}Tools\``);
      break;
    }
    case "help drystreaks": case "help drystreak": case "drystreaks": {
      embed.setAuthor("Drystreaks Help Menu");
      embed.setDescription(`Here is a list of drystreak commands! Example: \`${prefix}Drystreak Anarchy\``);
      embed.addField("Commands", `\`${prefix}Drystreak One Thousand Voices\`\n\`${prefix}Drystreak Anarchy\`\n\`${prefix}Drystreak Always on Time\`\n\`${prefix}Drystreak Tarrabah\`\n\`${prefix}Drystreak Luxurious Toast\`\n\`${prefix}Drystreak Eyes of Tomorrow\`\n\`${prefix}Drystreak Vex Mythoclast\``);
      break;
    }
    default: {
      embed.setAuthor("Hey there! I am Marvin.");
      embed.setDescription(`I have so many commands now i've had to split them up here is a list of my help commands! Example: \`${prefix}Rankings\``);
      embed.addField("Categories", `\`${prefix}Rankings\`, \`${prefix}Broadcasts\`, \`${prefix}Announcements\`, \`${prefix}Dungeons\`, \`${prefix}Raids\`, \`${prefix}Items\`, \`${prefix}Titles\`, \`${prefix}Seasonal\`, \`${prefix}Clan\`, \`${prefix}Globals\`, \`${prefix}Trials\`, \`${prefix}Clanwars\`, \`${prefix}Others\``);
      embed.addField("Request", `If you wish to request something or would like to give feedback use the request command like this: \`${prefix}request I would like to see Marvin track season ranks!\``);
      break;
    }
  }

  if(command !== "broadcasts" && command !== "help broadcasts") {
    message.channel.send({embed}).catch(err => {
      if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
      else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
    });
  }
}
async function GetLeaderboard(prefix, message, command, users, registeredUser) {
  let players = [];
  let privatePlayers = [];
  let registeredPlayer;

  //Get players
  var GetGuildPlayers = () => new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); privatePlayers = data.filter(e => e.isPrivate); } }
    resolve(true);
  }));

  //Get registered user info
  var GetRegisteredUserInfo = () => new Promise(resolve =>
    Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
      if(!isError) { if(isFound) { if(!players.find(e => e.membershipID === registeredUser.membershipID)) { players.push(data.User); } registeredPlayer = data; } }
      resolve(true);
    })
  );

  //Promise all
  if(registeredUser && registeredUser !== "NoUser") { await Promise.all([await GetGuildPlayers(), await GetRegisteredUserInfo()]); }
  else { await Promise.all([await GetGuildPlayers()]); }

  SendLeaderboard(prefix, message, command, players, privatePlayers, registeredUser, registeredPlayer);
}
async function GetTitleLeaderboard(prefix, message, command, users, registeredUser) {
  let players = [];
  let playerTitles = [];
  let privatePlayers = [];
  let registeredPlayer;
  let registeredPlayerTitles;

  //Get players
  var GetGuildPlayers = () => new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); privatePlayers = data.filter(e => e.isPrivate); } }
    resolve(true);
  }));

  //Get player titles
  var GetGuildTitles = () => new Promise(resolve => Database.getGuildTitles(message.guild.id, function GetGuildTitles(isError, isFound, data) {
    if(!isError) { if(isFound) { playerTitles = data; } }
    resolve(true);
  }));

  //Get registered user info
  var GetRegisteredUserInfo = () => new Promise(resolve =>
    Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
      if(!isError) { if(isFound) { if(!players.find(e => e.membershipID === registeredUser.membershipID)) { players.push(data.User); } registeredPlayer = data; } }
      resolve(true);
    })
  );

  //Promise all
  if(registeredUser && registeredUser !== "NoUser") { await Promise.all([await GetGuildPlayers(), await GetGuildTitles(), await GetRegisteredUserInfo()]); }
  else { await Promise.all([await GetGuildPlayers(), await GetGuildTitles()]); }

  SendTotalTitlesLeaderboard(prefix, message, command, players, privatePlayers, registeredUser, registeredPlayer, playerTitles, registeredPlayerTitles);
}
async function GetObtainedItems(prefix, message, command, type, users, registeredUser) {
  let players = [];
  let playerItems = [];
  let obtained = [];
  let dataType;
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
  var GetGuildPlayers = () => new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); } }
    resolve(true);
  }));

  //Get player items
  var GetGuildItems = () => new Promise(resolve => Database.getGuildItems(message.guild.id, function GetGuildItems(isError, isFound, data) {
    if(!isError) { if(isFound) { playerItems = data; } }
    resolve(true);
  }));

  //Promise all
  if(item) {
    if(item.collectibleHash) {
      dataType = "item";
      await Promise.all([await GetGuildPlayers(), await GetGuildItems()]);
      for(var i in playerItems) {
        let user = players.find(e => e.membershipID === playerItems[i].membershipID);
        if(user) {
          let itemState = null; try { itemState = (playerItems[i].items.find(e => e.hash == item.collectibleHash)).state } catch (err) { }
          if(type === "obtained") { if(itemState!== null && !Misc.GetItemState(itemState).notAcquired) { obtained.push(user.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })); } }
          else { if(itemState === null || Misc.GetItemState(itemState).notAcquired) { obtained.push(user.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })); } }
        }
      }
    }
    else { dataType = "collectible"; }
  }

  if(dataType) { SendItemsLeaderboard(prefix, msg, command, type, players, obtained, item, dataType); }
  else {
    let errorEmbed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    errorEmbed.setAuthor("Uhh oh...");
    errorEmbed.setDescription(`Could not find the item requested. Its more than likely a character collectible and not something i can track sorry!`);
    msg.edit(errorEmbed);
  }
}
async function GetObtainedTitles(prefix, message, command, type, users, registeredUser) {
  let players = [];
  let playerTitles = [];
  let msg = await message.channel.send(new Discord.MessageEmbed().setColor(0x0099FF).setAuthor("Processing...").setDescription("This command takes a little to process. It will update in a few seconds.").setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp());

  //Get title
  var requestedTitleName = type === "obtained" ? command.substr("title ".length) : command.substr("!title ".length);
  var titleDefs = ManifestHandler.getManifestTitleByName(requestedTitleName);

  //Get players
  var GetGuildPlayers = () => new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); } }
    resolve(true);
  }));

  //Get player items
  var GetGuildTitles = () => new Promise(resolve => Database.getGuildTitles(message.guild.id, function GetGuildTitles(isError, isFound, data) {
    if(!isError) { if(isFound) { playerTitles = data; } }
    resolve(true);
  }));

  //Check to see if any title names match
  if(titleDefs.length > 0) {
    await Promise.all([await GetGuildPlayers(), await GetGuildTitles()]);
    let playersWithReqTitles = [];
    let playersWithoutReqTitles = [];

    for(let i in playerTitles) {
      let user = players.find(e => e.membershipID === playerTitles[i].membershipID);
      //Check if user is requesting obtained titles or missing titles
      if(type === "obtained") {
        for(let j in titleDefs) {
          if(playerTitles[i].titles.find(e => e === titleDefs[j].hash)) {
            if(user) {
              let displayName = user.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x });
              let membershipID = user.membershipID;
              let isGilded = titleDefs[j].forTitleGilding;
              Misc.upsertArray(playersWithReqTitles, { id: i, displayName, membershipID, isGilded, seen: 1 });
            }
          }
        }
      }
      else {
        if(!playerTitles[i].titles.find(e => e === titleDefs[0].hash)) {
          if(user) {
            let displayName = user.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x });
            let membershipID = user.membershipID;
            let isGilded = titleDefs[0].forTitleGilding;
            Misc.upsertArray(playersWithoutReqTitles, { id: i, displayName, membershipID, isGilded, seen: 1 });
          }
        }
      }
    }

    SendTitlesLeaderboard(prefix, msg, command, type, players, type === "obtained" ? playersWithReqTitles : playersWithoutReqTitles, titleDefs);
  }
  else {
    let errorEmbed = new Discord.MessageEmbed().setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    errorEmbed.setAuthor("Uhh oh...");
    errorEmbed.setDescription(`Could not find the title requested. If trying to search for Flawless or Conqueror just use tha name; Flawless or Conqueror. Previously you had to add the season but this has since changed.`);
    msg.edit(errorEmbed);
  }
}
async function GetProfile(prefix, message, command, type, users, registeredUser) {
  let players = [];
  let playerTitles = [];
  let registeredPlayer;
  let registeredPlayerStats = [];
  let registeredPlayerBroadcasts = [];

  //Get players
  var GetGuildPlayers = () => new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
    if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); } }
    resolve(true);
  }));

  //Get player titles
  var GetGuildTitles = () => new Promise(resolve => Database.getGuildTitles(message.guild.id, function GetGuildTitles(isError, isFound, data) {
    if(!isError) { if(isFound) { playerTitles = data; } }
    resolve(true);
  }));

  //Get registered user info
  var GetRegisteredUserInfo = () => new Promise(resolve =>
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
            triumphScore: { "data": data.User.triumphScore.score, "rank": players.sort(function(a, b) { return b.triumphScore.score - a.triumphScore.score; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            legacyTriumphScore: { "data": data.User.triumphScore.legacyScore, "rank": players.sort(function(a, b) { return b.triumphScore.legacyScore - a.triumphScore.legacyScore; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
            lifetimeTriumphScore: { "data": data.User.triumphScore.lifetimeScore, "rank": players.sort(function(a, b) { return b.triumphScore.lifetimeScore - a.triumphScore.lifetimeScore; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },
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
            dsc: { "data": data.User.raids.dsc, "rank": players.sort(function(a, b) { return b.raids.dsc - a.raids.dsc; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },     
            vog: { "data": data.User.raids.vog, "rank": players.sort(function(a, b) { return b.raids.vog - a.raids.vog; }).findIndex(e => e.membershipID === data.User.membershipID) +1 },     
            totalRaids: { "data": data.User.totalRaids, "rank": players.sort(function(a, b) { return b.totalRaids - a.totalRaids; }).findIndex(e => e.membershipID === data.User.membershipID) +1 }                    
          }
        }
      }
      resolve(true);
    })
  );

  //Get broadcasts for user
  var GetUserBroadcasts = () => new Promise(resolve => 
    Database.getUserBroadcasts(registeredUser.membershipID, message.guild.id, 15, function GetUserBroadcasts(isError, isFound, data) {
      if(!isError) { if(isFound) { registeredPlayerBroadcasts = data.filter(e => e.guildID === message.guild.id || e.guildID === "0"); } }
      resolve(true);
    })
  );

  //Promise all
  if(registeredUser && registeredUser !== "NoUser") {
    if(type === "profile") {
      if(command.startsWith("profile -b")) { await Promise.all([await GetGuildPlayers(), await GetGuildTitles(), await GetRegisteredUserInfo(), await GetUserBroadcasts()]); }
      else { await Promise.all([await GetGuildPlayers(), await GetGuildTitles(), await GetRegisteredUserInfo()]); }
    }
    else if(type === "trials") { await Promise.all([await GetRegisteredUserInfo()]); }
  }

  SendProfile(prefix, message, command, registeredUser, registeredPlayer, registeredPlayerStats, registeredPlayerBroadcasts, players.length);
}
async function GetClanWars(prefix, message, command, users, registeredUser) {
  RequestHandler.GetClanWars(async (isError, clanData) => {
    if(!isError) {
      let registeredPlayer;

      //Add registered user to players if not there already
      if(registeredUser && registeredUser !== "NoUser") {
        await new Promise(resolve =>
          Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
            if(!isError) { if(isFound) { registeredPlayer = data; } }
            resolve(true);
          })
        );
      }

      SendClanWarsLeaderboard(prefix, message, command, registeredUser, registeredPlayer, clanData);
    }
    else {
      if(clanData.code === "ECONNREFUSED") { message.channel.send(`The server that processes this information is offline. Feel free to let me know using \`${prefix}request\``); }
      else { message.channel.send(`Failed to generate clanwars leaderboards... Uhh report using: \`${prefix}request\``); }
    }
  });
}
async function GetGlobal(prefix, message, command, users, registeredUser) {
  let globalReq;
  switch(true) {
    case command.startsWith("global time played"): case command.startsWith("global time"): { globalReq = "GetGlobalTimePlayedLeaderboard"; break; }
    case command.startsWith("global sr"): case command.startsWith("global season rank"): { globalReq = "GetGlobalSeasonRankLeaderboard"; break; }
    case command.startsWith("global triumph score"): case command.startsWith("global triumph"): case command.startsWith("global triumphs"): { globalReq = "GetGlobalTriumphScoreLeaderboard"; break; }
    case command.startsWith("global valor"): { globalReq = "GetGlobalValorLeaderboard"; break; }
    case command.startsWith("global infamy"): { globalReq = "GetGlobalInfamyLeaderboard"; break; }
    case command.startsWith("global levi"): case command.startsWith("global leviathan"): { globalReq = "GetGlobalLeviLeaderboard"; break; }
    case command.startsWith("global eow"): case command.startsWith("global eater of worlds"): { globalReq = "GetGlobalEoWLeaderboard"; break; }
    case command.startsWith("global sos"): case command.startsWith("global spire of stars"): { globalReq = "GetGlobalSoSLeaderboard"; break; }
    case command.startsWith("global prestige levi"): case command.startsWith("global prestige leviathan"): { globalReq = "GetGlobalLeviPrestigeLeaderboard"; break; }
    case command.startsWith("global prestige eow"): case command.startsWith("global prestige eater of worlds"): { globalReq = "GetGlobalEoWPrestigeLeaderboard"; break; }
    case command.startsWith("global prestige sos"): case command.startsWith("global prestige spire of stars"): { globalReq = "GetGlobalSoSPrestigeLeaderboard"; break; }
    case command.startsWith("global last wish"): case command.startsWith("global lw"): { globalReq = "GetGlobalLastWishLeaderboard"; break; }
    case command.startsWith("global scourge"): case command.startsWith("global scourge of the past"): case command.startsWith("global sotp"): { globalReq = "GetGlobalScourgeLeaderboard"; break; }
    case command.startsWith("global sorrows"): case command.startsWith("global crown of sorrows"): case command.startsWith("global crown"): case command.startsWith("global cos"): { globalReq = "GetGlobalSorrowsLeaderboard"; break; }
    case command.startsWith("global garden"): case command.startsWith("global garden of salvation"): case command.startsWith("global gos"): { globalReq = "GetGlobalGardenLeaderboard"; break; }
    case command.startsWith("global dsc"): case command.startsWith("global deep stone crypt"): { globalReq = "GetGlobalDSCLeaderboard"; break; }
    case command.startsWith("global total raids"): case command.startsWith("global raids total"): { globalReq = "GetGlobalTotalRaidsLeaderboard"; break; }
    case command.startsWith("global highest power"): case command.startsWith("global power"): case command.startsWith("global max power"): case command.startsWith("global max light"): {
      if(command.startsWith("global highest power -a") || command.startsWith("global power -a") || command.startsWith("global max power -a") || command.startsWith("global max light -a")) { globalReq = "GetGlobalHighestPowerMinusArtifactLeaderboard"; }
      else { globalReq = "GetGlobalHighestPowerLeaderboard"; }
      break;
    }
    case command.startsWith("global cookies"): case command.startsWith("global event"): case command.startsWith("global dawning 2020"): { globalReq = "GetGlobalDawning2020Leaderboard"; break; }
    default: break;
  }
  if(globalReq) {
    RequestHandler[globalReq](async (isError, leaderboardData) => {
      if(!isError) {
        let registeredPlayer;
  
        //Add registered user to players if not there already
        if(registeredUser && registeredUser !== "NoUser") {
          await new Promise(resolve =>
            Database.findUserByID(registeredUser.membershipID, function LeaderboardFindUserByID(isError, isFound, data) {
              if(!isError) { if(isFound) { registeredPlayer = data; } }
              resolve(true);
            })
          );
        }
  
        SendGlobalLeaderboard(prefix, message, command, registeredUser, registeredPlayer, leaderboardData);
      }
      else {
        if(leaderboardData.code === "ECONNREFUSED") { message.channel.send(`The server that processes this information is offline. Feel free to let me know using \`${prefix}request\``); }
        else { Log.SaveLog("Frontend", "Error", leaderboardData); message.channel.send(`Failed to generate global leaderboards... Uhh report using: \`${prefix}request\``); }
      }
    });
  }
  else { message.channel.send(`We're unsure what global command that is or we do not have global tracking for that. See the global commands by using: \`${prefix}help globals\``); }
}
async function GetDrystreak(prefix, message, command) {
  let msg = await message.channel.send(new Discord.MessageEmbed().setColor(0x0099FF).setAuthor("Processing...").setDescription("This command takes a little to process. It will update in a few seconds.").setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp());
  let players = [];
  let playerItems = [];
  let broadcasts = [];
  let drystreaks = [];
  let collectibleHash;
  let isFound = false;

  switch(command.substr("drystreak ".length).toString().toUpperCase()) {
    case "1000 VOICES": case "1KV": case "1K VOICES": case "ONE THOUSAND VOICES": case "199171385": { collectibleHash = 199171385; isFound = true; break; }
    case "ANARCHY": case "2220014607": { collectibleHash = 2220014607; isFound = true; break; }
    case "ALWAYS ON TIME": case "1903459810": { collectibleHash = 1903459810; isFound = true; break; }
    case "TARRABAH": case "2329697053": { collectibleHash = 2329697053; isFound = true; break; }
    case "LUXURIOUS TOAST": case "1866399776": { collectibleHash = 1866399776; isFound = true; break; }
    case "EYES OF TOMORROW": case "753200559": { collectibleHash = 753200559; isFound = true; break; }
    case "VEX MYTHOCLAST": case "2300465938": { collectibleHash = 2300465938; isFound = true; break; }
    case "VEX MYTHOCAST": case "2300465938": { collectibleHash = 2300465938; isFound = true; break; }
    default: { break; }
  }


  if(isFound) {
    //Get players
    var GetGuildPlayers = () => new Promise(resolve => Database.getGuildPlayers(message.guild.id, function GetGuildPlayers(isError, isFound, data) {
      if(!isError) { if(isFound) { players = data.filter(e => !e.isPrivate); } }
      resolve(true);
    }));

    //Get player items
    var GetGuildItems = () => new Promise(resolve => Database.getGuildItems(message.guild.id, function GetGuildItems(isError, isFound, data) {
      if(!isError) { if(isFound) { playerItems = data; } }
      resolve(true);
    }));

    //Get broadcasts
    var GetGuildBroadcasts = () => new Promise(resolve => Database.getGuildBroadcasts(message.guild.id, function GetGuildBroadcasts(isError, isFound, data) {
      if(!isError) { if(isFound) { broadcasts = data; } }
      resolve(true);
    }));

    //Promise all
    await Promise.all([await GetGuildPlayers(), await GetGuildItems(), await GetGuildBroadcasts()]);

    //Since broadcasts are logged as they come in, we need to make sure we are filtering out users who have since left the clan(s).
    broadcasts = broadcasts.filter(e => players.find(f => f.membershipID === e.membershipID));
    
    //Further filter out unrelated items.
    broadcasts = broadcasts.filter(e => e.hash !== collectibleHash);


    //Filter through items looking for people missing the item.
    for(var i in playerItems) {
      let user = players.find(e => e.membershipID === playerItems[i].membershipID);
      if(user) {
        let itemState = (playerItems[i].items.find(e => e.hash == collectibleHash)).state;
        let item = ManifestHandler.getManifestItemByCollectibleHash(collectibleHash);
        let completions = 0;
        if(collectibleHash === 199171385) { completions = user.raids.lastWish }
        else if(collectibleHash === 2220014607) { completions = user.raids.scourge }
        else if(collectibleHash === 1903459810) { completions = user.raids.scourge }
        else if(collectibleHash === 2329697053) { completions = user.raids.sorrows }
        else if(collectibleHash === 1866399776) { completions = (user.raids.sos + user.raids.prestige_sos) }
        else if(collectibleHash === 753200559) { completions = user.raids.dsc }
        else if(collectibleHash === 2300465938) { completions = user.raids.vog }
        if(Misc.GetItemState(itemState).notAcquired) {
          drystreaks.push({
            "displayName": user.displayName,
            "membershipID": user.membershipID,
            "item": item.displayProperties.name,
            "obtained": false,
            "completions": completions
          });
        }
      }
    }

    //Go through broadcasts and look for when they obtained said item and add them to the list.
    for(var i in broadcasts) {
      let user = players.find(e => e.membershipID === broadcasts[i].membershipID);
      let item = ManifestHandler.getManifestItemByCollectibleHash(collectibleHash);
      if(broadcasts[i].hash.toString() === collectibleHash.toString()) {
        if(!drystreaks.find(e => e.membershipID === broadcasts[i].membershipID)) {
          drystreaks.push({
            "displayName": user.displayName,
            "membershipID": user.membershipID,
            "item": item.displayProperties.name,
            "obtained": true,
            "completions": broadcasts[i].count
          });
        }
      }
    }

    SendDrystreakLeaderboard(prefix, msg, command, players, broadcasts, drystreaks);
  }
  else {
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    embed.setAuthor("Drystreaks");
    embed.setDescription(`The item you tried to search for was not tracked for drystreaks. There are only a few items that have drystreaks as these are manually added. See them here: \`${prefix}help drystreaks\``);
    msg.edit({ embed });
  }
}
async function GetBroadcastDates(prefix, message, command) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let guildBroadcasts = [];

  //Get item
  var requestedItemName = command.substr("test ".length);
  var item;
  if(isNaN(requestedItemName)) { item = ManifestHandler.getManifestItemByName(requestedItemName); }
  else {
    item = ManifestHandler.getManifestItemByHash(requestedItemName);
    if(!item) { item = ManifestHandler.getManifestItemByCollectibleHash(requestedItemName); }
  }

  //Get broadcasts for user
  var GetGuildItemBroadcasts = () => new Promise(resolve => 
    Database.getGuildItemBroadcasts(message.guild.id, item.collectibleHash, function GetGuildItemBroadcasts(isError, isFound, data) {
      if(!isError) { if(isFound) { for(let i in data) { if(!guildBroadcasts.find(e => e.membershipID === data[i].membershipID)) { guildBroadcasts.push(data[i]); } } } }
      resolve(true);
    })
  );

  await Promise.all([await GetGuildItemBroadcasts()]);

  if(guildBroadcasts.length > 0) {
    guildBroadcasts.sort((a, b) => { return a.date - b.date }).slice(0, 100);
    embed.setAuthor(`Obtained Dates - ${ item.displayProperties.name }`);
    embed.setDescription(`This is capped at 100, a full leaderboard will be coming soon. Shown: ${ guildBroadcasts.length } / 100`);
    if(item.displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ item.displayProperties.icon }`); }
    embed.addField("Name", guildBroadcasts.slice(0, guildBroadcasts.length / 2).map(e => { return e.displayName }), true);
    embed.addField("Date", guildBroadcasts.slice(0, guildBroadcasts.length / 2).map(e => { return `${ new Date(e.date).getDate() }-${ new Date(e.date).getMonth()+1 }-${ new Date(e.date).getFullYear() }` }), true);
    embed.addField("\u200B", "\u200B", true);
    embed.addField("Name", guildBroadcasts.slice(guildBroadcasts.length / 2, guildBroadcasts.length).map(e => { return e.displayName }), true);
    embed.addField("Date", guildBroadcasts.slice(guildBroadcasts.length / 2, guildBroadcasts.length).map(e => { return `${ new Date(e.date).getDate() }-${ new Date(e.date).getMonth()+1 }-${ new Date(e.date).getFullYear() }` }), true);
    embed.addField("\u200B", "\u200B", true);
  }
  else {
    embed.setAuthor("Uhh oh...");
    embed.setDescription("Could not find any broadcasts for that item in this server. Has this server had any broadcasts since Marvin has started tracking this server/clan?");
  }

  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
  });
}
async function GetBroadcastItems(prefix, message, command) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let guild = null;
  let globals = [];

  //Get Guild Info
  var GetGuildInfo = () => new Promise(resolve => Database.findGuildByID(message.guild.id, function GetGuildInfo(isError, isFound, data) {
    if(!isError) { if(isFound) { guild = data; } }
    resolve(true);
  }));

  await Promise.all([await GetGuildInfo()]);
  
  //Create the help menu
  embed.setAuthor("Broadcasts Help Menu");
  embed.setDescription(`Here is a list of broadcast commands! Example: \`${prefix}Set broadcasts #channel\``);
  embed.addField("Commands", `\`${prefix}Set broadcasts #channel\`\n\`${prefix}Remove broadcasts\`\n\`${prefix}Manage broadcasts\`\n\`${prefix}Toggle item broadcasts\`\n\`${prefix}Toggle title broadcasts\`\n\`${prefix}Toggle clan broadcasts\`\n\`${prefix}Track itemname\`\n\`${prefix}Untrack itemname\``);
  
  // //Get mode, global items and extra items.
  // let broadcastMode = guild.broadcasts.mode;
  // let globalItems = (GlobalItemsHandler.getGlobalItems()).filter(e => { if(e.broadcastEnabled) { return e } });
  // let extraItems = guild.broadcasts.extraItems.filter(e => { if(e.enabled) return e });
  // let ignoredItems = guild.broadcasts.extraItems.filter(e => { if(!e.enabled) return e });

  // //Check if broadcasts are enabled
  // if(guild && guild?.broadcasts?.channel !== "0") {
  //   var chunkyGlobals = MakeItChunky(globalItems, 1000, 25);
  //   var chunkyExtras = MakeItChunky(extraItems, 1000, 25);
  //   var chunkyIgnored = MakeItChunky(ignoredItems, 1000, 25);

  //   if(globalItems.length > 0) { for(let i in chunkyGlobals) { embed.addField("Auto Broadcasts", chunkyGlobals[i].map(e => { return e.name }), true); } }
  //   if(extraItems.length > 0) { for(let i in chunkyExtras) { embed.addField("Manual Broadcasts", chunkyExtras[i].map(e => { return e.name }), true); } }
  //   if(ignoredItems.length > 0) { for(let i in chunkyIgnored) { embed.addField("Ignored Broadcasts", chunkyIgnored[i].map(e => { return e.name }), true); } }
  // }

  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
  });
}

function BuildLeaderboard(command, message, players, registeredPlayer) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let sortedPlayers = [];

  if(!Array.isArray(command.sorting)) {
    sortedPlayers = players.sort((a, b) => {
      return Object.byString(b, command.sorting) - Object.byString(a, command.sorting)
    });
  }
  else {
    sortedPlayers = players.sort((a, b) => {
      return (Object.byString(b, command.sorting[0]) + Object.byString(b, command.sorting[1])) - (Object.byString(a, command.sorting[0]) + Object.byString(a, command.sorting[1]))
    });
  }

  embed.setAuthor(command.title);
  embed.setDescription(
    `${ command.description ? command.description : '' }` + '\n' +
    `${ command.leaderboardURL ? `[Click to see full leaderboard](https://marvin.gg/leaderboards/${ message.guild.id }/${ command.leaderboardURL }/)` : '' }`
  );

  for(let field of command.fields) {
    embed.addField(field.name, BuildField(field, sortedPlayers, registeredPlayer, command.size), field.inline);
  }

  return embed;
}
function BuildField(field, sortedPlayers, registeredPlayer, size) {
  switch(field.type) {
    case 'Name': {
      let builtField = sortedPlayers.map((e, index) => `${parseInt(index)+1}: ${e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })}`).slice(0, size);
      if(registeredPlayer) {
        var rank = sortedPlayers.indexOf(sortedPlayers.find(e => e.membershipID === registeredPlayer.User.membershipID));
        builtField.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
      }
      return builtField;
    }
    case 'Leaderboard': {
      let builtField = sortedPlayers.map((e, index) => `${ Misc.AddCommas( Math.floor(Object.byString(e, field.data))) }`).slice(0, size);
      if(registeredPlayer) {
        builtField.push("", `${ Misc.AddCommas( Math.floor(Object.byString(registeredPlayer.User, field.data))) }`);
      }
      return builtField;
    }
    case 'SplitLeaderboard': {
      let builtField =  sortedPlayers.map((e, index) => `${ Misc.AddCommas( Math.floor(Object.byString(e, field.data[0]))) } - ${ Misc.AddCommas(Math.floor(Object.byString(e, field.data[1]))) }`).slice(0, size);
      if(registeredPlayer) {
        builtField.push("", `${ Misc.AddCommas( Math.floor(Object.byString(registeredPlayer.User, field.data[0]))) } - ${ Misc.AddCommas(Math.floor(Object.byString(registeredPlayer.User, field.data[1]))) }`);
      }
      return builtField;
    }
    case 'PowerLeaderboard': {
      let builtField =  sortedPlayers.map((e, index) => `${ Misc.AddCommas( Math.floor(Object.byString(e, field.data[0]) + Object.byString(e, field.data[1]))) } (${ Misc.AddCommas(Object.byString(e, field.data[0])) } + ${ Misc.AddCommas(Object.byString(e, field.data[1])) })`).slice(0, size);
      if(registeredPlayer) {
        builtField.push("", `${ Misc.AddCommas( Math.floor(Object.byString(registeredPlayer.User, field.data[0]) + Object.byString(registeredPlayer.User, field.data[1]))) } (${ Misc.AddCommas(Object.byString(registeredPlayer.User, field.data[0])) } + ${ Misc.AddCommas(Object.byString(registeredPlayer.User, field.data[1])) })`);
      }
      return builtField;
    }
    case 'TimeLeaderboard': {
      let builtField =  sortedPlayers.map((e, index) => `${ Misc.AddCommas( Math.floor(Object.byString(e, field.data)/60)) } Hrs`).slice(0, size);
      if(registeredPlayer) {
        builtField.push("", `${ Misc.AddCommas( Math.floor(Object.byString(registeredPlayer.User, field.data)/60)) } Hrs`);
      }
      return builtField;
    }
    case 'SplitTotal': {
      let builtField =  sortedPlayers.map((e, index) => `${ Misc.AddCommas( Math.floor(Object.byString(e, field.data[0]) + Object.byString(e, field.data[1]))) }`).slice(0, size);
      if(registeredPlayer) {
        builtField.push("", `${ Misc.AddCommas( Math.floor(Object.byString(registeredPlayer.User, field.data[0]) + Object.byString(registeredPlayer.User, field.data[1]))) }`);
      }
      return builtField;
    }
    case 'Reset': {
      let builtField = sortedPlayers.map((e, index) => `${ Misc.AddCommas( Math.floor(Object.byString(e, field.data) / field.divisibleBy)) }`).slice(0, size);
      if(registeredPlayer) {
        builtField.push("", `${ Misc.AddCommas( Math.floor(Object.byString(registeredPlayer.User, field.data) / field.divisibleBy)) }`);
      }
      return builtField;
    }
  }
}
async function SendLeaderboard(prefix, message, input, players, privatePlayers, registeredUser, registeredPlayer) {
  // Look for command
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let command = Commands.filter(c => c.commands.find(cm => input.startsWith(cm)))[0];

  if(players.length > 0) {
    if(command) {
      // Build leaderboard embed
      try { embed = BuildLeaderboard(command, message, players, registeredPlayer) } catch(err) {
        Log.SaveLog("Frontend", "Error", err);
        embed.setAuthor("Uhh oh...");
        embed.setDescription(`So something went wrong and this command just didn't work. It dun broke. Please report using \`${prefix}request\``);
      };
  
      // Attempt to send it
      message.channel.send({ embed }).catch(err => {
        if(err.code === 50035) {
          message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message.");
        }
        else {
          Log.SaveLog("Frontend", "Error", err);
          message.channel.send("There was an error, this has been logged.");
        }
      });
    }
    else {
      // Return message letting them know that the command was not found
      message.channel.send(`I\'m not sure what that commands is sorry. Use \`${ prefix }help\` to see commands.`).then(msg => {
        msg.delete({ timeout: 3000 });
      }).catch();
    }
  }
  else {
    // Return message letting them know that the there was no players were returned.
    embed.setDescription(`No players found, this usually happen 1 of 2 reasons. \n\nFirstly you may not have setup the bot correctly, make sure you that you've registered yourself and used \`${ prefix }set clan\` to setup the bot. \n\nIf you have done this then the reason I found no players is that I haven't scanned your clan yet. Because I serve so many clans it does take time before your inital clan setup would be complete. \n\nTry again in about 15-30 minutes if this is the case.`);
    message.channel.send(embed);
  }
}
function SendTotalTitlesLeaderboard(prefix, message, command, players, privatePlayers, registeredUser, registeredPlayer, playerTitles, registeredPlayerTitles) {
  let leaderboard = { names: [], first: [], second: [] }
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  let top = playerTitles.sort((a, b) => { return b.titles.length - a.titles.length }).slice(0, 10);
  leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ players.find(player => player.membershipID === e.membershipID).displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
  leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.titles.length) }` });
  if(registeredPlayer) {
    var rank = playerTitles.indexOf(playerTitles.find(e => e.membershipID === registeredPlayer.User.membershipID));
    leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
    leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.Titles.titles.length) }`);
  }
  else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
  embed.setAuthor("Top 10 Total Titles");
  embed.addField("Name", leaderboard.names, true);
  embed.addField("Total", leaderboard.first, true);

  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
  });
}

function SendItemsLeaderboard(prefix, message, command, type, players, playerItems, item, dataType) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  
  playerItems.sort((a, b) => a.localeCompare(b));
  var chunkArray = playerItems.slice(0, 100).reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index / 15);
    if(!resultArray[chunkIndex]) { resultArray[chunkIndex] = []; }
    resultArray[chunkIndex].push(item)
    return resultArray
  }, []);

  if(dataType === "item") {
    if(playerItems.length > 0) {
      embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ item.displayProperties.name }`);
      embed.setDescription(`This list can only show 100 players. There may be more not on this list depending on how many clans are tracked. ${ playerItems.length > 100 ? `100 / ${ playerItems.length }` : ` ${ playerItems.length } / 100` }`);
      if(item.displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ item.displayProperties.icon }`); }
      for(var i in chunkArray) { embed.addField(`${ type === "obtained" ? "Obtained" : "Missing" }`, chunkArray[i], true); }
    }
    else {
      if(item.collectibleHash) {
        embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ item.displayProperties.name }`);
        embed.setDescription(`Nobody has it yet.`);
        if(item.displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ item.displayProperties.icon }`); }
      }
      else {
        embed.setAuthor("Can not track item.");
        embed.setDescription(`This item does not have an associated collectible hash to it, which means i cannot track it. Sorry!`);
      }
    }
  }
  else {
    if(playerItems.length > 0) {
      embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ item.displayProperties.name }`);
      embed.setDescription(`This list can only show 100 players. There may be more not on this list depending on how many clans are tracked. ${ playerItems.length > 100 ? `100 / ${ playerItems.length }` : ` ${ playerItems.length } / 100` }`);
      if(item.displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ item.displayProperties.icon }`); }
      for(var i in chunkArray) { embed.addField(`${ type === "obtained" ? "Obtained" : "Missing" }`, chunkArray[i], true); }
    }
    else {
      embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ item.displayProperties.name }`);
      embed.setDescription(`Nobody has it yet.`);
      if(item.displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ item.displayProperties.icon }`); }
    }
  }

  message.edit(embed);
}
function SendTitlesLeaderboard(prefix, message, command, type, players, playerTitles, titleDefs) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let amount = type === "obtained" ? 50 : 100;
  playerTitles.sort((a, b) => a.displayName.localeCompare(b.displayName));
  playerTitles.sort((a, b) => b.seen - a.seen);
  var chunkArray = playerTitles.slice(0, amount).reduce((resultArray, titleDefs, index) => { 
    const chunkIndex = Math.floor(index / (type === "obtained" ? amount : 15));
    if(!resultArray[chunkIndex]) { resultArray[chunkIndex] = []; }
    resultArray[chunkIndex].push(titleDefs)
    return resultArray
  }, []);

  if(playerTitles.length > 0) {
    embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ titleDefs[0].titleInfo.titlesByGender.Male }`);
    embed.setDescription(`This list can only show ${ amount } players. There may be more not on this list depending on how many clans are tracked. ${ playerTitles.length > amount ? `${ amount } / ${ playerTitles.length }` : ` ${ playerTitles.length } / ${ amount }` }`);
    if(titleDefs[0].displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ titleDefs[0].displayProperties.icon }`); }
    for(var i in chunkArray) {
      embed.addField(`${ type === "obtained" ? "Obtained" : "Missing" }`, chunkArray[i].map(e => e.displayName), true);
      if(type === "obtained") {
        embed.addField("Gilded", chunkArray[i].map(e => { return e.isGilded ? ":white_check_mark: ".repeat(e.seen-1) : "\u200b" }), true);
      }
    }
  }
  else {
    embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ titleDefs[0].titleInfo.titlesByGender.Male }`);
    embed.setDescription(`Nobody has it yet.`);
    if(titleDefs[0].displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ titleDefs[0].displayProperties.icon }`); }
  }

  message.edit(embed);
}
function SendClanWarsLeaderboard(prefix, message, command, registeredUser, registeredPlayer, clanData) {
  let leaderboard = { names: [], first: [], second: [] }
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  switch(true) {
    case command.startsWith("clanwars valor"): {
      let top = Object.values(clanData).sort((a, b) => { return b.valor - a.valor }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.valor) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.valor - a.valor }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.valor) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Valor");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Score", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars glory"): {
      let top = Object.values(clanData).sort((a, b) => { return b.glory - a.glory }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.glory) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.glory - a.glory }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.glory) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Glory");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Score", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars iron banner kills"): case command.startsWith("clanwars ironbanner kills"): {
      let top = Object.values(clanData).sort((a, b) => { return b.ironBanner.kills - a.ironBanner.kills }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.ironBanner.kills) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.ironBanner.kills - a.ironBanner.kills }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.ironBanner.kills) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Iron Banner Kills");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Score", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars iron banner wins"): case command.startsWith("clanwars ironbanner wins"): {
      let top = Object.values(clanData).sort((a, b) => { return b.ironBanner.wins - a.ironBanner.wins }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.ironBanner.wins) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.ironBanner.wins - a.ironBanner.wins }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.ironBanner.wins) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Iron Banner Wins");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Score", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars time"): case command.startsWith("clanwars time played"): {
      let top = Object.values(Object.values(clanData)).sort((a, b) => { return b.timePlayed - a.timePlayed }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(Math.round(e.timePlayed/60)) } Hrs` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.timePlayed - a.timePlayed }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(Math.round(clan.timePlayed/60)) } Hrs`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Total Time Played");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Hours", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars levi"): case command.startsWith("clanwars leviathan"): {
      let top = Object.values(clanData).sort((a, b) => { return b.levi - a.levi }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.levi) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.levi - a.levi }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.levi) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Leviathan Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars eow"): case command.startsWith("clanwars eater"): case command.startsWith("clanwars eater of worlds"): {
      let top = Object.values(clanData).sort((a, b) => { return b.eow - a.eow }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.eow) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.eow - a.eow }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.eow) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Eater of Worlds Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars sos"): case command.startsWith("clanwars spire of stars"): {
      let top = Object.values(clanData).sort((a, b) => { return b.sos - a.sos }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.sos) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.sos - a.sos }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.sos) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Spire of Stars Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars lw"): case command.startsWith("clanwars last wish"): {
      let top = Object.values(clanData).sort((a, b) => { return b.lastWish - a.lastWish }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.lastWish) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.lastWish - a.lastWish }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.lastWish) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Last Wish Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars scourge"): case command.startsWith("clanwars scourge of the past"): {
      let top = Object.values(clanData).sort((a, b) => { return b.scourge - a.scourge }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.scourge) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.scourge - a.scourge }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.scourge) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Scourge of the Past Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars sorrows"): case command.startsWith("clanwars crown"): case command.startsWith("clanwars crown of sorrows"): {
      let top = Object.values(clanData).sort((a, b) => { return b.sorrows - a.sorrows }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.sorrows) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.sorrows - a.sorrows }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.sorrows) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Crown of Sorrows Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars garden"): case command.startsWith("clanwars garden of salvation"): {
      let top = Object.values(clanData).sort((a, b) => { return b.garden - a.garden }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.garden) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.garden - a.garden }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.garden) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Garden of Salvation Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars dsc"): case command.startsWith("clanwars deep stone crypt"): {
      let top = Object.values(clanData).sort((a, b) => { return b.dsc - a.dsc }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.dsc) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.dsc - a.dsc }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.dsc) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Deep Stone Crypt Clears");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Clears", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars raids"): case command.startsWith("clanwars total raids"): case command.startsWith("clanwars raid completions"): {
      let top = Object.values(clanData).sort((a, b) => { return b.totalRaids - a.totalRaids }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.totalRaids) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.totalRaids - a.totalRaids }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.totalRaids) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Total Raid Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("clanwars season ranks"): case command.startsWith("clanwars sr"): case command.startsWith("clanwars season rank"): {
      let top = Object.values(clanData).sort((a, b) => { return b.seasonRank - a.seasonRank }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.seasonRank) }` });
      if(registeredPlayer) {
        var clan = Object.values(clanData).find(e => e.clanID === registeredPlayer.User.clanID);
        var rank = Object.values(clanData).sort((a, b) => { return b.seasonRank - a.seasonRank }).indexOf(clan);
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.seasonRank) }`);
      }
      embed.setAuthor("Top 10 Clan Wars Rankings for Total Season Ranks");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Ranks", leaderboard.first, true);
      break;
    }
    default: { embed.setDescription(`That\'s not a valid clanwars command. Use \`${prefix}help clanwars\` to see clanwars commands.`); break; }
  }
  
  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
  });
}
function SendProfile(prefix, message, command, registeredUser, registeredPlayer, registeredPlayerStats, registeredPlayerBroadcasts, leaderboardLength) {
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
              embed.addField("Deep Stone Crypt", `${ Misc.AddCommas(registeredPlayerStats.dsc.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.dsc.rank) })*`, true);
              embed.addField("Vault of Glass", `${ Misc.AddCommas(registeredPlayerStats.vog.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.vog.rank) })*`, true);
              embed.addField("See more at", `https://guardianstats.com/profile/${ registeredUser.membershipID }`);
              break;
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription(`The person you have @ has not registered. Get them to register\nThey can do this by using \`${prefix}register\``);
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription(`In order to view your profile i need to know who you are. I cannot know without you registering first. Use: \`${prefix}register\``);
            break;
          }
        }
        case command.startsWith("profile -b"): case command.startsWith("profile -broadcasts"): {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              if(registeredPlayerBroadcasts.length > 0) {
                registeredPlayerBroadcasts.sort((a, b) => { return b.date - a.date }).slice(0, 15);
                embed.setAuthor(`Viewing Profile for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
                embed.setDescription("This only shows broadcasts whilst Marvin was tracking your clan in this discord. (Capped at 15 newest broadcasts)");
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
              embed.setDescription(`The person you have @ has not registered. Get them to register\nThey can do this by using \`${prefix}register\``);
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription(`In order to view your profile i need to know who you are. I cannot know without you registering first. Use: \`${prefix}register\``);
            break;
          }
        }
        case command.startsWith("profile -g"): case command.startsWith("profile -grandmaster"): case command.startsWith("profile -grandmasters"): {
          if(registeredUser) {
            if(registeredUser !== "NoUser") {
              if(registeredPlayer.User.grandmasters) {
                embed.setAuthor(`Viewing Profile for ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`)
                embed.setDescription("Grandmaster Completions (Season of the Splicer)");
                let grandmasters = {
                  names: ["The Glassway", "The Insight Terminus", "Fallen S.A.B.E.R", "The Inverted Spire", "Warden of Nothing", "The Disgraced"],
                  counts: [
                    registeredPlayer.User.grandmasters.theGlassway,
                    registeredPlayer.User.grandmasters.theInsightTerminus,
                    registeredPlayer.User.grandmasters.fallenSABER,
                    registeredPlayer.User.grandmasters.invertedSpire,
                    registeredPlayer.User.grandmasters.wardenOfNothing,
                    registeredPlayer.User.grandmasters.theDisgraced,
                  ]
                }
                grandmasters.names.push("", "Total");
                grandmasters.counts.push("", grandmasters.counts.reduce((a,b) => a+b));
                embed.addField("Strike", grandmasters.names, true);
                embed.addField("Completions", grandmasters.counts, true);
                break;
              }
              else {
                embed.setAuthor("Uhh oh...");
                embed.setDescription(`Found User but I have no grandmaster data for you yet, Most likely still scanning.`);
                break;
              }
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription(`The person you have @ has not registered. Get them to register\nThey can do this by using \`${prefix}register\``);
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription(`In order to view your profile i need to know who you are. I cannot know without you registering first. Use: \`${prefix}register\``);
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
              embed.addField("Active Triumph Score", `${ Misc.AddCommas(registeredPlayerStats.triumphScore.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.triumphScore.rank) })*`, true);
              embed.addField("Legacy Triumph Score", `${ Misc.AddCommas(registeredPlayerStats.legacyTriumphScore.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.legacyTriumphScore.rank) })*`, true);
              embed.addField("Lifetime Triumph Score", `${ Misc.AddCommas(registeredPlayerStats.lifetimeTriumphScore.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.lifetimeTriumphScore.rank) })*`, true);
              embed.addField("Raids", `${ Misc.AddCommas(registeredPlayerStats.totalRaids.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.totalRaids.rank) })*`, true);
              embed.addField("Titles", `${ Misc.AddCommas(registeredPlayerStats.titles.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.titles.rank) })*`, true);
              embed.addField("Highest Power", `${ Misc.AddCommas(registeredPlayerStats.highestPower.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.highestPower.rank) })*`, true);
              embed.addField("See more at", `https://guardianstats.com/profile/${ registeredUser.membershipID }`);
              break;
            }
            else {
              embed.setAuthor("Uhh oh...");
              embed.setDescription(`The person you have @ has not registered. Get them to register\nThey can do this by using \`${prefix}register\``);
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription(`In order to view your profile i need to know who you are. I cannot know without you registering first. Use: \`${prefix}register\``);
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
              embed.setDescription(`The person you have @ has not registered. Get them to register\nThey can do this by using \`${prefix}register\``);
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription(`In order to view your profile i need to know who you are. I cannot know without you registering first. Use: \`${prefix}register\``);
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
              embed.setDescription(`The person you have @ has not registered. Get them to register\nThey can do this by using \`${prefix}register\``);
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription(`In order to view your profile i need to know who you are. I cannot know without you registering first. Use: \`${prefix}register\``);
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
              embed.setDescription(`The person you have @ has not registered. Get them to register\nThey can do this by using \`${prefix}register\``);
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription(`In order to view your profile i need to know who you are. I cannot know without you registering first. Use: \`${prefix}register\``);
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
              embed.setDescription(`The person you have @ has not registered. Get them to register\nThey can do this by using \`${prefix}register\``);
              break;
            }
          }
          else {
            embed.setAuthor("Uhh oh...");
            embed.setDescription(`In order to view your profile i need to know who you are. I cannot know without you registering first. Use: \`${prefix}register\``);
            break;
          }
        }
      }
      break;
    }
  }
  
  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
  });
}
function SendGlobalLeaderboard(prefix, message, command, registeredUser, registeredPlayer, leaderboardData) {
  let leaderboard = { names: [], first: [], second: [] }
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  switch(true) {
    //Pvp
    case command.startsWith("global valor"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.valor) }` });
      leaderboard.second = top.map((e, index) => { return `${ ~~(e.valor/2000) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.valor.current) }`);
        leaderboard.second.push("", `${ ~~(registeredPlayer.User.valor.current/2000) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Seasonal Valor Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Valor", leaderboard.first, true);
      embed.addField("Resets", leaderboard.second, true);
      break;
    }
    case command.startsWith("global infamy"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.infamy.current) }` });
      leaderboard.second = top.map((e, index) => { return `${ ~~(e.infamy.current/2000) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.infamy.current) }`);
        leaderboard.second.push("", `${ ~~(registeredPlayer.User.infamy.current/2000) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Seasonal Infamy Rankings");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Infamy", leaderboard.first, true);
      embed.addField("Resets", leaderboard.second, true);
      break;
    }

    //Raids
    case command.startsWith("global leviathan"): case command.startsWith("global levi"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.levi }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.levi }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Leviathan Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global eater of worlds"): case command.startsWith("global eow"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.eow }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.eow }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Eater of Worlds Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global spire of stars"): case command.startsWith("global sos"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.sos }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.sos }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Spire of Stars Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global prestige leviathan"): case command.startsWith("global prestige levi"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.prestige_levi }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.prestige_levi }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Prestige Leviathan Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global prestige eater of worlds"): case command.startsWith("global prestige eow"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.prestige_eow }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.prestige_eow }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Prestige Eater of Worlds Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global prestige spire of stars"): case command.startsWith("global prestige sos"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.prestige_sos }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.raids.prestige_sos }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Prestige Spire of Stars Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global last wish"): case command.startsWith("global lw"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.lastWish) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.lastWish) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Last Wish Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global scourge"): case command.startsWith("global scourge of the past"): case command.startsWith("global sotp"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.scourge) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.scourge) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Scourge of the Past Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global sorrows"): case command.startsWith("global crown of sorrows"): case command.startsWith("global crown"): case command.startsWith("global cos"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.sorrows) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.sorrows) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Crown of Sorrows Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global garden"): case command.startsWith("global garden of salvation"): case command.startsWith("global gos"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.garden) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.garden) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Garden of Salvation Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global dsc"): case command.startsWith("global deep stone crypt"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.dsc) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.dsc) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Deep Stone Crypt Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }
    case command.startsWith("global total raids"): case command.startsWith("global raids total"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.totalRaids) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.totalRaids) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Total Raid Completions");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
      break;
    }

    //Others
    case command.startsWith("global highest power"): case command.startsWith("global power"): case command.startsWith("global max power"): case command.startsWith("global max light"): {
      if(command.startsWith("global highest power -a") || command.startsWith("global power -a") || command.startsWith("global max power -a") || command.startsWith("global max light -a")) {
        let top = leaderboardData.slice(0, 10);
        leaderboard.names = top.map((e, index) => { return `${ parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
        leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.highestPower) }` });
        if(registeredPlayer) {
          var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
          leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.highestPower) }`);
        }
        else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
        embed.setAuthor("Top 10 Global Highest Base Power");
        embed.setDescription(`As there is no actual 'highest power' stat, this leaderboard may be in-accurate at times due to it only updating the power at the time the clan was scanned.`);
        embed.addField("Name", leaderboard.names, true);
        embed.addField("Power", leaderboard.first, true);
      }
      else {
        let top = leaderboardData.slice(0, 10);
        leaderboard.names = top.map((e, index) => { return `${ parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
        leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.highestPower+e.powerBonus) } (${ Misc.AddCommas(e.highestPower) } + ${ Misc.AddCommas(e.powerBonus) })` });
        if(registeredPlayer) {
          var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
          leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.highestPower+registeredPlayer.User.powerBonus) } (${ Misc.AddCommas(registeredPlayer.User.highestPower) } + ${ Misc.AddCommas(registeredPlayer.User.powerBonus) })`);
        }
        else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
        embed.setAuthor("Top 10 Global Highest Power");
        embed.setDescription(`As there is no actual 'highest power' stat, this leaderboard may be in-accurate at times due to it only updating the power at the time the clan was scanned.\n\n To see global highest base power use: \`${prefix}global power -a\``);
        embed.addField("Name", leaderboard.names, true);
        embed.addField("Power", leaderboard.first, true);
      }
      break;
    }
    case command.startsWith("global time played"): case command.startsWith("global time"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(Math.round(e.timePlayed/60)) } Hrs` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(Math.round(registeredPlayer.User.timePlayed/60)) } Hrs`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Most Time Played");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Hours", leaderboard.first, true);
      break;
    }
    case command.startsWith("global sr"): case command.startsWith("global season rank"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.seasonRank) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.seasonRank) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Season Rank");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Rank", leaderboard.first, true);
      break;
    }
    case command.startsWith("global triumph score"): case command.startsWith("global triumph"): case command.startsWith("global triumphs"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.triumphScore.score) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.triumphScore.score) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Triumph Score");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Score", leaderboard.first, true);
      break;
    }
    case command.startsWith("global cookies"): case command.startsWith("global event"): case command.startsWith("global dawning 2020"): {
      let top = leaderboardData.slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.dawning2020) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.dawning2020) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Dawning Spirit Collected");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Spirit", leaderboard.first, true);
      break;
    }
  }

  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
  });
}
function SendDrystreakLeaderboard(prefix, message, command, players, broadcasts, drystreaks) {
  if(drystreaks.length > 0) {
    let leaderboard = { names: [], first: [], second: [] }
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    let top = drystreaks.sort((a, b) => { return b.completions - a.completions }).slice(0, 10);
    leaderboard.names = top.map((e, index) => { return `${ e.obtained ? "✓" : "✗"} - ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
    leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.completions) }` });
    embed.setAuthor(`Top 10 Unluckiest People - ${ drystreaks[0].item }`);
    embed.setDescription(`These are not all loot runs. I cannot tell the difference between loot runs and non-loot runs. So these are just on what raid completion did they obtain the item on.\n\n✓ = Obtained, ✗ = Not Obtained`);
    embed.addField("Name", leaderboard.names, true);
    embed.addField("Completions", leaderboard.first, true);
    message.edit({embed});
  }
}

function MakeItChunky(array, maxArraySize, chunkSize) {
  return array.slice(0, maxArraySize).reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index / chunkSize);
    if(!resultArray[chunkIndex]) { resultArray[chunkIndex] = []; }
    resultArray[chunkIndex].push(item)
    return resultArray
  }, []);
}

module.exports = { MessageHandler }