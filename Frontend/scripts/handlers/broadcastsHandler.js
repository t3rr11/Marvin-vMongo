//Required Libraraies
const Discord = require('discord.js');
const Log = require('../../../Shared/log');
const Database = require('../../../Shared/database');
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
            if(!processed_broadcasts.find(e => e.clanID === broadcasts[i].clanID && e.membershipID === broadcasts[i].membershipID && e.season === broadcasts[i].season && e.broadcast === broadcasts[i].broadcast)) {
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
              processed_broadcasts.push({ "clanId": broadcasts[i].clanID, "membershipId": broadcasts[i].membershipID, "season": broadcasts[i].season, "broadcast": broadcasts[i].broadcast });
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
    //Loop through guilds and find guilds where the clan_id matches those guilds tracked clans.
    Database.findClanByID(broadcast.clanID, function FindClanByID(isError, isFound, data) {
      if(!isError) {
        if(isFound) {
          Database.getClanGuilds(broadcast.clanID, function GetClanGuilds(isError, isFound, guilds) {
            if(!isError) {
              if(isFound) {
                //Look for guilds that have the clanID.
                for(var i in guilds) {
                  //Check to see if they have broadcasts enabled. If they have broadcasts disabled it will return "0".
                  if(guilds[i].broadcasts.channel !== "0") {
                    if(broadcastType === "item") {
                      if(broadcast.count && broadcast.count !== -1) {
                        //If the broadcast count has a value other than -1 then it must be a raid broadcast so the message needs to be changed to include this.
                        BroadcastMessage = `${ broadcast.displayName } has obtained ${ broadcast.broadcast } in ${ broadcast.count } ${ broadcast.count > 1 ? "raids!" : "raid!" }`;
                      }
                      else { BroadcastMessage = `${ broadcast.displayName } has obtained ${ broadcast.broadcast }`; }
                      sendItemBroadcast(client, guilds[i], BroadcastMessage, broadcast, data);
                    }
                    else if(broadcastType === "title") {
                      BroadcastMessage = `${ broadcast.displayName } has obtained the ${ broadcast.broadcast } title!`;
                      sendTitleBroadcast(client, guilds[i], BroadcastMessage, broadcast, data);
                    }
                    else if(broadcastType === "clan") { BroadcastMessage = broadcast.broadcast; sendClanBroadcast(client, guilds[i], BroadcastMessage, broadcast, data); }
                    else if(broadcastType === "triumph") { BroadcastMessage = broadcast.broadcast; sendTriumphBroadcast(client, guilds[i], BroadcastMessage, broadcast, data); }
                    else if(broadcastType === "other") { BroadcastMessage = broadcast.broadcast; sendOtherBroadcast(client, guilds[i], BroadcastMessage, broadcast, data); }
                    else { Log.SaveError(`New broadcast type found, but we are unsure of what to do with it. Type: ${ broadcastType }`); }
                  }
                }
              }
              else { ErrorHandler("Med", `No clans found with the clanID: ${ broadcast.clanID }`) }

              //Finally remove broadcast from awaiting.
              Database.removeAwaitingBroadcast(broadcast, function RemoveAwaitingBroadcast(isError) {
                if(isError) { ErrorHandler("Low", "Failed to remove broadcast from awaiting broadcasts") }
              });
            }
            else { ErrorHandler("Med", data); didError = true; }
          });
        }
      }
      else { ErrorHandler("Med", data); didError = true; }
    });
  }
  //Finally add broadcast to collection and remove it from awaiting broadcasts.
  if(!didError) {
    Database.addBroadcast({ clanID: broadcast.clanID, displayName: broadcast.displayName, membershipID: broadcast.membershipID, season: broadcast.season, type: broadcast.type, broadcast: broadcast.broadcast, hash: broadcast.hash, count: broadcast.count }, function AddBroadcast(isError, severity, err) {
      if(isError) { ErrorHandler(severity, `Failed to add broadcast to broadcasts collection: ${ err }`) }
      else {
        Database.removeAwaitingBroadcast(broadcast, function RemoveAwaitingBroadcast(isError, severity, err) {
          if(isError) { ErrorHandler(severity, `Failed to remove broadcast from awaiting broadcasts: ${ err }`) }
        });
      }
    });
  }
}
async function sendItemBroadcast(client, guild, message, broadcast, clan) {
  let embed = null;
  console.log(guild);

  //Check to see if item broadcasts are enabled.
  if(guild.broadcasts.items) {

    var itemDef = GlobalItemsHandler.getGlobalItems().find(e => e.hash === broadcast.hash);
    var manifestItem = ManifestHandler.getManifest().DestinyCollectibleDefinition[broadcast.hash];
    
    //Change the embed based on the type of item
    if(itemDef && itemDef.advanced_type === "emblem") {
      embed = new Discord.MessageEmbed()
      .setColor(0xFFE000)
      .setTitle(`Clan Broadcast - ${ clan.clanName }`)
      .setDescription(message)
      .setImage(encodeURI(`https://bungie.net${ manifestItem.secondaryIcon }`))
      .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
      .setTimestamp();
    }
    else {
      embed = new Discord.MessageEmbed()
      .setColor(0xFFE000)
      .setTitle(`Clan Broadcast - ${ clan.clanName }`)
      .setDescription(message)
      .setThumbnail(encodeURI(`https://bungie.net${ manifestItem.displayProperties.icon }`))
      .setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL)
      .setTimestamp();
    }

    if(itemDef) {
      if(itemDef.description.length > 0){
        embed.addField("How to obtain:", itemDef.description);
      }
    }

    //Try send broadcast
    try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.broadcasts.channel).send({embed}); }
    catch(err) { console.log(`Failed to send item broadcast to ${ guild.guildID } because of ${ err }`); }
  }
}
async function sendBroadcast(client, guild, message, broadcast, clan) {
  //If it got to this step broadcasts are enabled.
  if(broadcast.type === "title" && guild.enable_broadcasts_titles === "true") {
    //If title, get title from definitions and adjust embed.
    var titleDef = ManifestHandler.DestinyRecordDefinition[broadcast.hash];
    
    //Check if broadcasts are enabled on that item.
    if(JSON.parse(titleDef.broadcast_enabled)) {
      embed = new Discord.MessageEmbed()
      .setColor(0xFFE000)
      .setTitle("Clan Broadcast")
      .setDescription(message)
      .setThumbnail(encodeURI(titleDef.imageUrl))
      .setFooter(Config.defaultFooter, Config.defaultLogoURL)
      .setTimestamp();

      if(titleDef.description.length > 0){ embed.addField("Obtained by:", titleDef.description) }
  
      try { client.guilds.cache.get(guild.guild_id).channels.cache.get(guild.broadcasts_channel).send({embed}); }
      catch(err) { console.log(`Failed to send title broadcast to ${ guild.guild_id } because of ${ err }`); }
    }
  }
  else if(broadcast.type === "clan" && guild.enable_broadcasts_clans === "true") {
    try { client.guilds.cache.get(guild.guild_id).channels.cache.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send clan broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
  else if(broadcast.type === "dungeon" && guild.enable_broadcasts_dungeons === "true") {
    try { client.guilds.cache.get(guild.guild_id).channels.cache.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send dungeon broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
  else if(broadcast.type === "catalyst" && guild.enable_broadcasts_catalysts === "true") {
    try { client.guilds.cache.get(guild.guild_id).channels.cache.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send catalyst broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
  else if(broadcast.type === "triumph" && guild.enable_broadcasts_triumphs === "true") {
    try { client.guilds.cache.get(guild.guild_id).channels.cache.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send triumph broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
  else if(broadcast.type === "other" && guild.enable_broadcasts_others === "true") {
    try { client.guilds.cache.get(guild.guild_id).channels.cache.get(guild.broadcasts_channel).send({embed}); }
    catch(err) { console.log(`Failed to send other broadcast to ${ guild.guild_id } because of ${ err }`); }
  }
}
async function sendFinishedLoadingAnnouncement(client, clan) {
  Database.getAllGuilds(function(isError, guilds) {
    if(!isError) {
      for(var i in guilds) {
        var clans = guilds[i].clans;
        for(var j in clans) {
          if(clans[j] === clan.clanID) {
            const thisDate = new Date();
            const embed = new Discord.MessageEmbed().setColor(0xFFE000).setAuthor("Clan Broadcast").setDescription(`${ clan.clanName } has finished loading for the first time. You are free to use commands now! For help use: ~help.`).setFooter(Config.defaultFooter, Config.defaultLogoURL).setTimestamp();
            try { Misc.getDefaultChannel(client.guilds.cache.get(guilds[i].guildID)).send({embed}); Log.SaveLog("Clans", `Informed ${ guilds[i].guildID } that the clan ${ clan.clanID } has finished loading.`); }
            catch(err) { Log.SaveError(`Failed to inform ${ guilds[i].guildID } that the clan ${ clan.clanID } has finished loading. Error: ${ err }`); }
          }
        }
      }
    }
  });
}

module.exports = { checkForBroadcasts, processBroadcast }