const Discord = require('discord.js');
const Canvas = require('canvas');
const Config = require('../../../Shared/configs/Config.json');
const DiscordConfig = require(`../../../Shared/configs/${ Config.isLocal ? 'local' : 'live' }/DiscordConfig.json`);
const { dailyCycleInfo } = require('../../../Shared/handlers/cycleHandler');
const ManifestHandler = require('../../../Shared/handlers/manifestHandler');
const CanvasHandler = require('./canvasHandler');

async function sendModsBroadcasts(client, guilds, mods, vendor) {
  var embed = new Discord.MessageEmbed().setColor(0x0099FF).setTitle(`Vendor - ${ vendor.name } - Daily Mods`).setFooter("Data provided by Braytech", "https://bray.tech/static/images/icons/icon-96.png").setTimestamp();
  var data = { mods };

  const canvas = await CanvasHandler.buildModCanvasBuffer(vendor.name, data);
  const attachment = new Discord.MessageAttachment(canvas, 'mods.png');
  embed.setImage('attachment://mods.png');

  for(let i in guilds) {
    let guild = guilds[i];

    var description = [];
    description.push(`To see who needs these mods use:`);
    for(var mod of mods) { description.push(`\`${ guild?.prefix ? guild?.prefix : "~" }!item ${ mod.name }\``); }
    embed.setDescription(description.join("\n"));

    if(vendor.name === "Ada-1") {
      if(guild.announcements.adas && guild.announcements.channel !== "0") {
        try {
          client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send({
            embeds: [embed],
            files: [attachment]
          });
        }
        catch(err) { console.log(`Failed to send ada-1 mods broadcast to ${ guild.guildID } because of ${ err }`); }
      }
    }

    if(vendor.name === "Gunsmith") {
      if(guild.announcements.gunsmiths && guild.announcements.channel !== "0") {
        try {
          client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send({
            embeds: [embed],
            files: [attachment]
          });
        }
        catch(err) { console.log(`Failed to send gunsmith mods broadcast to ${ guild.guildID } because of ${ err }`); }
      }
    }
  }
}
async function sendDailyLostSectorBroadcasts(client, guilds) {
  var attachment;

  generateLostSectorEmbed = async () => {
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    const lostSector = dailyCycleInfo("lostsector");
    let sector = ManifestHandler.getManifest().DestinyActivityDefinition[lostSector.sector.legendHash];

    //process description from lost sector
    let description = sector.displayProperties.description.match(/[^\r\n]+/g);
    let formattedDesc = description.map(e => { let arr = e.split(": "); return { key: arr[0], value: arr[1] } });
    let filteredDesc = formattedDesc.splice(1, formattedDesc.length-1);

    //Canvasing the mod images
    const canvas = Canvas.createCanvas(640, 360);
    const ctx = canvas.getContext('2d');

    //Add Background Image
    ctx.drawImage(await Canvas.loadImage(`https://bungie.net${ sector.pgcrImage }`), 0, 0, 640, 360);

    //Add Image to Embed
    attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'lostSector.png');
    embed.setImage('attachment://lostSector.png');

    embed.setTitle(`${ sector.displayProperties.name } - ${ lostSector.sector.planet } (${ lostSector.loot.type })`);
    embed.setDescription(`${ formattedDesc[0].value }\n ${ filteredDesc.map(e => `**${ e.key }**: ${ e.value }\n`).join('') }`);

    return embed;
  }

  let generatedEmbed = await generateLostSectorEmbed();

  //Send them
  for(let i in guilds) {
    let guild = guilds[i];
    if(guild.announcements.lostSectors && guild.announcements.channel !== "0") {
      try {
        client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send({
          embeds: [generatedEmbed],
          files: [attachment]
        });
      }
      catch(err) { console.log(`Failed to send daily lost sector broadcasts to ${ guild.guildID } because of ${ err }`); }
    }
  }
}
async function sendDailyWellspringBroadcasts(client, guilds) {
  var attachment;

  generateWellspringEmbed = async () => {
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter(DiscordConfig.defaultFooter, DiscordConfig.defaultLogoURL).setTimestamp();
    const wellspring = dailyCycleInfo("wellspring");
    let activity = ManifestHandler.getManifest().DestinyActivityDefinition[wellspring.activity];

    //Canvasing the mod images
    const canvas = Canvas.createCanvas(640, 360);
    const ctx = canvas.getContext('2d');

    //Add Background Image
    ctx.drawImage(await Canvas.loadImage(`https://bungie.net${ activity.pgcrImage }`), 0, 0, 640, 360);

    //Add Image to Embed
    attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'wellspring.png');
    embed.setImage('attachment://wellspring.png');

    embed.setTitle(`${ wellspring.boss } (${ wellspring.loot })`);
    embed.setDescription(`${ activity.displayProperties.description }`);

    return embed;
  }

  let generatedEmbed = await generateWellspringEmbed();

  //Send them
  for(let i in guilds) {
    let guild = guilds[i];
    if(guild.announcements.wellspring && guild.announcements.channel !== "0") {
      try {
        client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send({
          embeds: [generatedEmbed],
          files: [attachment]
        });
      }
      catch(err) { console.log(`Failed to send daily wellspring broadcasts to ${ guild.guildID } because of ${ err }`); }
    }
  }
}

