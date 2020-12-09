const Discord = require('discord.js');
const Canvas = require('canvas');
const Database = require('../../../Shared/database');

async function sendGunsmithBroadcasts(client, guilds) {
  var embed = new Discord.MessageEmbed().setColor(0x0099FF).setAuthor(`Vendor - Gunsmith Mods`).setFooter("Data provided by Braytech", "https://braytech.org/static/images/icons/icon-96.png").setTimestamp();
  function FormatText(string) {
    let name = string;
    if(string.split(" ").length > 3) {
      name = string.split(" ")[0] + " " + string.split(" ")[1] + " " + string.split(" ")[2] + "\n" + string.substr((string.split(" ")[0] + " " + string.split(" ")[1] + " " + string.split(" ")[2]).length, string.length);
    }
    return name;
  }
  function FormatHeight(string, defaultHeight) {
    let height = defaultHeight;
    if(string.split(" ").length > 3) { height = 130; }
    return height;
  }
  Database.getGunsmithMods(async function(isError, isFound, data) {  
    if(!isError && isFound) {
      //Canvasing the mod images
      const canvas = Canvas.createCanvas(500, 210);
      const ctx = canvas.getContext('2d');
  
      const background = await Canvas.loadImage(`./images/banshee-44.png`);
      const mod1Image = await Canvas.loadImage(`https://bungie.net${ data.mods[0].icon }`);
      const mod2Image = await Canvas.loadImage(`https://bungie.net${ data.mods[1].icon }`);
  
      //Add Images
      ctx.drawImage(background, 0, 0, 500, 210);
      ctx.drawImage(mod1Image, (canvas.width / 2) - 20, 30, 64, 64);
      ctx.drawImage(mod2Image, (canvas.width / 2) - 20, 114, 64, 64);

      //Add Text Backgrounds
      ctx.beginPath();
      ctx.globalAlpha = 0.1;
      ctx.rect((canvas.width / 2) - 25, 25, (canvas.width / 2) + 10, 74);
      ctx.fill(0,0,0);
      ctx.globalAlpha = 0.2;
      ctx.rect((canvas.width / 2) - 25, 109, (canvas.width / 2) + 10, 74);
      ctx.fill(0,0,0);
      ctx.stroke();
  
      //Add Text
      ctx.globalAlpha = 1;
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(FormatText(data.mods[0].name), (canvas.width / 2) + 54, FormatHeight(data.mods[0].name, 66));
      ctx.fillText(FormatText(data.mods[1].name), (canvas.width / 2) + 54, FormatHeight(data.mods[1].name, 150));
  
      //Add Image to Embed
      const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'mods.png');
      embed.attachFiles([attachment]);
      embed.setImage('attachment://mods.png');

      for(let i in guilds) {
        let guild = guilds[i];
        if(guild.announcements.gunsmiths && guild.announcements.channel !== "0") {
          embed.setDescription(`To see who needs these mods use: \n\`${ guild?.prefix ? guild?.prefix : "~" }!item ${ data.mods[0].name }\`\n\`${ guild?.prefix ? guild?.prefix : "~" }!item ${ data.mods[1].name }\``);
          try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send({ embed }); }
          catch(err) { console.log(`Failed to send gunsmith broadcast to ${ guild.guildID } because of ${ err }`); }
        }
      }
    }
  });
}
function getDefaultChannel(guild) { return guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')); }

module.exports = { sendGunsmithBroadcasts }