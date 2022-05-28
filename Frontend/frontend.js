//Required Libraraies
const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
const fetch = require('node-fetch');
const Database = require('../Shared/database');
const Checks = require('../Shared/checks');
const Log = require('../Shared/log');
const Misc = require('../Shared/misc');
const { MessageHandler } = require('./scripts/handlers/messageHandler');
const { StartUpInteractions, InteractionsHandler } = require('./scripts/handlers/interactionsHandler');
const BroadcastHandler = require('./scripts/handlers/broadcastsHandler');
const AnnouncementsHandler = require('./scripts/handlers/announcementsHandler');
const GlobalItemsHandler = require('../Shared/handlers/globalItemsHandler');
const ManifestHandler = require('../Shared/handlers/manifestHandler');
const RequestHandler = require('../Shared/handlers/requestHandler');
const Config = require('../Shared/configs/Config.json');
const { ErrorHandler } = require('../Shared/handlers/errorHandler');
const DiscordConfig = require(`../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);
const DBL = require("dblapi.js");
const dbl = new DBL('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzMTM1MTM2Njc5OTA2NTA4OCIsImJvdCI6dHJ1ZSwiaWF0IjoxNTg0NDIxMzAxfQ.qZ5CrrQdaC9cIfeuqx7svNTwiSTH_R0JD5H-1CVzrCo', client);

// Variables
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

// Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.FrontendConnect(); }
  if(DiscordReady && Database.checkDBConnection() && GlobalItemsHandler.checkGlobalItems() && ManifestHandler.checkManifestMounted()) {
    // Initialize the frontend and start running!
    clearInterval(startupCheck);
    await update();

    // Setup interactions
    // await setupInteractions();

    // Finally start the bot
    init();
  }
}, 1000);

// Startup
async function init() {
  // Start Up Console Log
  Log.SaveLog("Frontend", "Startup", `Bot has started, with ${ Users } users, in ${ client.guilds.cache.size } guilds. Tracking ${ Clans.length } clans!`);

  setInterval(() => { update() }, 1000 * 10); //Every 10 seconds
  setInterval(() => { UpdateActivityList() }, 1000 * 20); //Every 20 seconds

  if(!Config.isLocal) {
    setInterval(() => { Log.LogFrontendStatus(Users, client.guilds.cache.size, commandsInput, (new Date().getTime() - InitializationTime)) }, 1000); //Every 1 second
    setInterval(() => { ManifestHandler.checkManifestUpdate("frontend"); }, 1000 * 60 * 10); //10 Minute Interval
  
    // Handle reset functions
    ResetHandler();
  
    function ResetHandler() {
      // Define Reset Time and Weekly Reset as today at 17:00 UTC and 17:00 UTC on Tuesday
      var timeNow = new Date();
      var resetTime = new Date().setUTCHours(17,0,0,0);
      let resetOffset = 1000 * 60 * 15;
      let trueReset;
  
      if(timeNow > resetTime) { trueReset = new Date(resetTime).setDate(new Date(resetTime).getUTCDate() +1); }
      else { trueReset = resetTime; }
  
      let millisUntilReset = trueReset - timeNow;
  
      Log.SaveLog("Frontend", "Info", `Next reset: ${ new Date(trueReset).toUTCString() }`);
      Log.SaveLog("Frontend", "Info", `Time until: ${ Misc.formatTime("big", millisUntilReset / 1000) }`);
  
      // Define daily reset functions
      setTimeout(() => {
        Log.SaveLog("Frontend", "Info", `Fired the daily reset handler: ${ new Date().toUTCString() }`);
  
        // Send daily broadcasts for the first time
        // AnnouncementsHandler.sendDailyLostSectorBroadcasts(client, Guilds);
        // AnnouncementsHandler.sendDailyWellspringBroadcasts(client, Guilds);
        updateDailyAnnouncements(new Date(trueReset));
        updateXurAnnouncements(new Date(trueReset));
  
        //Reset the handler for tomorrow.
        ResetHandler();
      }, millisUntilReset + resetOffset);
    }
  
    // Start Logger
    // I wanted to explain this a little, the timeout is here to do the first log which is never exactly an hour after startup.
    // Then it'll start the hourly interval which logs like normal every hour.
    setTimeout(() => {
      Log.LogHourlyFrontendStatus(Users, client.guilds.cache.size, commandsInput, (new Date().getTime() - InitializationTime));
      commandsInput = 0;
      setInterval(() => {
        Log.LogHourlyFrontendStatus(Users, client.guilds.cache.size, commandsInput, (new Date().getTime() - InitializationTime));
        commandsInput = 0;
      }, 1000 * 60 * 60);
    }, 3600000 - new Date().getTime() % 3600000); 
  }
}

// Functions
function UpdateActivityList() {
  if(APIDisabled) { client.user.setActivity("The Bungie API is undergoing maintenance. Commands will work like normal but may not show the latest information due to this."); }
  else {
    var ActivityList = [];
    ActivityList.push(`Serving ${ Users } users`);
    ActivityList.push(`Tracking ${ Clans.length } clans!`);
    ActivityList.push(`Use ~Help or ~Request for Support`);
    ActivityList.push(`You can now change your prefix by using: ~set prefix`);
    ActivityList.push(`Want Faster Broadcasts? Consider Supporting, ~Support`);
    ActivityList.push(`Wonder what clannies are upto? Use: ~Clan Activity`);
    ActivityList.push(`~Xur now in! For how long?.. until Bungie obsure his location again.`);
    var activity = ActivityList[Math.floor(Math.random() * ActivityList.length)];
    client.user.setActivity(activity);
  }
}

async function update() {
  // Update Users
  Users = 0;
  client.guilds.cache.forEach((guild) => {
    if(guild?.memberCount) {
      Users = Number(Users) + Number(guild?.memberCount);
    }
  });

  // Update clans
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

  // Update guilds
  await new Promise(resolve => Database.getTrackedGuilds(function GetTrackedGuilds(isError, isFound, data) {
    if(!isError) { if(isFound) { Guilds = data; } }
    else { ErrorHandler("Low", data); }
    resolve(true);
  }));

  // Update RegisteredUsers
  await new Promise(resolve => Database.getAllRegisteredUsers(function GetAllRegisteredUsers(isError, isFound, data) {
    if(!isError) { if(isFound) { RegisteredUsers = data; } }
    else { ErrorHandler("Low", data); }
    resolve(true);
  }));

  // Check Maintenance
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
  
  // Check for broadcasts
  if(!Config.isLocal) { BroadcastHandler.checkForBroadcasts(client); }
}

async function updateDailyAnnouncements(ResetTime) {
  //Loop through vendors
  const vendors = [{ name: "Gunsmith", hash: "672118013" }, { name: "Ada-1", hash: "350061650" }];
  for(let vendor of vendors) {
    const getVendor = (vendor) => RequestHandler.GetVendor(vendor.hash, async function(isError, ModData) {
      if(!isError && ModData?.Response?.sales?.data) {
        //Get mods and new refresh date.
        let refreshDate = ModData.Response.vendor.data.nextRefreshDate;
        const vendorLocation = ModData.Response.vendor.data?.vendorLocationIndex;
        const dailySales = ModData.Response.sales.data;
        const modsRaw = Object.values(dailySales).filter(e => (ManifestHandler.getManifestItemByHash(e.itemHash))?.itemType === 19);
        const mods = Object.values(modsRaw).map(e => {
          let mod = ManifestHandler.getManifestItemByHash(e.itemHash);
          if(e.overrideNextRefreshDate) { refreshDate = e.overrideNextRefreshDate; }
          return {
            name: mod.displayProperties.name,
            icon: mod.displayProperties.icon,
            description: mod.displayProperties.description,
            hash: mod.hash,
            collectibleHash: mod.collectibleHash
          }
        });

        //Only proceed if the reset times are different otherwise you're re-entering the duplicte data
        if(ResetTime !== refreshDate) {
          //Add new database entry.
          Database.addDailyMods({
            vendor: vendor.name,
            mods: mods,
            location: vendorLocation,
            nextRefreshDate: refreshDate
          }, function addDailyMods(isError, isFound, data) {
            if(isError) {
              ErrorHandler("High", data);
            }
          });
        
          //Send mod broadcasts.
          AnnouncementsHandler.sendModsBroadcasts(client, Guilds, mods, vendor);
        }
        else { ErrorHandler("Med", `Tried to enter duplicate mod data for ${ vendor.name }. Ignored.`); }
      }
      else {
        //If failed for some reason, set a timeout to retry and log error.
        ErrorHandler("Med", `Failed to update mods for ${ vendor.name }, retrying in 60 seconds.`);
        setTimeout(() => { getVendor(vendor); }, 60000);
      }
    });

    getVendor(vendor);
  }
}

async function updateXurAnnouncements(ResetTime, isForced) {
  Database.getDailyMods("Xûr", async function(isError, isFound, lastVendorEntry) { 
    const vendor = ManifestHandler.getManifest().DestinyVendorDefinition[2190858386];   
    if(!isError && isFound) {

      //Check to make sure it's past the reset date, otherwise we don't want to store a new entry
      if((new Date() > new Date(lastVendorEntry.nextRefreshDate) && new Date().getDay() === 5) || isForced) {
        RequestHandler.GetVendor(vendor.hash, async function(isError, ItemData) {
          if(!isError && ItemData?.Response?.sales?.data) {

            //Get items and new refresh date.
            let refreshDate = ItemData.Response.vendor.data.nextRefreshDate;
            const vendorLocation = ItemData.Response.vendor.data.vendorLocationIndex;
            const dailySales = ItemData.Response.sales.data;
            const itemRaw = Object.values(dailySales).filter(e => 
              (ManifestHandler.getManifestItemByHash(e.itemHash))?.inventory?.tierType === 6 &&
              (ManifestHandler.getManifestItemByHash(e.itemHash))?.collectibleHash
            );
            const items = Object.values(itemRaw).map(e => {
              let item = ManifestHandler.getManifestItemByHash(e.itemHash);
              return {
                name: item.displayProperties.name,
                icon: item.displayProperties.icon,
                description: item.displayProperties.description,
                hash: item.hash,
                collectibleHash: item.collectibleHash,
                stats: ItemData.Response?.itemComponents?.stats?.data[e?.vendorItemIndex]?.stats,
                itemType: item.itemType
              }
            });

            //Only proceed if the reset times are different otherwise you're re-entering the duplicte data
            if(ResetTime !== refreshDate) {
              //Add new database entry.
              Database.addDailyMods({ 
                vendor: vendor.displayProperties.name,
                items: items,
                location: vendorLocation,
                nextRefreshDate: refreshDate
              }, function addDailyMods(isError, isFound, data) {
                if(isError) {
                  ErrorHandler("High", data);
                }
              });
            
              // Send xur broadcasts.
              AnnouncementsHandler.sendXurBroadcasts(client, Guilds, items, vendor, vendorLocation);
            }
            else { ErrorHandler("Med", `Tried to enter duplicate mod data for ${ vendor.displayProperties.name }. Ignored.`); }
          }
          else {
            //If failed for some reason, set a timeout to retry and log error.
            ErrorHandler("Med", `Failed to update mods for ${ vendor.displayProperties.name }, retrying in 60 seconds.`);
            setTimeout(() => { console.log(err); }, 60000);
          }
        });
      }

    }
  });
}

// Joined a server
client.on("guildCreate", guild => {
  try {
    Log.SaveLog("Frontend", "Server", `Joined a new guild: ${ guild.name } (${ guild.id })`);
    Database.enableGuildTracking(guild.id, function enableGuildTracking(isError, isFound, data) {
      if(!isError) {
        if(isFound) { Log.SaveLog("Frontend", "Server", `Tracking Re-Enabled: ${ guild.name } (${ guild.id })`); }
        else {
          const embed = new Discord.MessageEmbed()
          .setTitle("Hey there!")
          .setColor(0x0099FF)
          .setDescription("I am Marvin. To set me up first register with me by using the `~Register example` command. Replace example with your in-game username. \n\nOnce registration is complete use the `~Set clan` command and **then wait 5 minutes** whilst I scan your clan. That's it you'll be ready to go! \n\nTry out clan broadcasts this can be set up by typing `~Set Broadcasts #general` (does not have to be general). \n\nSee `~help` to see what I can do!")
          .setFooter({ name: Config.defaultFooter, iconURL: Config.defaultLogoURL })
          .setTimestamp();
          try { getDefaultChannel(guild).send({ embeds: [embed] }) }
          catch (err) { Log.SaveLog("Frontend", "Error", `Failed to give welcome message to: ${ guild.name } (${ guild.id })`); }
        }
      }
    });
  }
  catch (err) { console.log("Failed to re-enable tracking for a clan."); }
});

