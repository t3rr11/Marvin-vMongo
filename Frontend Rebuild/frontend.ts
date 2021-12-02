import DiscordJS, { Intents } from 'discord.js';
import * as InteractionsHandler from './handlers/interactions.handler';
import * as MessageHandler from './handlers/message.handler';
import dotenv from 'dotenv';
dotenv.config();

const client = new DiscordJS.Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

client.on('ready', () => {
  console.log('Bot is ready');

  InteractionsHandler.init(client);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  InteractionsHandler.handle(interaction);
});

client.on('messageCreate', (message) => {
  MessageHandler.handleMessage(message);
});

client.login(process.env.TOKEN);