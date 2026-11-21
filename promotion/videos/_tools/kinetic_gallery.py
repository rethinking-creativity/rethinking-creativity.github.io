"""Writes _out/kinetic/index.html: each kinetic look, vertical and landscape side by side, with the script."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from kinetic import LOOKS, OUT as KOUT, QUESTIONS  # noqa: E402

out = KOUT.parent / "_out" / "kinetic"
rows = []
for s in LOOKS:
    v, l = f"vertical-{s.num}-{s.slug}.mp4", f"landscape-{s.num}-{s.slug}.mp4"
    rows.append(f'''<section><h2>{s.num} · {s.slug}</h2><p>{s.desc}</p>
<div class="pair"><video src="{v}" controls preload="metadata" class="v"></video><video src="{l}" controls preload="metadata" class="l"></video></div></section>''')
qs = "".join(f"<li>{q.replace('*', '')}</li>" for _, q in QUESTIONS)
html = f'''<!doctype html><meta charset="utf-8"><title>Meet-up kinetic films</title>
<style>body{{font-family:system-ui,sans-serif;margin:32px;background:#fdfcf8;color:#2a2140;max-width:1400px}} h1{{margin:0 0 6px}}
.lead{{margin:0 0 8px;color:#655c7a}} ol{{margin:0 0 24px;color:#655c7a}}
section{{margin:0 0 40px;padding-top:20px;border-top:1px solid #ece7f5}} h2{{margin:0 0 4px}} p{{margin:0 0 12px;color:#655c7a}}
.pair{{display:flex;gap:20px;align-items:flex-start}} .v{{height:560px}} .l{{height:315px}}</style>
<h1>Meet-up kinetic films</h1>
<p class="lead">One script, five looks, each cut to its own original track (synthesized for these films, no samples). Every cut and camera move sits on the beat.
Script: “AI can write. Paint. Film. Compose. So which part is still yours?” → 4 questions back to back → “Let’s figure it out together at CHI 2027” →
what CHI is → a 90-minute meet-up, open to anyone at CHI → who it is for → “Make art? Share a piece.” → the guessing game → “Can’t make it to CHI? Send it anyway.” → organizers and link.</p>
<ol>{qs}</ol>
{chr(10).join(rows)}'''
out.mkdir(parents=True, exist_ok=True)
(out / "index.html").write_text(html)
print("wrote", out / "index.html")
