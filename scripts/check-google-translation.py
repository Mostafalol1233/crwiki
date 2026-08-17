import json
import re
import sys
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/home/ubuntu/crwiki/shared/weapon-descriptions.ts')
if path.suffix == '.ts':
    # Read only the generated Arabic fields; this keeps the check independent
    # from the ignored translation cache used during generation.
    text = path.read_text(encoding='utf-8')
    encoded_values = re.findall(r'"descriptionAr":\s*("(?:\\.|[^"\\])*")', text)
    values = [json.loads(value) for value in encoded_values]
    items = [(str(index), value) for index, value in enumerate(values)]
else:
    cache = json.loads(path.read_text(encoding='utf-8'))
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
