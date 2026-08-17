import json
from pathlib import Path
rows = json.loads(Path('/home/ubuntu/crwiki/shared/weapon-enrichment.raw.json').read_text())['weapons']
for row in rows:
    haystack = json.dumps(row, ensure_ascii=False).casefold()
    if 'lapis' in haystack or 'demon' in haystack:
        print(json.dumps({k: row.get(k) for k in ['name','pageTitle','descriptionEn','availabilityEn','obtainable','matchMode']}, ensure_ascii=False))
