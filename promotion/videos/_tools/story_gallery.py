"""Writes _out/story/index.html: each look's vertical and landscape render side by side."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from story import STYLES, CREDITS, OUT as STORY  # noqa: E402

out = STORY.parent / "_out" / "story"
rows = []
for s in STYLES:
    v, l = f"vertical-{s.num}-{s.slug}.mp4", f"landscape-{s.num}-{s.slug}.mp4"
    rows.append(f'''<section><h2>{s.num} · {s.slug}</h2><p>{s.desc} <i>Music: {CREDITS[s.music]}.</i></p>
<div class="pair"><video src="{v}" controls preload="metadata" class="v"></video><video src="{l}" controls preload="metadata" class="l"></video></div></section>''')
html = f'''<!doctype html><meta charset="utf-8"><title>Meet-up story film</title>
<style>body{{font-family:system-ui,sans-serif;margin:32px;background:#fdfcf8;color:#2a2140}} h1{{margin:0 0 6px}} .lead{{margin:0 0 24px;color:#655c7a}}
section{{margin:0 0 40px;padding-top:20px;border-top:1px solid #ece7f5}} h2{{margin:0 0 4px}} p{{margin:0 0 12px;color:#655c7a}}
.pair{{display:flex;gap:20px;align-items:flex-start}} .v{{height:560px}} .l{{height:315px}}</style>
<h1>Meet-up story film</h1>
<p class="lead">One script (topic → four questions → CHI → meet-up → who → share your work → organizers), four looks.
Vertical 1080×1920 for Reels, landscape 1920×1080 for the website. No voice: kinetic type, sound effects, a quiet music bed.</p>
{chr(10).join(rows)}'''
out.mkdir(parents=True, exist_ok=True)
(out / "index.html").write_text(html)
print("wrote", out / "index.html")
