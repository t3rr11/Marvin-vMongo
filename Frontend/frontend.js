//Required Libraraies
const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const Database = require('../Shared/database');
const Checks = require('../Shared/checks');
const Log = require('../Shared/log');
const Misc = require('../Shared/misc');
const { MessageHandler } = require('./scripts/handlers/messageHandler');
const BroadcastHandler = require('./scripts/handlers/broadcastsHandler');
const AnnouncementsHandler = require('./scripts/handlers/announcementsHandler');
const GlobalItemsHandler = require('../Shared/handlers/globalItemsHandler');
const ManifestHandler = require('../Shared/handlers/manifestHandler');
const RequestHandler = require('../Shared/handlers/requestHandler');
const Config = require('../Shared/configs/Config.json');
const Interactions = require('../Shared/configs/Interactions.json');
const { ErrorHandler } = require('../Shared/handlers/errorHandler');
const DiscordConfig = require(`../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);
const DBL = require("dblapi.js");
const dbl = new DBL('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzMTM1MTM2Njc5OTA2NTA4OCIsImJvdCI6dHJ1ZSwiaWF0IjoxNTg0NDIxMzAxfQ.qZ5CrrQdaC9cIfeuqx7svNTwiSTH_R0JD5H-1CVzrCo', client);

//Variables
let InitializationTime = new Date().getTime();
let DiscordReady = false;
let APIDisabled = false;
let APILastDisabled = new Date().getTime();
let Users = 0;
let Guilds = [];
let Clans = [];
let NewClans = [];
let RegisteredUsers = [];
let isConnecting = false;
let commandsInput = 0;
let ResetTime = 0;

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.FrontendConnect(); }
  console.log(DiscordReady, Database.checkDBConnection(), GlobalItemsHandler.checkGlobalItems(), ManifestHandler.checkManifestMounted());
  if(DiscordReady && Database.checkDBConnection() && GlobalItemsHandler.checkGlobalItems() && ManifestHandler.checkManifestMounted()) {
    //Initialize the frontend and start running!
    clearInterval(startupCheck);
    await update();

    //Setup interactions
    //await setupInteractions();

    //Finally start the bot
    init();
  }
}, 1000);

//Startup
async function init() {
  //Start Up Console Log
  Log.SaveLog("Frontend", "Startup", `Bot has started, with ${ Users } users, in ${ client.guilds.cache.size } guilds. Tracking ${ Clans.length } clans!`);

  setInterval(() => { update() }, 1000 * 10); //Every 10 seconds
  setInterval(() => { Log.LogFrontendStatus(Users, client.guilds.cache.size, commandsInput, (new Date().getTime() - InitializationTime)) }, 1000); //Every 1 second
  setInterval(() => { UpdateActivityList() }, 1000 * 20); //Every 20 seconds
  setInterval(() => { ManifestHandler.checkManifestUpdate("frontend"); }, 1000 * 60 * 10); //10 Minute Interval

  //Get next reset and set timer to update gunsmith mods, this function is also used for other daily broadcasts.
  Database.getGunsmithMods((isError, isFound, data) => {
    if(!isError && isFound) {
      ResetTime = data.nextRefreshDate;
      let millisUntil = (new Date(ResetTime).getTime() - new Date().getTime());
      let resetOffset = 1000 * 60 * 15; //This is just to wait a few minutes after reset before grabbing data.
      setTimeout(() => {
        //Update the mod slots to stop this check.
        updateGunsmithMods();
      }, millisUntil + resetOffset);
    }
  });

  //Start Logger
  //I wanted to explain this a little, the timeout is here to do the first log which is never exactly an hour after startup.
  //Then it'll start the hourly interval which logs like normal every hour.
  setTimeout(() => {
    Log.LogHourlyFrontendStatus(Users, client.guilds.cache.size, commandsInput, (new Date().getTime() - InitializationTime));
    commandsInput = 0;
    setInterval(() => {
      Log.LogHourlyFrontendStatus(Users, client.guilds.cache.size, commandsInput, (new Date().getTime() - InitializationTime));
      commandsInput = 0;
    }, 1000 * 60 * 60);
  }, 3600000 - new Date().getTime() % 3600000);
}

//Functions
function UpdateActivityList() {
  if(APIDisabled) { client.user.setActivity("The Bungie API is undergoing maintenance. Commands will work like normal but may not show the latest information due to this."); }
  else {
    var ActivityList = [];
    ActivityList.push(`Serving ${ Users } users`);
    ActivityList.push(`Tracking ${ Clans.length } clans!`);
    ActivityList.push(`Use ~Help or ~Request for Support`);
    ActivityList.push(`You can now change your prefix by using: ~set prefix`);
    ActivityList.push(`~Legend and ~Master are now re-enabled.`);
    ActivityList.push(`Want Faster Broadcasts? Consider Supporting, ~Support`);
    ActivityList.push(`Wonder what clannies are upto? Use: ~Clan Activity`);
    var activity = ActivityList[Math.floor(Math.random() * ActivityList.length)];
    client.user.setActivity(activity);
  }
}

async function update() {
  //Update Users
  Users = 0; for(let g in client.guilds.cache.array()) { var guild = client.guilds.cache.array()[g]; try { if(!isNaN(guild.memberCount)) { Users = Users + guild.memberCount; } } catch (err) { } }

  //Update clans
  await new Promise(resolve => Database.getAllClans(function GetAllClans(isError, isFound, clans) {
    if(!isError) {
      if(isFound) {
        for(var i in clans) {
          Clans = clans.filter(e => e.isTracking);
          if(clans[i].firstScan) {
            //Found new clan, added.
            if(!NewClans.find(e => e === clans[i].clanID)) { NewClans.push(clans[i].clanID); }
          }
          else {
            //Remove and broadcast that it's finished loading.
            if(NewClans.find(e => e === clans[i].clanID)) {
              NewClans.splice(NewClans.indexOf(clans[i].clanID), 1);
              BroadcastHandler.sendFinishedLoadingAnnouncement(client, clans[i]);
            }
          }
        }
      }
    }
    else { ErrorHandler("Low", clans); }
    resolve(true);
  }));

  //Update guilds
  await new Promise(resolve => Database.getTrackedGuilds(function GetTrackedGuilds(isError, isFound, data) {
    if(!isError) { if(isFound) { Guilds = data; } }
    else { ErrorHandler("Low", data); }
    resolve(true);
  }));

  //Update RegisteredUsers
  await new Promise(resolve => Database.getAllRegisteredUsers(function GetAllRegisteredUsers(isError, isFound, data) {
    if(!isError) { if(isFound) { RegisteredUsers = data; } }
    else { ErrorHandler("Low", data); }
    resolve(true);
  }));

  //Check Maintenance
  await Checks.CheckMaintenance(APIDisabled, (isDisabled) => {
    if(APIDisabled === true && isDisabled === false) {
      if((new Date().getTime() - new Date(APILastDisabled).getTime()) > (1000 * 60 * 15)) {
        Database.forceFullRescan(function ForceFullRescan(isError, severity, err) {
          if(isError) { ErrorHandler(severity, err); }
          else { Log.SaveLog("Frontend", "Info", `Forced a full rescan due to API Maintenance being over.`); }
        });
      }
    }
    if(isDisabled) { APILastDisabled = new Date().getTime(); }
    APIDisabled = isDisabled;
  });
  
  //Check for broadcasts
  if(!Config.isLocal) { BroadcastHandler.checkForBroadcasts(client); }
}
async function setupInteractions() {
  //const url = `https://discord.com/api/v8/applications/${ DiscordConfig.client_id }/commands`;
  const url = `https://discord.com/api/v8/applications/${ DiscordConfig.client_id }/guilds/305561313675968513/commands`;
  const request = await fetch(url, { headers: { "Authorization": `Bot ${ DiscordConfig.token }`, 'Content-Type': 'application/json' }, method: 'POST', body: JSON.stringify(Interactions) }).then(async (req) => { console.log(req); return true; }).catch((err) => { return false; });
  console.log(request);
}
async function updateGunsmithMods() {
  RequestHandler.GetGunsmithMods(async function(isError, Gunsmith) {    
    if(!isError && Gunsmith?.Response?.sales?.data) {
      const gunsmithSales = Gunsmith.Response.sales.data;
      const refreshDate = Gunsmith.Response.vendor.data.nextRefreshDate;
      const modsRaw = Object.values(gunsmithSales).filter(e => (ManifestHandler.getManifestItemByHash(e.itemHash))?.itemType === 19);
      const mods = Object.values(modsRaw).map(e => {
        let mod = ManifestHandler.getManifestItemByHash(e.itemHash);
        return {
          name: mod.displayProperties.name,
          icon: mod.displayProperties.icon,
          description: mod.displayProperties.description,
          hash: mod.hash,
          collectibleHash: mod.collectibleHash
        }
      });

      //Add new database entry.
      Database.addGunsmithMods({ mods: mods, nextRefreshDate: refreshDate }, function addGunsmithMods(isError, isFound, data) { if(isError) { ErrorHandler("High", data); } });

      //Finally send the announcement out to all discords that have them enabled.
      AnnouncementsHandler.sendGunsmithBroadcasts(client, Guilds, mods);

      //Send other daily announcements
      try {
        AnnouncementsHandler.sendDailyLostSectorBroadcasts(client, Guilds);
      }
      catch(err) { ErrorHandler("High", `Failed to run other daily announcements.`); }

      //Reset the announcement to broadcast again the next day
      let millisUntil = (new Date(refreshDate).getTime() - new Date().getTime());
      let resetOffset = 1000 * 60 * 15;
      setTimeout(() => updateGunsmithMods(), millisUntil + resetOffset);
    }
    else {
      //If failed for some reason, set a timeout to retry and log error.
      ErrorHandler("Med", `Failed to update Gunsmith mods, retrying in 60 seconds.`);
      setTimeout(() => { updateGunsmithMods(); }, 60000);
    }
  });
}

