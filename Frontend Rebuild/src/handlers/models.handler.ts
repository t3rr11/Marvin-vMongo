import { DB } from './database.handler';
import mongoose, { Document, Model } from 'mongoose';

import { guildSchema } from '../schemes/guild.schema';
import { clanSchema } from '../schemes/clan.schema';
import { userSchema } from '../schemes/user.schema';
import { manifestsSchema } from '../schemes/manifest.schema';

const Guilds = mongoose.model('guilds', guildSchema);
const Clans = mongoose.model('clans', clanSchema);
const Users = mongoose.model('users', userSchema);
const Manifests = mongoose.model('manifests', manifestsSchema);

export const GetModel = (collection): Model<any,{},{},{}> => {
  switch(collection) {
    case "Guilds": { return Guilds; }
    case "Clans": { return Clans; }
    case "Users": { return Users; }
    case "Manifests": { return Manifests; }
    default: { return; }
  }
}

export const GetCollections = () => new Promise<boolean>((resolve, reject) => {
  console.log(DB.name);
  DB.db.listCollections({ }).next(function(err, collections) {
    if (collections) {
      console.log(collections);
    }
    else {
      console.log('Collections no existy');
    }
  });
});

export const GetDocuments = (collection: string, identifier?: {}) => new Promise<Document[]>((resolve, reject) => {
  GetModel(collection).find(identifier ? identifier : {}, (err: Error, data: Document[]) => {
    if (err) throw err;
    resolve(data);
  });
});

export const UpdateDocument = (collection: string, identifier?: {}, data?: {}) => new Promise<Document[]>((resolve, reject) => {
  GetModel(collection).updateOne(identifier ? identifier : {}, data ? data : {}, (err: Error, data: Document[]) => {
    if (err) throw err;
    resolve(data);
  });
});