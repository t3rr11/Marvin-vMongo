//Required Libraraies
const Discord = require('discord.js');
const Database = require('../../../Shared/database');
const Log = require('../../../Shared/log');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');
const RequestHandler = require('../../../Shared/handlers/requestHandler');
const Config = require('../../../Shared/configs/Config.json');
const DiscordConfig = require(`../../../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);

module.exports = { RegisterClan, AddClan, RemoveClan, GetTrackedClans };

async function RegisterClan(prefix, message, command) {
  Database.findRegisteredUserByID(message.author.id, function findRegisteredUserByID(isError, isFound, user) {
    if(!isError) {
      if(isFound) {
        Database.findGuildByID(message.guild.id, async function findGuildByID(isError, isFound, guild) {
          if(!isError) {
            if(!isFound) {
              RequestHandler.GetClanFromMbmID(user.platform, user.membershipID, function GetClanFromMbmID(isError, data) {
                if(!isError) {
                  if(data.Response.results.length > 0) {
                    let clan = data.Response.results[0].group;
                    Database.addGuild({
                      guildID: message.guild.id,
                      guildName: message.guild.name,
                      ownerID: message.author.id,
                      ownerAvatar: message.author.avatar,
                      clans: [clan.groupId],
                      region: message.guild.region,
                    }, (isError, severity, err) => {
                      if(isError) { ErrorHandler(severity, err); }
                      else {
                        Log.SaveLog("Frontend", "Clans", `Clan Added: ${ clan.name } (${ clan.groupId })`);
                        message.channel.send(`${ clan.name } has been successfully registered to this server! If this is the first time registering it may take a few minutes to grab your clans data for the first time.`);
                      }
                    });
                  }
                  else { message.reply("So you are apparently not in a clan? Was there a mistake in registering your username?"); }
                }
                else { ErrorHandler("Low", data); message.channel.send("There was an error when trying to get clan data. Try again?"); } 
              });
            }
            else {
              if(guild.clans.length === 0) {
                RequestHandler.GetClanFromMbmID(user.platform, user.membershipID, function GetClanFromMbmID(isError, data) {
                  if(!isError) {
                    if(data.Response.results.length > 0) {
                      let clan = data.Response.results[0].group;
                      Database.updateGuildByID(message.guild.id, { clans: [clan.groupId] }, (isError, severity, err) => {
                        if(isError) { ErrorHandler(severity, err); }
                        else {
                          Log.SaveLog("Frontend", "Clans", `Clan Added: ${ clan.name } (${ clan.groupId })`);
                          message.channel.send(`${ clan.name } has been successfully registered to this server! If this is the first time registering it may take a few minutes to grab your clans data for the first time.`);
                        }
                      });
                    }
                    else { message.reply("So you are apparently not in a clan? Was there a mistake in registering your username?"); }
                  }
                  else { ErrorHandler("Low", data); message.channel.send("There was an error when trying to get clan data. Try again?"); } 
                });
              }
              else { message.reply(`This server already has a registered clan, if you wish to add another to the tracking use \`${prefix}Add clan\`, or if you have changed clan use \`${prefix}Remove clan\` first.`); }
            }
          }
          else { ErrorHandler("Med", guild); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      }
      else { message.reply(`Please register first so that i know who you are in order to add your clan. Use: \`${prefix}Register\``); }
    }
    else { ErrorHandler("Med", user); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}
