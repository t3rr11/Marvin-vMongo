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
  description.push("I am Marvin. To set me up first register with me by using the `/Register example` command. Replace example with your in-game username.");
  description.push("Once registration is complete use the `/clan setup` command and **then wait 5 minutes** whilst I scan your clan. That's it you'll be ready to go!");
  description.push("Try out clan broadcasts this can be set up by typing `/Broadcasts channel #general` (does not have to be general).");
  description.push("See `/help` to see what I can do!");

  embed.title = "Clan help";
  embed.description = description.join('\n\n');

  return embed;
}