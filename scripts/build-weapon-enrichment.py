import json
import re
import time
from pathlib import Path
from urllib.parse import quote

import requests

PRODUCTION = Path('/tmp/crossfire-production-weapons.json')
OUTPUT = Path('/home/ubuntu/crwiki/shared/weapon-enrichment.raw.json')
API = 'https://crossfirefps.fandom.com/api.php'
WIKI_BASE = 'https://crossfirefps.fandom.com/wiki/'


def clean_wikitext(value: str) -> str:
    value = re.sub(r'<!--.*?-->', '', value or '', flags=re.S)
    value = re.sub(r'<[^>]+>', '', value)
    value = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'\2', value)
    value = re.sub(r'\[\[([^\]]+)\]\]', r'\1', value)
    value = re.sub(r'\[https?://[^ ]+\s+([^\]]+)\]', r'\1', value)
    value = re.sub(r"'''([^']+)'''", r'\1', value)
    value = re.sub(r"''([^']+)''", r'\1', value)
    value = re.sub(r'\{\{[^{}]*\}\}', '', value)
    value = value.replace('&nbsp;', ' ').replace('&times;', '×')
    value = re.sub(r'\s+', ' ', value)
    return value.strip(' |\n\r\t')


def normalize_key(value: str) -> str:
    value = value.casefold().replace('_', ' ')
    value = re.sub(r'[^a-z0-9]+', '', value)
    return value


def candidate_titles(name: str):
    candidates = [name]
    # Fandom page titles commonly omit a cosmetic suffix after the base weapon.
    current = name
    for _ in range(5):
        if '-' not in current and ' ' not in current:
            break
        if '-' in current:
            current = current.rsplit('-', 1)[0].strip()
        else:
            current = current.rsplit(' ', 1)[0].strip()
        if current and current not in candidates:
            candidates.append(current)
    replacements = {
        'AK-47': 'AK47',
        'M4A1-S': 'M4A1-S',
        '[T] ': '',
    }
    for title in list(candidates):
        for old, new in replacements.items():
            if old in title:
                alt = title.replace(old, new).strip()
                if alt and alt not in candidates:
                    candidates.append(alt)
    return candidates


def api_pages(titles):
    params = {
        'action': 'query',
        'prop': 'revisions',
        'rvprop': 'content|ids',
        'rvslots': 'main',
        'redirects': '1',
        'format': 'json',
        'titles': '|'.join(titles),
    }
    response = requests.get(API, params=params, headers={'User-Agent': 'CrossFireWikiAudit/1.0'}, timeout=35)
    response.raise_for_status()
    payload = response.json()
    pages = {}
    for page in payload.get('query', {}).get('pages', {}).values():
        if 'missing' in page or not page.get('revisions'):
            continue
        rev = page['revisions'][0]
        slots = rev.get('slots', {})
        main = slots.get('main', {})
        text = main.get('*') or main.get('content') or ''
        if text:
            pages[page.get('title', '')] = {
                'title': page.get('title', ''),
                'pageid': page.get('pageid'),
                'revid': rev.get('revid'),
                'wikitext': text,
            }
    return pages


def infobox_field(text: str, field: str) -> str:
    match = re.search(rf'^\|\s*{re.escape(field)}\s*=\s*(.*?)(?=^\|\s*[A-Za-z0-9_]+\s*=|^\}}\}})', text, flags=re.M | re.S)
    return match.group(1).strip() if match else ''


def parse_obtain(raw: str):
    values = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        line = re.sub(r'^\*+\s*', '', line)
        value = clean_wikitext(line)
        if value and value not in values:
            values.append(value)
    if not values:
        value = clean_wikitext(raw)
        if value:
            values.append(value)
    return values


def first_sentences(text: str, max_chars: int = 500) -> str:
    text = clean_wikitext(text)
    text = re.sub(r'^\s*\|?\s*', '', text)
    text = text.replace('\n', ' ').strip()
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars]
    boundary = max(cut.rfind('. '), cut.rfind('。'), cut.rfind('! '), cut.rfind('? '))
    return (cut[:boundary + 1] if boundary >= 120 else cut).strip()


