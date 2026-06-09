const { Jimp } = require("jimp");
async function main() {
  console.log("Loading image...");
  const image = await Jimp.read("build/icon.png");
  console.log("Resizing image...");
  image.resize({ w: 512, h: 512 });
  console.log("Writing image...");
  await image.write("build/icon.png");
  console.log("Done.");
}
main().catch(console.error);
