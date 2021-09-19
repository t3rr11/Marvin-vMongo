//Required Libraraies
const Discord = require('discord.js');
const Database = require('../../../Shared/database');
const Log = require('../../../Shared/log');
const Misc = require('../../../Shared/misc');
const { ErrorHandler } = require('../../../Shared/handlers/errorHandler');
const RequestHandler = require('../../../Shared/handlers/requestHandler');
const Config = require('../../../Shared/configs/Config.json');
const { cleanString } = require('../../../Shared/misc');
const DiscordConfig = require(`../../../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);

async function Register(prefix, message, command, users, registeredUser) {
  if(command === "register") { message.reply(`To register please use: Use: \`${prefix}Register example\` example being your destiny username.`); }
  else if(command === "register example") { message.reply("To register please replace example with your destiny username."); }
  else {
    let username = command.substr("register ".length);
    if(!isNaN(username)) {
      if(!username.toString().startsWith("765")) {
        RequestHandler.GetMembershipsById(username, (isError, data) => {
          if(!isError) {
            if(data.Response) {
              if(data.Response.destinyMemberships.length === 0) {
                message.channel.send(`Could not find a Destiny 2 account that matches that ID, This has been logged, just check and make sure it starts with: 46116860\*\*\*\*\*\*\*`);
                Log.SaveLog("Frontend", "Error", `Could not find a user with the ID: ${ username }, Error: ${ JSON.stringify(data) }`);
              }
              else {
                for(var i in data.Response.destinyMemberships) {
                  if(data.Response.destinyMemberships[i].membershipId === username.toString()) {
                    FinishRegistration(message, command, users, registeredUser, data.Response.destinyMemberships[i]);
                  }
                }
              }
            }
            else {
              message.channel.send(`Could not find a Destiny 2 account that matches that ID, This has been logged, just check and make sure it starts with: 46116860\*\*\*\*\*\*\*`);
              Log.SaveLog("Frontend", "Error", `Could not find a user with the ID: ${ username }, Error: ${ JSON.stringify(data) }`);
            }
          }
          else {
            ErrorHandler("Med", data);
            if(data.ErrorCode === 217) {
              message.channel.send(`Could not find a Destiny 2 account that matches that ID. Try another ID? or Request help using \`${prefix}request\``);
            }
            else {
              message.channel.send(`There was an issue getting data for the requested user. Please try again, if it persits please report with \`${prefix}request\``);
            }
          }
        });
      }
      else { message.reply('This is your Steam ID not your Membership ID, Please follow these steps to get your Membership ID: \n\n1. Goto https://guardianstats.com and login there. \n2. Then if required choose a platform. \n3. If not then just click your name next to the setting wheel which will reveal your Membership ID.'); }
    }
    else {
      let search1 = [];
      let search2 = [];
      await new Promise(resolve => {
        RequestHandler.SearchPrefixDestinyPlayer(encodeURIComponent(username), async (isError, data) => {
          if(data.isError) { return; }
          const searchResults = data.Response.searchResults;
          await searchResults.map(e => {
            e.destinyMemberships.forEach(membership => {
              search1.push(membership);
            });
          });
          resolve();
        });
      });
      await new Promise(resolve => {
        RequestHandler.SearchDestinyPlayer(encodeURIComponent(username), async (isError, data) => {
          search2 = !data.isError ? data.Response : [];
          resolve();
        });
      });

      let searchResults = [...search1, ...search2];

      if(searchResults.length > 1) {
        let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();

        embed.setAuthor("Too many results...");
        embed.setDescription(`If I was unable to find your account it may be because it's under a different name, sometimes bungie does that.\n\nHere is a list of possibilities though. To select one please re-register with the ID associated: \`${prefix}Register 4611686018*****\` \n\n**Make sure you select the right platform if you play on more than 1 platform**`);

        if(searchResults.length > 10) {
          let chunkyResult = MakeItChunky(searchResults, Math.round(searchResults.length / 10));

          for(let chunk of chunkyResult) {

            let usernames = [];
            let ids = [];
            let clans = [];
            
            for(let i in chunk) {
              usernames.push(`${ GetPlatformEmoji(chunk[i].membershipType) } ${ chunk[i].bungieGlobalDisplayName }#${ chunk[i].bungieGlobalDisplayNameCode }`);
              ids.push(chunk[i].membershipId);
              await RequestHandler.GetClanFromMbmID(chunk[i].membershipType, chunk[i].membershipId, async function GetClanFromMbmID(isError, data) {
                if(!isError) {
                  if(data.Response.results.length > 0) { clans.push(data.Response.results[0].group.name); }
                  else { clans.push("-"); }
                }
                else { clans.push("-"); }
              });
            }
    
            embed.addField("Username", usernames, true);
            embed.addField("Clan", clans, true);
            embed.addField("Bungie ID", ids, true);
          }
        }
        else {
          let usernames = [];
          let ids = [];
          let clans = [];

          for(let i in searchResults) {
            usernames.push(`${ GetPlatformEmoji(searchResults[i].membershipType) } ${ searchResults[i].bungieGlobalDisplayName }#${ searchResults[i].bungieGlobalDisplayNameCode }`);
            ids.push(searchResults[i].membershipId);
            await RequestHandler.GetClanFromMbmID(searchResults[i].membershipType, searchResults[i].membershipId, async function GetClanFromMbmID(isError, data) {
              if(!isError) {
                if(data.Response.results.length > 0) { clans.push(data.Response.results[0].group.name); }
                else { clans.push("-"); }
              }
              else { clans.push("-"); }
            });
          }
  
          embed.addField("Username", usernames, true);
          embed.addField("Clan", clans, true);
          embed.addField("Bungie ID", ids, true);
        }

        try {
          message.channel.send({embed});
        }
        catch(err) {
          message.channel.send(`So something went wrong and this command just didn't work. It dun broke. Please report using \`${prefix}request\``);
        }
      }
      else if(searchResults.length === 0) { message.reply(`No users with that name found... Try this: \n\n1. Goto https://guardianstats.com and login there. \n2. Then if required choose a platform. \n3. If not then just click your name next to the setting wheel which will reveal your membershipId. \n4. Once you have copied that ID then just use the command like this \`${prefix}Register 1234567890\`.`); }
      else { FinishRegistration(message, command, users, registeredUser, searchResults[0]); }
    } 
  }
}

