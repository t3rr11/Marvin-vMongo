//Required Libraries and Files
const mongoose = require('mongoose');
const ssh = require('tunnel-ssh');
const Config = require('./configs/Config.json');
const SSHConfig = require(`./configs/${ Config.isLocal ? 'local' : 'live' }/SSHConfig.js`).Config;
const { ErrorHandler } = require('./handlers/errorHandler');

//Schemas
const Guild = require('./models/guild_model');
const Clan = require('./models/clan_model');
const User = require('./models/user_model');
const UserItems = require('./models/userItems_model');
const UserTitles = require('./models/userTitles_model');
const RegisteredUser = require('./models/registeredUser_model');
const GlobalItem = require('./models/globalItem_model');
const BanUser = require('./models/bannedUsers_model');
const Broadcast = require('./models/broadcast_model');
const AwaitingBroadcast = require('./models/awaiting_broadcast_model');
const Manifest = require('./models/manifest_model');
const LogItem = require('./models/log_model');
const BroadcastLog = require('./models/broadcastLog_model');
const FrontendStatusLog = require('./models/frontendStatus_model');
const HourlyFrontendStatusLog = require('./models/hourlyFrontendStatus_model');
const BackendStatusLog = require('./models/backendStatus_model');
const HourlyBackendStatusLog = require('./models/hourlyBackendStatus_model');
const ScanTimeLog = require('./models/log_time_model');
const GunsmithMods = require('./models/gunsmithMods_model');
const Cookies = require('./models/log_cookies_model');
const Auth = require('./models/auth_model');

//Variables
let SSHConnected = false;
let DBConnected = false;

const checkSSHConnection = () => { return SSHConnected }
const checkDBConnection = () => { return DBConnected }

//SSH and Connect to Mongo
function FrontendConnect() { var mongoConfig = SSHConfig.mongoConfig; mongoConfig.dstPort = mongoConfig.dstPorts[0]; StartConnection("frontend", mongoConfig); }
function BackendConnect() { var mongoConfig = SSHConfig.mongoConfig; mongoConfig.dstPort = mongoConfig.dstPorts[0]; StartConnection("backend", mongoConfig); }
function ExpressConnect() { var mongoConfig = SSHConfig.mongoConfig; mongoConfig.dstPort = mongoConfig.dstPorts[0]; StartConnection("express", mongoConfig); }
function GlobalsConnect() { var mongoConfig = SSHConfig.mongoConfig; mongoConfig.dstPort = mongoConfig.dstPorts[0]; StartConnection("globals", mongoConfig); }

