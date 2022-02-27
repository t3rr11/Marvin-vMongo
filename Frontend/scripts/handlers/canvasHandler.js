const Canvas = require('canvas');

const buildModCanvasBuffer = async (vendor, data) => {
  //Canvasing the mod images
  const canvas = Canvas.createCanvas(500, 210);
  const ctx = canvas.getContext('2d');

  const background = await Canvas.loadImage(`./images/${ vendor }.png`);
  const mod1Image = await Canvas.loadImage(`https://bungie.net${ data.mods[0].icon }`);
  const mod2Image = await Canvas.loadImage(`https://bungie.net${ data.mods[1].icon }`);
  const mod3Image = await Canvas.loadImage(`https://bungie.net${ data.mods[2]?.icon }`);
  const mod4Image = await Canvas.loadImage(`https://bungie.net${ data.mods[3]?.icon }`);

  //Add Images
  ctx.drawImage(background, 0, 0, 500, 210);
  ctx.drawImage(mod1Image, 260, 32, 32, 32);
  ctx.drawImage(mod2Image, 260, 74, 32, 32);
  ctx.drawImage(mod3Image, 260, 116, 32, 32);
  ctx.drawImage(mod4Image, 260, 158, 32, 32);

  //Add Text Backgrounds
  ctx.beginPath();

  ctx.globalAlpha = 0.2;
  ctx.rect(250, 20, 230, 176);
  ctx.fill(0,0,0);

  ctx.stroke();

  //Add Text
  ctx.globalAlpha = 1;
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(FormatText(data.mods[0].name), 270 + 30, 52);
  ctx.fillText(FormatText(data.mods[1].name), 270 + 30, 94);
  ctx.fillText(FormatText(data.mods[2]?.name), 270 + 30, 136);
  ctx.fillText(FormatText(data.mods[3]?.name), 270 + 30, 178);

  return canvas.toBuffer();
}

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

module.exports = { buildModCanvasBuffer }