//Joined a server
client.on("guildCreate", guild => {
  try {
    Log.SaveLog("Frontend", "Server", `Joined a new guild: ${ guild.name } (${ guild.id })`);
    Database.enableGuildTracking(guild.id, function enableGuildTracking(isError, isFound, data) {
      if(!isError) {
        if(isFound) { Log.SaveLog("Frontend", "Server", `Tracking Re-Enabled: ${ guild.name } (${ guild.id })`); }
        else {
          const embed = new Discord.MessageEmbed()
          .setColor(0x0099FF)
          .setAuthor("Hey there!")
          .setDescription("I am Marvin. To set me up first register with me by using the `~Register example` command. Replace example with your in-game username. \n\nOnce registration is complete use the `~Set clan` command and **then wait 5 minutes** whilst I scan your clan. That's it you'll be ready to go! \n\nTry out clan broadcasts this can be set up by typing `~Set Broadcasts #general` (does not have to be general). \n\nSee `~help` to see what I can do!")
          .setFooter(Config.defaultFooter, Config.defaultLogoURL)
          .setTimestamp();
          try { getDefaultChannel(guild).send({ embed }) }
          catch (err) { Log.SaveLog("Frontend", "Error", `Failed to give welcome message to: ${ guild.name } (${ guild.id })`); }
        }
      }
    });
  }
  catch (err) { console.log("Failed to re-enable tracking for a clan."); }
});