// Removed from a server
client.on("guildDelete", guild => {
  Log.SaveLog("Frontend", "Server", `Left a guild: ${ guild.name } (${ guild.id })`);
  Database.disableGuildTracking(guild.id, function disableGuildTracking(isError, isFound, data) {
    if(!isError) { if(isFound) { Log.SaveLog("Frontend", "Server", `Tracking Disabled: ${ guild.name } (${ guild.id })`); } }
    else { ErrorHandler("High", `Failed to disable guild tracking for ${ guild.id }`); }
  });
});

// Watch for commands via Interactions
client.on("interactionCreate", (interaction) => {
  if (interaction.name === "test") {
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    const masterSector = dailyCycleInfo("lostsector");
    const activity = ManifestHandler.getManifest().DestinyActivityDefinition[masterSector.sector.masterHash];
    console.log(activity);
    
    embed.setTitle("Master Lost Sector");
    embed.setDescription(JSON.stringify(masterSector));
    embed.addField("Name", activity.displayProperties.name);
    embed.setImage(`https://www.bungie.net${ activity.pgcrImage }`);

    interaction.channel.send({ embeds: [embed] });
  }
});

// Check if discord bot is ready and shard info
client.on("ready", async () => {
  if(!Config.isLocal) { setInterval(() => { try { dbl.postStats(client.guilds.cache.size) } catch (err) { console.log("Failed to update top.gg stats."); } }, 1800000); }
  DiscordReady = true;
  StartUpInteractions(client);
});

