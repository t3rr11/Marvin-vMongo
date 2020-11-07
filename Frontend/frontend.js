//Required Libraraies
const Discord = require('discord.js');
const client = new Discord.Client();
const Database = require('../Shared/database');
const Checks = require('../Shared/checks');
const Log = require('../Shared/log');
const Misc = require('../Shared/misc');
const Test = require('./scripts/testing');
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

  //SetTimeouts
  //setInterval(() => { CheckNewSeason(); }, 1000 * 1); //Every second
  //setInterval(() => { UpdateActivityList() }, 1000 * 20); //Every 20 seconds
  //setInterval(() => { LogStatus() }, 1000 * 60); //Every 60 seconds

  //DiscordCommands.GuildCheck(client);
  //DiscordCommands.ClanCheck(client);

  //Test.addTestBroadcast();
  //Test.testBroadcast(client);
  //Test.testFirstscan(client);
  //Test.addGuild();
}

async function update() {
  //Update Users
  Users = 0; for(let g in client.guilds.cache.array()) { var guild = client.guilds.cache.array()[g]; try { if(!isNaN(guild.memberCount)) { Users = Users + guild.memberCount; } } catch (err) { } }

  //Update clans
  await new Promise(resolve => Database.getAllClans(function GetAllClans(isError, isFound, data) {
    if(!isError) {
      if(isFound) {
        Clans = data;
        for(var i in data) {
          if(data[i].firstScan) {
            //Found new clan, added.
            if(!NewClans.find(e => e === data[i].clanID)) { NewClans.push(data[i].clanID); }
          }
          else {
            //Remove and broadcast that it's finished loading.
            if(NewClans.find(e => e === data[i].clanID)) {
              NewClans.splice(NewClans.indexOf(data[i].clanID), 1);
              BroadcastHandler.sendFinishedLoadingAnnouncement(client, data[i]);
            }
          }
        }
      }
    }
    else { ErrorHandler("Low", data); }
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

client.login(DiscordConfig.token);