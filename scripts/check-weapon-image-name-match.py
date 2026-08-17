from __future__ import annotations

import json
import re
from pathlib import Path

INPUT = Path('/tmp/crossfire-wiki-weapons.json')
rows = json.loads(INPUT.read_text()).get('weapons', [])

GENERIC = {
    'bi', 'buyweapon', 'info', 'weapon', 'nm', 'nomark', 'mark', 'cf', 'crossfire',
    'png', 'jpg', 'jpeg', 'webp', 'revision', 'latest', 'scale', 'cdn', 'static',
}

def tokens(value: str) -> set[str]:
    return {
        token.lower() for token in re.split(r'[^a-z0-9]+', value)
        if len(token) >= 2 and token.lower() not in GENERIC
    }

suspect = []
for row in rows:
    name = str(row.get('name') or '')
    image = str(row.get('image_url') or row.get('image') or '')
    filename = image.split('?', 1)[0].rstrip('/').rsplit('/', 1)[-1]
    name_tokens = tokens(name)
    file_tokens = tokens(filename)
    overlap = name_tokens & file_tokens
    if image and not overlap:
        suspect.append({'name': name, 'filename': filename, 'image_url': image})

print(f'zero_token_overlap={len(suspect)} total={len(rows)}')
for item in suspect[:200]:
    print(item['name'], '|', item['filename'], '|', item['image_url'])
