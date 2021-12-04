import DiscordJS, { Client, ApplicationCommandManager, GuildApplicationCommandManager, CommandInteraction } from 'discord.js';
import * as LogHandler from './log.handler';
import * as MiscHandler from './misc.handler';
import * as DatabaseFunctions from './database.functions';
import { Commands } from '../commands';

const byString = function(o, s) {
  s = s.replace(/\[(\w+)\]/g, '.$1');       // convert indexes to properties
  s = s.replace(/^\./, '');                 // strip a leading dot
  var a = s.split('.');
  for (var i = 0, n = a.length; i < n; ++i) {
    var k = a[i];
    if (k in o) {
      o = o[k];
    } else {
      return;
    }
  }
  return o;
}

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
  const { commandName, options } = interaction;
  switch(commandName) {
    case 'valor': {
      const leaderboard_size = options.getNumber('size')!;

      await interaction.deferReply(); // This allows the response to take longer than 5 seconds if logic will take longer.
      
      const embed = await buildLeaderboard(interaction);

      if(embed) {
        interaction.editReply({
          embeds: [embed],
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

const buildLeaderboard = async (interaction: CommandInteraction) => {
  let embed = new DiscordJS.MessageEmbed().setColor(0x0099FF).setFooter(process.env.DEFAULT_FOOTER, process.env.DEFAULT_LOGO_URL).setTimestamp();
  let command = Commands.filter(c => c.commands.find(cm => interaction.commandName.startsWith(cm)))[0];

  var getGuildMembers = () => new Promise(resolve => {
    DatabaseFunctions.getGuildMembers(process.env.TEST_GUILD_ID, (isError, isFound, data) => {
      resolve(data.filter(user => !user?.isPrivate));
    });
  });

  const players = await getGuildMembers() as any[];

  if(players.length > 0) {
    if(command) {
      // Build leaderboard embed
      try { embed = BuildLeaderboard(embed, command, interaction, players) } catch(err) {
        LogHandler.SaveLog("Frontend", "Error", err);
        embed.setAuthor("Uhh oh...");
        embed.setDescription(`So something went wrong and this command just didn't work. It dun broke. Please report using /request`);
      };

      return embed;
    }
  }
  else {
    // Return message letting them know that the there was no players were returned.
    embed.setDescription(`No players found, this usually happen 1 of 2 reasons. \n\nFirstly you may not have setup the bot correctly, make sure you that you've registered yourself and used /set clan to setup the bot. \n\nIf you have done this then the reason I found no players is that I haven't scanned your clan yet. Because I serve so many clans it does take time before your inital clan setup would be complete. \n\nTry again in about 15-30 minutes if this is the case.`);
    return embed;
  }
}

function BuildLeaderboard(embed, command, interaction, players) {
  let sortedPlayers = [];

  if(!Array.isArray(command.sorting)) {
    sortedPlayers = players.sort((a, b) => {
      return byString(b, command.sorting) - byString(a, command.sorting)
    });
  }
  else {
    sortedPlayers = players.sort((a, b) => {
      return (byString(b, command.sorting[0]) + byString(b, command.sorting[1])) - (byString(a, command.sorting[0]) + byString(a, command.sorting[1]))
    });
  }

  embed.setAuthor(command.title);

  embed.setDescription(
    `${ command.description ? command.description : '' }` + '\n' +
    `${ command.leaderboardURL ? `[Click to see full leaderboard](https://marvin.gg/leaderboards/${ process.env.TEST_GUILD_ID }/${ command.leaderboardURL }/)` : '' }`
  );

  for(let field of command.fields) {
    embed.addField(field.name, BuildField(field, sortedPlayers, command.size).toString().replaceAll(/\,/ig, "\n"), field.inline);
  }

  return embed;
}

function BuildField(field, sortedPlayers, size) {
  switch(field.type) {
    case 'Name': {
      let builtField = sortedPlayers.map((e, index) => `${parseInt(index)+1}: ${e.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x })}`).slice(0, size);
      return builtField;
    }
    case 'Leaderboard': {
      let builtField = sortedPlayers.map((e, index) => `${ MiscHandler.AddCommas( Math.floor(byString(e, field.data))) }`).slice(0, size);
      return builtField;
    }
    case 'SplitLeaderboard': {
      let builtField =  sortedPlayers.map((e, index) => `${ MiscHandler.AddCommas( Math.floor(byString(e, field.data[0]))) } - ${ MiscHandler.AddCommas(Math.floor(byString(e, field.data[1]))) }`).slice(0, size);
      return builtField;
    }
    case 'PowerLeaderboard': {
      let builtField =  sortedPlayers.map((e, index) => `${ MiscHandler.AddCommas( Math.floor(byString(e, field.data[0]) + byString(e, field.data[1]))) } (${ MiscHandler.AddCommas(byString(e, field.data[0])) } + ${ MiscHandler.AddCommas(byString(e, field.data[1])) })`).slice(0, size);
      return builtField;
    }
    case 'TimeLeaderboard': {
      let builtField =  sortedPlayers.map((e, index) => `${ MiscHandler.AddCommas( Math.floor(byString(e, field.data)/60)) } Hrs`).slice(0, size);
      return builtField;
    }
    case 'SplitTotal': {
      let builtField =  sortedPlayers.map((e, index) => `${ MiscHandler.AddCommas( Math.floor(byString(e, field.data[0]) + byString(e, field.data[1]))) }`).slice(0, size);
      return builtField;
    }
    case 'Reset': {
      let builtField = sortedPlayers.map((e, index) => `${ MiscHandler.AddCommas((byString(e, field.data))) }`).slice(0, size);
      return builtField;
    }
  }
}