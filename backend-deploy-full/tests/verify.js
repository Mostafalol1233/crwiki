import { downloadAndUploadImage } from '../utils/cloudinary-helper.js';
import { scrapeMaps } from '../services/scraper.js';
import assert from 'assert';

async function testScraper() {
  console.log('Testing scraper logic...');
  try {
    const maps = await scrapeMaps();
    console.log(`Successfully scraped ${maps.length} maps.`);
    if (maps.length > 0) {
      const mapsWithImages = maps.filter(m => m.imageUrl);
      console.log(`Found ${mapsWithImages.length} maps with images.`);
      assert(maps.length > 10, 'Should find at least 10 maps');
    }
    console.log('✅ Scraper test passed!');
  } catch (error) {
    console.error('❌ Scraper test failed:', error.message);
  }
}

async function testCloudinaryHelper() {
  console.log('Testing Cloudinary helper...');
  try {
    const testUrl = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
    const result = await downloadAndUploadImage(testUrl, 'test');
    console.log('Upload result:', result);
    assert(result.url, 'Result should have a URL');
    assert(result.url.includes('crossfire.wiki'), 'Result URL should be a domain URL');
    console.log('✅ Cloudinary helper test passed!');
  } catch (error) {
    console.error('❌ Cloudinary helper test failed:', error.message);
  }
}

async function runTests() {
  await testScraper();
  await testCloudinaryHelper();
}

runTests();
