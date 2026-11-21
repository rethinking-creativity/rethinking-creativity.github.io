"""Writes _out/index.html: every rendered MP4 side by side, vertical and landscape, to review in a browser."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from build import VERSIONS, OUT

rows = []
for num, slug, desc, music, _ in VERSIONS:
    v, l = f"vertical-{num}-{slug}.mp4", f"landscape-{num}-{slug}.mp4"
    rows.append(f'''<section><h2>{num} · {slug}</h2><p>{desc} <i>Music: {music}.</i></p>
<div class="pair"><video src="{v}" controls preload="metadata" class="v"></video><video src="{l}" controls preload="metadata" class="l"></video></div></section>''')
html = f'''<!doctype html><meta charset="utf-8"><title>Meet-up promo videos</title>
<style>body{{font-family:system-ui,sans-serif;margin:32px;background:#fdfcf8;color:#2a2140}} h1{{margin:0 0 24px}}
section{{margin:0 0 40px;padding-top:20px;border-top:1px solid #ece7f5}} h2{{margin:0 0 4px}} p{{margin:0 0 12px;color:#655c7a}}
.pair{{display:flex;gap:20px;align-items:flex-start}} .v{{height:560px}} .l{{height:315px}}</style>
<h1>Meet-up promo videos <small style="font-weight:400;color:#655c7a">vertical 1080×1920 · landscape 1920×1080</small></h1>
{chr(10).join(rows)}'''
(OUT / "_out" / "index.html").write_text(html)
print("wrote", OUT / "_out" / "index.html")
