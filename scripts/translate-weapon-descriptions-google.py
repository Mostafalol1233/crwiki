import json
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path('/home/ubuntu/crwiki')
RAW = ROOT / 'shared/weapon-enrichment.raw.json'
OUT = ROOT / 'shared/weapon-description-arabic-google.json'
CACHE = ROOT / 'shared/weapon-description-arabic-google.cache.json'


def translate(text: str) -> str:
    query = urlencode({
        'client': 'gtx',
        'sl': 'en',
        'tl': 'ar',
        'dt': 't',
        'q': text,
    })
    request = Request(
        'https://translate.googleapis.com/translate_a/single?' + query,
        headers={'User-Agent': 'Mozilla/5.0 CrossFireWiki research bot'},
        method='GET',
    )
    with urlopen(request, timeout=25) as response:
        payload = json.loads(response.read().decode('utf-8'))
    chunks = payload[0] if isinstance(payload, list) else []
    return ' '.join(str(chunk[0]) for chunk in chunks if isinstance(chunk, list) and chunk and chunk[0]).strip()


def main():
    rows = json.loads(RAW.read_text())['weapons']
    unique = list(dict.fromkeys(str(r.get('descriptionEn') or '').strip() for r in rows if r.get('descriptionEn')))
    result = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    result = {key: value for key, value in result.items() if str(value).strip()}
    pending = [text for text in unique if text not in result]
    print(f'total={len(unique)} cached={len(result)} pending={len(pending)}', flush=True)
    for index, source in enumerate(pending, start=1):
        for attempt in range(3):
            try:
                arabic = translate(source)
                if not arabic:
                    raise RuntimeError('empty translation')
                result[source] = arabic
                break
            except Exception as exc:
                if attempt == 2:
                    print(f'failed={index} error={type(exc).__name__}: {exc}', flush=True)
                    result[source] = ''
                else:
                    time.sleep(2 ** attempt)
        if index % 20 == 0 or index == len(pending):
            CACHE.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
            print(f'translated={len(result)}/{len(unique)}', flush=True)
        time.sleep(0.15)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f'written={OUT} entries={len(result)}', flush=True)


if __name__ == '__main__':
    main()
