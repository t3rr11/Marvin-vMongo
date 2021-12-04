import { ErrorHandler } from './error.handler';
import fs from 'fs';

type mocks = "Clans" | "Guilds" | "Manifests" | "Users";

const formMockURL = (mock: mocks) => {
  return `./src/data/mocks/${ mock.toLowerCase() }.json`;
}
const templateMockURL = (mock: mocks) => {
  return `./src/data/mock-templates/${ mock.toLowerCase() }.json`;
}

export const getMock = (mock: mocks) => {
  if(!fs.existsSync(formMockURL(mock))) {
    const getTemplateMock = JSON.parse(fs.readFileSync(templateMockURL(mock)).toString());
    updateMock(mock, getTemplateMock);
    return getTemplateMock;
  }
  return JSON.parse(fs.readFileSync(formMockURL(mock)).toString());
}

export const updateMock = async (mock: mocks, data): Promise<{ updated: boolean, data }> => {
  let updated: boolean;

  await fs.writeFile(formMockURL(mock), JSON.stringify(data, null, 2), function (err) {
    if (err) {
      ErrorHandler("High", err);
      updated = false;
    }
    updated = true;
  });

  return { updated, data };
}