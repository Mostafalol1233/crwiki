async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function scrapeAll() {
  const BASE = 'https://help.z8games.com/api/v2/help_center/en-us';
  const CAT_ID = '37856722020635';

  // Get sections
  const sectionsData = await fetchJson(`${BASE}/categories/${CAT_ID}/sections.json`);
  const sections = sectionsData.sections;
  console.log(`Found ${sections.length} sections`);

  const result = [];

  for (const section of sections) {
    console.log(`\nFetching articles for: ${section.name}`);
    const articlesData = await fetchJson(`${BASE}/sections/${section.id}/articles.json?per_page=30`);
    
    const articles = [];
    for (const article of articlesData.articles) {
      // Strip HTML tags from body
      const body = article.body ? article.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000) : '';
      articles.push({
        id: article.id,
        title: article.title,
        body: body,
        url: article.html_url,
      });
    }

    result.push({
      id: section.id,
      name: section.name,
      articles
    });
  }

  console.log('\n\nFINAL SCRAPED DATA:');
  console.log(JSON.stringify(result, null, 2));
}

scrapeAll().catch(e => console.error('Error:', e.message));
