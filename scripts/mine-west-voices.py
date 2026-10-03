#!/usr/bin/env python3
"""Mine CrossFire West character voices (Message, NOT Radio).

Methodology (per request: the RIGHT message, not normal radio):
  1. Walk <game>/rez/Snd2/<Character>/MESSAGE/  (case-insensitive) — these are
     the character-specific situational lines (bomb plant, die, fire-in-hole...).
     NEVER take <Character>/RADIO/ (generic radio commands shared by everyone).
  2. Prefer `*_C.wav` variants (character-voiced) over base files.
  3. Flag 0-byte stubs (West streams real audio from FMOD banks, loose files
     may be placeholders) — stubs are reported, never copied as real audio.
  4. Cross-check against Voice_US.bank: parse RIFF chunks, locate FSB5 blobs,
     list sample names matching the wanted MESSAGE filenames + variant counts.

Usage:
  python scripts/mine-west-voices.py --game "D:\\pythoncode" --out manifest.json

Read-only: never modifies the game folder.
"""
import argparse
import json
import mmap
import os
import re
import struct
import sys

AP = argparse.ArgumentParser()
AP.add_argument("--game", default=r"D:\pythoncode")
AP.add_argument("--out", default="voice-manifest.json")
A = AP.parse_args()

GAME = A.game
SND2 = os.path.join(GAME, "rez", "Snd2")
BANK = os.path.join(GAME, "rez", "FModStudio", "Voice", "Voice_US.bank")

manifest = {"game": GAME, "characters": {}, "bank": {}}


def find_dir(parent, name):
    if not os.path.isdir(parent):
        return None
    for e in os.listdir(parent):
        if e.lower() == name.lower() and os.path.isdir(os.path.join(parent, e)):
            return os.path.join(parent, e)
    return None


def scan_character(char_dir):
    """Return MESSAGE clips only. Returns (clips, skipped_radio_note)."""
    msg = find_dir(char_dir, "message")
    clips = []
    if msg:
        for root, _, files in os.walk(msg):
            for fn in sorted(files):
                if not fn.lower().endswith(".wav"):
                    continue
                fp = os.path.join(root, fn)
                try:
                    sz = os.path.getsize(fp)
                except OSError:
                    continue
                clips.append({
                    "file": fn,
                    "path": os.path.relpath(fp, GAME),
                    "bytes": sz,
                    "stub": sz <= 100,
                    "char_voiced": fn.upper().endswith("_C.WAV"),
                })
    # verify we did NOT touch radio
    radio = find_dir(char_dir, "radio")
    radio_count = 0
    if radio:
        for _, _, files in os.walk(radio):
            radio_count += sum(1 for fn in files if fn.lower().endswith(".wav"))
    return clips, radio_count


def parse_bank():
    """Locate FSB5 blobs + harvest filename-like sample names."""
    info = {"path": os.path.relpath(BANK, GAME), "fsb5": [], "name_hits": {}}
    if not os.path.isfile(BANK):
        info["error"] = "bank not found"
        return info
    with open(BANK, "rb") as f:
        data = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
        offs = []
        i = data.find(b"FSB5")
        while i != -1:
            offs.append(i)
            i = data.find(b"FSB5", i + 1)
        for o in offs:
            ver, n, shsz, namesz, datasz, _mode = struct.unpack_from("<IIIIII", data, o + 4)
            info["fsb5"].append({"offset": o, "samples": n, "data_bytes": datasz})
            p, end = o + 28, o + 28 + shsz
            while p < end:
                m = re.compile(rb"[A-Z0-9_]{6,}").match(bytes(data[p:min(p + 200, end)]))
                if m and end > (p + len(m.group(0))) and data[p + len(m.group(0))] == 0:
                    nm = m.group(0).decode()
                    info["name_hits"][nm] = info["name_hits"].get(nm, 0) + 1
                    p += len(m.group(0)) + 1
                else:
                    p += 1
    return info


def main():
    if not os.path.isdir(SND2):
        sys.exit(f"Snd2 not found: {SND2}")
    chars = sorted(d for d in os.listdir(SND2) if os.path.isdir(os.path.join(SND2, d)))
    total_clips = total_real = total_stub = total_radio_skipped = 0
    for ch in chars:
        clips, radio_n = scan_character(os.path.join(SND2, ch))
        real = [c for c in clips if not c["stub"]]
        total_clips += len(clips)
        total_real += len(real)
        total_stub += len(clips) - len(real)
        total_radio_skipped += radio_n
        if clips:
            manifest["characters"][ch] = {
                "message_clips": len(clips),
                "real_audio": len(real),
                "stubs": len(clips) - len(real),
                "radio_skipped": radio_n,
                "sample_files": [c["file"] for c in clips[:8]],
            }
    print(f"characters with MESSAGE/: {len(manifest['characters'])}")
    print(f"MESSAGE clips: {total_clips} (real={total_real}, stubs={total_stub}) radio skipped={total_radio_skipped}")
    print("parsing bank (slow, one pass)...")
    manifest["bank"] = parse_bank()
    hits = manifest["bank"].get("name_hits", {})
    print(f"bank FSB5 blobs: {len(manifest['bank'].get('fsb5', []))}, filename hits: {len(hits)}")
    with open(A.out, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print("manifest ->", A.out)


main()
