from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.parse import urljoin

import requests


def load_env(path: Path) -> dict[str, str]:
    out = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            out[key.strip()] = value.strip().strip('"').strip("'")
    return out

raw_env = {**load_env(Path('/home/ubuntu/upload/.env')), **os.environ}
env = {k: (v.strip() if isinstance(v, str) else v) for k, v in raw_env.items()}
base = (env.get('VITE_SUPABASE_URL') or env.get('SUPABASE_URL') or '').rstrip('/')
key = (env.get('VITE_SUPABASE_PUBLISHABLE_KEY') or env.get('SUPABASE_PUBLISHABLE_KEY') or '').strip()
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}


def get(table):
    r = requests.get(f'{base}/rest/v1/{table}', params={'select': '*', 'order': 'created_at.desc'}, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()

posts = get('posts')
news = get('news')
old_markers = ['featured loadouts', 'drop calendar and community notes', 'global weapon comparison', 'new region weapon tracker is live']
all_titles = [str(row.get('title', '')).lower() for row in posts + news]
old_remaining = [marker for marker in old_markers if any(marker in title for title in all_titles)]
urls = [row.get('image_url') for row in posts + news if row.get('image_url')]
image_results = []
for image in urls:
    try:
        r = requests.get(image, headers={'User-Agent': 'CrossFireWikiContentCheck/1.0'}, timeout=20, stream=True)
        image_results.append({'url': image, 'status': r.status_code, 'content_type': r.headers.get('content-type', '')})
        r.close()
    except Exception as exc:
        image_results.append({'url': image, 'error': str(exc)})

result = {
    'posts_count': len(posts),
    'news_count': len(news),
    'post_slugs': [row.get('post_slug') for row in posts],
    'news_slugs': [row.get('news_slug') for row in news],
    'old_markers_remaining': old_remaining,
    'images': image_results,
    'all_images_ok': all(item.get('status') == 200 and item.get('content_type', '').startswith('image/') for item in image_results),
}
Path('/home/ubuntu/crwiki/content_refresh_verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