function AddClan(prefix, message, command) {
  Database.findRegisteredUserByID(message.author.id, function findRegisteredUserByID(isError, isFound, user) {
    if(!isError) {
      if(isFound) {
        let clanID = command.substr("add clan ".length);
        Database.findGuildByID(message.guild.id, async function findGuildByID(isError, isFound, guild) {
          if(!isError) {
            if(isFound) {
              if(guild.clans.length > 0) {
                if(guild.ownerID === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                  if(clanID.length > 0 && !isNaN(clanID)) {
                    RequestHandler.GetClan({ clanID }, function GetClan(id, isError, clan) {
                      if(!isError) {
                        const clans = guild.clans;
                        const clanData = clan.Response.detail;
                        if(clanData.clanInfo) {
                          if(!clans.includes(clanID)) {
                            clans.push(clanID.toString());
                            Database.updateGuildByID(message.guild.id, { clans }, function updateGuildByID(isError, severity, err) {
                              if(!isError) {
                                Log.SaveLog("Frontend", "Clans", `Clan Added: ${ clanData.name } (${ clanData.groupId }) to the tracking for ${ message.guild.id }`);
                                message.channel.send(`${ clanData.name } has been succesfully added and will start to be tracked for this server! If this is the first time they've been scanned, it may take a few minutes to load the data for the first time. Please wait.`);
                                CheckIfNewClan(clanID, clanData); //Check if it is a new clan.
                              }
                              else { ErrorHandler(severity, err); message.reply(`There was an error trying to add clan. Sorry please try again.`); }
                            });
                          }
                          else { message.reply(`${ clanData.name } (${ clanData.groupId }) is already being tracked by this server. Whatcha doing willis?`); }
                        }
                        else { ErrorHandler("Low", `A clan was found, but it is not a Destiny 2 clan. Not added sorry.`); message.channel.send(`A clan was found, but it is not a Destiny 2 clan. Not added sorry.`); }
                      }
                      else { ErrorHandler("High", clan); message.channel.send(`Failed to find a clan with the ID: ${ clanID }`); }
                    });
                  }
                  else {
                    const embed = new Discord.MessageEmbed()
                    .setColor(0x0099FF)
                    .setAuthor("How to add another clan!")
                    .setDescription(`In order to add a new clan to be tracked along side your main clan you will need to find that clan here: https://www.bungie.net/en/ClanV2/MyClans \n\nOnce you've found the clan you wish to add check the URL of the page, it should say \`https://www.bungie.net/en/ClanV2/Index?groupId=1234567\`. \n\nThen it's just a matter of using that groupId like this: \`${prefix}add clan 1234567\``)
                    .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
                    .setTimestamp()
                    message.channel.send({embed});
                  }
                }
                else { message.reply(`Only discord administrators or the one who linked this server can add or remove clans from the server. Get them to use: \`${prefix}add clan\` for you.`); }
              }
              else { RegisterClan(message, command); }
            }
            else { RegisterClan(message, command); }
          }
          else { Log.SaveLog("Frontend", "Error", "Failed to find clan."); message.reply("An error has occured... This has been logged, sorry about that!"); }
        });
      }
      else { message.reply(`Please register first so that i know who you are in order to add your clan. Use: \`${prefix}Register\``); }
    }
    else { Log.SaveLog("Frontend", "Error", "Failed to check if user exists"); message.reply("An error has occured... This has been logged, sorry about that!"); }
  });
}
function RemoveClan(prefix, message, command) {
  const clanID = command.substr("remove clan ".length);
  if(clanID.length > 0) {
    Database.findRegisteredUserByID(message.author.id, function findRegisteredUserByID(isError, isFound, user) {
      if(!isError) {
        if(isFound) {
          Database.findGuildByID(message.guild.id, async function findGuildByID(isError, isFound, guild) {
            if(!isError) {
              if(isFound) {
                if(guild.ownerID === message.author.id || message.member.hasPermission("ADMINISTRATOR")) {
                  if(guild.clans.includes(clanID)) {
                    var clans = [...guild.clans.filter(e => e.toString() !== clanID.toString())];
                    Database.updateGuildByID(message.guild.id, { clans }, function updateGuildByID(isError, severity, err) {
                      if(isError) { ErrorHandler(severity, err); }
                      else {
                        message.channel.send("Clan has been removed and will no longer be associated to this server.");
                        CheckIfStillTracking(clanID); //Check if clan still requires to be tracked.
                      }
                    });
                  }
                  else { message.channel.send(`This server does not track a clan with the ID: ${ clanID }, Try again?`); }
                }
                else { message.reply("Only discord administrators or the one who linked this server can remove the clan from the server."); }
              }
              else { message.reply("We could not find a clan to remove."); }
            }
            else { ErrorHandler("Med", guild); message.reply("An error has occured... This has been logged, sorry about that!"); }
          });
        }
        else { message.reply(`Please register first so that i know who you are in order to add your clan. Use: \`${prefix}Register\``); }
      }
      else { ErrorHandler("Med", "Failed to check if user exists"); message.reply("An error has occured... This has been logged, sorry about that!"); }
    });
  }
  else { GetTrackedClans(prefix, message, command); }
}
function CheckIfStillTracking(clanID) {
  //Now check if any clans are tracking that clanID, if not disable tracking for clan.
  Database.getTrackedClanGuilds(clanID, function CheckClanTracked(isError, isFound, data) {
    if(!isError && !isFound) {
      Database.updateClanByID(clanID, { isTracking: false }, function RemoveTrackingFromClan(isError, severity, err) {
        if(!isError) { Log.SaveLog("Frontend", "Clan", `Clan: ${ clanID } has been removed from tracking as there are no more guilds tracking it.`); }
        else { ErrorHandler(severity, `Failed to remove tracking from clan: ${ clanID }, ${ err }`) }
      });
    }
  });
}
function CheckIfNewClan(clanID, clanData) {
  Database.findClanByID(clanID, function CheckIfClanExists(isError, isFound, data) {
    if(!isError) {
      if(!isFound) {
        Database.addClan({ clanID: clanData.groupId, clanName: clanData.name, clanCallsign: clanData.clanInfo.clanCallsign }, (isError, severity, err) => {
          if(isError) { ErrorHandler(severity, err) }
          else { Log.SaveLog("Frontend", "Clan", `Clan: ${ clanID } has been added to tracking.`); }
        });
      }
      else {
        if(!data.isTracking) {
          Database.updateClanByID(clanID, { clanID: clanData.groupId, clanName: clanData.name, clanCallsign: clanData.clanInfo.clanCallsign, isTracking: true, firstScan: true }, function EnableTrackingForClan(isError, severity, err) {
            if(!isError) { Log.SaveLog("Frontend", "Clan", `Clan: ${ clanID } has come back! Re-tracking now.`); }
            else { ErrorHandler(severity, `Failed to enable tracking for clan: ${ clanID }, ${ err }`) }
          });
        }
      }
    }
    else { ErrorHandler(severity, `Failed to find clan: ${ clanID }, ${ err }`); }
  });
}
async function GetTrackedClans(prefix, message, command) {
  Database.findGuildByID(message.guild.id, async function findGuildByID(isError, isFound, guild) {
    if(!isError) {
      if(isFound) {
        var clanData = { "names": [], "ids":[] }
        for(var i in guild.clans) {
          await new Promise(resolve => Database.findClanByID(guild.clans[i], function(isError, isFound, clan) {
            if(!isError) {
              if(isFound) {
                clanData.names.push(clan.clanName);
                clanData.ids.push(clan.clanID);
              }
              else {
                clanData.names.push(`Unknown. Still loading data...`);
                clanData.ids.push(guild.clans[i]);
              }
            }
            resolve(true);
          }));
        }
        const embed = new Discord.MessageEmbed()
        .setColor(0x0099FF)
        .setAuthor("Clans Tracked")
        .setDescription(`To add another clan use: \`${prefix}add clan\`\n\nTo remove a tracked clan, use the clan id associated with the clan.\nExample: \`${prefix}remove clan 123456\``)
        .addField("Name", clanData.names, true)
        .addField("Clan ID", clanData.ids, true)
        .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
        .setTimestamp()
        message.channel.send({embed});
      }
      else { message.reply("Could not find and clans tracked by this guild."); }
    }
    else { ErrorHandler("Med", guild); message.reply("Could not find and clans tracked by this guild."); }
  });
}