client.on('shardDisconnect', (event, id) => { Log.SaveLog("Frontend", "Error", `Shard has disconnected and will no longer reconnect: ${ id }`); });
client.on('shardError', (error, shardID) => { Log.SaveLog("Frontend", "Error", `Shard encounted an error: ${ id }, ${ error }`); });
client.on('shardReady', (id, unavailableGuilds) => { Log.SaveLog("Frontend", "Info", `Shard is ready: ${ id }`); });
client.on('shardReconnecting', (id) => { Log.SaveLog("Frontend", "Warning", `Shard is attempting to reconnect: ${ id }`); });
client.on('shardResume', (id, replayedEvents) => { Log.SaveLog("Frontend", "Info", `Shard has been resumed: ${ id }`); });

//On Message
client.on("messageCreate", async message => {
  const args = message.content.slice("~".length);
  const lowercased = args.toString().toLowerCase();
  const command = lowercased.replace(/[\u2018\u2019]/g, "'");
  if(message.author.id === "194972321168097280" && command.startsWith("force announcements")) {
    AnnouncementsHandler.sendDailyLostSectorBroadcasts(client, Guilds);
    AnnouncementsHandler.sendDailyWellspringBroadcasts(client, Guilds);
    updateDailyAnnouncements(new Date().getTime());
    // updateXurAnnouncements(new Date().getTime(), true);
  }
  else {
    MessageHandler(client, message, Guilds, RegisteredUsers, APIDisabled, function() { commandsInput++ });
  }
});

// On Interaction
client.ws.on('INTERACTION_CREATE', async (interaction) => {
  InteractionsHandler(client, interaction);
});

// On Error
client.on('error', async error => { Log.SaveLog("Frontend", "Error", error) });

// Others
function getDefaultChannel(guild) { return guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')); }

client.login(DiscordConfig.token);