async function sendXurBroadcasts(client, Guilds, items, vendor, vendorLocation) {
  let attachment;
  generateXurEmbed = async () => {
    let embed = new Discord.MessageEmbed().setColor(0x0099FF).setFooter("Data provided by Braytech", "https://bray.tech/static/images/icons/icon-96.png").setTimestamp();

    //Canvasing the mod images
    const canvas = Canvas.createCanvas(500, 210);
    const ctx = canvas.getContext('2d');
    let friendlyLocation = "Hidden";
    let locationText = "Xûr's location is hidden";

    //Add Background Image
    switch(vendorLocation) {
      case 0: {
        friendlyLocation = "Tower";
        locationText = "Xûr can be found in the **Tower**, near **Dead Orbit**.";
        ctx.drawImage(await Canvas.loadImage(`./images/xur_tower.png`), 0, 0, 500, 210);
        break;
      }
      case 1: {
        friendlyLocation = "EDZ";
        locationText = "Xûr can be found on **EDZ** in the **Winding Cove**.";
        ctx.drawImage(await Canvas.loadImage(`./images/xur_edz.png`), 0, 0, 500, 210);
        break;
      }
      case 2: {
        friendlyLocation = "Nessus";
        locationText = "Xûr can be found in **Nessus** on a branch over in **Watcher's Grave**.";
        ctx.drawImage(await Canvas.loadImage(`./images/xur_nessus.png`), 0, 0, 500, 210);
        break;
      }
      default: {
        friendlyLocation = "Hidden";
        locationText = "Xûr's location is hidden.";
        break;
      }
    }

    //Build Item
    buildItemDesc = (item) => {
      if(item.itemType === 2) {
        const intellect = item.stats['144602215']?.value;
        const resilience = item.stats['392767087']?.value;
        const discipline = item.stats['1735777505']?.value;
        const recovery = item.stats['1943323491']?.value;
        const mobility = item.stats['2996146975']?.value;
        const strength = item.stats['4244567218']?.value;
        const total = intellect + resilience + discipline + recovery + mobility + strength;

        return `**${ item.name }** - ${ total }\n${ mobility ? 'Mob: ' + mobility : '' }, ${ resilience ? 'Res: ' + resilience : '' }, ${ recovery ? 'Rec: ' + recovery : '' }\n${ discipline ? 'Dis: ' + discipline : '' }, ${ intellect ? 'Int: ' + intellect : '' }, ${ strength ? 'Str: ' + strength : '' }\n\n`;
      }
      else if(item.itemType === 3) {
        const stability = item.stats['155624089']?.value;
        const handling = item.stats['943549884']?.value;
        const range = item.stats['1240592695']?.value;
        const magazine = item.stats['3871231066']?.value;
        const impact = item.stats['4043523819']?.value;
        const reload = item.stats['4188031367']?.value;
        const rpm = item.stats['4284893193']?.value;

        return `**${ item.name }**\n${ impact ? 'Imp: ' + impact : '' }, ${ range ? 'Ran: ' + range : '' }, ${ stability ? 'Sta: ' + stability : '' }, ${ handling ? 'Han: ' + handling : '' }\n${ reload ? 'Rel: ' + reload : '' }, ${ magazine ? 'Mag: ' + magazine : '' }, ${ rpm ? 'Rpm: ' + rpm : '' }\n\n`;
      }
      else {
        return `**${ item.name }**\n\n`;
      }
    };

    //Add Image to Embed
    attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'xurLocation.png');
    embed.setImage('attachment://xurLocation.png');
    embed.setTitle(`Xûr - ${ friendlyLocation }`);
    embed.setDescription(`${ locationText }\n\n**Items for sale**\n\n${ items.map(item => buildItemDesc(item)).join('') }`);

    return embed;
  }

  let xurEmbed = await generateXurEmbed();
  
  client.guilds.cache.get("664237007261925404").channels.cache.get("846850131998277642").send({
    embeds: [xurEmbed],
    files: [attachment]
  });

  //Send them
  // for(let i in guilds) {
  //   let guild = guilds[i];
  //   if(guild.announcements.lostSectors && guild.announcements.channel !== "0") {
  //     try {
  //       client.guilds.cache.get(guild.guildID).channels.cache.get(guild.announcements.channel).send(legendEmbed);
  //     }
  //     catch(err) { console.log(`Failed to send daily lost sector broadcasts to ${ guild.guildID } because of ${ err }`); }
  //   }
  // }
}
function getDefaultChannel(guild) { return guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES')); }

module.exports = { sendModsBroadcasts, sendDailyLostSectorBroadcasts, sendXurBroadcasts }