const Discord = require('discord.js');
const Database = require('../../../Shared/database');

function MessageHandler(client, message, guilds) {
  //TODO
  if(message.guild) {
    var guild = guilds.find(e => e.guildID == message.guild.id);
    var prefix = guild ? guild.prefix : "~";
    if(message.guild.id === "110373943822540800" || message.guild.id === "264445053596991498") return;
    if(!message.guild.me.permissionsIn(message.channel.id).has('SEND_MESSAGES')) return;
    if(!message.content.startsWith(prefix) || message.author.bot) { return; }

    const args = message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift().toString().toLowerCase();

    console.log(command);
  }
}

module.exports = { MessageHandler }