//Removed from a server
client.on("guildDelete", guild => {
  Log.SaveLog("Frontend", "Server", `Left a guild: ${ guild.name } (${ guild.id })`);
  Database.disableGuildTracking(guild.id, function disableGuildTracking(isError, isFound, data) {
    if(!isError) { if(isFound) { Log.SaveLog("Frontend", "Server", `Tracking Disabled: ${ guild.name } (${ guild.id })`); } }
    else { ErrorHandler("High", `Failed to disable guild tracking for ${ guild.id }`); }
  });
});

//Watch for commands via Interactions
client.on("interactionCreate", (interaction) => {
  if (interaction.name === "test") {
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    const masterSector = dailyCycleInfo("legendLostSector");
    const activity = ManifestHandler.getManifest().DestinyActivityDefinition[masterSector.sector.masterHash];
    console.log(activity);
    
    embed.setAuthor("Master Lost Sector");
    embed.setDescription(JSON.stringify(masterSector));
    embed.addField("Name", activity.displayProperties.name);
    embed.setImage(`https://www.bungie.net${ activity.pgcrImage }`);

    interaction.channel.send(embed);
  }
});

//Check if discord bot is ready and shard info
client.on("ready", async () => {
  DiscordReady = true;
  if(!Config.isLocal) { setInterval(() => { try { dbl.postStats(client.guilds.cache.size) } catch (err) { console.log("Failed to update top.gg stats."); } }, 1800000); }
});
client.on('shardDisconnect', (event, id) => { Log.SaveLog("Frontend", "Error", `Shard has disconnected and will no longer reconnect: ${ id }`); });
client.on('shardError', (error, shardID) => { Log.SaveLog("Frontend", "Error", `Shard encounted an error: ${ id }, ${ error }`); });
client.on('shardReady', (id, unavailableGuilds) => { Log.SaveLog("Frontend", "Info", `Shard is ready: ${ id }`); });
client.on('shardReconnecting', (id) => { Log.SaveLog("Frontend", "Warning", `Shard is attempting to reconnect: ${ id }`); });
client.on('shardResume', (id, replayedEvents) => { Log.SaveLog("Frontend", "Info", `Shard has been resumed: ${ id }`); });

//On Message
client.on("message", async message => {
  MessageHandler(client, message, Guilds, RegisteredUsers, APIDisabled, function() { commandsInput++ });
});

//On Error
client.on('error', async error => { Log.SaveLog("Frontend", "Error", error) });

//Others
function getDefaultChannel(guild) { return guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')); }

client.login(DiscordConfig.token);