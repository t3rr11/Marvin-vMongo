import DiscordJS, { CommandInteraction } from 'discord.js';

export const handleInteraction = (interaction: CommandInteraction) => {
  let embed = new DiscordJS.MessageEmbed().setColor(0x0099FF).setFooter(process.env.DEFAULT_FOOTER, process.env.DEFAULT_LOGO_URL).setTimestamp();
  const command = interaction.options.getSubcommand();

  switch(command) {
    case 'help': {
      return buildHelp(embed);
    }
  }

  return embed;
}

const buildHelp = (embed: DiscordJS.MessageEmbed): DiscordJS.MessageEmbed => {
  let description = [];
  description.push("**Setup** - It's easy!");
  description.push("- First register by using the `/register` command.\n- Then once registered `/clan setup`\n");

  description.push("**Want more than one clan?**");
  description.push("Todo\n");

  description.push("**Manage**");
  description.push("Todo\n");

  description.push("**Remove**");
  description.push("Todo\n");

  embed.title = "Need help do ya? - Clan Help";
  embed.description = description.join('\n');

  return embed;
}