def parse_page(page, requested_name: str):
    text = page['wikitext']
    quote_match = re.search(r'\{\{Quote\|(.+?)\|Weapon description\}\}', text, flags=re.S | re.I)
    quote_text = clean_wikitext(quote_match.group(1)) if quote_match else ''
    overview = ''
    overview_match = re.search(r'^==\s*Overview\s*==\s*(.*?)(?=^==|\Z)', text, flags=re.M | re.S | re.I)
    if overview_match:
        overview = overview_match.group(1)
    else:
        # Some pages use a spaced heading or place the introductory sentence
        # directly after the Weapon infobox without an Overview section.
        intro = re.split(r'^==', text, maxsplit=1, flags=re.M)[0]
        intro = re.sub(r'^.*?^\}\}\s*', '', intro, count=1, flags=re.M | re.S)
        overview = intro
    overview = first_sentences(overview, 450)
    if quote_text and overview and overview.casefold() not in quote_text.casefold():
        description = f'{quote_text} {overview}'
    else:
        description = quote_text or overview
    description = first_sentences(description, 650)
    weapon_type = clean_wikitext(infobox_field(text, 'type'))
    obtainable = parse_obtain(infobox_field(text, 'obtain'))
    availability = ''
    availability_match = re.search(r'^==\s*Availability\s*==\s*(.*?)(?=^==|\Z)', text, flags=re.M | re.S | re.I)
    if availability_match:
        availability = first_sentences(availability_match.group(1), 300)
    return {
        'pageTitle': page['title'],
        'pageId': page['pageid'],
        'revisionId': page['revid'],
        'sourceUrl': WIKI_BASE + quote(page['title'].replace(' ', '_')),
        'matchedName': requested_name,
        'type': weapon_type,
        'descriptionEn': description,
        'quoteEn': quote_text,
        'overviewEn': overview,
        'availabilityEn': availability,
        'obtainable': obtainable,
        'sourceKind': 'secondary_reference',
    }


def main():
    rows = json.loads(PRODUCTION.read_text()).get('weapons', [])
    names = [str(row.get('name', '')).strip() for row in rows if row.get('name')]
    unique_names = list(dict.fromkeys(names))
    pages_by_key = {}
    titles = list(dict.fromkeys(t for name in unique_names for t in candidate_titles(name)))
    print(f'production={len(rows)} unique_names={len(unique_names)} candidate_titles={len(titles)}')
    for start in range(0, len(titles), 50):
        batch = titles[start:start + 50]
        try:
            batch_pages = api_pages(batch)
            for title, page in batch_pages.items():
                pages_by_key[normalize_key(title)] = page
            print(f'pages {min(start + 50, len(titles))}/{len(titles)} fetched={len(pages_by_key)}')
        except Exception as exc:
            print(f'warning batch={start}: {exc}')
        time.sleep(0.15)

    records = []
    exact = 0
    fallback = 0
    missing = 0
    for row in rows:
        name = str(row.get('name', '')).strip()
        page = None
        matched_title = None
        for candidate in candidate_titles(name):
            page = pages_by_key.get(normalize_key(candidate))
            if page:
                matched_title = candidate
                break
        if page:
            record = parse_page(page, name)
            record['matchMode'] = 'exact' if normalize_key(page['title']) == normalize_key(name) else 'base_reference'
            if record['matchMode'] == 'exact':
                exact += 1
            else:
                fallback += 1
        else:
            missing += 1
            record = {
                'pageTitle': '', 'pageId': None, 'revisionId': None,
                'sourceUrl': '', 'matchedName': name, 'type': '',
                'descriptionEn': '', 'quoteEn': '', 'overviewEn': '',
                'availabilityEn': '', 'obtainable': [],
                'sourceKind': 'not_found', 'matchMode': 'not_found',
            }
        record.update({
            'id': row.get('id'),
            'name': name,
            'category': row.get('category', ''),
            'imageUrl': row.get('image_url', ''),
            'officialCatalogueUrl': 'https://crossfire.z8games.com/weapons.html',
        })
        records.append(record)
    result = {
        'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'source': 'CrossFire Wiki Fandom via MediaWiki API; official catalogue link retained for publisher cross-check',
        'counts': {'production': len(rows), 'exact': exact, 'baseReference': fallback, 'notFound': missing},
        'weapons': records,
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f'written={OUTPUT} exact={exact} base_reference={fallback} not_found={missing}')


if __name__ == '__main__':
    main()
