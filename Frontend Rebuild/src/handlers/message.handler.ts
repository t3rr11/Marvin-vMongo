import DiscordJS, { Client, Message } from 'discord.js';

export const handleMessage = (message: Message) => {
  if (message.content === 'ping') {
    message.reply({
      content: "pong"
    });
  }
}