/**
 * CrossFire Announcements Scraper
 * Scrapes all events from https://forum.z8games.com/categories/crossfire-announcements
 * Fields: title, url, discussionId, tags, startedBy, startedByUrl, startedDate, startedDateISO,
 *         replies, views, viewsRaw, mostRecentUser, mostRecentUserUrl, mostRecentDate, mostRecentDateISO
 */

const https = require('https');
const cheerio = require('cheerio');

const BASE_URL = 'https://forum.z8games.com';
const CATEGORY_URL = `${BASE_URL}/categories/crossfire-announcements`;

// ── helpers ────────────────────────────────────────────────────────────────

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseViews(text) {
  // "11.7K" → 11700,  "416" → 416
  if (!text) return 0;
  text = text.trim();
  if (text.toUpperCase().endsWith('K')) {
    return Math.round(parseFloat(text) * 1000);
  }
  return parseInt(text.replace(/,/g, ''), 10) || 0;
}

// ── parser ─────────────────────────────────────────────────────────────────

function parseDiscussions(html) {
  const $ = cheerio.load(html);
  const results = [];

  $('tr[id^="Discussion_"]').each((_, row) => {
    const $row = $(row);
    const id = (row.attribs.id || '').replace('Discussion_', '');

    // ── Discussion title & URL ─────────────────────────────
    const $title = $row.find('td.DiscussionName .Title');
    const title = $title.text().trim();
    const relUrl = $title.attr('href') || '';
    const url = relUrl.startsWith('http') ? relUrl : BASE_URL + relUrl;

    // ── Tags (e.g. "Announcement") ─────────────────────────
    const tags = [];
    $row.find('td.DiscussionName .Tag').each((_, tag) => {
      const t = $(tag).text().trim();
      if (t) tags.push(t);
    });

    // ── Started by ────────────────────────────────────────
    const $firstUser = $row.find('td.FirstUser');
    const startedBy = $firstUser.find('a.UserLink').text().trim();
    const startedByUrl = (() => {
      const href = $firstUser.find('a.UserLink').attr('href') || '';
      return href.startsWith('http') ? href : BASE_URL + href;
    })();
    const $startedTime = $firstUser.find('time');
    const startedDate = $startedTime.text().trim();
    const startedDateISO = $startedTime.attr('datetime') || '';

    // ── Replies ───────────────────────────────────────────
    const repliesText = $row.find('td.CountComments .Number').text().trim();
    const replies = parseInt(repliesText, 10) || 0;

    // ── Views ─────────────────────────────────────────────
    const viewsText = $row.find('td.CountViews .Number').text().trim();
    const viewsDisplay = viewsText;
    const viewsRaw = parseViews(viewsText);

    // ── Most recent ───────────────────────────────────────
    const $lastUser = $row.find('td.LastUser');
    const mostRecentUser = $lastUser.find('a.UserLink').text().trim();
    const mostRecentUserUrl = (() => {
      const href = $lastUser.find('a.UserLink').attr('href') || '';
      return href.startsWith('http') ? href : BASE_URL + href;
    })();
    const $lastTime = $lastUser.find('time');
    const mostRecentDate = $lastTime.text().trim();
    const mostRecentDateISO = $lastTime.attr('datetime') || '';
    const mostRecentCommentUrl = (() => {
      const href = $lastUser.find('a.CommentDate').attr('href') || '';
      return href.startsWith('http') ? href : BASE_URL + href;
    })();

    if (!title) return; // skip empty rows

    results.push({
      id,
      title,
      url,
      tags,
      startedBy,
      startedByUrl,
      startedDate,
      startedDateISO,
      replies,
      viewsDisplay,
      viewsRaw,
      mostRecentUser,
      mostRecentUserUrl,
      mostRecentDate,
      mostRecentDateISO,
      mostRecentCommentUrl,
    });
  });

  return results;
}

// ── pagination support ────────────────────────────────────────────────────
// Vanilla forum uses  /p2  /p3  … suffix on the category URL
// We keep fetching until a page returns 0 new discussions

async function scrapeAllPages() {
  const allDiscussions = [];
  const seenIds = new Set();
  let page = 1;

  while (true) {
    const url = page === 1 ? CATEGORY_URL : `${CATEGORY_URL}/p${page}`;
    console.log(`  Fetching page ${page}: ${url}`);

    const html = await fetchPage(url);
    const discussions = parseDiscussions(html);

    let newCount = 0;
    for (const d of discussions) {
      if (!seenIds.has(d.id)) {
        seenIds.add(d.id);
        allDiscussions.push(d);
        newCount++;
      }
    }

    console.log(`    → found ${discussions.length} rows, ${newCount} new`);

    if (newCount === 0) break; // no new items → we've hit the end
    page++;

    // small delay to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  return allDiscussions;
}

// ── main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== CrossFire Announcements Scraper ===');
  console.log(`Source: ${CATEGORY_URL}\n`);

  const discussions = await scrapeAllPages();

  console.log(`\nTotal announcements scraped: ${discussions.length}\n`);

  // ── pretty table ──────────────────────────────────────
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  console.log(
    pad('Title', 55) +
    pad('Started By', 18) +
    pad('Date', 14) +
    pad('Replies', 9) +
    pad('Views', 10) +
    pad('Most Recent', 18) +
    'Last Activity'
  );
  console.log('─'.repeat(145));

  for (const d of discussions) {
    console.log(
      pad(d.title, 55) +
      pad(d.startedBy, 18) +
      pad(d.startedDate, 14) +
      pad(d.replies, 9) +
      pad(d.viewsDisplay, 10) +
      pad(d.mostRecentUser, 18) +
      d.mostRecentDate
    );
  }

  // ── save JSON ─────────────────────────────────────────
  const fs = require('fs');
  const outPath = 'cf_announcements.json';
  fs.writeFileSync(outPath, JSON.stringify(discussions, null, 2), 'utf8');
  console.log(`\nSaved ${discussions.length} records → ${outPath}`);

  return discussions;
}

main().catch((err) => {
  console.error('Scraper error:', err);
  process.exit(1);
});
