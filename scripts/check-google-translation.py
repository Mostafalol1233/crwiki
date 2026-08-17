import json
import re
from pathlib import Path

path = Path('/home/ubuntu/crwiki/shared/weapon-description-arabic-google.json')
cache = json.loads(path.read_text())
items = list(cache.items())
for index, (english, arabic) in enumerate(items[:12]):
    print(f'[{index}] EN: {english[:180]}')
    print(f'[{index}] AR: {arabic[:260]}')
print('entries=', len(items))
print('empty=', sum(not str(value).strip() for _, value in items))
# Detect untranslated English sentences, while allowing official weapon/character names
# such as "The Fates-Born Beast" inside otherwise Arabic descriptions.
english_sentence = re.compile(r'(^|[.!?]\s+)(This|The weapon|It)\b', re.IGNORECASE)
print('english_like=', sum(bool(english_sentence.search(str(value))) for _, value in items))
print('arabic_script=', sum(any('\u0600' <= char <= '\u06ff' for char in str(value)) for _, value in items))