function StartConnection(system, mongoConfig) {
  if(Config.isLocal) {
    var server = ssh(mongoConfig, (err, server) => {
      if(!err) { SSHConnected = true; console.log("Connected to SSH"); StartMongoConnection(); }
      else { console.log(err); }
    });
    server.on('error', (err) => {
      if(err.code === "ECONNRESET" || err.code === "CONNECT_FAILED") {
        switch(system) {
          case "frontend": { FrontendConnect(); break; }
          case "backend": { BackendConnect(); break; }
          case "express": { ExpressConnect(); break; }
          case "globals": { GlobalsConnect(); break; }
          default: {
            addLog({ location: "Database", type: "Error", log: `Database Connection Error: ${ JSON.stringify(err) }` },
              function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err); }
            });
          }
        }
      }
      else {
        addLog({ location: "Database", type: "Error", log: `Database Connection Error: ${ JSON.stringify(err) }` },
          function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) }
        });
      }
    });
  }
  else { StartMongoConnection(); }
}
function StartMongoConnection() {
  mongoose.connect('mongodb://127.0.0.1/Test', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
  DB = mongoose.connection;
  DB.on('error', console.error.bind(console, 'DB connection error:'));
  DB.once('open', () => { console.log("Connected to MongoDB"); DBConnected = true; });
}

//Adds
const addGuild = async (guildData, callback) => {
  //Callback fields { isError, severity, err }
  await findGuildByID(guildData.guildID, async (isError, isFound, data) => {
    if(!isError) {
      if(!isFound) {
        await new Guild(guildData).save((err, guild) => {
          if(err) { callback(true, "High", err) }
          else { callback(false); }
        });
      } else { callback(true, "Low", `Tried to add duplicate guild: ${ guildData.guildName }`) }
    } else { callback(true, "High", data) }
  });
}
const addClan = async (clanData, callback) => {
  //Callback fields { isError, severity, err }
  await findClanByID(clanData.clanID, async (isError, isFound, data) => {
    if(!isError) {
      if(!isFound) {
        await new Clan(clanData).save((err, clan) => {
          if(err) { callback(true, "High", err) }
          else { callback(false); }
        });
      } else { callback(true, "Low", `Tried to add duplicate clan: ${ clanData.clanName }`) }
    } else { callback(true, "High", data) }
  });
}
const addGlobalItem = async (globalItemData, callback) => {
  await new GlobalItem(globalItemData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false); }
  });
}
const addBannedUser = async (userData, callback) => {
  //Callback fields { isError, severity, err }
  await findBannedUserByID(userData.discordID, async (isError, isFound, data) => {
    if(!isError) {
      if(!isFound) {
        await new BanUser(userData).save((err, doc) => {
          if(err) { callback(true, "High", err); }
          else { callback(false); }
        });
      } else { callback(true, "Low", `User is already banned.`); }
    } else { callback(true, "High", data); }
  });
}
const addAwaitingBroadcast = async (broadcastData, callback) => {
  await new AwaitingBroadcast(broadcastData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else {
      if(doc.displayName) {
        //console.log("Database", "Clan", `${ doc.displayName } (${ doc.membershipID }) from guild: (${ doc.guildID }) has obtained ${ doc.broadcast }`);
      }
      else {
        //console.log("Database", "Clan", doc.broadcast);
      }
      callback(false);
    }
  });
}
const addBroadcast = async (broadcastData, callback) => {
  //Callback fields { isError, severity, err }
  await findBroadcast({ membershipID: broadcastData.membershipID, season: broadcastData.season, broadcast: broadcastData.broadcast, guildID: broadcastData.guildID }, async (isError, isFound, data) => {
    if(!isError) {
      if(!isFound) {
        await new Broadcast(broadcastData).save((err, doc) => {
          if(err) { callback(true, "High", err) }
          else { 
            if(doc.displayName) {
              addLog({ location: "Database", type: "Broadcast", log: `${ doc.displayName } (${ doc.membershipID }) from guild: (${ doc.guildID }) has obtained ${ doc.broadcast }` },
                function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) }
              });
            }
            else {
              addLog({ location: "Database", type: "Broadcast", log: doc.broadcast },
                function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) }
              });
            }
            callback(false);
          }
        });
      } else { callback(true, "Low", `Duplicate broadcast: ${ broadcastData.guildID }, ${ broadcastData.membershipID }, ${ broadcastData.broadcast }`) }
    } else { callback(true, "High", data) }
  });
}
const addManifest = async (manifestData, callback) => {
  await new Manifest(manifestData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false); }
  });
}
const addRegisteredUser = async (userData, callback) => {
  //Callback fields { isError, isAdded, isUpdated }
  await findRegisteredUserByID(userData.discordID, async (isError, isFound, data) => {
    if(!isError) {
      if(!isFound) {
        await new RegisteredUser(userData).save((err, user) => {
          if(err) { callback(true, false, false); }
          else { callback(false, true, false); }
        });
      }
      else {
        RegisteredUser.updateOne({ discordID: userData.discordID }, userData, { }, (err, numAffected) => {
          if(err || numAffected < 1) { callback(true, false, false); }
          else { callback(false, false, true); }
        });
      }
    }
    else { callback(true, false, false); }
  });
}
const addLog = async (logData, callback) => {
  if(!Config.isLocal) {
    if(logData.type === "Broadcast") {
      await new BroadcastLog(logData).save((err, doc) => {
        if(err) { callback(true, "High", err) }
        else { callback(false); }
      });
    }
    else {
      await new LogItem(logData).save((err, doc) => {
        if(err) { callback(true, "High", err) }
        else { callback(false); }
      });
    }
  }
}
const addBackendStatusLog = async (logData, callback) => {
  await new BackendStatusLog(logData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false); }
  });
}
const addHourlyBackendStatusLog = async (logData, callback) => {
  await new HourlyBackendStatusLog(logData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false); }
  });
}
const addFrontendStatusLog = async (logData, callback) => {
  await new FrontendStatusLog(logData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false); }
  });
}
const addHourlyFrontendStatusLog = async (logData, callback) => {
  await new HourlyFrontendStatusLog(logData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false); }
  });
}
const addTimeLog = async (logData, callback) => {
  await new ScanTimeLog(logData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false); }
  });
}
const addCookieLog = async (logData) => {
  if(!Config.isLocal) { await new Cookies(logData).save((err, doc) => { }); }
}
const addGunsmithMods = async (data, callback) => {
  await new GunsmithMods(data).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false); }
  });
}
const addAuth = async (options, data, callback) => {
  //Callback(isError, isFound, response)
  await new Auth(data.auth).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { callback(false, true, doc); }
  });
}

