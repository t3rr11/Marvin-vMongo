const Discord = require('discord.js');

const GetApp = (client, guildID) => {
  const app = client.api.applications(client.user.id);
  if(guildID) { app.guilds(guildID); }
  return app;
}

const StartUpInteractions = async (client) => {
  const commands = await GetApp(client, "305561313675968513").commands.get();
  const g_Commands = await client.api.applications(client.user.id).commands.get();

  GetApp(client, "305561313675968513").commands.post({
    data: {
      name: 'test',
      description: 'A simple test command'
    }
  });
  GetApp(client, "305561313675968513").commands.post({
    data: {
      name: 'embed',
      description: 'Displays an embed',
    }
  });

  console.log(commands);
  //GetApp(client, "305561313675968513").commands("853062909411590174").delete();
}

const InteractionsHandler = (client, interaction) => {
  const { name, options } = interaction.data;
  const command = name.toLowerCase();

  if(command === 'test') { Reply(client, interaction, 'Works'); }
  else if(command === 'test embed') { ReplyEmbed(client, interaction, command); }
}

const Reply = (client, interaction, response) => {
  client.api.interactions(interaction.id, interaction.token).callback.post({
    data: {
      type: 4,
      data: { content: response }
    }
  });
}
const ReplyEmbed = (client, interaction, command) => {
  let embed = { data: { type: 4, data: { embeds: [] } } };

  if(command === 'embed') {
    embed.data.data.embeds.push({
      title: "Title",
      description: "Description",
      fields: [
        {
          name: "First field",
          value: "1st",
          inline: true
        },
        {
          name: "Second field",
          value: "2nd",
          inline: true
        }
      ]
    });
  }

  if(embed.data.data.embeds.length > 0) {
    client.api.interactions(interaction.id, interaction.token).callback.post({ ...embed });
  }
}

module.exports = { StartUpInteractions, InteractionsHandler }