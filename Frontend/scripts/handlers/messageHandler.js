const fs = require('fs');
const Discord = require('discord.js');
const Register = require('./registerHandler.js');
const ClanHandler = require('./clanHandler.js');
const BroadcastHandler = require('./broadcastsHandler.js');
const Database = require('../../../Shared/database');
const Misc = require('../../../Shared/misc');
const Log = require('../../../Shared/log');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');
const ManifestHandler = require('../../../Shared/handlers/manifestHandler');
const RequestHandler = require('../../../Shared/handlers/requestHandler');
const GlobalItemsHandler = require('../../../Shared/handlers/globalItemsHandler');
const Config = require('../../../Shared/configs/Config.json');
const DiscordConfig = require(`../../../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);

function MessageHandler(client, message, guilds, users, APIDisabled) {
  if(message.guild) {
    var guild = guilds.find(e => e.guildID == message.guild.id);
    var prefix = guild ? guild.prefix : "~";
    if(message.guild.id === "110373943822540800" || message.guild.id === "264445053596991498") return;
    if(!message.guild.me.permissionsIn(message.channel.id).has('SEND_MESSAGES')) return;
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    if(message.content.startsWith("~~")) return;

    const args = message.content.slice(prefix.length);
    const command = args.toString().toLowerCase();
    let registeredUser = null;

    Log.SaveLog("Frontend", "Command", `User: ${ message.member.user.tag }, Command: ${ message.content.slice(0, 100) }`);

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
        case message.author.id === "194972321168097280" && command.startsWith("force manifest update"): { ManifestHandler.updateManifest(); message.channel.send("Manifest Update Forced"); break; }
        case message.author.id === "194972321168097280" && command === "force rescan": {
          Database.forceFullRescan(function ForceFullRescan(isError, severity, err) {
            if(isError) { ErrorHandler(severity, err); message.channel.send("Failed to force a full rescan."); }
            else { message.channel.send("Forced a full rescan."); }
          });
          break;
        }

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
        case command === "drystreaks": { GetHelp(prefix, message, command); break; }
        
        //Management
        case command === "current season": case command === "season": case command === "next season": { GetSeason(message); break; }
        case command.startsWith("register"): { Register(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("request"): { Request(client, message, command); break; }
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
        case command.startsWith("data "): { ItemInfo(prefix, message, command); break; }
        case command.startsWith("track "): { BroadcastHandler.enableItemBroadcast(prefix, message, command, guild); break; }
        case command.startsWith("untrack "): { BroadcastHandler.disableItemBroadcast(prefix, message, command, guild); break; }
        case command === "claninfo": { ClanInfo(prefix, message, command, guild); break; }

        //Rankings
        case command.startsWith("clan wars"): { message.channel.send(`The command is used without a space: \`${ prefix }Clanwars\`. It's for stability issues sorry.`); break; }
        case command.startsWith("clanwars "): { GetClanWars(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("global ") && !command.startsWith("globals"): { GetGlobal(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("item "): { GetObtainedItems(prefix, message, command, "obtained", users, registeredUser); break; }
        case command.startsWith("!item "): { GetObtainedItems(prefix, message, command, "not", users, registeredUser); break; }
        case command.startsWith("title "): { GetObtainedTitles(prefix, message, command, "obtained", users, registeredUser); break; }
        case command.startsWith("!title "): { GetObtainedTitles(prefix, message, command, "not", users, registeredUser); break; }
        case command.startsWith("valor"): case command.startsWith("glory"): case command.startsWith("infamy"): 
        case command.startsWith("levi"): case command.startsWith("leviathan"):
        case command.startsWith("eow"): case command.startsWith("eater of worlds"):
        case command.startsWith("sos"): case command.startsWith("spire of stars"):
        case command.startsWith("lw"): case command.startsWith("last wish"):
        case command.startsWith("sotp"): case command.startsWith("scourge"): case command.startsWith("scourge of the past"):
        case command.startsWith("cos"): case command.startsWith("sorrows"): case command.startsWith("crown of sorrows"):
        case command.startsWith("dsc"): case command.startsWith("deep stone crypt"):
        case command.startsWith("gos"): case command.startsWith("garden"): case command.startsWith("garden of salvation"):
        case command.startsWith("sr"): case command.startsWith("season rank"):
        case command.startsWith("power"): case command.startsWith("light"): case command.startsWith("highest power"): case command.startsWith("max power"): case command.startsWith("max light"):
        case command.startsWith("throne"): case command.startsWith("shattered throne"): case command.startsWith("pit"): case command.startsWith("pit of heresy"): case command.startsWith("prophecy"): 
        case command.startsWith("empire hunts"): case command.startsWith("empire hunt"):
        case command.startsWith("triumph score"): case command.startsWith("triumph"): case command.startsWith("triumphs"):
        case command.startsWith("time"): case command.startsWith("time played"): case command.startsWith("total time"):
        case command.startsWith("raids total"): case command.startsWith("total raids"): { GetLeaderboard(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("profile"): { GetProfile(prefix, message, command, "profile", users, registeredUser); break; }
        case command.startsWith("drystreak "): { GetDrystreak(prefix, message, command); break; }
        case command.startsWith("when "): { GetBroadcastDates(prefix, message, command); break; }

        //Trials
        case command.startsWith("trials weekly win streak"): case command.startsWith("trials seasonal win streak"): 
        case command.startsWith("trials weekly wins"): case command.startsWith("trials seasonal wins"): case command.startsWith("trials overall wins"): 
        case command.startsWith("trials weekly flawless"): case command.startsWith("trials seasonal flawless"): case command.startsWith("trials overall flawless"): 
        case command.startsWith("trials weekly final blows"): case command.startsWith("trials seasonal final blows"): case command.startsWith("trials overall final blows"): 
        case command.startsWith("trials weekly post wins"): case command.startsWith("trials seasonal post wins"): 
        case command.startsWith("trials weekly carries"): case command.startsWith("trials overall post wins"): 
        case command.startsWith("trials seasonal carries"): case command.startsWith("trials overall carries"): { GetLeaderboard(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("titles total"): case command.startsWith("total titles"): { GetTitleLeaderboard(prefix, message, command, users, registeredUser); break; }
        case command.startsWith("trials profile"):
        case command.startsWith("trials profile weekly"):
        case command.startsWith("trials profile seasonal"):
        case command.startsWith("trials profile overall"): { GetProfile(prefix, message, command, "trials", users, registeredUser); break; }

        //Others
        case command.startsWith("donate"): case command.startsWith("sponsor"): case command.startsWith("supporting"): { Donate(client, message); break; }
        case command.startsWith("checkapi"): { if(APIDisabled) { message.reply("API is offline."); } else { message.reply("API is online."); } break; }
        case command.startsWith("geo"): case command.startsWith("regions"): { GetGeolocationalData(client, message); }
        
        //Default - Unknown commands
        default: { message.channel.send(`I\'m not sure what that commands is sorry. Use \`${ prefix }help\` to see commands.`).then(msg => { msg.delete({ timeout: 3000 }) }).catch(); break; }
      }
    }
    catch (err) { ErrorHandler("High", err); message.channel.send("Uhh something went really wrong... Sorry about that."); }
  }
}
async function Donate(client, message) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  embed.setThumbnail(DiscordConfig.defaultLogoURL);
  embed.setAuthor("Want to help support future updates?");
  embed.setDescription(`By becoming a Patreon for $2.50 USD/month, Your clan will be scanned by a more powerful version of Marvin.\n\nThis means leaderboards and broadcasts will update anywhere from instant to ~30 seconds rather than the usual scan times between 5-10 minutes.`);
  embed.addField("Patreon <:patreon:779549421851377665>", "https://www.patreon.com/Terrii");
  embed.addField("Ko-fi <:kofi:779548939975131157>", "https://ko-fi.com/terrii_dev");
  embed.addField("Paypal <:paypal:779549835522080768>", "https://paypal.me/guardianstats");
  message.channel.send(embed);
}
async function Request(client, message, command) {
  const request = command.substr("request ".length);
  const embed = new Discord.MessageEmbed()
  .setColor(0x0099FF)
  .setAuthor(`New Request by ${ message.author.username }#${ message.author.discriminator }, ID: ${ message.author.id }`)
  .setDescription(request)
  .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
  .setTimestamp()
  client.guilds.cache.get('664237007261925404').channels.cache.get('664238376219836416').send({embed});
  message.reply("Your request has been sent, Thank your for your valuable feedback! Feel free to join the discord if you'd like to keep up to date about the status of this request. https://guardianstats.com/JoinMarvin");
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
              message.channel.send(`Too easy Marvin will only react to your new prefix \`${newPrefix}\`, Example: \`${newPrefix}help\`.`);
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
              message.channel.send(`Too easy in a few seconds Marvin will only react to the prefix \`${newPrefix}\`, Example: \`${newPrefix}help\``);
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

    embed.setAuthor(`${ item.displayProperties.name }`);
    if(item.displayProperties.description) { embed.setDescription(`${ item.displayProperties.description }${ item.collectibleHash ? `\n\nTo enable server broadcasts for this item use: \`${prefix}track ${ item.hash }\`` : "" }`); }
    else { embed.setDescription(`There is no description for this item.${ item.collectibleHash ? `\n\nTo enable server broadcasts for this item use: \`${prefix}track ${ item.hash }\`` : "" }`); }
    embed.addField(`Item Hash`, item.hash ? item.hash : "None", true);
    embed.addField(`Collectible Hash`, item.collectibleHash ? item.collectibleHash : "None", true);
    embed.addField(`Trackable`, item.collectibleHash ? "Yes" : "No", true);
    embed.setThumbnail(`https://bungie.net${ item.displayProperties.icon }`);
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

async function GetHelp(prefix, message, command) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  switch(command) {
    case "help rankings": case "rankings": {
      embed.setAuthor("Rankings Help Menu");
      embed.setDescription(`Here is a list of ranking commands! Example: \`${prefix}Iron Banner\``);
      embed.addField("Commands", `\`${prefix}Valor\`\n\`${prefix}Glory\`\n\`${prefix}Infamy\`\n\`${prefix}Iron Banner\`\n\`${prefix}Max Power\`\n\`${prefix}Triumph Score\`\n\`${prefix}Time Played\`\n\`${prefix}Season Rank\``);
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
      embed.addField("Raids", `\`${prefix}Clanwars Levi\`\n\`${prefix}Clanwars pLevi\`\n\`${prefix}Clanwars Eow\`\n\`${prefix}Clanwars pEow\`\n\`${prefix}Clanwars Sos\`\n\`${prefix}Clanwars pSos\`\n\`${prefix}Clanwars Last Wish\`\n\`${prefix}Clanwars Scourge\`\n\`${prefix}Clanwars Crown\`\n\`${prefix}Clanwars Garden\``);
      embed.addField("Others", `\`${prefix}Clanwars Season Rank\`\n\`${prefix}Clanwars Triumph Score\`\n\`${prefix}Clanwars Time Played\``);
      break;
    }
    case "help others": case "others": {
      embed.setAuthor("Others Help Menu");
      embed.setDescription(`Here is a list of other commands! Example: \`${prefix}Donate\``);
      embed.addField("Commands", `\`${prefix}Donate\``);
      break;
    }
    case "help drystreaks": case "drystreaks": {
      embed.setAuthor("Drystreaks Help Menu");
      embed.setDescription(`Here is a list of drystreak commands! Example: \`${prefix}Drystreak Anarchy\``);
      embed.addField("Commands", `\`${prefix}Drystreak One Thousand Voices\`\n\`${prefix}Drystreak Anarchy\`\n\`${prefix}Drystreak Always on Time\`\n\`${prefix}Drystreak Tarrabah\`\n\`${prefix}Drystreak Luxurious Toast\`\n\`${prefix}Drystreak Eyes of Tomorrow\``);
      break;
    }
    default: {
      embed.setAuthor("Hey there! I am Marvin.");
      embed.setDescription(`I have so many commands now i've had to split them up here is a list of my help commands! Example: \`${prefix}Rankings\``);
      embed.addField("Categories", `\`${prefix}Rankings\`, \`${prefix}Dungeons\`, \`${prefix}Raids\`, \`${prefix}Items\`, \`${prefix}Titles\`, \`${prefix}Seasonal\`, \`${prefix}Clan\`, \`${prefix}Globals\`, \`${prefix}Trials\`, \`${prefix}Clanwars\`, \`${prefix}Others\``);
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
  if(registeredUser && registeredUser !== "NoUser") { console.log("Check"); await Promise.all([await GetGuildPlayers(), await GetRegisteredUserInfo()]); }
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

  SendLeaderboard(prefix, message, command, players, privatePlayers, registeredUser, registeredPlayer, playerTitles, registeredPlayerTitles);
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
          if(type === "obtained") { if(!Misc.GetItemState(itemState).notAcquired) { obtained.push(user.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })); } }
          else { if(Misc.GetItemState(itemState).notAcquired) { obtained.push(user.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })); } }
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
  let obtained = [];
  let msg = await message.channel.send(new Discord.MessageEmbed().setColor(0x0099FF).setAuthor("Processing...").setDescription("This command takes a little to process. It will update in a few seconds.").setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp());

  //Get title
  var requestedTitleName = type === "obtained" ? command.substr("title ".length) : command.substr("!title ".length);
  var title = ManifestHandler.getManifestTitleByName(requestedTitleName);

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

  //Promise all
  if(title) {
    await Promise.all([await GetGuildPlayers(), await GetGuildTitles()]);

    if(title.length === 1) {
      for(var i in playerTitles) {
        let user = players.find(e => e.membershipID === playerTitles[i].membershipID);
        if(type === "obtained") { if(playerTitles[i].titles.find(e => e === title[0].hash)) { obtained.push(user.displayName); } }
        else { if(!playerTitles[i].titles.find(e => e === title[0].hash)) { obtained.push(user.displayName); } }
      }
    }
    else {
      for(let i in title) {
        for(var j in playerTitles) {
          let user = players.find(e => e.membershipID === playerTitles[j].membershipID);
          if(type === "obtained") { if(playerTitles[j].titles.find(e => e === title[i].hash)) { obtained.push(user.displayName); } }
          else { if(!playerTitles[j].titles.find(e => e === title[i].hash)) { obtained.push(user.displayName); } }
        }
      }
    }
  }

  SendTitlesLeaderboard(prefix, msg, command, type, players, obtained, title);
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
  var GetUserBroadcasts = () => new Promise(resolve => 
    Database.getUserBroadcasts(registeredUser.membershipID, function GetUserBroadcasts(isError, isFound, data) {
      if(!isError) { if(isFound) { registeredPlayerBroadcasts = data.filter(e => e.guildID === message.guild.id || e.guildID === "0"); } }
      resolve(true);
    })
  );

  //Promise all
  if(registeredUser && registeredUser !== "NoUser") {
    if(type === "profile") { await Promise.all([await GetGuildPlayers(), await GetGuildTitles(), await GetRegisteredUserInfo()]); }
  }
  else {
    if(type === "profile") { await Promise.all([await GetGuildPlayers(), await GetGuildTitles(), await GetRegisteredUserInfo(), await GetUserBroadcasts()]); }
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
        if(Misc.GetItemState(itemState).notAcquired) {
          drystreaks.push({
            "displayName": user.displayName,
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
        drystreaks.push({
          "displayName": user.displayName,
          "item": item.displayProperties.name,
          "obtained": true,
          "completions": broadcasts[i].count
        });
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
  embed.addField("Commands", `\`${prefix}Set broadcasts #channel\`\n\`${prefix}Remove broadcasts\`\n\`${prefix}Manage broadcasts\`\n\`${prefix}Toggle item broadcasts\`\n\`${prefix}Toggle title broadcasts\`\n\`${prefix}Toggle clan broadcasts\``);
  
  //Get mode, global items and extra items.
  let broadcastMode = guild.broadcasts.mode;
  let globalItems = (GlobalItemsHandler.getGlobalItems()).filter(e => { if(e.broadcastEnabled) { return e } });
  let extraItems = guild.broadcasts.extraItems.filter(e => { if(e.enabled) return e });
  let ignoredItems = guild.broadcasts.extraItems.filter(e => { if(!e.enabled) return e });

  //Check if broadcasts are enabled
  if(guild && guild?.broadcasts?.channel !== "0") {
    var chunkyGlobals = MakeItChunky(globalItems, 1000, 25);
    var chunkyExtras = MakeItChunky(extraItems, 1000, 25);
    var chunkyIgnored = MakeItChunky(ignoredItems, 1000, 25);

    if(globalItems.length > 0) { for(let i in chunkyGlobals) { embed.addField("Auto Broadcasts", chunkyGlobals[i].map(e => { return e.name }), true); } }
    if(extraItems.length > 0) { for(let i in chunkyExtras) { embed.addField("Manual Broadcasts", chunkyExtras[i].map(e => { return e.name }), true); } }
    if(ignoredItems.length > 0) { for(let i in chunkyIgnored) { embed.addField("Ignored Broadcasts", chunkyIgnored[i].map(e => { return e.name }), true); } }
  }

  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
  });
}

function SendLeaderboard(prefix, message, command, players, privatePlayers, registeredUser, registeredPlayer, playerTitles, registeredPlayerTitles) {
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
    case command.startsWith("sotp"): case command.startsWith("scourge"): case command.startsWith("scourge of the past"): {
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
    case command.startsWith("cos"): case command.startsWith("sorrows"): case command.startsWith("crown of sorrows"): {
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
    case command.startsWith("gos"): case command.startsWith("garden"): case command.startsWith("garden of salvation"): {
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
    case command.startsWith("dsc"): case command.startsWith("deep stone crypt"): {
      let top = players.sort((a, b) => { return b.raids.dsc - a.raids.dsc }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.raids.dsc) }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.raids.dsc) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Deep Stone Crypt Completions");
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
      if(command.startsWith("power -a") || command.startsWith("light -a") || command.startsWith("highest power -a") || command.startsWith("max power -a") || command.startsWith("max light -a")) {
        let top = players.sort((a, b) => { return (b.highestPower) - (a.highestPower) }).slice(0, 10);
        leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
        leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.highestPower) }` });
        if(registeredPlayer) {
          var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
          leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.highestPower) }`);
        }
        else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
        embed.setAuthor("Top 10 Highest Base Power");
        embed.addField("Name", leaderboard.names, true);
        embed.addField("Highest Base", leaderboard.first, true);
      }
      else {
        let top = players.sort((a, b) => { return (b.highestPower+b.powerBonus) - (a.highestPower+a.powerBonus) }).slice(0, 10);
        leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
        leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.highestPower+e.powerBonus) } (${ Misc.AddCommas(e.highestPower) } + ${ Misc.AddCommas(e.powerBonus) })` });
        if(registeredPlayer) {
          var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
          leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.highestPower+registeredPlayer.User.powerBonus) } (${ Misc.AddCommas(registeredPlayer.User.highestPower) } + ${ Misc.AddCommas(registeredPlayer.User.powerBonus) })`);
        }
        else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
        embed.setAuthor("Top 10 Highest Power");
        embed.addField("Name", leaderboard.names, true);
        embed.addField("Highest Power", leaderboard.first, true);
      }
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
    case command.startsWith("empire hunts"): case command.startsWith("empire hunt"): {
      let top = players.sort((a, b) => { return b.empireHunts.total - a.empireHunts.total }).slice(0, 10);
      leaderboard.names = top.map((e, index) => { return `${parseInt(index)+1}: ${ e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }` });
      leaderboard.first = top.map((e, index) => { return `${ e.empireHunts.total }` });
      if(registeredPlayer) {
        var rank = players.indexOf(players.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ registeredPlayer.User.empireHunts.total }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Empire Hunt Completions");
      embed.setDescription("Completions are for Empire Hunts on an elected difficulty. (Adept-Master)");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Completions", leaderboard.first, true);
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
      embed.setAuthor("Top 10 Total Titles");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Total", leaderboard.first, true);
      break;
    }

    //Default
    default: {
      embed.setAuthor("Uhh oh...");
      embed.setDescription(`So something went wrong and this command just didn't work. It dun broke. Please report using \`${prefix}request\``);
      break;
    }
  }

  message.channel.send({embed}).catch(err => {
    if(err.code === 50035) { message.channel.send("Discord has a limit of 1024 characters, for this reason i cannot send this message."); }
    else { Log.SaveLog("Frontend", "Error", err); message.channel.send("There was an error, this has been logged."); }
  });
}
function SendItemsLeaderboard(prefix, message, command, type, players, playerItems, item, dataType) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  
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
function SendTitlesLeaderboard(prefix, message, command, type, players, playerTitles, title) {
  let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  var chunkArray = playerTitles.slice(0, 100).reduce((resultArray, title, index) => { 
    const chunkIndex = Math.floor(index / 15);
    if(!resultArray[chunkIndex]) { resultArray[chunkIndex] = []; }
    resultArray[chunkIndex].push(title)
    return resultArray
  }, []);

  if(title) {
    if(playerTitles.length > 0) {
      embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ title[0].titleInfo.titlesByGender.Male }`);
      embed.setDescription(`This list can only show 100 players. There may be more not on this list depending on how many clans are tracked. ${ playerTitles.length > 100 ? `100 / ${ playerTitles.length }` : ` ${ playerTitles.length } / 100` }`);
      if(title[0].displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ title[0].displayProperties.icon }`); }
      for(var i in chunkArray) { embed.addField(`${ type === "obtained" ? "Obtained" : "Missing" }`, chunkArray[i], true); }
    }
    else {
      embed.setAuthor(`Showing users who ${ type === "obtained" ? "have" : "are missing" }: ${ title[0].titleInfo.titlesByGender.Male }`);
      embed.setDescription(`Nobody has it yet.`);
      if(title[0].displayProperties.hasIcon) { embed.setThumbnail(`https://bungie.net${ title[0].displayProperties.icon }`); }
    }
  }
  else {
    embed.setAuthor("Uhh oh...");
    embed.setDescription(`Could not find the title requested. If trying to search for Flawless or Conqourer use: Flawless S10, Conqourer S11, Etc.`);
  }

  message.edit(embed);
}
function SendClanWarsLeaderboard(prefix, message, command, registeredUser, registeredPlayer, clanData) {
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
        leaderboard.names.push("", `${ rank+1 }: ${ clan.clanName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(clan.data.seasonRanks) }`);
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
              console.log(registeredPlayer);
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
              embed.addField("Triumph Score", `${ Misc.AddCommas(registeredPlayerStats.triumphScore.data) } *(Rank: ${ Misc.addOrdinal(registeredPlayerStats.triumphScore.rank) })*`, true);
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
          leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.highestPower-registeredPlayer.User.powerBonus) }`);
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
        leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.highestPower) } (${ Misc.AddCommas(e.highestPower-e.powerBonus) } + ${ Misc.AddCommas(e.powerBonus) })` });
        if(registeredPlayer) {
          var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
          leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
          leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.highestPower) } (${ Misc.AddCommas(registeredPlayer.User.highestPower-registeredPlayer.User.powerBonus) } + ${ Misc.AddCommas(registeredPlayer.User.powerBonus) })`);
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
      leaderboard.first = top.map((e, index) => { return `${ Misc.AddCommas(e.triumphScore) }` });
      if(registeredPlayer) {
        var rank = leaderboardData.indexOf(leaderboardData.find(e => e.membershipID === registeredPlayer.User.membershipID));
        leaderboard.names.push("", `${ rank+1 }: ${ registeredPlayer.User.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x }) }`);
        leaderboard.first.push("", `${ Misc.AddCommas(registeredPlayer.User.triumphScore) }`);
      }
      else if(registeredUser === "NoUser") { leaderboard.names.push("", "User has not registered yet."); }
      embed.setAuthor("Top 10 Global Triumph Score");
      embed.addField("Name", leaderboard.names, true);
      embed.addField("Score", leaderboard.first, true);
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