async function FinishRegistration(message, command, users, registeredUser, data) {
  Database.addRegisteredUser({ discordID: message.author.id, username: `${ data.bungieGlobalDisplayName }#${ data.bungieGlobalDisplayNameCode }`, membershipID: data.membershipId, platform: data.membershipType }, function(isError, isAdded, isUpdated) {
    if(!isError) {
      if(isAdded) { Log.SaveLog("Frontend", "Account", `${ data.bungieGlobalDisplayName }#${ data.bungieGlobalDisplayNameCode } has just registered!`); message.reply(`Your username has been set to: ${ data.bungieGlobalDisplayName }#${ data.bungieGlobalDisplayNameCode }. This takes a few seconds to update.`); }
      if(isUpdated) { Log.SaveLog("Frontend", "Account", `${ data.bungieGlobalDisplayName }#${ data.bungieGlobalDisplayNameCode } has updated their details!`); message.reply(`Your username has been updated to: ${ data.bungieGlobalDisplayName }#${ data.bungieGlobalDisplayNameCode }. This takes a few seconds to update.`); }
    }
    else {
      Log.SaveLog("Frontend", "Error", `Failed to set username for: ${ data.bungieGlobalDisplayName }#${ data.bungieGlobalDisplayNameCode }, Discord: ${ message.author.name } (${ message.author.id })`);
      message.reply(`Failed to set your username to: ${ data.bungieGlobalDisplayName }#${ data.bungieGlobalDisplayNameCode } this has been logged.`);
    }
  });
}

function GetPlatformEmoji(membershipType) {
  switch(membershipType) {
    case 1: { return "<:xbl:769837546037182475>" }
    case 2: { return "<:psn:769837546091053056>" }
    case 3: { return "<:steam:769837546179919892>" }
    case 4: { return "<:bnet:769837546132733962>" }
    case 5: { return "<:stadia:769837546024730634>" }
    default: { return membershipType }
  }
}

function MakeItChunky(arr, n) {
  var chunkLength = Math.max(arr.length/n ,1);
  var chunks = [];
  for (var i = 0; i < n; i++) {
    if(chunkLength*(i+1) <= arr.length) { 
      chunks.push(arr.slice(chunkLength*i, chunkLength*(i+1))) 
    };
  }
  return chunks; 
}

module.exports = Register;