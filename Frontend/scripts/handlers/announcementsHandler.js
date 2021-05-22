const Discord = require('discord.js');
const Canvas = require('canvas');
const Config = require('../../../Shared/configs/Config.json');
const DiscordConfig = require(`../../../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);
const { dailyCycleInfo, mod_DailyCycleInfo, weeklyCycleInfo } = require('../../../Shared/handlers/cycleHandler');
const ManifestHandler = require('../../../Shared/handlers/manifestHandler');

async function sendModsBroadcasts(client, guilds, mods, vendor) {
  var embed = new Discord.MessageEmbed().setColor(0x0099FF).setAuthor(`Vendor - ${ vendor.name } - Daily Mods`).setFooter("Data provided by Braytech", "https://braytech.org/static/images/icons/icon-96.png").setTimestamp();
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
  //Canvasing the mod images
  const canvas = Canvas.createCanvas(500, 210);
  const ctx = canvas.getContext('2d');

  const background = await Canvas.loadImage(`./images/${ vendor.name }.png`);
  const mod1Image = await Canvas.loadImage(`https://bungie.net${ mods[0].icon }`);
  const mod2Image = await Canvas.loadImage(`https://bungie.net${ mods[1].icon }`);

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
  ctx.fillText(FormatText(mods[0].name), (canvas.width / 2) + 54, 60);
  ctx.fillText(FormatText(mods[1].name), (canvas.width / 2) + 54, 150);

  //Add Image to Embed
  const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'mods.png');
  embed.attachFiles([attachment]);
  embed.setImage('attachment://mods.png');

  for(let i in guilds) {
    let guild = guilds[i];
    if(vendor === "Ada-1") {
      if(guild.announcements.adas && guild.announcements.channel !== "0") {
        embed.setDescription(`To see who needs these mods use: \n\`${ guild?.prefix ? guild?.prefix : "~" }!item ${ mods[0].name }\`\n\`${ guild?.prefix ? guild?.prefix : "~" }!item ${ mods[1].name }\``);
        try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send({ embed }); }
        catch(err) { console.log(`Failed to send ada-1 mods broadcast to ${ guild.guildID } because of ${ err }`); }
      }
    }
    if(vendor === "Gunsmith") {
      if(guild.announcements.gunsmiths && guild.announcements.channel !== "0") {
        embed.setDescription(`To see who needs these mods use: \n\`${ guild?.prefix ? guild?.prefix : "~" }!item ${ mods[0].name }\`\n\`${ guild?.prefix ? guild?.prefix : "~" }!item ${ mods[1].name }\``);
        try { client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send({ embed }); }
        catch(err) { console.log(`Failed to send gunsmith mods broadcast to ${ guild.guildID } because of ${ err }`); }
      }
    }
  }
}
async function sendDailyLostSectorBroadcasts(client, guilds) {

  generateLostSectorEmbed = async (type) => {
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    const lostSector = dailyCycleInfo(type);
    const sector = ManifestHandler.getManifest().DestinyActivityDefinition[lostSector.sector[type === "masterLostSector" ? "masterHash" : "legendHash"]];

    //Canvasing the mod images
    const canvas = Canvas.createCanvas(640, 360);
    const ctx = canvas.getContext('2d');

    //Add Background Image
    ctx.drawImage(await Canvas.loadImage(`https://bungie.net${ sector.pgcrImage }`), 0, 0, 640, 360);

    //Add Image to Embed
    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'lostSector.png');
    embed.attachFiles([attachment]);
    embed.setImage('attachment://lostSector.png');

    embed.setAuthor(`${ sector.displayProperties.name } - ${ lostSector.sector.planet } (${ lostSector.loot.type })`);
    embed.setDescription(sector.displayProperties.description);

    return embed;
  }

  let legendEmbed = await generateLostSectorEmbed("legendLostSector");
  let masterEmbed = await generateLostSectorEmbed("masterLostSector");

  //Send them
  for(let i in guilds) {
    let guild = guilds[i];
    if(guild.announcements.lostSectors && guild.announcements.channel !== "0") {
      try {
        client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send(legendEmbed);
        client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send(masterEmbed);
      }
      catch(err) { console.log(`Failed to send daily lost sector broadcasts to ${ guild.guildID } because of ${ err }`); }
    }
  }
}
function getDefaultChannel(guild) { return guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')); }

module.exports = { sendModsBroadcasts, sendDailyLostSectorBroadcasts }