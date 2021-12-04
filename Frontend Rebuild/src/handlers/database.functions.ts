import * as ModelsHandler from './models.handler';
import * as MockHandler from './mock.handler';
import dotenv from 'dotenv';
dotenv.config();

export const addLog = (data, callback) => {
  
}

export const getManifestVersion = async (callback) => {
  // Callback fields { isError, isFound, data }
  if(process.env.USE_MOCK) {
    callback(false, true, await MockHandler.getMock('Manifests'));
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
    MockHandler.updateMock('Manifests', data).then(response => {
      if(response.updated) { callback(false, true, response.data); }
      else { callback(false, false, null); }
    });
  }
  await ModelsHandler.UpdateDocument('Manifests', { name: "Version" }, data).then((documents) => {
    if(documents.length > 0) { callback(false, true, documents); }
    else { callback(false, false, null); }
  }).catch(err => callback(true, false, err));
}