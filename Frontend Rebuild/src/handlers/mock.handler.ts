import { ErrorHandler } from './error.handler';
import fs from 'fs';

type mocks = "Clans" | "Guilds" | "Manifests" | "Users";

const formFileURL = (mock: mocks) => {
  return `./src/data/mocks/${ mock.toLowerCase() }.json`;
}

export const getMock = (mock: mocks) => {
  if(!fs.existsSync(formFileURL(mock))) {
    // Do re-create mock code;
    return [];
  }
  return JSON.parse(fs.readFileSync(formFileURL(mock)).toString());
}

export const updateMock = async (mock: mocks, data): Promise<{ updated: boolean, data }> => {
  let updated: boolean;

  await fs.writeFile(formFileURL(mock), JSON.stringify(data), function (err) {
    if (err) {
      ErrorHandler("High", err);
      updated = false;
    }
    updated = true;
  });

  return { updated, data };
}