//Finds
const findUserByID = async (membershipID, callback) => {
  //Callback fields { isError, isFound, data }
  await User.find({ membershipID }, async (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) {
        await Promise.all([await getUserItems(membershipID), await getUserTitles(membershipID)]).then((data) => {
          var Items = data[0];
          var Titles = data[1];
          if(Items !== null && Titles !== null) { callback(false, true, { User: array[0], "Items": Items[0], "Titles": Titles[0] }); }
          else { callback(false, false); }
        });
      }
      else { callback(false, false); }
    }
  });
}
const findBannedUserByID = async (discordID, callback) => {
  //Callback fields { isError, isFound, data }
  await BanUser.find({ discordID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array[0]); }
      else { callback(false, false, null); }
    }
  });
}
const findGuildByID = async (guildID, callback) => {
  //Callback fields { isError, isFound, data }
  await Guild.find({ guildID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array[0]); }
      else { callback(false, false, null); }
    }
  });
}
const findClanByID = async (clanID, callback) => {
  //Callback fields { isError, isFound, data }
  await Clan.find({ clanID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array[0]); }
      else { callback(false, false, null); }
    }
  });
}
const findBroadcast = async (broadcast, callback) => {
  //Callback fields { isError, isFound, data }
  await Broadcast.find({ membershipID: broadcast.membershipID, season: broadcast.season, broadcast: broadcast.broadcast, guildID: broadcast.guildID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array[0]); }
      else { callback(false, false, null); }
    }
  });
}
const findRegisteredUserByID = async (discordID, callback) => {
  //Callback fields { isError, isFound, data }
  await RegisteredUser.find({ discordID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array[0]); }
      else { callback(false, false, null); }
    }
  });
}

