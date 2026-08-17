from __future__ import annotations

import io
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import requests
from PIL import Image

INPUT = Path('/tmp/crossfire-wiki-weapons.json')
OUTPUT = Path('/tmp/crossfire-wiki-weapon-image-url-validation.json')
TIMEOUT = 15

rows = json.loads(INPUT.read_text()).get('weapons', [])
items = [
    {'id': row.get('id'), 'name': row.get('name'), 'image_url': row.get('image_url') or row.get('image') or ''}
    for row in rows
]


def validate(item: dict[str, Any]) -> dict[str, Any]:
    url = str(item['image_url'] or '').strip()
    result = {**item, 'ok': False, 'status': None, 'content_type': '', 'bytes': 0, 'width': None, 'height': None, 'error': ''}
    if not url:
        result['error'] = 'missing_url'
        return result
    try:
        response = requests.get(url, timeout=TIMEOUT, headers={'User-Agent': 'CrossFireWiki-image-audit/1.0'}, allow_redirects=True)
        result['status'] = response.status_code
        result['content_type'] = response.headers.get('content-type', '')
        result['bytes'] = len(response.content)
        if response.status_code != 200:
            result['error'] = f'http_{response.status_code}'
            return result
        if not result['content_type'].lower().startswith('image/'):
            result['error'] = 'not_image_content_type'
            return result
        with Image.open(io.BytesIO(response.content)) as image:
            result['width'], result['height'] = image.size
            result['format'] = image.format
        result['ok'] = True
    except Exception as exc:
        result['error'] = type(exc).__name__ + ': ' + str(exc)[:180]
    return result

results = []
with ThreadPoolExecutor(max_workers=24) as executor:
    futures = [executor.submit(validate, item) for item in items]
    for future in as_completed(futures):
        results.append(future.result())
results.sort(key=lambda item: (str(item.get('name') or '').lower(), str(item.get('id') or '')))

report = {
    'total': len(results),
    'ok': sum(1 for item in results if item['ok']),
    'failed': sum(1 for item in results if not item['ok']),
    'wide_assets': [item for item in results if item.get('width') and item.get('height') and item['width'] / item['height'] >= 3.2],
    'failed_items': [item for item in results if not item['ok']],
    'results': results,
}
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: report[key] if key != 'results' else len(report[key]) for key in ('total', 'ok', 'failed', 'wide_assets', 'failed_items', 'results')}, ensure_ascii=False))
for item in report['failed_items'][:100]:
    print('FAILED', item['name'], item['error'], item['image_url'])
for item in report['wide_assets'][:100]:
    print('WIDE', item['name'], f"{item['width']}x{item['height']}", item['image_url'])
print(f'report={OUTPUT}')
