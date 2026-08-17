import json
from collections import Counter
from pathlib import Path

path = Path('/tmp/crossfire-production-weapons.json')
data = json.loads(path.read_text())
rows = data.get('weapons', []) if isinstance(data, dict) else data
print(f'total={len(rows)}')
print('categories=', dict(Counter(str(r.get('category', '')) for r in rows)))
print('empty_description=', sum(not str(r.get('description', '')).strip() for r in rows))
print('generic_description=', sum(str(r.get('description', '')).strip() == f"{r.get('name')} - CrossFire weapon." for r in rows))
print('missing_image=', sum(not str(r.get('image_url', '')).strip() for r in rows))
print('first_names=')
for r in rows[:30]:
    print(f"{r.get('name')} | {r.get('category')} | {r.get('image_url')}")
