//Required Libraraies
const Discord = require('discord.js');
const Log = require('../../../Shared/log');
const Database = require('../../../Shared/database');
const Misc = require('../../../Shared/misc');
const Config = require('../../../Shared/configs/Config.json');
const DiscordConfig = require(`../../../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);
const ManifestHandler = require('../../../Shared/handlers/manifestHandler');
const GlobalItemsHandler = require('../../../Shared/handlers/globalItemsHandler');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');

function checkForBroadcasts(client) {
  Database.getAwaitingBroadcasts(async function GetAwaitingBroadcasts(isError, isFound, broadcasts) {
    //This is a catch for broadcasts, if there is more than 30 then something went wrong, catch it and delete them.
    if(!isError) {
      if(isFound) {
        if(broadcasts.length < 30) {
          //This array will hold the broadcasts processed from the awaiting_broadcasts list. This is to avoid sending duplicate broadcasts in the same scan.
          var processed_broadcasts = [];
          for(var i in broadcasts) {
            if(!processed_broadcasts.find(e => 
                e.clanID === broadcasts[i].clanID && 
                e.membershipID === broadcasts[i].membershipID && 
                e.season === broadcasts[i].season && 
                e.broadcast === broadcasts[i].broadcast && 
                e.type === broadcasts[i].type && 
                e.guildID === broadcasts[i].guildID))    
            {
              //Check to see if it is a new broadcast
              await new Promise(resolve =>
                Database.findBroadcast(broadcasts[i], function FindBroadcast(isError, isFound, data) {
                  if(!isError) {
                    if(isFound) {
                      Database.removeAwaitingBroadcast(broadcasts[i], function RemoveAwaitingBroadcast(isError) {
                        if(isError) { ErrorHandler("Low", "Failed to remove broadcast from awaiting broadcasts") }
                      });
                    }
                    else { processBroadcast(client, broadcasts[i]); }
                  }
                  else { ErrorHandler("Low", "Error finding broadcast") }
                  resolve(true);
                })
              );
              //Processed Broadcast, Add to filter.
              processed_broadcasts.push({ "clanID": broadcasts[i].clanID, "membershipID": broadcasts[i].membershipID, "season": broadcasts[i].season, "broadcast": broadcasts[i].broadcast, "guildID": broadcasts[i].guildID });
            }
          }
        }
        else {
          Database.removeAllAwaitingBroadcasts(function RemoveAllAwaitingBroadcasts(isError) {
            if(isError) { ErrorHandler("Low", "Failed to remove all awaiting broadcasts") }
          });
        }
      }
    }
    else { ErrorHandler("Low", broadcasts); }
  });
}
async function processBroadcast(client, broadcast) {
  const broadcastType = broadcast.type;
  let BroadcastMessage = null;
  let didError = false;

  //Check to see if broadcasts are enabled. Usually disabled for debugging.
  if(Config.enableBroadcasts) {
    Database.findClanByID(broadcast.clanID, function FindClanByID(isError, isFound, clan) {
      if(!isError) {
        if(isFound) {
          Database.findGuildByID(broadcast.guildID, function FindGuildByID(isError, isFound, guild) {
            if(!isError) {
              if(isFound) {
                if(guild.broadcasts.channel !== "0") {
                  if(broadcastType === "item") {
                    if(typeof broadcast.count != "undefined" && broadcast.count > -1) {
                      //If the broadcast count has a value other than -1 then it must be a raid broadcast so the message needs to be changed to include this.
                      broadcast.count++;
                      BroadcastMessage = `${ broadcast.displayName } has obtained ${ broadcast.broadcast } on their ${ Misc.addOrdinal(broadcast.count) } clear! ${ broadcast.count === 1 ? "That lucky bastard." : "" }`;
                      if(broadcast.hash === 2298387876) {
                        // If trials shell custom message
                        BroadcastMessage = `${ broadcast.displayName } has obtained ${ broadcast.broadcast } on their ${ Misc.addOrdinal(broadcast.count) } win! ${ broadcast.count === 1 ? "That lucky bastard." : "" }`;
                      }
                    }
                    else { BroadcastMessage = `${ broadcast.displayName } has obtained ${ broadcast.broadcast }`; }
                    sendItemBroadcast(client, guild, BroadcastMessage, broadcast, clan);
                  }
                  else if(broadcastType === "title") {
                    BroadcastMessage = `${ broadcast.displayName } has obtained the ${ broadcast.broadcast } title!`;
                    sendTitleBroadcast(client, guild, BroadcastMessage, broadcast, clan);
                  }
                  else if(broadcastType === "gildedTitle") {
                    BroadcastMessage = `${ broadcast.displayName } has Gilded the ${ broadcast.broadcast } title!`;
                    sendGildedTitleBroadcast(client, guild, BroadcastMessage, broadcast, clan);
                  }
                  else if(broadcastType === "clan") { BroadcastMessage = broadcast.broadcast; sendClanBroadcast(client, guild, BroadcastMessage, broadcast, clan); }
                  else if(broadcastType === "dungeon") { BroadcastMessage = broadcast.broadcast; sendDungeonBroadcast(client, guild, BroadcastMessage, broadcast, clan); }
                  else if(broadcastType === "catalyst") { BroadcastMessage = broadcast.broadcast; sendCatalystBroadcast(client, guild, BroadcastMessage, broadcast, clan); }
                  else if(broadcastType === "triumph") { BroadcastMessage = broadcast.broadcast; sendTriumphBroadcast(client, guild, BroadcastMessage, broadcast, clan); }
                  else if(broadcastType === "other") { BroadcastMessage = broadcast.broadcast; sendOtherBroadcast(client, guild, BroadcastMessage, broadcast, clan); }
                  else if(broadcastType === "custom") { BroadcastMessage = broadcast.broadcast; sendCustomBroadcast(client, guild, BroadcastMessage, broadcast, clan); }
                  else { Log.SaveLog("Frontend", "Error", `New broadcast type found, but we are unsure of what to do with it. Type: ${ broadcastType }`); }
                }
              }
              else { ErrorHandler("Low", `No guild with the ID: ${ broadcast.guildID } found. Did not send broadcast.`) }
            }
            else { ErrorHandler("Low", guild) }
          });
        }
        else { ErrorHandler("Low", `No clan with the ID: ${ broadcast.clanID } found. Did not send broadcast.`) }
      }
      else { ErrorHandler("Low", clan) }
    });
  }

  //Add broadcast to broadcasts list and remove it from awaiting broadcasts
  Database.addBroadcast({ clanID: broadcast.clanID, guildID: broadcast.guildID, displayName: broadcast.displayName, membershipID: broadcast.membershipID, season: broadcast.season, type: broadcast.type, broadcast: broadcast.broadcast, hash: broadcast.hash, parentHash: broadcast.parentHash, count: broadcast.count }, function AddBroadcast(isError, severity, err) {
    if(isError) { ErrorHandler(severity, `Failed to add broadcast to broadcasts collection: ${ err }`) }
    else {
      Database.removeAwaitingBroadcast(broadcast, function RemoveAwaitingBroadcast(isError, severity, err) {
        if(isError) { ErrorHandler(severity, `Failed to remove broadcast from awaiting broadcasts: ${ err }`) }
      });
    }
  });
}
async function sendItemBroadcast(client, guild, message, broadcast, clan) {
  let embed = new Discord.MessageEmbed().setTitle(`Clan Broadcast - ${ clan.clanName }`).setDescription(message.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })).setColor(0xFFE000).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
  let sendBroadcast = true;
  //Check to see if item broadcasts are enabled.
  if(guild.broadcasts.items) {

    var itemDef = GlobalItemsHandler.getGlobalItems().find(e => e.hash === broadcast.hash);
    var manifestItem = ManifestHandler.getManifest().DestinyCollectibleDefinition[broadcast.hash];

    if(manifestItem) {
      //Change the embed based on the type of item
      if(itemDef && itemDef.advanced_type === "emblem") {
        embed.setImage(encodeURI(`https://bungie.net${ manifestItem.secondaryIcon }`));
      }
      else {
        embed.setThumbnail(encodeURI(`https://bungie.net${ manifestItem.displayProperties.icon }`));
      }
  
      if(itemDef && itemDef.description.length > 0) { embed.addField("How to obtain:", itemDef.description); }
  
      //Try send broadcast
      if(itemDef && !itemDef.broadcastEnabled) { sendBroadcast = false; }
      if(sendBroadcast) {
        try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
        catch(err) { console.log(`Failed to send item broadcast to ${ guild.guildID } because of ${ err }`); }
      }
    }
  }
}
async function sendTitleBroadcast(client, guild, message, broadcast, clan) {
  let embed = new Discord.MessageEmbed().setColor(0xFFE000).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  //Check to see if item broadcasts are enabled.
  if(guild.broadcasts.titles) {

    var manifestRecord = ManifestHandler.getManifest().DestinyRecordDefinition[broadcast.hash];
    
    if(manifestRecord) {
      embed.setTitle(`Clan Broadcast - ${ clan.clanName }`);
      embed.setDescription(message);
      if(manifestRecord?.displayProperties?.description) { embed.addField("Obtained by:", manifestRecord.displayProperties.description); }
      embed.setThumbnail(encodeURI(`https://bungie.net${ manifestRecord.displayProperties.icon }`));
      
      try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
      catch(err) { console.log(`Failed to send title broadcast to ${ guild.guildID } because of ${ err }`); }
    }
  }
}
async function sendGildedTitleBroadcast(client, guild, message, broadcast, clan) {
  let embed = new Discord.MessageEmbed().setColor(0xFFE000).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

  //Check to see if item broadcasts are enabled.
  if(guild.broadcasts.titles) {

    var globalRecord = GlobalItemsHandler.getGlobalItems().find(e => e.hash === broadcast.hash);
    if(globalRecord) {
      var manifestRecord = ManifestHandler.getManifest().DestinyRecordDefinition[globalRecord["_doc"].parentHash];
      if(manifestRecord) {
        embed.setTitle(`Clan Broadcast - ${ clan.clanName }`);
        embed.setDescription(message);
        embed.setThumbnail(encodeURI(`https://bungie.net${ manifestRecord.displayProperties.icon }`));
        
        try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
        catch(err) { console.log(`Failed to send title broadcast to ${ guild.guildID } because of ${ err }`); }
      }
    }
    else { console.log(`Failed to send title broadcast to ${ guild.guildID } because global record for ${ broadcast.hash } was not found.`); }
  }
}
async function sendClanBroadcast(client, guild, message, broadcast, clan) {
  let embed = new Discord.MessageEmbed()
  .setColor(0xFFE000)
  .setTitle(`Clan Broadcast - ${ clan.clanName }`)
  .setDescription(message)
  .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
  .setTimestamp();
  try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
  catch(err) { console.log(`Failed to send clan broadcast to ${ guild.guildID } because of ${ err }`); }
}
async function sendDungeonBroadcast(client, guild, message, broadcast, clan) {
  let embed = new Discord.MessageEmbed()
  .setColor(0xFFE000)
  .setTitle(`Clan Broadcast - ${ clan.clanName }`)
  .setDescription(message)
  .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
  .setTimestamp();
  try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
  catch(err) { console.log(`Failed to send dungeon broadcast to ${ guild.guildID } because of ${ err }`); }
}
async function sendCatalystBroadcast(client, guild, message, broadcast, clan) {
  let embed = new Discord.MessageEmbed()
  .setColor(0xFFE000)
  .setTitle(`Clan Broadcast - ${ clan.clanName }`)
  .setDescription(message)
  .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
  .setTimestamp();
  try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
  catch(err) { console.log(`Failed to send catalyst broadcast to ${ guild.guildID } because of ${ err }`); }
}
async function sendTriumphBroadcast(client, guild, message, broadcast, clan) {
  var manifestRecord = ManifestHandler.getManifest().DestinyRecordDefinition[broadcast.hash];
  let embed = new Discord.MessageEmbed()
  .setColor(0xFFE000)
  .setTitle(`Clan Broadcast - ${ clan.clanName }`)
  .setDescription(`${ broadcast.displayName } has obtained the ${ broadcast.broadcast } triumph!${ manifestRecord?.displayProperties?.description ? `\n\n**How to obtain:**\n ${ manifestRecord.displayProperties.description }` : "" }`)
  .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
  .setTimestamp();
  try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
  catch(err) { console.log(`Failed to send triumph broadcast to ${ guild.guildID } because of ${ err }`); }
}
async function sendOtherBroadcast(client, guild, message, broadcast, clan) {
  let embed = new Discord.MessageEmbed()
  .setColor(0xFFE000)
  .setTitle(`Clan Broadcast - ${ clan.clanName }`)
  .setDescription(message)
  .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
  .setTimestamp();
  try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
  catch(err) { console.log(`Failed to send other broadcast to ${ guild.guildID } because of ${ err }`); }
}
async function sendCustomBroadcast(client, guild, message, broadcast, clan) {
  let embed = new Discord.MessageEmbed()
  .setColor(0xFFE000)
  .setTitle(`Clan Broadcast - ${ clan.clanName }`)
  .setDescription(message)
  .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
  .setTimestamp();
  try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] }); }
  catch(err) { console.log(`Failed to send custom broadcast to ${ guild.guildID } because of ${ err }`); }
}
async function sendFinishedLoadingAnnouncement(client, clan) {
  Database.getClanGuilds(clan.clanID, function(isError, isFound, guilds) {
    if(!isError) {
      if(isFound) {
        for(var i in guilds) {
          let guild = guilds[i];
          const embed = new Discord.MessageEmbed()
          .setColor(0xFFE000)
          .setTitle("Clan Broadcast")
          .setDescription(`${ clan.clanName } has finished loading for the first time. You are free to use commands now!`)
          .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
          .setTimestamp();
          try {
            if(guild.broadcasts.channel === "0") { getDefaultChannel(client.guilds.cache.get(guild.guildID)).send({ embeds: [embed] }); }
            else {
              client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({ embeds: [embed] });
              Log.SaveLog("Frontend", "Clans", `Informed ${ guild.guildID } that the clan ${ clan.clanID } has finished loading.`);
            }
          }
          catch(err) { Log.SaveLog("Frontend", "Error", `Failed to inform ${ guild.guildID } that the clan ${ clan.clanID } has finished loading. Error: ${ err }`); }
        }
      }
      else { ErrorHandler("Med", `Failed to sent finished loading broadcast due to there being no guilds with the clanID: ${ clan.clanID }.`); }
    }
    else { ErrorHandler("Med", guilds); }
  });
}
async function enableItemBroadcast(prefix, message, command, guild) {
  if(guild) {
    if(guild.ownerID === message.author.id || message.member.permissions.has("ADMINISTRATOR")) {
      //Check for multiple items
      const requestedItems = command.substr("track ".length).split(",");
      //Get all items
      let items = [];
      for(let i in requestedItems) {
        if(isNaN(requestedItems[i])) {
          let item = ManifestHandler.getManifestItemByName(requestedItems[i]);
          item ? items.push(item) : null;
        }
        else {
          let itemByHash = ManifestHandler.getManifestItemByHash(requestedItems[i]);
          let itemByCollectible = ManifestHandler.getManifestItemByCollectibleHash(requestedItems[i]);
          if(itemByHash) {
            items.push(itemByHash);
          }
          else if(itemByCollectible) {
            let itemByHashFromCollectible = ManifestHandler.getManifestItemByHash(itemByCollectible.itemHash);
            if(itemByHashFromCollectible) {
              items.push(itemByHashFromCollectible);
            }
          }
        }
      }

      //If items exist add them to tracking
      if(items.length > 0) {
        let canTrack = [];
        let canNotTrack = [];

        for(let i in items) {
          if(items[i].collectibleHash) {
            await new Promise(resolve =>
              Database.enableItemBroadcast(guild, items[i], function EnableItemBroadcast(isError, severity, err) {
                if(isError) { canNotTrack.push({ item: items[i], reason: err }); }
                else {
                  Log.SaveLog("Frontend", "Info", `Item: ${ items[i].displayProperties.name } is now being tracked by ${ guild.guildName } (${ message.guild.id })`);
                  canTrack.push({ item: items[i] });
                }
                resolve(true);
              })
            );
          }
          else { canNotTrack.push({ item: items[i], reason: "No collectible hash found for item" }); }
        }

        //Let the user know successful and unsuccessful item tracks.
        if(canTrack.length > 0) {
          let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
          embed.setTitle("Success");
          embed.setDescription(`**Now Tracking** ${ canTrack.map(e => { return `\n${e.item.displayProperties.name}` }) } ${ canNotTrack.length > 0 ? `\n\n**Failed to track these items**: ${ canNotTrack.map(e => { return `\n${e.item.displayProperties.name}` }) }\n\n**Due to these reasons**: ${ canNotTrack.map(e => { return `\n${e.reason}` } ) }` : `` }\n\n Please allow me 30 seconds to make the change!`);
          message.channel.send({ embeds: [embed] })
        }
        else {
          let embed = new Discord.MessageEmbed().setTitle("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
          embed.setTitle("Uhh oh...");
          embed.setDescription(`${ canNotTrack.length > 0 ? `**Failed to track these items**: ${ canNotTrack.map(e => { return `\n${e.item.displayProperties.name}` }) }\n\n**Due to these reasons**: ${ canNotTrack.map(e => { return `\n${e.reason}` } ) }` : `` }`);
          message.channel.send({ embeds: [embed] })
        }
      }
      else {
        let errorEmbed = new Discord.MessageEmbed().setTitle("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
        errorEmbed.setDescription(`Could not find any of the the requested items. Sorry!`);
        message.channel.send({ embeds: [errorEmbed] })
      }
    }
    else {
      let errorEmbed = new Discord.MessageEmbed().setTitle("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
      errorEmbed.setDescription("You do not have permission to use this command, only the person who first setup Marvin or any server Administrator can make changes.");
      message.channel.send({ embeds: [errorEmbed] })
    }
  }
  else {
    let errorEmbed = new Discord.MessageEmbed().setTitle("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    errorEmbed.setDescription("Cannot track item because this guild has no registered clans yet.");
    message.channel.send({ embeds: [errorEmbed] })
  }
}
async function disableItemBroadcast(prefix, message, command, guild) {
  if(guild) {
    if(guild.ownerID === message.author.id || message.member.permissions.has("ADMINISTRATOR")) {     
      //Check for multiple items
      const requestedItems = command.substr("untrack ".length).split(",");
      //Get all items
      let items = [];
      for(let i in requestedItems) {
        if(isNaN(requestedItems[i])) {
          let item = ManifestHandler.getManifestItemByName(requestedItems[i]);
          item ? items.push(item) : null;
        }
        else {
          let itemByHash = ManifestHandler.getManifestItemByHash(requestedItems[i]);
          let itemByCollectible = ManifestHandler.getManifestItemByCollectibleHash(requestedItems[i]);
          if(itemByHash) {
            items.push(itemByHash);
          }
          else if(itemByCollectible) {
            let itemByHashFromCollectible = ManifestHandler.getManifestItemByHash(itemByCollectible.itemHash);
            if(itemByHashFromCollectible) {
              items.push(itemByHashFromCollectible);
            }
          }
        }
      }

      //If items exist remove them from tracking
      if(items.length > 0) {
        let canTrack = [];
        let canNotTrack = [];

        for(let i in items) {
          if(items[i].collectibleHash) {
            await new Promise(resolve =>
              Database.disableItemBroadcast(guild, items[i], function DisableItemBroadcast(isError, severity, err) {
                if(isError) { canNotTrack.push({ item: items[i], reason: err }); }
                else {
                  Log.SaveLog("Frontend", "Info", `Item: ${ items[i].displayProperties.name } is no longer being tracked by ${ guild.guildName } (${ message.guild.id })`);
                  canTrack.push({ item: items[i] });
                }
                resolve(true);
              })
            );
          }
          else { canNotTrack.push({ item: items[i], reason: "No collectible hash found for item" }); }
        }

        //Let the user know successful and unsuccessful item untracks.
        if(canTrack.length > 0) {
          let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
          embed.setTitle("Success");
          embed.setDescription(`**No Longer Tracking** ${ canTrack.map(e => { return `\n${e.item.displayProperties.name}` }) } ${ canNotTrack.length > 0 ? `\n\n**Failed to untrack these items**: ${ canNotTrack.map(e => { return `\n${e.item.displayProperties.name}` }) }\n\n**Due to these reasons**: ${ canNotTrack.map(e => { return `\n${e.reason}` } ) }` : `` }\n\n Please allow me 30 seconds to make the change!`);
          message.channel.send({ embeds: [embed] })
        }
        else {
          let embed = new Discord.MessageEmbed().setTitle("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
          embed.setTitle("Uhh oh...");
          embed.setDescription(`${ canNotTrack.length > 0 ? `**Failed to untrack these items**: ${ canNotTrack.map(e => { return `\n${e.item.displayProperties.name}` }) }\n\n**Due to these reasons**: ${ canNotTrack.map(e => { return `\n${e.reason}` } ) }` : `` }`);
          message.channel.send({ embeds: [embed] })
        }
      }
      else {
        let errorEmbed = new Discord.MessageEmbed().setTitle("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
        errorEmbed.setDescription(`Could not find any of the the requested items. Sorry!`);
        message.channel.send({ embeds: [errorEmbed] })
      }
    }
    else {
      let errorEmbed = new Discord.MessageEmbed().setTitle("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
      errorEmbed.setDescription("You do not have permission to use this command, only the person who first setup Marvin or any server Administrator can make changes.");
      message.channel.send({ embeds: [errorEmbed] })
    }
  }
  else {
    let errorEmbed = new Discord.MessageEmbed().setTitle("Uhh oh...").setColor(0xFF3348).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    errorEmbed.setDescription("Cannot untrack item because this guild has no registered clans yet.");
    message.channel.send({ embeds: [errorEmbed] })
  }
}
function getDefaultChannel(guild) { return guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')); }

module.exports = { checkForBroadcasts, processBroadcast, enableItemBroadcast, disableItemBroadcast, sendFinishedLoadingAnnouncement, sendItemBroadcast, sendCustomBroadcast }