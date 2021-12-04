import DiscordJS, { Client, ApplicationCommandManager, GuildApplicationCommandManager, CommandInteraction } from 'discord.js';
import * as LogHandler from './log.handler';
import * as LeaderboardHandler from './leaderboard.handler';

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
  commands?.create({
    name: "valor",
    description: 'Return a clan leaderboard for valor',
    options: [
      {
        name: 'size',
        description: 'How big of a leaderboard do you want? Top 10? Top 25? Top 5? (max 25)',
        required: false,
        type: NUMBER
      },
    ],
  });
}

export const handle = async (interaction: CommandInteraction) => {
  switch(interaction.commandName) {
    case 'valor': {
      await interaction.deferReply(); // This allows the response to take longer than 5 seconds if logic will take longer.
      const embed = await LeaderboardHandler.buildLeaderboard(interaction);
      if(embed) {
        interaction.editReply({
          embeds: [embed]
        }).catch(err => catchError(err, interaction));
      }
      else {
        interaction.editReply({
          content: `I\'m not sure what that commands is sorry. Use /help to see commands.`,
        }).catch(err => catchError(err, interaction));
      }
    }
  }
}

const catchError = async (err: Error, interaction: CommandInteraction) => {
  LogHandler.SaveLog('Frontend', 'Error', `Failed Interaction: ${ interaction.commandName }, Reason: ${ err.message }`);
  interaction.editReply({
    content: `Something went wrong. Try again?`,
  });
}