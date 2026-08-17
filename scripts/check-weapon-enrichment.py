import json
from collections import Counter
from pathlib import Path

payload = json.loads(Path('/home/ubuntu/crwiki/shared/weapon-enrichment.raw.json').read_text())
rows = payload['weapons']
print('counts=', payload['counts'])
print('description_nonempty=', sum(bool(r['descriptionEn']) for r in rows))
print('obtain_nonempty=', sum(bool(r['obtainable']) for r in rows))
print('availability_nonempty=', sum(bool(r['availabilityEn']) for r in rows))
print('type_nonempty=', sum(bool(r['type']) for r in rows))
print('match_modes=', Counter(r['matchMode'] for r in rows))
print('source_kinds=', Counter(r['sourceKind'] for r in rows))
print('categories=', Counter(r['category'] for r in rows).most_common())
print('obtain_values=', Counter(value for r in rows for value in r['obtainable']).most_common(30))
print('missing_descriptions_sample=', [r['name'] for r in rows if not r['descriptionEn']][:30])
print('base_reference_sample=', [(r['name'], r['pageTitle']) for r in rows if r['matchMode'] == 'base_reference'][:20])
print('generic_like=', [(r['name'], r['descriptionEn'][:100]) for r in rows if r['descriptionEn'].casefold().startswith('crossfire weapon')][:20])
