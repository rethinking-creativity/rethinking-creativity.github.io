"""Downloads CC0 / public-domain music from Wikimedia Commons into /tmp/kmusic, slowly (Commons
rate-limits bursts), and prints each file's licence and length.

    python3 fetch_music.py "File title.ogg" ...
"""
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = {"User-Agent": "promo-builder/1.0 (music for a research meet-up promo)"}
OUT = Path("/tmp/kmusic")
OUT.mkdir(exist_ok=True)


def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:  # rate limit or network: wait and retry
            print("  retry", attempt + 1, e, file=sys.stderr)
            time.sleep(8 * (attempt + 1))
    raise RuntimeError(url)


for title in sys.argv[1:]:
    name = title.replace(" ", "_").replace("(", "").replace(")", "")
    dest = OUT / name
    if not dest.exists():
        q = urllib.parse.quote("File:" + title)
        meta = json.loads(get(f"https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&format=json&titles={q}"))
        page = list(meta["query"]["pages"].values())[0]
        info = page["imageinfo"][0]
        lic = info["extmetadata"].get("LicenseShortName", {}).get("value")
        dest.write_bytes(get(info["url"]))
        (OUT / (name + ".license")).write_text(f"{lic}\n{info['descriptionurl'] if 'descriptionurl' in info else ''}\n")
        time.sleep(3)
    lic = (OUT / (name + ".license")).read_text().split("\n")[0] if (OUT / (name + ".license")).exists() else "?"
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dest)], capture_output=True, text=True).stdout.strip()
    print(f"{lic} | {name} | {dur}")
