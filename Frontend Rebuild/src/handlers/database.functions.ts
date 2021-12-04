import * as ModelsHandler from './models.handler';
import dotenv from 'dotenv';
import { getMock, updateMock } from './mock.handler';
dotenv.config();

export const addLog = (data, callback) => {
  
}

export const getManifestVersion = async (callback) => {
  // Callback fields { isError, isFound, data }
  if(process.env.USE_MOCK) {
    callback(false, true, getMock('Manifests'));
    return;
  }
  await ModelsHandler.GetDocuments('Manifests').then((documents) => {
    if(documents.length > 0) { callback(false, true, documents); }
    else { callback(false, false, null); }
  }).catch(err => callback(true, false, err));
}

export const updateManifestVersion = async (data, callback) => { 
  // Callback fields { isError, isFound, data }
  if(process.env.USE_MOCK) {
    updateMock('Manifests', data).then(returned => {
      if(returned.saved) { callback(false, true, returned.data); }
      else { callback(false, false, null); }
    });
  }
  await ModelsHandler.UpdateDocument('Manifests', { name: "Version" }, data).then((documents) => {
    if(documents.length > 0) { callback(false, true, documents); }
    else { callback(false, false, null); }
  }).catch(err => callback(true, false, err));
}