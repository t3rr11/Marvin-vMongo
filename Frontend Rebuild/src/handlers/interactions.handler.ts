import DiscordJS, { Client, ApplicationCommandManager, GuildApplicationCommandManager, CommandInteraction } from 'discord.js';
import * as LogHandler from './log.handler';
import * as LeaderboardHandler from './leaderboard.handler';
import * as ClanHandler from './clan.handler';
import { Rankings, Raids } from '../interactions';

const sizeOption = {
  name: 'size',
  description: 'How big of a leaderboard do you want? Top 10? Top 25? Top 5? (max 25)',
  type: 10 // NUMBER
};

export const init = (client: Client) => {
  const guild = client.guilds.cache.get(process.env.TEST_GUILD_ID!);
  let commands: GuildApplicationCommandManager | ApplicationCommandManager | undefined;

  // If guild then it adds the commands locally else add the commands globally (1hr wait time)
  if(guild) { commands = guild.commands; }
  else { commands = client.application?.commands; }

  registerInteractions(commands, guild);
}

const registerInteractions = (commands: GuildApplicationCommandManager | ApplicationCommandManager | undefined, guild?) => {
  const { NUMBER, STRING } = DiscordJS.Constants.ApplicationCommandOptionTypes;
  
  Rankings.map(interactionConfig => {
    interactionConfig.commands.map(command => {
      commands?.create({
        name: command,
        description: interactionConfig.title,
        options: [sizeOption],
      });
    })
  });

  commands?.create({
    name: "raid",
    description: "Create a leaderboard for a specific raid",
    options: [
      ...Raids.flatMap(raid => {
        return raid.commands.map(raid_command => {
          return {
            name: raid_command,
            description: raid.interaction_desc,
            type: 1, // SUB COMMAND
            options: [sizeOption]
          };
        });
      })
    ]
  });

  commands?.create({
    name: "clan",
    description: "Setup or manage the clans linked with this server",
    options: [
      {
        name: 'help',
        description: 'Helpful information to get you started.',
        type: 1, // SUB COMMAND
      },
      {
        name: 'setup',
        description: 'Link your clan to this server.',
        type: 1, // SUB COMMAND
      },
      {
        name: 'add',
        description: 'Link another clan to this discord.',
        type: 1, // SUB COMMAND
        options: [
          {
            name: "id",
            description: 'Use `/clan help` to learn how to get this ID value for this command',
            required: true,
            type: 10, // NUMBER
          }
        ]
      },
      {
        name: 'remove',
        description: 'Remove a linked clan from this discord server.',
        type: 1, // SUB COMMAND
      },
    ]
  });
}

export const handle = async (interaction: CommandInteraction) => {
  await interaction.deferReply(); // This allows the response to take longer than 5 seconds if logic will take longer.

  if(Rankings.filter(interactionConfig => interactionConfig.commands.includes(interaction.commandName)).length > 0) {
    interaction.editReply({
      embeds: [ await LeaderboardHandler.buildLeaderboard(interaction, 'rankings') ]
    }).catch(err => catchError(err, interaction));
  }
  else if(interaction.commandName === 'raid') {
    interaction.editReply({
      embeds: [ await LeaderboardHandler.buildLeaderboard(interaction, 'raids') ]
    }).catch(err => catchError(err, interaction));
  }
  else if(interaction.commandName === 'clan') {
    interaction.editReply({
      embeds: [ await ClanHandler.handleInteraction(interaction) ]
    }).catch(err => catchError(err, interaction));
  }
  else {
    interaction.editReply({
      content: `I forgot to code this. Oops. Let's just agree that this feature is coming soon (tm). Yeah...`,
    }).catch(err => catchError(err, interaction));
  }
}

const catchError = async (err: Error, interaction: CommandInteraction) => {
  LogHandler.SaveLog('Frontend', 'Error', `Failed Interaction: ${ interaction.commandName }, Reason: ${ err.message }`);
  interaction.editReply({
    content: `Something went wrong. Try again?`,
  });
}