#!/usr/bin/env node
/**
 * upload-to-catbox.js
 * Uploads all images to catbox.moe and generates seed-ready URLs
 */
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const assetsPath = './attached_assets';
const outputFile = './catbox-urls.json';

const urls = {
  mercenaries: [],
  weapons: [],
  modes: [],
  ranks: []
};

async function uploadFile(filePath, category) {
  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
    });

    const url = (await response.text()).trim();
    if (url.includes('error') || !url.startsWith('http')) {
      console.log(`  ⚠️ ${path.basename(filePath)} - skipped`);
      return null;
    }

    console.log(`  ✅ ${path.basename(filePath)} → ${url}`);
    return url;
  } catch (err) {
    console.log(`  ⚠️ ${path.basename(filePath)} - error: ${err.message}`);
    return null;
  }
}

async function uploadCategory(dir, category) {
  const categoryPath = path.join(assetsPath, dir);
  if (!fs.existsSync(categoryPath)) {
    console.log(`❌ ${categoryPath} not found`);
    return 0;
  }

  const files = fs.readdirSync(categoryPath).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  let count = 0;

  for (const file of files) {
    const filePath = path.join(categoryPath, file);
    const url = await uploadFile(filePath, category);
    if (url) {
      urls[category].push({ file, url });
      count++;
      if (count % 50 === 0) console.log(`  Progress: ${count}/${files.length}...`);
    }
  }

  return count;
}

async function main() {
  console.log('🚀 Starting catbox.moe upload...\n');

  console.log('⚔️ Uploading mercenaries...');
  const mercFiles = ['merc-wolf.jpg', 'merc-vipers.jpg', 'merc-sisterhood.jpg', 'merc-blackmamba.jpg', 'merc-desperado.jpg', 'merc-ronin.jpg', 'merc-sfg.jpg', 'merc-thoth.jpg', 'merc-archhonorary.jpg', 'merc-dean.jpg'];
  for (const file of mercFiles) {
    const filePath = path.join(assetsPath, file);
    if (fs.existsSync(filePath)) {
      const url = await uploadFile(filePath, 'mercenaries');
      if (url) urls.mercenaries.push({ file, url });
    }
  }
  console.log(`✅ Mercenaries: ${urls.mercenaries.length}\n`);

  console.log('📦 Uploading weapons...');
  const weaponCount = await uploadCategory('weapons', 'weapons');
  console.log(`✅ Weapons: ${weaponCount}\n`);

  console.log('🎮 Uploading modes...');
  const modeCount = await uploadCategory('modes', 'modes');
  console.log(`✅ Modes: ${modeCount}\n`);

  console.log('🏅 Uploading ranks...');
  const rankCount = await uploadCategory('ranks', 'ranks');
  console.log(`✅ Ranks: ${rankCount}\n`);

  fs.writeFileSync(outputFile, JSON.stringify(urls, null, 2));
  console.log(`✅ All URLs saved to: ${outputFile}`);
  console.log(`📊 Total: ${urls.mercenaries.length} mercenaries + ${weaponCount} weapons + ${modeCount} modes + ${rankCount} ranks`);
}

main().catch(err => console.error('❌ Error:', err.message));