//Gets
const getAllGuilds = async (callback) => {
  //Callback fields { isError, isFound, data }
  await Guild.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getClanGuilds = async (clanID, callback) => {
  //Callback fields { isError, isFound, data }
  await Guild.find({ clans: clanID.toString(), isTracking: true }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getTrackedClanGuilds = async (clanID, callback) => {
  //Callback fields { isError, isFound, data }
  await Guild.find({ clans: clanID.toString(), isTracking: true }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAllClans = async (callback) => {
  //Callback fields { isError, isFound, data }
  await Clan.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAllUsers = async (callback) => {
  //Callback fields { isError, isFound, data }
  await User.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAllTrackedUsers = async (callback) => {
  //Callback fields { isError, isFound, data }
  await User.find({ clanID: { $ne: 0 } }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getUsersByClanIDArrayList = async (clanIDs, callback) => {
  //Callback fields { isError, isFound, data }
  await User.find({ clanID: { $in: clanIDs }, firstLoad: false }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getGuildsByGuildIDArrayList = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await Guild.find({ guildID: { $in: data.guilds.map(e => e.id) }, isTracking: true }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) {
        let adjustedArray = [];
        for(let i in array) {
          adjustedArray.push({...array[i]["_doc"], ...data.guilds.find(e => e.id === array[i].guildID) });
        }
        callback(false, true, adjustedArray);
      }
      else { callback(false, false, null); }
    }
  });
}
const getClansFromGuildID = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  Guild.findOne({ guildID: data.guildID }, (err, doc) => {
    if(err) { callback(true, false, err); }
    else {
      if(doc) {
        Clan.find({ clanID: { $in: doc.clans.map(e => parseInt(e)) } }, (err, array) => {
          if(err) { callback(true, false, err); }
          else {
            if(array.length > 0) { callback(false, true, array); }
            else { callback(false, false, null); }
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const getUsersFromGuildID = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  Guild.findOne({ guildID: data.guildID }, (err, doc) => {
    if(err) { callback(true, false, err); }
    else {
      if(doc) {
        Clan.find({ clanID: { $in: doc.clans.map(e => parseInt(e)) } }, (err, array) => {
          if(err) { callback(true, false, err); }
          else {
            if(array.length > 0) {
              User.find({ clanID: { $in: array.map(e => e.clanID) } }, (err, users) => {
                if(err) { callback(true, false, err); }
                else {
                  if(array.length > 0) { callback(false, true, users); }
                  else { callback(false, false, null); }
                }
              });
            }
            else { callback(false, false, null); }
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const getGuildDashboard = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  Guild.findOne({ guildID: data.guildID }, (err, doc) => {
    if(err) { callback(true, false, err); }
    else {
      if(doc) {
        Clan.find({ clanID: { $in: doc.clans.map(e => parseInt(e)) } }, (err, array) => {
          if(err) { callback(true, false, err); }
          else {
            if(array.length > 0) {
              User.find({ clanID: { $in: array.map(e => e.clanID) } }, (err, users) => {
                if(err) { callback(true, false, err); }
                else {
                  if(array.length > 0) { callback(false, true, { guild: doc, clans: array, users: users }); }
                  else { callback(false, false, null); }
                }
              });
            }
            else { callback(false, false, null); }
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const getGlobalItems = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await GlobalItem.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAllRegisteredUsers = async (callback) => {
  //Callback fields { isError, isFound, data }
  await RegisteredUser.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getTrackedGuilds = async (callback) => {
  //Callback fields { isError, isFound, data }
  await Guild.find({ isTracking: true }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getTrackedClans = async (callback) => {
  //Callback fields { isError, isFound, data }
  await Clan.find({ isTracking: true }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAllGlobalItems = async (callback) => {
  //Callback fields { isError, isFound, data }
  await GlobalItem.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getUserItems = async (membershipID) => {
  return await UserItems.find({ membershipID });
}
const getUserTitles = async (membershipID) => {
  return await UserTitles.find({ membershipID });
}
const getUserBroadcasts = async (membershipID, callback) => {
  //Callback fields { isError, isFound, data }
  await Broadcast.find({ membershipID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAllBannedUsers = async (callback) => {
  //Callback fields { isError, isFound, data }
  await BanUser.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAwaitingBroadcasts = async (callback) => {
  //Callback fields { isError, isFound, data }
  await AwaitingBroadcast.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getManifestVersion = async (callback) => {
  //Callback fields { isError, isFound, data }
  await Manifest.find({}, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getGuildPlayers = async (guildID, callback) => {
  await Guild.findOne({ guildID, isTracking: true }, async (err, guild) => {
    if(err) { callback(true, false, err); }
    else {
      if(guild) {
        await User.find({ clanID: guild.clans }, (err, users) => {
          if(err) { callback(true, false, err); }
          else {
            if(users.length > 0) { callback(false, true, users); }
            else { callback(false, false, null); }
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const getGuildTitles = async (guildID, callback) => {
  await Guild.findOne({ guildID, isTracking: true }, async (err, guild) => {
    if(err) { callback(true, false, err); }
    else {
      if(guild) {
        await UserTitles.find({ clanID: guild.clans }, (err, users) => {
          if(err) { callback(true, false, err); }
          else {
            if(users.length > 0) { callback(false, true, users); }
            else { callback(false, false, null); }
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const getGuildItems = async (guildID, callback) => {
  console.log("Starting...");
  let start = Date.now();
  await Guild.findOne({ guildID, isTracking: true }, async (err, guild) => {
    console.log(`Took: ${ Date.now() - start }ms to find guild`);
    if(err) { callback(true, false, err); }
    else {
      if(guild) {
        await UserItems.find({ clanID: guild.clans }, (err, users) => {
          console.log(`Took: ${ Date.now() - start }ms to get user items`);
          if(err) { callback(true, false, err); }
          else {
            if(users.length > 0) { callback(false, true, users); }
            else { callback(false, false, null); }
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const getGuildBroadcasts = async (guildID, callback) => {
  await Guild.findOne({ guildID, isTracking: true }, async (err, guild) => {
    if(err) { callback(true, false, err); }
    else {
      if(guild) {
        await Broadcast.find({ clanID: guild.clans }, (err, broadcasts) => {
          if(err) { callback(true, false, err); }
          else {
            if(broadcasts.length > 0) { callback(false, true, broadcasts); }
            else { callback(false, false, null); }
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const getGuildItemBroadcasts = async (guildID, hash, callback) => {
  await Guild.findOne({ guildID, isTracking: true }, async (err, guild) => {
    if(err) { callback(true, false, err); }
    else {
      if(guild) {
        await Broadcast.find({ clanID: guild.clans, hash }, (err, broadcasts) => {
          if(err) { callback(true, false, err); }
          else {
            if(broadcasts.length > 0) { callback(false, true, broadcasts); }
            else { callback(false, false, null); }
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const getClanUsers = async (clanID, callback) => {
  await User.find({ clanID }, (err, players) => {
    if(err) { callback(true, false, err); }
    else {
      if(players.length > 0) { callback(false, true, players); }
      else { callback(false, false, null); }
    }
  });
}
const getBackendLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await BackendStatusLog.find().sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getFrontendLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await FrontendStatusLog.find().sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getDiscordUserLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await LogItem.find({ discordID: data.discordID }).sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getDiscordGuildLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await LogItem.find({ guildID: data.guildID }).sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getUserDetails = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await RegisteredUser.find({ discordID: data.discordID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array[0]); }
      else { callback(false, false, null); }
    }
  });
}
const getBroadcastLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await BroadcastLog.find(data).limit(options.amount).sort({ _id: -1 }).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getBroadcasts = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await Broadcast.find(data).limit(options.amount).sort({ _id: -1 }).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await LogItem.find(data).sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAPIStatus = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await BackendStatusLog.find({}, { _id: 0, APIStatus: 1, date: 1 }).sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getAllClansForExpress = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await Clan.find({}, '-_id -firstScan -forcedScan -__v').limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getDailyUsers = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  let yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  await User.find({ lastPlayed: { $gt: yesterday.toISOString() } }, '-_id -firstScan -forcedScan -__v').exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getClanByID = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await Clan.find({ clanID: data.clanID }, '-_id -firstScan -forcedScan -__v').exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getClanMembersByID = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await User.find({ clanID: data.clanID }, '-_id -__v').exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getClanBroadcastsByID = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await Broadcast.find({ clanID: data.clanID }, '-_id -__v', { sort: { _id: -1 } }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getLastCookieLog = async (callback) => {
  //Callback fields { isError, isFound, data }
  await Cookies.find({ }).sort({ _id: -1 }).limit(1).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getGunsmithMods = async (callback) => {
  //Callback fields { isError, isFound, data }
  await GunsmithMods.findOne({}, {}, { sort: { _id: -1 } }, function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getWeeklyFrontendLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await HourlyFrontendStatusLog.find().sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getWeeklyBackendLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await HourlyBackendStatusLog.find().sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getScanTimeLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await ScanTimeLog.find({ type: options.type }).sort({ _id: -1 }).limit(options.amount).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}
const getTimeLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await ScanTimeLog.find(data).sort({ _id: -1 }).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}

//Get Aggregates
const getAggregateWeeklyFrontendLogs = async (options, data, callback) => {
  //Callback fields { isError, isFound, data }
  await FrontendStatusLog.aggregate([
    { $sort: { _id: -1 } },
    { $limit : 604800 },
    { 
      $project: {
        "y":{ "$year": "$date" }, "m":{ "$month": "$date" }, "d":{ "$dayOfMonth": "$date" }, "h":{ "$hour": "$date" },
        "users": "$users",
        "servers": "$servers",
        "commandsInput": "$commandsInput",
        "uptime": "$uptime"
      }
    },
    {
      $group: { 
        _id: { "year": "$y","month": "$m","day": "$d","hour": "$h" },
        users: { $first: "$users" },
        servers: { $first: "$servers" },
        commandsInput: { $first: "$commandsInput" },
        uptime: { $first: "$uptime" }
      }
    },
    { $sort: { _id: -1 } }
  ]).exec(function (err, array) {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) { callback(false, true, array); }
      else { callback(false, false, null); }
    }
  });
}

//Updates
const updateUserByID = async (membershipID, data, callback) => {
  let successCheck = [];

  await new Promise(resolve => { User.findOneAndUpdate({ membershipID }, data.user, { upsert: true, setDefaultsOnInsert: true }, (err, numAffected) => { if(err || numAffected < 1) { successCheck.push({ "error": "User", "reason": err }); } else { successCheck.push(true); } }); resolve(true); });
  await new Promise(resolve => { UserItems.findOneAndUpdate({ membershipID }, data.items, { upsert: true, setDefaultsOnInsert: true }, (err, numAffected) => { if(err || numAffected < 1) { successCheck.push({ "error": "UserItems", "reason": err }); } else { successCheck.push(true); } }); resolve(true); });
  await new Promise(resolve => { UserTitles.findOneAndUpdate({ membershipID }, data.titles, { upsert: true, setDefaultsOnInsert: true }, (err, numAffected) => { if(err || numAffected < 1) { successCheck.push({ "error": "UserTitles", "reason": err }); } else { successCheck.push(true); } }); resolve(true); });
  
  if(successCheck.every(e => e === true)) { callback(false); } //Successfully updated user.
  else { callback(true, "High", successCheck) } //Failed to update user.
}
const updateBannerUserByID = async (discordID, data, callback) => {
  BanUser.updateOne({ discordID }, data, { }, (err, numAffected) => {
    if(err || numAffected < 1) { callback(true, "Med", err); }
    else { callback(false); }
  });
}
const updatePrivacyByID = async (membershipID, data, callback) => {
  let user = await User.findOneAndUpdate({ membershipID }, data);
  if(user !== null) {
    callback(false);
    if(user.isPrivate !== data.isPrivate) {
      addLog({ location: "Database", type: "Clan", log: `Updated Privacy Settings For User: ${ user.displayName }, isPrivate: ${ data.isPrivate }` },
        function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) }
      });
    }
  }
  else { callback(true, "Low", `NoUser`); }
}
const updateClanByID = async (clanID, data, callback) => {
  Clan.updateOne({ clanID, isTracking: true }, data, { }, (err, numAffected) => {
    if(err || numAffected < 1) { callback(true, "Med", err); }
    else { callback(false); }
  });
}
const updateManifestVersion = (name, data, callback) => {
  Manifest.updateOne({ name }, data, { }, (err, numAffected) => {
    if(err || numAffected < 1) { callback(true, "Med", err); }
    else { callback(false); }
  });
}
const updateGuildByID = async (guildID, data, callback) => {
  Guild.updateOne({ guildID }, data, { }, (err, numAffected) => {
    if(err || numAffected < 1) { callback(true, "Med", err); }
    else { callback(false); }
  });
}
const forceFullRescan = (callback) => {
  Clan.updateMany({}, { $set: { forcedScan: true } }, function(err, numAffected){
    if(err || numAffected < 1) { callback(true, "Med", err); }
    else {
      User.updateMany({}, { $set: { firstLoad: true } }, function(err, numAffected){
        if(err || numAffected < 1) { callback(true, "Med", err); }
        else { callback(false); }
      });
    }
  });
}

//Remove
const removeBannedUser = async (discordID, callback) => {
  BanUser.deleteOne({ discordID }, (err, numAffected) => {
    if(err || numAffected.deletedCount < 1) { callback(true, "Low", err) } else { callback(false) }
  });
}
const removeAwaitingBroadcast = async (broadcast, callback) => {
  AwaitingBroadcast.deleteOne({ membershipID: broadcast.membershipID, season: broadcast.season, broadcast: broadcast.broadcast, guildID: broadcast.guildID }, (err) => {
    if(err) { callback(true) } else { callback(false) }
  });
}
const removeAllAwaitingBroadcasts = async (callback) => {
  AwaitingBroadcast.deleteMany({}, (err) => {
    if(err) { callback(true) } else { callback(false) }
  });
}
const removeClanFromPlayer = async (membershipID) => {
  User.findOneAndUpdate({ membershipID }, { membershipID, clanID: 0, firstLoad: true }, { upsert: true, setDefaultsOnInsert: true }, (err) => { if(err) { } });
  UserItems.updateOne({ membershipID }, { clanID: 0 }, (err) => { if(err) { } });
  UserTitles.updateOne({ membershipID }, { clanID: 0 }, (err) => { if(err) { } });
}

//Toggles
const enableGuildTracking = async (guildID, callback) => {
  await Guild.find({ guildID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) {
        Guild.updateOne({ guildID }, { isTracking: true }, { }, (err, numAffected) => {
          if(err || numAffected < 1) { callback(true, false, err); }
          else {
            for(let i in array[0].clans) {
              let clanID = array[0].clans[i];
              Clan.find({ clanID }, (err, clan) => {
                if(err) { callback(true, false, err); }
                else {
                  if(clan.length > 0) {
                    if(!clan[0].isTracking) {
                      Clan.updateOne({ clanID }, { isTracking: true, firstScan: false }, { }, (err, numAffected) => {
                        if(err || numAffected < 1) { callback(true, false, `Failed to re-enable tracking for clan: ${ clanID }, ${ err }`); }
                        else {
                          addLog({ location: "Frontend", type: "Clan", log: `Clan: ${ clanID } is now being tracked once again as a tracked guild was found to have it.` },
                            function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) }
                          });
                        }
                      });
                    }
                  }
                }
              });
            }
            callback(false, true, guildID);
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const disableGuildTracking = async (guildID, callback) => {
  await Guild.find({ guildID }, (err, array) => {
    if(err) { callback(true, false, err); }
    else {
      if(array.length > 0) {
        Guild.updateOne({ guildID }, { isTracking: false }, { }, async (err, numAffected) => {
          if(err || numAffected < 1) { callback(true, false, err); }
          else {
            for(let i in array[0].clans) {
              let clanID = array[0].clans[i];
              await Guild.find({ clans: clanID.toString(), isTracking: true }, (err, guilds) => {
                if(err) { callback(true, false, err); }
                else {
                  if(guilds.length === 0) {
                    Clan.updateOne({ clanID }, { firstScan: true, isTracking: false, clanLevel: 1, memberCount: 0, onlineMembers: 0, lastScan: new Date() }, { }, (err, numAffected) => {
                      if(err || numAffected < 1) { callback(true, false, `Failed to remove tracking from clan: ${ clanID }, ${ err }`); }
                      else {
                        addLog({ location: "Frontend", type: "Clan", log: `Clan: ${ clanID } has been removed from tracking as there are no more guilds tracking it.` },
                          function AddLogToDB(isError, severity, err) { if(isError) { ErrorHandler(severity, err) }
                        });
                      }
                    });
                  }
                }
              });
            }
            callback(false, true, array[0]);
          }
        });
      }
      else { callback(false, false, null); }
    }
  });
}
const enableItemBroadcast = async (guild, item, callback) => {
  if(!guild.broadcasts.extraItems.find(e => e.hash === item.collectibleHash)) {
    guild.broadcasts.extraItems.push({ name: item.displayProperties.name, hash: item.collectibleHash, enabled: true });
    Guild.updateOne({ guildID: guild.guildID }, { broadcasts: guild.broadcasts }, { }, (err, numAffected) => {
      if(err || numAffected < 1) { callback(true, "Med", err); }
      else { callback(false); }
    });
  }
  else { callback(true, "low", "This item is already being tracked"); }
}
const disableItemBroadcast = async (guild, item, callback) => {
  if(guild.broadcasts.extraItems.find(e => e.hash === item.collectibleHash)) {
    guild.broadcasts.extraItems.splice(guild.broadcasts.extraItems.indexOf(guild.broadcasts.extraItems.find(e => e.hash === item.collectibleHash)), 1);
    Guild.updateOne({ guildID: guild.guildID }, { broadcasts: guild.broadcasts }, { }, (err, numAffected) => {
      if(err || numAffected < 1) { callback(true, "Med", err); }
      else { callback(false); }
    });
  }
  else { callback(true, "low", "This item is not being tracked"); }
}

module.exports = {
  checkSSHConnection, checkDBConnection,
  FrontendConnect, BackendConnect, ExpressConnect, GlobalsConnect,
  addGuild, addClan, addGlobalItem, addBannedUser, addAwaitingBroadcast, addBroadcast, addRegisteredUser, addManifest, addLog, addBackendStatusLog, addFrontendStatusLog,
  addHourlyFrontendStatusLog, addHourlyBackendStatusLog, addTimeLog, addCookieLog, addGunsmithMods, addAuth, 
  findUserByID, findGuildByID, findClanByID, findBroadcast, findRegisteredUserByID, 
  getAllGuilds, getClanGuilds, getAllClans, getAllUsers, getAllRegisteredUsers, getGlobalItems, getAllGlobalItems, getAllTrackedUsers,
  getTrackedGuilds, getTrackedClanGuilds, getTrackedClans, getUsersByClanIDArrayList, getGuildsByGuildIDArrayList, getClansFromGuildID, getUsersFromGuildID, getUserItems, getUserTitles, getUserBroadcasts, getAllBannedUsers, 
  getAwaitingBroadcasts, getManifestVersion, getGuildPlayers, getGuildTitles, getGuildItems, getGuildBroadcasts, getGuildItemBroadcasts, getClanUsers,
  getBackendLogs, getFrontendLogs, getDiscordUserLogs, getDiscordGuildLogs, getUserDetails, getBroadcastLogs, getBroadcasts, getLogs, getAPIStatus, getGunsmithMods, getGuildDashboard,
  getWeeklyFrontendLogs, getWeeklyBackendLogs, getScanTimeLogs, getAggregateWeeklyFrontendLogs,
  removeBannedUser, removeAwaitingBroadcast, removeAllAwaitingBroadcasts, removeClanFromPlayer,
  updateUserByID, updateBannerUserByID, updatePrivacyByID, updateClanByID, updateManifestVersion, updateGuildByID,
  forceFullRescan, enableGuildTracking, disableGuildTracking, enableItemBroadcast, disableItemBroadcast,
  getAllClansForExpress, getDailyUsers, getClanByID, getClanMembersByID, getClanBroadcastsByID, getLastCookieLog, getTimeLogs
}