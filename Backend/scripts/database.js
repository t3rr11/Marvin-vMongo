//Required Libraries and Files
const mongoose = require('mongoose');
const ssh = require('tunnel-ssh');
const Config = require('../../Configs/Config.json');
const SSHConfig = require(`../../Configs/${ Config.isLocal ? 'Local' : 'Live' }/SSHConfig.js`).Config;
const { ErrorHandler } = require('./errorHandler');

//Schemas
const Guild = require('./models/guild_model');
const Clan = require('./models/clan_model');
const User = require('./models/user_model');

//Variables
let SSHConnected = false;
let DBConnected = false;

const checkSSHConnection = () => { return SSHConnected }
const checkDBConnection = () => { return DBConnected }

//SSH and Connect to Mongo
ssh(SSHConfig.mongoConfig, function (error, server) {
  if(error) { console.log("SSH connection error: " + error); }
  else {
    SSHConnected = true;
    console.log("Connected to SSH");
    mongoose.connect('mongodb://localhost/Test', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    DB = mongoose.connection;
    DB.on('error', console.error.bind(console, 'DB connection error:'));
    DB.once('open', () => { console.log("Connected to MongoDB"); DBConnected = true; });
  }
});

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

//Finds
const findUserByID = async (membershipID, callback) => {
  //Callback fields { isError, isFound, data }
  await User.find({ membershipID }, (err, array) => {
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

//Updates
const updateUserByID = async (mbmID, data) => {
  let user = await User.findOneAndUpdate({ mbmID }, { data }, { new: true });
  console.log(`Updated User: ${ user.name }`);
}

module.exports = {
  checkSSHConnection,
  checkDBConnection,
  addUser,
  addGuild,
  addClan,
  findUserByID,
  findGuildByID,
  findClanByID,
  getAllGuilds,
  getAllClans,
  getAllUsers,
  getTrackedGuilds,
  getTrackedClans,
  getTrackedUsers,
  updateUserByID
} 