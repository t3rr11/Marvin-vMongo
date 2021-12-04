import DiscordJS, { Intents } from 'discord.js';
import { StartConnection, IConnectionStatus } from './src/handlers/database.handler';
import * as InteractionsHandler from './src/handlers/interactions.handler';
import * as MessageHandler from './src/handlers/message.handler';
import * as ModelsHandler from './src/handlers/models.handler';
import * as ManifestHandler from './src/handlers/manifest.handler';
import * as MockHandler from './src/handlers/mock.handler';
import dotenv from 'dotenv';
dotenv.config();

// Create a new Discord client
const client = new DiscordJS.Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

// Global variables
let Guilds = [];
let Clans = [];
let DiscordReady: boolean = false;
let DatabaseReady: boolean = false;

// Startup - Connect to the database
StartConnection().then((ConnectionStatus: IConnectionStatus) => {
  if(ConnectionStatus.UsingMock) {
    Guilds = MockHandler.getMock('Guilds');
    Clans = MockHandler.getMock('Clans');
    DatabaseReady = true;
  }
  else {
    new Promise(async () => {
      Guilds = await ModelsHandler.GetDocuments('Guilds').finally(() => { console.log('Guilds have been set'); });
      Clans = await ModelsHandler.GetDocuments('Clans').finally(() => { console.log('Clans have been set'); });
      DatabaseReady = true;
    });
  }
});

//Make sure before doing anything that we are connected to the database. Run a simple interval check that ends once it's connected.
ManifestHandler.checkManifestUpdate('');
let startupCheck = setInterval(async function Startup() {
  if(DiscordReady && DatabaseReady && ManifestHandler.checkManifestMounted()) {
    console.log('Manifest is ready');
    clearInterval(startupCheck);

    Ready();
  }
}, 1000);

const Ready = () => {
  console.log('Yeah we really ready now.');
};

client.on('ready', async () => {
  await InteractionsHandler.init(client);
  console.log('Bot is ready');
  DiscordReady = true;
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  InteractionsHandler.handle(interaction);
});

client.on('messageCreate', (message) => {
  MessageHandler.handleMessage(message);
});

client.login(process.env.TOKEN);