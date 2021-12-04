import * as DatabaseFunctions from './database.functions';
import * as Misc from './misc.handler';
import dotenv from 'dotenv';
dotenv.config();

export const SaveLog = (location, type, log) => {
  if(location !== "ErrorHandler") { console.log(Misc.GetReadableDateTime() + " - " + log); }
  if(!process.env.LOCAL) { DatabaseFunctions.addLog({ location, type, log }, function AddLogToDB(isError, severity, err) { }) }
}