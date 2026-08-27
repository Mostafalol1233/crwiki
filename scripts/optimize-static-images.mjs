import sharp from "sharp";
import { stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("client/public");
const sources = [
  ["cf-heroes-bg.png", "cf-heroes-bg.webp", 78],
  ["portal/weapons.jpg", "portal/weapons.webp", 80],
  ["portal/maps.jpg", "portal/maps.webp", 80],
  ["portal/mercenaries.jpg", "portal/mercenaries.webp", 80],
  ["portal/modes.jpg", "portal/modes.webp", 80],
  ["portal/ranks.jpg", "portal/ranks.webp", 80],
  ["portal/events.jpg", "portal/events.webp", 80],
];

for (const [source, output, quality] of sources) {
  const sourcePath = path.join(root, source);
  const outputPath = path.join(root, output);
  await sharp(sourcePath).webp({ quality, effort: 4 }).toFile(outputPath);
  const [before, after] = await Promise.all([stat(sourcePath), stat(outputPath)]);
  const saved = Math.max(0, 1 - after.size / before.size) * 100;
  console.log(`${source} -> ${output}: ${before.size} -> ${after.size} bytes (${saved.toFixed(1)}% smaller)`);
}
