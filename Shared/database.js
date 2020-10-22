//Required Libraries and Files
const mongoose = require('mongoose');
const ssh = require('tunnel-ssh');
const Log = require('./log');
const Config = require('./configs/Config.json');
const SSHConfig = require(`./configs/${ Config.isLocal ? 'local' : 'live' }/SSHConfig.js`).Config;

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

//Variables
let SSHConnected = false;
let DBConnected = false;

const checkSSHConnection = () => { return SSHConnected }
const checkDBConnection = () => { return DBConnected }

//SSH and Connect to Mongo
function FrontendConnect() { var mongoConfig = SSHConfig.mongoConfig; mongoConfig.dstPort = mongoConfig.dstPorts[0]; StartConnection("frontend", mongoConfig); }
function BackendConnect() { var mongoConfig = SSHConfig.mongoConfig; mongoConfig.dstPort = mongoConfig.dstPorts[1]; StartConnection("backend", mongoConfig); }
function ExpressConnect() { var mongoConfig = SSHConfig.mongoConfig; mongoConfig.dstPort = mongoConfig.dstPorts[2]; StartConnection("express", mongoConfig); }

function StartConnection(system, mongoConfig) {
  if(Config.isLocal) {
    var server = ssh(mongoConfig, (err) => { if(!err) { SSHConnected = true; console.log("Connected to SSH"); StartMongoConnection(); } });
    server.on('error', (err) => {
      if(err.code === "ECONNRESET" || err.code === "CONNECT_FAILED") {
        switch(system) {
          case "frontend": { FrontendConnect(); break; }
          case "backend": { BackendConnect(); break; }
          case "express": { ExpressConnect(); break; }
          default: { console.log("Database Connection Error:", err); }
        }
      }
      else { console.log("Database Connection Error:", err); }
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
const addUser = async (userData, callback) => {
  //Callback fields { isError, severity, err }
  await findUserByID(userData.membershipID, async (isError, isFound, data) => {
    if(!isError) {
      if(!isFound) {
        await new User(userData).save((err, user) => {
          if(err) { callback(true, "High", err) }
          else {
            console.log(user.displayName + " added to collection.");
            callback(false);
          }
        });
      } else { callback(true, "Low", `Tried to add duplicate user: ${ userData.membershipID }`) }
    } else { callback(true, "High", data) }
  });
}
const addGuild = async (guildData, callback) => {
  //Callback fields { isError, severity, err }
  await findGuildByID(guildData.guildID, async (isError, isFound, data) => {
    if(!isError) {
      if(!isFound) {
        await new Guild(guildData).save((err, guild) => {
          if(err) { callback(true, "High", err) }
          else {
            console.log(guild.guildName + " added to collection.");
            callback(false);
          }
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
          else {
            console.log(clan.clanName + " added to collection.");
            callback(false);
          }
        });
      } else { callback(true, "Low", `Tried to add duplicate clan: ${ clanData.clanName }`) }
    } else { callback(true, "High", data) }
  });
}
const addGlobalItem = async (globalItemData, callback) => {
  await new GlobalItem(globalItemData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { console.log(doc.name + " added to collection."); callback(false); }
  });
}
const addBannedUser = async (userData, callback) => {
  await new BanUser(userData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else { console.log(doc.name + " added to collection."); callback(false); }
  });
}
const addAwaitingBroadcast = async (broadcastData, callback) => {
  await new AwaitingBroadcast(broadcastData).save((err, doc) => {
    if(err) { callback(true, "High", err) }
    else {
      if(doc.displayName) {
        //Log.SaveLog("Clan", `${ doc.displayName } (${ doc.membershipID }) from guild: (${ doc.guildID }) has obtained ${ doc.broadcast }`);
      }
      else {
        //Log.SaveLog("Clan", doc.broadcast);
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
            if(doc.displayName) { Log.SaveLog("Clan", `${ doc.displayName } (${ doc.membershipID }) from guild: (${ doc.guildID }) has obtained ${ doc.broadcast }`) }
            else { Log.SaveLog("Clan", doc.broadcast); }
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
    else { console.log(doc.name + " added to collection."); callback(false); }
  });
}
const addRegisteredUser = async (userData, callback) => {
  //Callback fields { isError, severity, err }
  await findRegisteredUserByID(userData.discordID, async (isError, isFound, data) => {
    if(!isError) {
      if(!isFound) {
        await new RegisteredUser(userData).save((err, user) => {
          if(err) { callback(true, "High", err) }
          else {
            console.log(user.username + " has Registered.");
            callback(false);
          }
        });
      } else { callback(true, "Low", `Tried to add duplicate user: ${ userData.username }(${ userData.discordID })`) }
    } else { callback(true, "High", data) }
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
  await Guild.find({ clans: clanID.toString() }, (err, array) => {
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
const getTrackedUsers = async (callback) => {
  //Callback fields { isError, isFound, data }
  await User.find({ isTracking: true }, (err, array) => {
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
  await Guild.findOne({ guildID, isTracking: true }, async (err, guild) => {
    if(err) { callback(true, false, err); }
    else {
      if(guild) {
        await UserItems.find({ clanID: guild.clans }, (err, users) => {
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

const test = async (callback) => {
  await User.find({ membershipID: "4611686018471334813" }, (err, data) => {
    if(err) { callback(true, false, err) }
    else {
      if(data.length > 0) { callback(false, true, data) } 
      else { callback(false, false) }
    }
  });
}

//Updates
const updateUserByID = async (membershipID, data, callback) => {
  let user = await User.findOne({ membershipID });
  if(user !== null) {
    let successCheck = [];
    await new Promise(resolve => { User.updateOne({ membershipID }, data.user, {}, (err, numAffected) => { if(err || numAffected < 1) { successCheck.push({ "error": "User", "reason": err }); } else { successCheck.push(true); } }); resolve(true); })
    await new Promise(resolve => { UserItems.updateOne({ membershipID }, data.items, {}, (err, numAffected) => { if(err || numAffected < 1) { successCheck.push({ "error": "UserItems", "reason": err }); } else { successCheck.push(true); } }); resolve(true); });
    await new Promise(resolve => { UserTitles.updateOne({ membershipID }, data.titles, {}, (err, numAffected) => { if(err || numAffected < 1) { successCheck.push({ "error": "UserTitles", "reason": err }); } else { successCheck.push(true); } }); resolve(true); });
    if(successCheck.every(e => e === true)) {
      callback(false);
      //console.log(`Updated User: ${ data.user.displayName }`);
    }
    else { callback(true, "High", successCheck) }
  }
  else {
    let successCheck = [];
    await new Promise(resolve => { new User(data.user).save((err, doc) => { if(err) { successCheck.push({ "error": "User", "reason": err }); } else { successCheck.push(true); } resolve(true); }); });
    await new Promise(resolve => { new UserItems(data.items).save((err, doc) => { if(err) { successCheck.push({ "error": "UserItems", "reason": err }); } else { successCheck.push(true); } resolve(true); }); });
    await new Promise(resolve => { new UserTitles(data.titles).save((err, doc) => { if(err) { successCheck.push({ "error": "UserTitles", "reason": err }); } else { successCheck.push(true); } resolve(true); }); });
    if(successCheck.every(e => e === true)) {
      callback(false);
      //console.log(`Added User: ${ data.user.displayName }`);
    }
    else { callback(true, "High", successCheck) }
  }
}
const updatePrivacyByID = async (membershipID, data, callback) => {
  let user = await User.findOneAndUpdate({ membershipID }, data);
  if(user !== null) {
    callback(false);
    if(user.isPrivate !== data.isPrivate) {
      console.log(`Updated Privacy Settings For User: ${ user.displayName }, isPrivate: ${ data.isPrivate }`);
    }
  }
  else {
    callback(true, "Low", `NoUser`);
    //console.log(`User: ${ membershipID }, does not exist yet. Need to make?`);
  }
}
const updateClanByID = async (clanID, data, callback) => {
  Clan.updateOne({ clanID }, data, { }, (err, numAffected) => {
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

//Remove
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

module.exports = {
  FrontendConnect, BackendConnect, ExpressConnect,
  checkSSHConnection, checkDBConnection,
  addUser, addGuild, addClan, addGlobalItem, addBannedUser, addAwaitingBroadcast, addBroadcast, addRegisteredUser, addManifest,
  findUserByID, findGuildByID, findClanByID, findBroadcast, getAllGuilds, getClanGuilds, getAllClans, getAllUsers, getAllRegisteredUsers, getAllGlobalItems,
  getTrackedGuilds, getTrackedClanGuilds, getTrackedClans, getTrackedUsers, getUserItems, getUserTitles, getUserBroadcasts, getAwaitingBroadcasts,
  getManifestVersion, getGuildPlayers, getGuildTitles, getGuildItems,
  removeAwaitingBroadcast, removeAllAwaitingBroadcasts,
  updateUserByID, updatePrivacyByID, updateClanByID, updateManifestVersion,
  test
}