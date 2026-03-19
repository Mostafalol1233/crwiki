import sharp from "sharp";
import fs from "fs";
import path from "path";

const root = process.cwd();
const srcPath = path.resolve(root, "favicon.png");
const outPath = srcPath;
const out16 = path.resolve(root, "favicon-16x16.png");
const out32 = path.resolve(root, "favicon-32x32.png");
const out192 = path.resolve(root, "favicon-192x192.png");
const previewsDir = path.resolve(root, "attached_assets", "favicon_previews");

async function loadRaw(file) {
  const img = sharp(file, { failOn: "none" }).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function sampleBg(data, w, h) {
  const pts = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [Math.floor(w / 2), h - 1],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
  ];
  let r = 0, g = 0, b = 0;
  for (const [x, y] of pts) {
    const i = (y * w + x) * 4;
    r += data[i + 0];
    g += data[i + 1];
    b += data[i + 2];
  }
  const n = pts.length;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function dist(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function removeBgWithFeather(raw, tolerance = 30, feather = 20) {
  const { data, width: w, height: h } = raw;
  const bg = sampleBg(data, w, h);
  const maxD = 442;
  const out = Buffer.from(data);
  const t0 = tolerance;
  const t1 = tolerance + feather;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const px = [out[i + 0], out[i + 1], out[i + 2]];
      const d = dist(px, bg);
      if (d <= t0) {
        out[i + 3] = 0;
      } else if (d <= t1) {
        const a = Math.min(255, Math.max(0, Math.round(((d - t0) / (t1 - t0)) * 255)));
        out[i + 3] = a;
      } else {
        out[i + 3] = Math.max(out[i + 3], 255);
      }
    }
  }
  return { data: out, width: w, height: h };
}

async function savePng(raw, file) {
  const img = sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } });
  await img.png({ compressionLevel: 9, adaptiveFiltering: true, progressive: true }).toFile(file);
}

async function resizePng(file, size, out) {
  await sharp(file).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9, adaptiveFiltering: true, progressive: true }).toFile(out);
}

async function makePreviews(file) {
  await fs.promises.mkdir(previewsDir, { recursive: true });
  const icon = await sharp(file).ensureAlpha().resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  const lightBg = await sharp({ create: { width: 300, height: 300, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: icon, gravity: "center" }])
    .png({ compressionLevel: 9, adaptiveFiltering: true, progressive: true })
    .toFile(path.join(previewsDir, "preview-light.png"));

  const darkBg = await sharp({ create: { width: 300, height: 300, channels: 4, background: { r: 31, g: 41, b: 55, alpha: 1 } } })
    .composite([{ input: icon, gravity: "center" }])
    .png({ compressionLevel: 9, adaptiveFiltering: true, progressive: true })
    .toFile(path.join(previewsDir, "preview-dark.png"));

  const pattern = await sharp({ create: { width: 300, height: 300, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .png()
    .toBuffer();
  const tile = await sharp({ create: { width: 20, height: 20, channels: 4, background: { r: 220, g: 220, b: 220, alpha: 1 } } })
    .png()
    .toBuffer();
  const checker = await sharp(pattern)
    .composite([...Array(15 * 15)].map((_, idx) => {
      const x = (idx % 15) * 20;
      const y = Math.floor(idx / 15) * 20;
      const even = ((x / 20) + (y / 20)) % 2 === 0;
      return even ? { input: tile, left: x, top: y } : { input: { create: { width: 20, height: 20, channels: 4, background: { r: 240, g: 240, b: 240, alpha: 1 } } }, left: x, top: y };
    }))
    .png()
    .toBuffer();
  await sharp(checker)
    .composite([{ input: icon, gravity: "center" }])
    .png({ compressionLevel: 9, adaptiveFiltering: true, progressive: true })
    .toFile(path.join(previewsDir, "preview-pattern.png"));
}

async function main() {
  if (!fs.existsSync(srcPath)) {
    console.error("Source favicon.png not found:", srcPath);
    process.exit(1);
  }
  const raw = await loadRaw(srcPath);
  const processed = removeBgWithFeather(raw, 30, 24);
  await savePng(processed, outPath);
  await resizePng(outPath, 32, out32);
  await resizePng(outPath, 16, out16);
  await resizePng(outPath, 192, out192);
  await makePreviews(outPath);
  console.log("Favicon processed:");
  console.log("-", outPath);
  console.log("-", out16);
  console.log("-", out32);
  console.log("-", out192);
  console.log("Previews:");
  console.log("-", path.join(previewsDir, "preview-light.png"));
  console.log("-", path.join(previewsDir, "preview-dark.png"));
  console.log("-", path.join(previewsDir, "preview-pattern.png"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

