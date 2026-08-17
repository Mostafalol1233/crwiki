from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

INPUT = Path('/tmp/crossfire-wiki-weapons.json')
OUTPUT = Path('/tmp/crossfire-wiki-weapon-image-audit.json')
SUSPICIOUS = re.compile(r'(?:roadmap|road[-_ ]?map|collage|sprite(?:sheet)?|poster|banner|placeholder|(?:^|[/_.-])(?:crossfire_images|modes|events?|posts?)(?:[/]|$))', re.I)

payload = json.loads(INPUT.read_text())
rows = payload.get('weapons', payload if isinstance(payload, list) else [])
rows = rows if isinstance(rows, list) else []

suspicious = []
suspicious_backgrounds = []
missing = []
blank = []
urls = []
background_urls = []
for row in rows:
    name = str(row.get('name') or '').strip()
    image = str(row.get('image_url') or row.get('image') or '').strip()
    background = str(row.get('background_url') or '').strip()
    if not image:
        missing.append({'id': row.get('id'), 'name': name, 'background_url': background})
    elif SUSPICIOUS.search(image):
        suspicious.append({'id': row.get('id'), 'name': name, 'image_url': image})
    if background and (SUSPICIOUS.search(background) or 'static.wikia.nocookie.net' not in background):
        suspicious_backgrounds.append({'id': row.get('id'), 'name': name, 'background_url': background})
    if image:
        urls.append(image)
    if background:
        background_urls.append(background)
    else:
        blank.append(name)

report = {
    'total': len(rows),
    'with_image': len(rows) - len(missing),
    'without_image': len(missing),
    'suspicious_count': len(suspicious),
    'suspicious_background_count': len(suspicious_backgrounds),
    'suspicious': suspicious,
    'suspicious_backgrounds': suspicious_backgrounds,
    'missing': missing,
    'duplicate_image_urls': [
        {'image_url': url, 'count': count}
        for url, count in Counter(urls).most_common()
        if count > 1
    ],
    'categories': dict(Counter(str(row.get('category') or 'Uncategorized') for row in rows)),
}
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ('total', 'with_image', 'without_image', 'suspicious_count', 'suspicious_background_count')}, ensure_ascii=False))
print(f'report={OUTPUT}')
for item in suspicious[:100]:
    print('SUSPICIOUS', item['name'], item['image_url'])
for item in suspicious_backgrounds[:100]:
    print('SUSPICIOUS_BACKGROUND', item['name'], item['background_url'])
for item in missing[:50]:
    print('MISSING', item['name'])

for row in rows:
    image = str(row.get('image_url') or row.get('image') or '').strip()
    if image and 'static.wikia.nocookie.net' not in image:
        print('NON_WIKIA', row.get('name'), image)
