import DiscordJS, { Client, ApplicationCommandManager, GuildApplicationCommandManager, CommandInteraction } from 'discord.js';

export const init = (client: Client) => {
  const guild = client.guilds.cache.get(process.env.TEST_GUILD_ID!);
  let commands: GuildApplicationCommandManager | ApplicationCommandManager | undefined;

  // If guild then it adds the commands locally else add the commands globally
  if(guild) { commands = guild.commands; }
  else { commands = client.application?.commands; }

  registerInteractions(commands);
}

const registerInteractions = (commands: GuildApplicationCommandManager | ApplicationCommandManager | undefined) => {
  commands?.create({
    name: "ping",
    description: 'pong'
  });

  commands?.create({
    name: "add",
    description: 'Adds two numbers.',
    options: [
      { name: 'num1', description: 'The first number', required: true, type: DiscordJS.Constants.ApplicationCommandOptionTypes.NUMBER },
      { name: 'num2', description: 'The second number', required: true, type: DiscordJS.Constants.ApplicationCommandOptionTypes.NUMBER },
    ]
  });
}

export const handle = async (interaction: CommandInteraction) => {
  const { commandName, options } = interaction;

  if(commandName === 'ping') {
    interaction.reply({
      content: 'pong',
      ephemeral: false // Setting this to true, means the commands used will only be shown to the user who sent the action, could be a guild enabled feature
    });
  }
  else if(commandName === 'add') {
    const num1 = options.getNumber('num1')!;
    const num2 = options.getNumber('num2')!;

    await interaction.deferReply(); // This allows the response to take longer than 5 seconds if logic will take longer.

    interaction.editReply({
      content: `The sum is ${ num1 + num2 }`,
    });
  }
}