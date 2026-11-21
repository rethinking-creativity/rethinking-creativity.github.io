"""Finds each human-made work used in the promo films on Wikimedia Commons and checks its licence.

For every image in WORKS, searches Commons, downloads the candidates' thumbnails, and compares them
with our file by perceptual hash (smaller distance = same picture). Prints the best match, its
licence and its Commons page, and writes the table to _tools/sources.md.

    uv run --with pillow --with imagehash promotion/videos/_tools/verify_sources.py
"""
import io
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

import imagehash
from PIL import Image

SITE = Path(__file__).resolve().parents[3]
UA = {"User-Agent": "promo-builder/1.0 (checking image licences for a research meet-up)"}
WORKS = {
    "hokusai": "Great Wave off Kanagawa Hokusai",
    "vangogh": "Starry Night Van Gogh",
    "vermeer": "Girl with a Pearl Earring Vermeer",
    "monet": "Impression Sunrise Monet",
    "jeongseon": "Inwang Jesaekdo Jeong Seon",
    "hiroshige": "Hiroshige Sudden Shower Ohashi Atake",
    "klimt": "Klimt The Kiss",
    "botticelli": "Birth of Venus Botticelli",
    "rembrandt": "Rembrandt self-portrait 1659",
    "seurat": "Sunday Afternoon Island of La Grande Jatte Seurat",
    "kimhongdo": "Kim Hong-do Seodang",
    "chaekgado": "Chaekgado",
}


def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception:
            time.sleep(6 * (attempt + 1))
    return None


def candidates(query, n=8):
    q = urllib.parse.quote(query)
    url = (f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit={n}"
           f"&gsrsearch={q}%20filetype:bitmap&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=256&format=json")
    data = json.loads(get(url) or b"{}")
    return list(data.get("query", {}).get("pages", {}).values())


rows = []
for key, query in WORKS.items():
    ours = imagehash.phash(Image.open(SITE / "assets/works" / f"{key}.jpg").convert("RGB"))
    best = None
    for page in candidates(query):
        info = page["imageinfo"][0]
        raw = get(info["thumburl"])
        if not raw:
            continue
        try:
            d = ours - imagehash.phash(Image.open(io.BytesIO(raw)).convert("RGB"))
        except Exception:
            continue
        meta = info.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "?")
        if best is None or d < best[0]:
            best = (d, page["title"], lic, info["descriptionurl"])
        time.sleep(0.5)
    rows.append((key, *(best or (99, "not found", "?", ""))))
    print(rows[-1], flush=True)
    time.sleep(2)

out = ["| work | match distance (0 = identical, <10 same image) | Commons file | licence |", "|---|---|---|---|"]
out += [f"| {k} | {d} | [{t}]({u}) | {lic} |" for k, d, t, lic, u in rows]
(Path(__file__).parent / "sources.md").write_text("\n".join(out) + "\n")
