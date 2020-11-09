//Required Libraraies
const Discord = require('discord.js');
const client = new Discord.Client();
const Database = require('../Shared/database');
const Checks = require('../Shared/checks');
const Log = require('../Shared/log');
const Misc = require('../Shared/misc');
const { MessageHandler } = require('./scripts/handlers/messageHandler');
const BroadcastHandler = require('./scripts/handlers/broadcastsHandler');
const GlobalItemsHandler = require('../Shared/handlers/globalItemsHandler');
const ManifestHandler = require('../Shared/handlers/manifestHandler');
const Config = require('../Shared/configs/Config.json');
const { ErrorHandler } = require('../Shared/handlers/errorHandler');
const DiscordConfig = require(`../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);

//Variables
let InitializationTime = new Date().getTime();
let DiscordReady = false;
let APIDisabled = false;
let Users = 0;
let Guilds = [];
let Clans = [];
let NewClans = [];
let RegisteredUsers = [];
let isConnecting = false;
let commandsInput = 0;

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
let startupCheck = setInterval(async function Startup() {
  if(!isConnecting) { isConnecting = true; Database.FrontendConnect(); }
  if(DiscordReady && Database.checkDBConnection() && GlobalItemsHandler.checkGlobalItems() && ManifestHandler.checkManifestMounted()) {
    //Initialize the frontend and start running!
    clearInterval(startupCheck);
    await update();
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
}

//Functions
function UpdateActivityList() {
  if(APIDisabled) { client.user.setActivity("The Bungie API is undergoing maintenance. Commands will work like normal but may not show the latest information due to this."); }
  else {
    var ActivityList = [];
    ActivityList.push(`Serving ${ Users } users`);
    ActivityList.push(`Tracking ${ Clans.length } clans!`);
    ActivityList.push(`Use ~HELP or ~REQUEST for Support`);
    ActivityList.push(`Consider Donating? ~Donate`);
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
  await Checks.CheckMaintenance(APIDisabled, (isDisabled) => { APIDisabled = isDisabled });
  
  //Check for broadcasts
  BroadcastHandler.checkForBroadcasts(client);
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

//Check if discord bot is ready and shard info
client.on("ready", async () => { DiscordReady = true; });
client.on('shardDisconnect', (event, id) => { Log.SaveLog("Frontend", "Error", `Shard has disconnected and will no longer reconnect: ${ id }`); });
client.on('shardError', (error, shardID) => { Log.SaveLog("Frontend", "Error", `Shard encounted an error: ${ id }, ${ error }`); });
client.on('shardReady', (id, unavailableGuilds) => { Log.SaveLog("Frontend", "Info", `Shard is ready: ${ id }`); });
client.on('shardReconnecting', (id) => { Log.SaveLog("Frontend", "Warning", `Shard is attempting to reconnect: ${ id }`); });
client.on('shardResume', (id, replayedEvents) => { Log.SaveLog("Frontend", "Info", `Shard has been resumed: ${ id }`); });

//On Message
client.on("message", async message => { MessageHandler(client, message, Guilds, RegisteredUsers, APIDisabled); commandsInput++; });

//On Error
client.on('error', async error => { Log.SaveLog("Frontend", "Error", error) });

//Others
function getDefaultChannel(guild) { return guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')); }

client.login(DiscordConfig.token);