import DiscordJS, { CommandInteraction } from 'discord.js';
import * as LogHandler from './log.handler';
import * as MiscHandler from './misc.handler';
import * as DatabaseFunctions from './database.functions';
import { Rankings, Raids } from '../interactions';

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

export const buildLeaderboard = async (interaction: CommandInteraction, category: string) => {
  let embed = new DiscordJS.MessageEmbed().setColor(0x0099FF).setFooter(process.env.DEFAULT_FOOTER, process.env.DEFAULT_LOGO_URL).setTimestamp();
  let command;
  
  switch(category) {
    case "rankings": {
      command = Rankings.filter(c => c.commands.find(cm => interaction.commandName.startsWith(cm)))[0];
      break;
    }
    case "raids": {
      command = Raids.filter(c => c.commands.find(cm => interaction.options.getSubcommand().startsWith(cm)))[0];
      break;
    }
  }

  var getGuildMembers = () => new Promise(resolve => {
    DatabaseFunctions.getGuildMembers(process.env.TEST_GUILD_ID, (isError, isFound, data) => {
      resolve(data.filter(user => !user?.isPrivate));
    });
  });

  const players = await getGuildMembers() as any[];

  if(players.length > 0) {
    if(command) {
      const leaderboard_size = interaction.options.getNumber('size') || command?.size || 10;

      try {
        let sortedPlayers = [];

        if(!Array.isArray(command.sorting)) { sortedPlayers = players.sort((a, b) => byString(b, command.sorting) - byString(a, command.sorting)); }
        else {
          sortedPlayers = players.sort((a, b) => {
            return (byString(b, command.sorting[0]) + byString(b, command.sorting[1])) - (byString(a, command.sorting[0]) + byString(a, command.sorting[1]))
          });
        }

        embed.setAuthor(command.title);
        embed.setDescription(
          `${ command.description ? command.description : '' }` + '\n' +
          `${ command.leaderboardURL ? `[Click to see full leaderboard](https://marvin.gg/leaderboards/${ process.env.TEST_GUILD_ID }/${ command.leaderboardURL }/)` : '' }` + '\n' +
          "```" + 
            `Rank: ${ mapDefaultFieldNames(command.fields) } - Name` + `\n\n` +
            `${ buildRows(command.fields, sortedPlayers, leaderboard_size).join('') }` +
          "```"
        );
      } catch(err) {
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

const mapDefaultFieldNames = (fields) => fields.map((field, index) => index === fields.length-1 ? `${ field.name }` : `${ field.name } - `).join('');

const mapFieldNames = (fields, player) => {
  return fields.map((field, index) => {
    switch(field.type) {
      case 'Leaderboard': {
        const lastRow = index === fields.length-1;
        const field_data = Math.floor(byString(player, field.data));
        const field_data_with_commas = MiscHandler.AddCommas(field_data);
        const secondary_field_data = field.resetInterval ? ` (${ Math.floor(Number(field_data) / field.resetInterval) })`: '';

        return `${ field_data_with_commas }${ secondary_field_data }` + `${ lastRow ? '' : ' - ' }`;
      }
      case 'SplitTotal': {
        const lastRow = index === fields.length-1;
        const field_data = [Math.floor(byString(player, field.data[0])), Math.floor(byString(player, field.data[1]))];
        const field_data_with_commas = [MiscHandler.AddCommas(field_data[0]), MiscHandler.AddCommas(field_data[1])];
        const total_field_data_with_commas = MiscHandler.AddCommas(Number(field_data[0]) + Number(field_data[1]));

        return `${ total_field_data_with_commas } (${ field_data_with_commas[0] } | ${ field_data_with_commas[1] })` + `${ lastRow ? '' : ' - ' }`;
      }
    }
  }).join('');
}

const buildRows = (fields, sortedPlayers, size) => {
  return sortedPlayers.map((player, index) => {
    const rank = parseInt(index)+1;
    const serialisedName = player.displayName.replace(/\*|\^|\~|\_|\`/g, function(x) { return "\\" + x });
    const leaderboard_fields = mapFieldNames(fields, player);

    return `${ rank }: ${ leaderboard_fields } - ${ serialisedName }\n`;
  }).slice(0, size);
}