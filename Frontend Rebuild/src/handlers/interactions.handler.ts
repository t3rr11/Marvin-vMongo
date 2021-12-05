import DiscordJS, { Client, ApplicationCommandManager, GuildApplicationCommandManager, CommandInteraction } from 'discord.js';
import * as LogHandler from './log.handler';
import * as LeaderboardHandler from './leaderboard.handler';
import { Commands } from '../commands';
import { Interactions } from '../interactions';

export const init = (client: Client) => {
  const guild = client.guilds.cache.get(process.env.TEST_GUILD_ID!);
  let commands: GuildApplicationCommandManager | ApplicationCommandManager | undefined;

  // If guild then it adds the commands locally else add the commands globally (1hr wait time)
  if(guild) { commands = guild.commands; }
  else { commands = client.application?.commands; }

  registerInteractions(commands);
}

const registerInteractions = (commands: GuildApplicationCommandManager | ApplicationCommandManager | undefined) => {
  const { NUMBER } = DiscordJS.Constants.ApplicationCommandOptionTypes;
  Interactions.map(interactionConfig => {
    interactionConfig.commands.map(command => {
      commands?.create({
        name: command,
        description: interactionConfig.title,
        options: [
          {
            name: 'size',
            description: 'How big of a leaderboard do you want? Top 10? Top 25? Top 5? (max 25)',
            required: false,
            type: NUMBER
          },
        ],
      });
    })
  });
}

export const handle = async (interaction: CommandInteraction) => {
  let command = Interactions.filter(interactionConfig => interactionConfig.commands.includes(interaction.commandName));

  await interaction.deferReply(); // This allows the response to take longer than 5 seconds if logic will take longer.

  if(command) {
    interaction.editReply({
      embeds: [ await LeaderboardHandler.buildLeaderboard(interaction) ]
    }).catch(err => catchError(err, interaction));
  }
  else {
    interaction.editReply({
      content: `I\'m not sure what that commands is sorry. Use /help to see commands.`,
    }).catch(err => catchError(err, interaction));
  }
}

const catchError = async (err: Error, interaction: CommandInteraction) => {
  LogHandler.SaveLog('Frontend', 'Error', `Failed Interaction: ${ interaction.commandName }, Reason: ${ err.message }`);
  interaction.editReply({
    content: `Something went wrong. Try again?`,
  });
}