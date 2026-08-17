import json
from collections import Counter
from pathlib import Path
rows = json.loads(Path('/home/ubuntu/crwiki/shared/weapon-enrichment.raw.json').read_text())['weapons']
counts = Counter()
for row in rows:
    for value in row.get('obtainable') or []:
        counts[str(value)] += 1
for value, count in counts.most_common():
    print(f'{count}\t{value}')
