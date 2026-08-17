from __future__ import annotations

import html
import sys
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

url = sys.argv[1]
raw = Path(url).read_bytes() if url.startswith('/') else urllib.request.urlopen(url, timeout=30).read()
root = ET.fromstring(raw)
for item in root.findall('.//item'):
    def text(name: str) -> str:
        node = item.find(name)
        return html.unescape((node.text or '').strip()) if node is not None else ''
    title = text('title')
    link = text('link')
    pub = text('pubDate')
    desc = text('description').replace('\n', ' ').replace('\r', ' ')
    print(f'TITLE: {title}\nDATE: {pub}\nURL: {link}\nDESCRIPTION: {desc[:900]}\n---')
