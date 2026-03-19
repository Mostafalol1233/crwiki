import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const target = path.resolve(process.cwd(), 'favicon.png');
const out = target;

function colorDist(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function getPixel(png, x, y) {
  const idx = (png.width * y + x) << 2;
  return [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
}

function setAlpha(png, x, y, a) {
  const idx = (png.width * y + x) << 2;
  png.data[idx + 3] = a;
}

function sampleCorners(png) {
  const pts = [
    [0, 0],
    [png.width - 1, 0],
    [0, png.height - 1],
    [png.width - 1, png.height - 1],
  ];
  const colors = pts.map(([x, y]) => getPixel(png, x, y).slice(0, 3));
  const avg = colors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
  return [Math.round(avg[0] / colors.length), Math.round(avg[1] / colors.length), Math.round(avg[2] / colors.length)];
}

function floodToTransparent(png, bg, tolerance = 30) {
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const px = getPixel(png, x, y);
    if (colorDist(px, bg) <= tolerance) {
      visited[i] = 1;
      q.push([x, y]);
    }
  };
  push(0, 0);
  push(w - 1, 0);
  push(0, h - 1);
  push(w - 1, h - 1);
  while (q.length) {
    const [x, y] = q.shift();
    setAlpha(png, x, y, 0);
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
}

function featherEdges(png, radius = 1) {
  const w = png.width;
  const h = png.height;
  const copy = Buffer.from(png.data);
  const idx = (x, y) => (w * y + x) << 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = copy[idx(x, y) + 3];
      if (a === 0) continue;
      let nearTransparent = false;
      for (let dy = -radius; dy <= radius && !nearTransparent; dy++) {
        for (let dx = -radius; dx <= radius && !nearTransparent; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (copy[idx(nx, ny) + 3] === 0) nearTransparent = true;
        }
      }
      if (nearTransparent) {
        const ii = idx(x, y) + 3;
        png.data[ii] = Math.max(0, Math.min(255, a - 64));
      }
    }
  }
}

fs.createReadStream(target)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function () {
    const bg = sampleCorners(this);
    floodToTransparent(this, bg, 40);
    featherEdges(this, 1);
    this.pack({ zlib: { level: 9 } })
      .pipe(fs.createWriteStream(out))
      .on('finish', () => {
        console.log('Transparent favicon saved:', out);
      });
  })
  .on('error', (e) => {
    console.error('Failed to process favicon:', e.message);
    process.exit(1);
  });

