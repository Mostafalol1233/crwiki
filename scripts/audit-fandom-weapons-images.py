import json
import re
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE = 'https://crossfirefps.fandom.com/api.php'
USER_AGENT = 'CrossFireWikiWeaponAudit/1.0'
SUSPICIOUS = re.compile(r'(roadmap|road[-_ ]?map|collage|sprite|poster|banner|buyweapon|weapon[_-]?info|inventory|forum|event|map[_-])', re.I)


def api(params):
    full = dict(params)
    full.update({'format': 'json', 'origin': '*'})
    req = Request(BASE + '?' + urlencode(full), headers={'User-Agent': USER_AGENT})
    with urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode('utf-8'))


def category_pages(category):
    titles = []
    cont = {}
    while True:
        params = {'action': 'query', 'list': 'categorymembers', 'cmtitle': category, 'cmtype': 'page', 'cmlimit': '500'}
        params.update(cont)
        data = api(params)
        titles.extend(row.get('title') for row in data.get('query', {}).get('categorymembers', []) if row.get('ns') == 0 and row.get('title'))
        cont = data.get('continue', {})
        if not cont:
            break
        time.sleep(0.15)
    return list(dict.fromkeys(titles))


def page_details(titles):
    rows = []
    for start in range(0, len(titles), 50):
        chunk = titles[start:start + 50]
        data = api({
            'action': 'query', 'prop': 'pageimages|info', 'inprop': 'url',
            'piprop': 'thumbnail|name', 'pithumbsize': '1200', 'titles': '|'.join(chunk),
        })
        for page in data.get('query', {}).get('pages', {}).values():
            image = page.get('thumbnail') or {}
            filename = page.get('pageimage') or ''
            rows.append({
                'title': page.get('title', ''),
                'source_url': page.get('fullurl', ''),
                'pageid': page.get('pageid'),
                'image_filename': filename,
                'image_url': image.get('source', ''),
                'width': image.get('width'),
                'height': image.get('height'),
                'suspicious': bool(SUSPICIOUS.search(filename) or SUSPICIOUS.search(image.get('source', ''))),
            })
        print(f'processed {min(start + 50, len(titles))}/{len(titles)}', flush=True)
        time.sleep(0.25)
    by_title = {row['title']: row for row in rows}
    return [by_title.get(title, {'title': title, 'image_filename': '', 'image_url': '', 'suspicious': False}) for title in titles]


titles = category_pages('Category:Weapons')
rows = page_details(titles)
summary = {
    'category': 'Category:Weapons',
    'page_count': len(titles),
    'with_image': sum(bool(row.get('image_url')) for row in rows),
    'without_image': sum(not row.get('image_url') for row in rows),
    'suspicious_images': sum(bool(row.get('suspicious')) for row in rows),
    'wide_images_over_1600x900': sum((row.get('width') or 0) >= 1600 and (row.get('height') or 0) >= 900 for row in rows),
    'rows': rows,
}
with open('/tmp/crossfire-fandom-weapons-image-audit.json', 'w', encoding='utf-8') as handle:
    json.dump(summary, handle, ensure_ascii=False, indent=2)
print(json.dumps({key: value for key, value in summary.items() if key != 'rows'}, ensure_ascii=False))
print('suspicious_sample=', json.dumps([row for row in rows if row.get('suspicious')][:20], ensure_ascii=False))
print('missing_sample=', json.dumps([row for row in rows if not row.get('image_url')][:20], ensure_ascii=False))
