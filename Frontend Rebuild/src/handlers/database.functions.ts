import * as ModelsHandler from './models.handler';
import * as MockHandler from './mock.handler';
import dotenv from 'dotenv';
dotenv.config();

export const addLog = (data, callback) => {
  
}

export const getManifestVersion = async (callback) => {
  // Callback fields { isError, isFound, data }
  if(JSON.parse(process.env.USE_MOCK)) {
    callback(false, true, await MockHandler.getMock('Manifests'));
    return;
  }
  await ModelsHandler.GetDocuments('Manifests').then((documents) => {
    // Callback fields { isError, isFound, data }
    if(documents.length > 0) { callback(false, true, documents); }
    else { callback(false, false, null); }
  }).catch(err => callback(true, false, err));
}

export const updateManifestVersion = async (data, callback) => {
  // Callback fields { isError, isFound, data }
  if(JSON.parse(process.env.USE_MOCK)) {
    MockHandler.updateMock('Manifests', data).then(response => {
      if(response.updated) { callback(false, true, response.data); }
      else { callback(false, false, null); }
    });
  }
  await ModelsHandler.UpdateDocument('Manifests', { name: "Version" }, data).then((documents) => {
    // Callback fields { isError, isFound, data }
    if(documents.length > 0) { callback(false, true, documents); }
    else { callback(false, false, null); }
  }).catch(err => callback(true, false, err));
}

export const getGuildMembers = async (guildID, callback) => {
  // Callback fields { isError, isFound, data }
  if(JSON.parse(process.env.USE_MOCK)) {
    await MockHandler.getMock('Guilds').then(async (guilds) => {
      const guild = guilds.find(guild => guild.guildID === guildID);
      if(guild) {
        await MockHandler.getMock('Users').then(users => {
          callback(false, true, users.filter(user => guild.clans.includes(String(user.clanID))));
        });
      }
      else {
        callback(false, false, []);
      }
    });
  }
  await ModelsHandler.GetDocuments('Guilds', { guildID }).then(async (guilds) => {
    // Callback fields { isError, isFound, data }
    if(guilds.length > 0) {
      const guild = guilds[0] as any;

      await ModelsHandler.GetDocuments('Users', { clanID: { $in: [...guild.clans] } }).then(async (users) => {
        if(users.length > 0) {
          callback(false, true, users);
        }
        else { callback(false, false, null); }
      }).catch(err => callback(true, false, err));
    }
    else { callback(false, false, null); }
  }).catch(err => callback(true, false, err));
}