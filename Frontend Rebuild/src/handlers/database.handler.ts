import ssh from 'tunnel-ssh';
import { Server } from 'net';
import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export let DB: Connection;

export interface IConnectionStatus {
  UsingSSH: boolean | undefined,
  UsingMock: boolean | undefined,
  SSHConnected: boolean | undefined,
  DBConnected: boolean | undefined
}

export let ConnectionStatus: IConnectionStatus = {
  UsingSSH: process.env.LOCAL ? true : false,
  UsingMock: process.env.USE_MOCK ? true : false,
  SSHConnected: false,
  DBConnected: false
}

export const StartConnection = () => new Promise<IConnectionStatus>(async (resolve, reject) => {
  if(ConnectionStatus.UsingMock) {
    console.log('Using mock database');
  }
  else if(ConnectionStatus.UsingSSH) {
    await StartSSHConnection()
      .then(connected => ConnectionStatus.SSHConnected = connected)
      .catch((err) => { throw new Error(err);
    });
    await StartDBConnection()
      .then(connected => ConnectionStatus.DBConnected = connected)
      .catch((err) => { throw new Error(err);
    });
  }
  else {
    await StartDBConnection()
      .then(connected => ConnectionStatus.DBConnected = connected)
      .catch((err) => { throw new Error(err);
    });
  }
  resolve(ConnectionStatus);
});

const StartSSHConnection = () => new Promise<boolean>((resolve, reject) => {
  const privateKey = require('fs').readFileSync(require("path").resolve(__dirname, "../data/PrivateKey.ppk"));
  const { SSH_HOST, SSH_USER, SSH_PASSPHRASE, SSH_AUTH_SOCK, SSH_PORT, MONGO_DSTPORT } = process.env;
  
  ssh({
    host: SSH_HOST,
    username: SSH_USER,
    privateKey: privateKey,
    passphrase: SSH_PASSPHRASE,
    agent: SSH_AUTH_SOCK,
    port: Number(SSH_PORT),
    dstPort: Number(MONGO_DSTPORT)
  }, async (err: Error, server: Server) => {
    
    server.on('error', (err: Error) => {
      console.log(err.message);
      reject(err.message);
    });
    
    console.log(`Connected to ${ process.env.SSH_HOST } (SSH)`);

    resolve(true);
  });
});

const StartDBConnection = () => new Promise<boolean>((resolve, reject) => {
  const { MONGO_DATABASE } = process.env;
  const options = {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  };
  mongoose.connect(`mongodb://localhost/${ MONGO_DATABASE }`, options).catch((err: Error) => {
    console.log(err.message);
    reject(err.message);
  }).then(() => {
    console.log("Connected to MongoDB");
    DB = mongoose.connection;
    resolve(true);
  });
});