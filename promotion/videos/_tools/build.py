"""Builds the meet-up promo videos as HyperFrames projects: 10 vertical reels (1080x1920) and
the same 10 ideas recomposed for the website (1920x1080).

    python3 promotion/videos/_tools/build.py            # write every project
    python3 promotion/videos/_tools/build.py 03 07      # only these numbers

Each project lands in promotion/videos/{vertical,landscape}/NN-slug/ as plain HTML (index.html +
compositions/), editable by hand or in the HyperFrames desktop app. Edit VERSIONS (bottom) to
change copy, order, music or works, then re-run; a re-run overwrites the generated files.

Everything shown comes from the site: real works from js/wall.js (with their real credits), the
schedule, the four questions, the organizers. Music: public-domain or CC0 piano from the site's
wall, or an original synthesized beat. Sound effects: Pixabay Content License.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[3]
OUT = SITE / "promotion" / "videos"
SFX_SRC = Path.home() / ".claude/skills/media-use/audio/assets/sfx"
SYNTH = Path.home() / ".claude/skills/video-shorts/scripts/synth_music.py"
CACHE = OUT / "_tools" / ".cache"

INK, SOFT, VIOLET, BLUE = "#2a2140", "#655c7a", "#6d3be8", "#2563eb"
GRAD = "linear-gradient(140deg, #6d3be8, #e79ad0)"

# ---------------------------------------------------------------- works (from js/wall.js)
W_ = lambda kind, src, who, how, **k: dict(kind=kind, src=src, who=who, how=how, **k)
WORKS = {
    "hokusai": W_("img", "hokusai.jpg", "human", "Hokusai, c. 1831"),
    "ai_wave": W_("img", "ai_wave.jpg", "ai", "Gemini, c. 10 seconds"),
    "ai_portrait": W_("img", "ai_portrait.jpg", "ai", "Gemini, c. 10 seconds"),
    "vermeer": W_("img", "vermeer.jpg", "human", "Vermeer, c. 1665"),
    "ai_night": W_("img", "ai_night.jpg", "ai", "Gemini, c. 10 seconds"),
    "vangogh": W_("img", "vangogh.jpg", "human", "Van Gogh, 1889"),
    "monet": W_("img", "monet.jpg", "human", "Monet, 1872"),
    "ai_harbor": W_("img", "ai_harbor.jpg", "ai", "Gemini, c. 10 seconds"),
    "jeongseon": W_("img", "jeongseon.jpg", "human", "Jeong Seon, 1751"),
    "ai_jinkyeong": W_("img", "ai_jinkyeong.jpg", "ai", ""),
    "hope": W_("text", "“Hope” is the thing with feathers –\nThat perches in the soul –", "human", "Emily Dickinson"),
    "patience": W_("text", "“Patience” is the thing with roots –\nThat holds the ground below –", "ai", "Claude, asked to write like Dickinson"),
    "whitman": W_("text", "I celebrate myself, and sing myself,\nAnd what I assume you shall assume,", "human", "Walt Whitman, 1855"),
    "ai_whitman": W_("text", "I wander through the city, and the city wanders through me,", "ai", "Claude, asked to write like Whitman"),
    "train": W_("still", "lumiere_train.mp4", "human", "Lumière brothers, 1895", label="Video"),
    "tram": W_("still", "ai_tram.mp4", "ai", "", label="Video"),
    "satie_wave": W_("img", "satie_wave.jpg", "human", "Satie, 1888", label="Sound"),
    "ai_waltz_wave": W_("img", "ai_waltz_wave.jpg", "ai", "", label="Sound"),
}
WALL = ["hokusai", "ai_rain", "vangogh", "patience", "ai_portrait", "vermeer", "monet", "ai_night",
        "hope", "hiroshige", "ai_harbor", None, "klimt", "ai_park", "botticelli", "ai_shell",
        "rembrandt", "whitman", "seurat", "ai_oldman", "jeongseon", "ai_pungsok", "kimhongdo", "ai_miin",
        "chaekgado", "ai_chaekgado", "monet", "ai_wave"]
EXTRA = {  # wall-only tiles
    "ai_rain": ("ai", "Gemini, c. 10 seconds"), "hiroshige": ("human", "Hiroshige, 1857"),
    "klimt": ("human", "Klimt, 1908"), "ai_park": ("ai", ""), "botticelli": ("human", "Botticelli, c. 1485"),
    "ai_shell": ("ai", ""), "rembrandt": ("human", "Rembrandt, 1659"), "seurat": ("human", "Seurat, 1884"),
    "ai_oldman": ("ai", ""), "ai_pungsok": ("ai", ""), "kimhongdo": ("human", "Kim Hong-do, c. 1780"),
    "ai_miin": ("ai", ""), "chaekgado": ("human", "Joseon folk painting, 1800s"), "ai_chaekgado": ("ai", ""),
}
for k, (who, how) in EXTRA.items():
    WORKS.setdefault(k, W_("img", f"{k}.jpg", who, how))
KETTLE = W_("text", "The kettle learns my name each morning.\nIt calls twice, and I come home.", "human", "Anonymous")

PEOPLE = [("Hye-Young Jo", "University of Colorado Boulder", "hye-young.jpg"),
          ("Chenxinran Elise Shen", "University of Toronto", "elise.jpg"),
          ("Erzhen Hu", "Microsoft", "erzhen.jpg"), ("David Ledo", "Autodesk Research", "david.jpg"),
          ("Nicolai Marquardt", "Microsoft Research", "nic.jpg"), ("Jun Kato", "AIST", "jun.jpg"),
          ("Juho Kim", "KAIST and SkillBench", "juho.jpg"), ("Takeo Igarashi", "The University of Tokyo", "takeo.jpg"),
          ("Ryo Suzuki", "University of Colorado Boulder", "ryo.jpg")]
QUESTIONS = [("Creative contribution", "Can creativity be shared between humans and AI?"),
             ("Delegation", "Which parts of creating do people want to keep for themselves?"),
             ("Creative growth", "What does it mean to grow as a creator when more of the creative process can be delegated?"),
             ("Evaluation", "How do we know whether a tool supports human creativity?")]
SCHEDULE = [("Welcome", 10), ("Can You Spot the AI?", 10), ("Share Your Practice", 10),
            ("Rethinking Creativity", 50), ("Closing", 10)]
ICON = {
    "Text": '<path d="M4 6h16M4 11h16M4 16h10"/>',
    "Image": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/>',
    "Video": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    "Sound": '<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2"/>',
}
svg = lambda name: f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICON[name]}</svg>'


# ---------------------------------------------------------------- helpers
class Ctx:
    def __init__(self, W, H, root):
        self.W, self.H, self.root = W, H, root
        self.v = H > W  # vertical
        self.assets = set()

    def asset(self, rel_site, dest):
        self.assets.add((rel_site, dest))
        return dest


def size_of(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)], capture_output=True, text=True).stdout
    w = int(out.split("pixelWidth:")[1].split()[0]); h = int(out.split("pixelHeight:")[1].split()[0])
    return w, h


def still_of(video):
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / (Path(video).stem + "_still.jpg")
    if not out.exists():
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1.2", "-i", str(SITE / "assets/works" / video),
                        "-frames:v", "1", "-q:v", "2", str(out)], check=True)
    return out


def work_face(ctx, w, cls=""):
    """HTML for the front of a work: an image, a still from a film, or two lines of verse."""
    if w["kind"] == "text":
        lines = w["src"].replace("\n", "<br>")
        return f'<p class="poem {cls}">{lines}</p>', 0.8
    if w["kind"] == "still":
        p = still_of(w["src"])
        dest = ctx.asset(p, f"assets/works/{p.name}")
        ww, hh = size_of(p)
        return f'<div class="still"><img src="{dest}" alt=""><span class="play">▶</span></div>', ww / hh
    p = SITE / "assets/works" / w["src"]
    dest = ctx.asset(p, f"assets/works/{w['src']}")
    ww, hh = size_of(p)
    return f'<img src="{dest}" alt="">', ww / hh


def who_label(w):
    return ("AI", "is-ai") if w["who"] == "ai" else ("Human", "is-human")


BASE_CSS = f"""
    @font-face {{ font-family: "Instrument Serif"; src: url("assets/fonts/instrument-serif-latin.woff2") format("woff2"); }}
    @font-face {{ font-family: "Geist"; src: url("assets/fonts/geist-latin.woff2") format("woff2"); font-weight: 100 900; }}
    #root {{ position: absolute; inset: 0; overflow: hidden; font-family: "Geist", sans-serif; color: {INK}; }}
    .serif {{ font-family: "Instrument Serif", serif; font-weight: 400; }}
    .grad {{ background: {GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; }}
    .is-ai {{ color: {BLUE}; }} .is-human {{ color: {VIOLET}; }}
    .poem {{ font-family: "Instrument Serif", serif; background: #fff; border-radius: 8px; line-height: 1.28; }}
    .still {{ position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }}
    .still img {{ width: 100%; height: 100%; object-fit: contain; }}
    .still .play {{ position: absolute; width: 22%; aspect-ratio: 1; border-radius: 50%; background: rgba(255,255,255,0.92);
                   display: flex; align-items: center; justify-content: center; font-size: 200%; color: {INK}; padding-left: 1%; }}
"""


def scene(sid, ctx, css, body, js, dur):
    html = f"""<template>
  <style>{BASE_CSS}{css}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="{ctx.W}" data-height="{ctx.H}">
{body}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{js}
    window.__timelines["{sid}"] = tl;
  </script>
</template>
"""
    return html, dur


def box(ctx, v, l):
    """Pick the vertical or the landscape value."""
    return v if ctx.v else l


# ---------------------------------------------------------------- scenes
def s_rounds(ctx, sid, items, q='Human or <span class="grad">AI?</span>'):
    """Guessing game: each work for a beat, a bar fills, the card turns over to its maker."""
    R = 3.6
    dur = R * len(items)
    if ctx.v:
        qcss = f"#{sid}-q {{ top: 300px; left: 110px; right: 110px; text-align: center; font-size: 132px; }} #{sid}-n {{ top: 452px; left: 300px; right: 300px; text-align: center; }}"
        area = (110, 560, 860, 760)  # x, y, max w, max h
        bar = (110, 1350, 860)
    else:
        qcss = f"#{sid}-q {{ top: 360px; left: 140px; width: 760px; font-size: 150px; line-height: 0.95; }} #{sid}-n {{ top: 690px; left: 140px; width: 400px; }}"
        area = (1000, 150, 780, 740)
        bar = (1000, 935, 780)
    cards, js = [], []
    for n, key in enumerate(items):
        w = WORKS[key]
        face, ar = work_face(ctx, w)
        ax, ay, mw, mh = area
        if w["kind"] == "text":
            cw, ch = mw, min(mh, int(mw * 0.62))
        else:
            cw = min(mw, int(mh * ar) + 52); ch = min(mh, int((cw - 52) / ar) + 52)
            cw = int((ch - 52) * ar) + 52 if ch == mh else cw
        cx = ax + (mw - cw) // 2; cy = ay + (mh - ch) // 2
        lab, cls = who_label(w)
        how = f'<div class="rhow">{w["how"]}</div>' if w["how"] else ""
        t0 = n * R
        cards.append(f'''    <div id="{sid}-c{n}" class="rcard clip" data-layout-allow-overlap data-start="{t0}" data-duration="{R}" style="left:{cx}px;top:{cy}px;width:{cw}px;height:{ch}px">
      <div class="rin" id="{sid}-c{n}-in"><div class="rf">{face}</div><div class="rf rb"><div class="rwho {cls}">{lab}</div>{how}</div></div>
    </div>''')
        card = f"#{sid}-c{n}"
        if n:
            js.append(f'    tl.fromTo("{card}", {{ x: {box(ctx, 900, 1000)}, rotation: 6 }}, {{ x: 0, rotation: 0, duration: 0.45, ease: "power3.out" }}, {t0});')
        else:
            js.append(f'    tl.fromTo("{card}", {{ scale: 0.96 }}, {{ scale: 1, duration: 0.6, ease: "power2.out" }}, 0);')
        js.append(f'    tl.fromTo("#{sid}-fill", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 1.5, ease: "none" }}, {t0 + 0.45});')
        js.append(f'    tl.fromTo("{card}-in", {{ rotationY: 0 }}, {{ rotationY: 180, duration: 0.55, ease: "power2.inOut" }}, {t0 + 2.0});')
        js.append(f'    tl.fromTo("{card} .rwho", {{ scale: 0.6 }}, {{ scale: 1, duration: 0.4, ease: "back.out(1.8)" }}, {t0 + 2.35});')
        if n < len(items) - 1:
            js.append(f'    tl.to("{card}", {{ x: {box(ctx, -900, -1100)}, rotation: -6, duration: 0.4, ease: "power2.in" }}, {t0 + 3.2});')
        js.append(f'    tl.set("#{sid}-k", {{ textContent: "{n + 1}" }}, {t0});')
    css = f"""
    #{sid}-q, #{sid}-n {{ position: absolute; }}
    #{sid}-q {{ font-family: "Instrument Serif", serif; line-height: 1; }}
    {qcss}
    #{sid}-n {{ font-size: 34px; font-weight: 500; color: {SOFT}; letter-spacing: 0.02em; }}
    .rcard {{ position: absolute; perspective: 2400px; }}
    .rin {{ position: absolute; inset: 0; transform-style: preserve-3d; }}
    .rf {{ position: absolute; inset: 0; border-radius: 30px; background: #fdfcf8; border: 1px solid #f0ede4; box-shadow: 0 40px 80px -40px rgba(30,40,70,.45);
           backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 26px; }}
    .rf > img {{ width: 100%; height: 100%; object-fit: contain; border-radius: 4px; }}
    .rf .poem {{ font-size: {box(ctx, 52, 50)}px; padding: 40px 44px; width: 100%; }}
    .rb {{ transform: rotateY(180deg); gap: 20px; }}
    .rwho {{ font-family: "Instrument Serif", serif; font-size: {box(ctx, 220, 200)}px; line-height: .9; }}
    .rhow {{ font-size: {box(ctx, 44, 40)}px; font-weight: 500; color: {SOFT}; text-align: center; padding: 0 20px; }}
    #{sid}-bar {{ position: absolute; left: {bar[0]}px; top: {bar[1]}px; width: {bar[2]}px; height: 10px; border-radius: 99px; background: #ece7f5; overflow: hidden; }}
    #{sid}-fill {{ position: absolute; inset: 0; background: linear-gradient(90deg, #6d3be8, #e79ad0); transform-origin: 0 50%; }}"""
    body = f'''    <h1 id="{sid}-q" class="clip" data-start="0" data-duration="{dur}">{q}</h1>
    <p id="{sid}-n" class="clip" data-start="0" data-duration="{dur}"><span id="{sid}-k">1</span> / {len(items)}</p>
{chr(10).join(cards)}
    <div id="{sid}-bar" class="clip" data-start="0" data-duration="{dur}"><i id="{sid}-fill"></i></div>'''
    sfx = []
    for n in range(len(items)):
        t0 = n * R
        if n: sfx.append((t0, "whoosh-short", 0.7))
        sfx.append((t0 + 2.0, "whoosh" if n % 2 else "whoosh-short", 0.6))
        sfx.append((t0 + 2.37, "pop", 0.9))
    return scene(sid, ctx, css, body, "\n".join(js), dur) + (sfx,)


def s_wall(ctx, sid, target=None, title='Made by hand,<br>or with <span class="grad">AI?</span>', dive=True, dur=5.6):
    """The site's wall of works turns over in a wave; optionally the camera dives into one tile."""
    TW, TH, GAP = 236, 300, 24
    cols = box(ctx, 4, 7); rows = box(ctx, 6, 3)
    x0 = (ctx.W - (cols * TW + (cols - 1) * GAP)) // 2
    y0 = box(ctx, 0, 30)
    keys = WALL[: cols * rows]
    ti = box(ctx, 11, 10)
    tiles = []
    for i in range(cols * rows):
        c, r = i % cols, i // cols
        x, y = x0 + c * (TW + GAP), y0 + r * (TH + GAP) + (40 if c % 2 else 0)
        w = (target or KETTLE) if i == ti else WORKS[keys[i] or "hokusai"]
        face, _ = work_face(ctx, w, "wpoem")
        lab, cls = who_label(w)
        how = f'<i class="whow">{w["how"]}</i>' if w["how"] else ""
        tiles.append(f'      <div class="wt" id="{sid}-t{i}" style="left:{x}px;top:{y}px"><div class="win" id="{sid}-t{i}-in">'
                     f'<div class="wf">{face}</div><div class="wf wb"><b class="wwho {cls}">{lab}</b>{how}</div></div></div>')
    c, r = ti % cols, ti // cols
    cx = x0 + c * (TW + GAP) + TW / 2; cy = y0 + r * (TH + GAP) + (40 if c % 2 else 0) + TH / 2
    s = box(ctx, 3.05, 2.6)
    fx, fy = ctx.W / 2 - s * cx, ctx.H / 2 - s * cy
    zoom_at = dur - 2.6
    panel = box(ctx, "left: 130px; right: 130px; top: 700px;", "left: 560px; right: 560px; top: 330px;")
    css = f"""
    #{sid}-wall {{ position: absolute; left: 0; top: 0; width: {ctx.W}px; height: {ctx.H}px; transform-origin: 0 0; }}
    .wt {{ position: absolute; width: {TW}px; height: {TH}px; perspective: 1200px; }}
    .win {{ position: absolute; inset: 0; transform-style: preserve-3d; }}
    .wf {{ position: absolute; inset: 0; border-radius: 14px; background: #fdfcf8; border: 1px solid #f0ede4; box-shadow: 0 18px 40px -24px rgba(30,40,70,.45);
           backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px; overflow: hidden; }}
    .wf > img {{ width: 100%; height: 100%; object-fit: contain; }}
    .wpoem {{ font-size: 24px; padding: 10px; }}
    .wb {{ transform: rotateY(180deg); gap: 8px; }}
    .wwho {{ font-family: "Instrument Serif", serif; font-weight: 400; font-size: 62px; }}
    .whow {{ font-style: normal; font-size: 19px; color: {SOFT}; text-align: center; }}
    #{sid}-panel {{ position: absolute; {panel} padding: 56px 40px; border-radius: 34px; background: rgba(255,255,255,.92);
                   box-shadow: 0 40px 90px -40px rgba(30,40,70,.5); text-align: center; }}
    #{sid}-panel h1 {{ font-family: "Instrument Serif", serif; font-weight: 400; font-size: {box(ctx, 108, 104)}px; line-height: 1.02; }}"""
    body = f'''    <div id="{sid}-wall" class="clip" data-start="0" data-duration="{dur}" data-layout-allow-overflow data-layout-allow-overlap data-layout-ignore>
{chr(10).join(tiles)}
    </div>
    <div id="{sid}-panel" class="clip" data-start="0" data-duration="{zoom_at + 0.4 if dive else dur}" data-layout-allow-overlap><h1>{title}</h1></div>'''
    js = f"""    for (let i = 0; i < {cols * rows}; i++) {{
      const t = 0.3 + ((i % {cols}) + Math.floor(i / {cols})) * 0.11;
      tl.fromTo(`#{sid}-t${{i}}-in`, {{ rotationY: 0 }}, {{ rotationY: 180, duration: 0.45, ease: "power2.inOut" }}, t);
      tl.to(`#{sid}-t${{i}}-in`, {{ rotationY: 0, duration: 0.45, ease: "power2.inOut" }}, t + 1.15);
    }}"""
    if dive:
        js += f"""
    tl.fromTo("#{sid}-panel", {{ opacity: 1, scale: 1 }}, {{ opacity: 0, scale: 0.92, duration: 0.4, ease: "power2.in" }}, {zoom_at});
    tl.fromTo("#{sid}-wall", {{ x: 0, y: 0, scale: 1 }}, {{ x: {fx:.1f}, y: {fy:.1f}, scale: {s}, duration: 2.2, ease: "power3.inOut" }}, {zoom_at});
    for (let i = 0; i < {cols * rows}; i++) if (i !== {ti}) tl.to(`#{sid}-t${{i}}`, {{ opacity: 0, duration: 0.8, ease: "power1.in" }}, {zoom_at + 0.9});"""
    else:
        js += f"""
    tl.fromTo("#{sid}-panel", {{ opacity: 0, scale: 0.94 }}, {{ opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }}, 0);
    tl.fromTo("#{sid}-wall", {{ scale: 1.04 }}, {{ scale: 1, duration: {dur}, ease: "sine.out" }}, 0);"""
    sfx = [(0.3, "whoosh-short", 0.35), (0.9, "whoosh-short", 0.3)]
    if dive: sfx += [(zoom_at, "whoosh", 0.55)]
    return scene(sid, ctx, css, body, js, dur) + (sfx,)


def s_card(ctx, sid):
    """The printed card every submission becomes (the site's Kettle example, credited Anonymous)."""
    k = 2.4013
    cw, ch = 304 * k, 405.33 * k
    if ctx.v:
        cap = "top: 300px; left: 110px; right: 110px; text-align: center; font-size: 84px;"
        cx, cy = (ctx.W - cw) / 2, 500
    else:
        cap = "top: 380px; left: 140px; width: 720px; font-size: 104px;"
        cx, cy = 1050, (ctx.H - ch * 0.82) / 2
        k = 2.4013 * 0.82; cw, ch = 304 * k, 405.33 * k
    css = f"""
    #{sid}-cap {{ position: absolute; {cap} font-family: "Instrument Serif", serif; line-height: 1.05; }}
    #{sid}-box {{ position: absolute; left: {cx:.0f}px; top: {cy:.0f}px; width: {cw:.0f}px; height: {ch:.0f}px; perspective: 3000px; }}
    #{sid}-in {{ position: absolute; inset: 0; transform-style: preserve-3d; }}
    .kf {{ position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }}
    .kf--back {{ transform: rotateY(180deg); }}
    .ks {{ position: absolute; left: 0; top: 0; width: 304px; height: 405.33px; transform-origin: 0 0; transform: scale({k:.4f}); }}
    .card {{ position: absolute; inset: 0; display: flex; flex-direction: column; gap: .6rem; padding: 1rem; border-radius: 18px; background: #fdfcf8; border: 1px solid #f0ede4; box-shadow: 0 30px 60px -30px rgba(30,40,70,.35); overflow: hidden; font-size: 16px; }}
    .card__medium {{ display: flex; align-items: center; gap: .3rem; font-size: .66rem; color: #736a88; }}
    .card__medium svg {{ width: .8rem; height: .8rem; }}
    .card__excerpt {{ flex: 1; display: flex; flex-direction: column; justify-content: center; gap: .4rem; margin: .15rem .2rem .35rem; padding: .9rem 1rem; background: #fff; font-family: "Instrument Serif", serif; font-size: 1.3rem; line-height: 1.3; }}
    .card__excerpt .more {{ color: #736a88; }}
    .card__bottom {{ display: flex; align-items: flex-end; justify-content: space-between; gap: .6rem; }}
    .card__title {{ margin: 0; font-family: "Instrument Serif", serif; font-size: 1.55rem; font-weight: 400; line-height: 1.08; }}
    .card__artist {{ margin: .15rem 0 0; font-size: .82rem; color: {SOFT}; }}
    .card__materials {{ margin: .1rem 0 0; font-size: .74rem; color: #736a88; }}
    .card__qr img {{ width: 2.9rem; height: 2.9rem; display: block; }}
    .card--back {{ gap: .35rem; padding: .7rem .7rem .6rem; }}
    .blk {{ display: flex; flex-direction: column; gap: .3rem; padding: .45rem .55rem; border-radius: 12px; background: #fff; }}
    .sec {{ margin: 0; font-size: .72rem; font-weight: 600; }}
    .about {{ margin: 0; font-size: .72rem; line-height: 1.38; color: #3d3550; }}
    .proc {{ display: grid; grid-template-columns: fit-content(4.4rem) minmax(0,1fr) minmax(0,1fr); column-gap: .4rem; font-size: .68rem; line-height: 1.2; }}
    .proc > span {{ padding: .1rem 0; border-bottom: 1px solid #ebe5f6; }}
    .proc > span:nth-last-child(-n+3) {{ border-bottom: 0; }}
    .proc .hd {{ display: flex; align-items: center; gap: .3rem; font-size: .7rem; font-weight: 600; border-bottom: 1.5px solid #ddd4ef; }}
    .proc .hd i {{ width: .45rem; height: .45rem; border-radius: 50%; display: inline-block; }}
    .proc .h {{ color: #2e2366; }} .proc .hd.h {{ color: {VIOLET}; }} .proc .hd.h i {{ background: {VIOLET}; }}
    .proc .a {{ color: #1e3a8a; }} .proc .hd.a {{ color: {BLUE}; }} .proc .hd.a i {{ background: {BLUE}; }}
    .proc .st {{ font-size: .6rem; color: #736a88; padding-top: .32rem; }}
    .brand {{ margin-top: auto; }}
    .brand b {{ display: block; font-size: .76rem; font-weight: 600; line-height: 1.2; }}
    .brand small {{ display: block; font-size: .64rem; color: {SOFT}; }}"""
    ctx.asset(SITE / "assets/examples/qr_read.svg", "assets/works/qr_read.svg")
    body = f'''    <h2 id="{sid}-cap" class="clip" data-start="0" data-duration="5.6">Every card shows<br><span class="grad">how it was made.</span></h2>
    <div id="{sid}-box" class="clip" data-start="0" data-duration="5.6" data-layout-allow-overlap><div id="{sid}-in">
      <div class="kf"><div class="ks"><article class="card">
        <span class="card__medium">{svg("Text")}<span>Text</span></span>
        <div class="card__excerpt"><span>The kettle learns my name each morning.<br>It calls twice, and I come home.</span><span class="more">…</span></div>
        <div class="card__bottom"><span><h3 class="card__title">Kettle</h3><p class="card__artist">Anonymous, 2026</p><p class="card__materials">Poem</p></span><span class="card__qr"><img src="assets/works/qr_read.svg" alt=""></span></div>
      </article></div></div>
      <div class="kf kf--back"><div class="ks"><article class="card card--back">
        <div class="blk"><p class="sec">Description</p><p class="about">A short poem about living alone and the small sounds that keep me company.</p></div>
        <div class="blk"><p class="sec">Process</p><div class="proc"><span class="hd"></span><span class="hd h"><i></i>By hand</span><span class="hd a"><i></i>With AI</span>
          <span class="st">First line</span><span class="h">A line said half-asleep</span><span class="a"></span>
          <span class="st">Drafting</span><span class="h">Wrote it on the bus</span><span class="a">ChatGPT endings, unused</span>
          <span class="st">Tighten</span><span class="h">Cut it to two stanzas</span><span class="a">ChatGPT rhythm check</span></div></div>
        <div class="brand"><b>Rethinking <span class="grad">Human Creativity</span> ✦<br>in the Generative AI Era</b><small>CHI 2027 Meet-Up</small></div>
      </article></div></div>
    </div></div>'''
    js = f"""    tl.fromTo("#{sid}-cap", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }}, 0.2);
    tl.fromTo("#{sid}-box", {{ scale: 1.06 }}, {{ scale: 1, duration: 0.6, ease: "power2.out" }}, 0);
    tl.fromTo("#{sid}-in", {{ rotationY: 0 }}, {{ rotationY: 180, duration: 0.7, ease: "power2.inOut" }}, 2.0);"""
    return scene(sid, ctx, css, body, js, 5.6) + ([(0, "whoosh", 0.5), (2.0, "whoosh-short", 0.6), (2.7, "pop", 0.6)],)


def s_share(ctx, sid, note="You don't need to attend CHI to take part."):
    """The invitation: headline, the four media, and that attending is not needed."""
    if ctx.v:
        css = f"""
    #{sid}-h {{ position: absolute; top: 400px; left: 90px; right: 90px; text-align: center; white-space: nowrap; font-size: 118px; }}
    #{sid}-sub {{ position: absolute; top: 580px; left: 150px; right: 150px; text-align: center; font-size: 56px; }}
    #{sid}-chips {{ position: absolute; top: 740px; left: 150px; right: 150px; }}
    #{sid}-note {{ position: absolute; top: 1080px; left: 100px; right: 100px; text-align: center; font-size: 44px; }}"""
    else:
        css = f"""
    #{sid}-h {{ position: absolute; top: 330px; left: 140px; width: 860px; font-size: 128px; white-space: nowrap; }}
    #{sid}-sub {{ position: absolute; top: 520px; left: 140px; width: 800px; font-size: 58px; }}
    #{sid}-chips {{ position: absolute; top: 330px; left: 1040px; width: 740px; }}
    #{sid}-note {{ position: absolute; top: 640px; left: 140px; width: 800px; font-size: 42px; }}"""
    css += f"""
    #{sid}-h {{ font-family: "Instrument Serif", serif; line-height: 1; }}
    #{sid}-sub {{ font-weight: 600; letter-spacing: -0.02em; }}
    #{sid}-chips {{ display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }}
    .chip {{ display: flex; align-items: center; gap: 22px; padding: 28px 30px; border-radius: 28px; background: #fff; box-shadow: 0 20px 50px -30px rgba(30,40,70,.45); font-size: 48px; font-weight: 600; }}
    .chip svg {{ width: 58px; height: 58px; color: {VIOLET}; flex: none; }}
    #{sid}-note {{ font-weight: 500; color: {SOFT}; line-height: 1.3; }}"""
    chips = "".join(f'<div class="chip" id="{sid}-{m.lower()}">{svg(m)}{m}</div>' for m in ICON)
    body = f'''    <h2 id="{sid}-h" class="clip" data-start="0" data-duration="5.8">Now share <span class="grad">yours.</span></h2>
    <p id="{sid}-sub" class="clip" data-start="0" data-duration="5.8">Made by hand or with AI.</p>
    <div id="{sid}-chips" class="clip" data-start="0" data-duration="5.8">{chips}</div>
    <p id="{sid}-note" class="clip" data-start="0" data-duration="5.8">{note}</p>'''
    js = f"""    tl.fromTo("#{sid}-h", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }}, 0.1);
    tl.fromTo("#{sid}-sub", {{ opacity: 0, y: 24 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, 0.7);
    ["text", "image", "video", "sound"].forEach((m, i) => tl.fromTo(`#{sid}-${{m}}`, {{ opacity: 0, scale: 0.7 }}, {{ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, 1.7 + i * 0.18));
    tl.fromTo("#{sid}-note", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, 2.4);"""
    sfx = [(0, "whoosh", 0.55)] + [(1.72 + i * 0.18, "pop" if i % 2 == 0 else "click-soft", 0.7) for i in range(4)]
    return scene(sid, ctx, css, body, js, 5.8) + (sfx,)


def s_end(ctx, sid, dur=3.6):
    """End card: the meet-up, where and when, where to submit."""
    if ctx.v:
        css = f"""
    #{sid}-t {{ position: absolute; top: 420px; left: 80px; right: 80px; text-align: center; font-size: 80px; }}
    #{sid}-m {{ position: absolute; top: 790px; left: 200px; right: 200px; text-align: center; }}
    #{sid}-u {{ position: absolute; top: 980px; left: 540px; }}
    #{sid}-b {{ position: absolute; top: 1110px; left: 300px; right: 300px; text-align: center; font-size: 36px; }}"""
        bio = "Link in bio"
    else:
        css = f"""
    #{sid}-t {{ position: absolute; top: 230px; left: 200px; right: 200px; text-align: center; font-size: 92px; }}
    #{sid}-m {{ position: absolute; top: 590px; left: 500px; right: 500px; text-align: center; }}
    #{sid}-u {{ position: absolute; top: 770px; left: 960px; }}
    #{sid}-b {{ position: absolute; top: 700px; left: 600px; right: 600px; text-align: center; font-size: 34px; }}"""
        bio = "Submit your work"
    css += f"""
    #{sid}-t {{ font-weight: 600; line-height: 1.08; letter-spacing: -0.035em; }}
    #{sid}-t .spark {{ color: #b06ec6; font-size: .7em; vertical-align: top; }}
    #{sid}-m {{ font-size: 46px; font-weight: 500; color: {SOFT}; line-height: 1.45; }}
    #{sid}-u {{ padding: 24px 40px; border-radius: 999px; background: linear-gradient(140deg, #6d3be8, #b56ad8); color: #fff; font-size: 40px; font-weight: 600; white-space: nowrap; }}
    #{sid}-b {{ font-weight: 500; color: {SOFT}; }}"""
    body = f'''    <h2 id="{sid}-t" class="clip" data-start="0" data-duration="{dur}">Rethinking<br><span class="grad">Human Creativity</span><span class="spark">&#10022;</span><br>in the Generative AI Era</h2>
    <p id="{sid}-m" class="clip" data-start="0" data-duration="{dur}">CHI 2027 Meet-Up<br>Pittsburgh · May 10–14</p>
    <p id="{sid}-u" class="clip" data-start="0" data-duration="{dur}">rethinking-creativity.github.io</p>
    <p id="{sid}-b" class="clip" data-start="0" data-duration="{dur}">{bio}</p>'''
    if not ctx.v:  # landscape: "Submit your work" sits above the URL
        body = body.replace(f'<p id="{sid}-m" class="clip" data-start="0" data-duration="{dur}">CHI 2027 Meet-Up<br>Pittsburgh · May 10–14</p>',
                            f'<p id="{sid}-m" class="clip" data-start="0" data-duration="{dur}">CHI 2027 Meet-Up · Pittsburgh · May 10–14</p>')
    js = f"""    gsap.set("#{sid}-u", {{ xPercent: -50 }});
    tl.fromTo("#{sid}-t", {{ opacity: 0, scale: 0.94 }}, {{ opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }}, 0.05);
    tl.fromTo("#{sid}-m", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, 0.55);
    tl.fromTo("#{sid}-u", {{ opacity: 0, scale: 0.8 }}, {{ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }}, 1.0);
    tl.fromTo("#{sid}-b", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4, ease: "power1.out" }}, 1.4);"""
    return scene(sid, ctx, css, body, js, dur) + ([(0, "whoosh", 0.55), (0.05, "sparkle", 0.7)],)


def s_type(ctx, sid, beats):
    """Kinetic type on a dark ground: one line per beat, cut on the beat, flashes of real works between."""
    t, items, js, sfx = 0.0, [], [], []
    fields = ["#130e22", "#2a1a52", "#130e22", "#3b1d6e", "#130e22", "#1d2a6b"]
    for i, b in enumerate(beats):
        d = b.get("d", 1.0)
        if "flash" in b:
            w = WORKS[b["flash"]]
            face, _ = work_face(ctx, w)
            items.append(f'    <div id="{sid}-b{i}" class="flash clip" data-start="{t:.2f}" data-duration="{d}">{face}</div>')
            js.append(f'    tl.fromTo("#{sid}-b{i}", {{ scale: 1.08 }}, {{ scale: 1, duration: {d}, ease: "power1.out" }}, {t:.2f});')
            sfx.append((t, "click-soft", 0.5))
        else:
            size = b.get("size", box(ctx, 150, 170))
            items.append(f'    <div id="{sid}-b{i}" class="beat clip" data-start="{t:.2f}" data-duration="{d}" style="background:{fields[i % len(fields)]}">'
                         f'<p style="font-size:{size}px" class="{b.get("cls", "")}">{b["text"]}</p></div>')
            js.append(f'    tl.fromTo("#{sid}-b{i} p", {{ scale: 1.12, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.32, ease: "back.out(1.5)" }}, {t:.2f});')
            sfx.append((t, "whoosh-short" if i % 2 else "pop", 0.55))
        t += d
    css = f"""
    .beat {{ position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0 {box(ctx, 110, 220)}px; }}
    .beat p {{ color: #fff; text-align: center; font-weight: 700; letter-spacing: -0.04em; line-height: 1.02; }}
    .beat p.serif {{ font-family: "Instrument Serif", serif; font-weight: 400; letter-spacing: -0.01em; }}
    .beat p .grad {{ background: linear-gradient(140deg, #b18cff, #ffb3dd); -webkit-background-clip: text; background-clip: text; color: transparent; }}
    .flash {{ position: absolute; inset: 0; background: #130e22; display: flex; align-items: center; justify-content: center; padding: {box(ctx, "320px 80px", "100px 300px")}; }}
    .flash > img {{ width: 100%; height: 100%; object-fit: contain; }}
    .flash .poem {{ font-size: 60px; padding: 50px; }}"""
    return scene(sid, ctx, css, "\n".join(items), "\n".join(js), round(t, 2)) + (sfx,)


def s_questions(ctx, sid):
    """The four guiding questions of the meet-up, one at a time."""
    D = 2.6
    dur = 1.8 + D * 4
    rows = [f'    <p id="{sid}-i" class="clip" data-start="0" data-duration="1.8">Four questions<br>we\'ll <span class="grad">explore</span></p>']
    js = [f'    tl.fromTo("#{sid}-i", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }}, 0.05);']
    sfx = [(0.05, "whoosh", 0.5)]
    for n, (lab, q) in enumerate(QUESTIONS):
        t0 = 1.8 + n * D
        rows.append(f'    <div id="{sid}-q{n}" class="qq clip" data-start="{t0:.2f}" data-duration="{D}"><span class="qn">{n + 1} / 4 · {lab}</span><p class="qt">{q}</p></div>')
        js.append(f'    tl.fromTo("#{sid}-q{n} .qn", {{ opacity: 0, y: 16 }}, {{ opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }}, {t0:.2f});')
        js.append(f'    tl.fromTo("#{sid}-q{n} .qt", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.55, ease: "expo.out" }}, {t0 + 0.12:.2f});')
        sfx.append((t0, "whoosh-short", 0.55))
    css = f"""
    #{sid}-i {{ position: absolute; top: {box(ctx, 700, 360)}px; left: {box(ctx, 110, 260)}px; right: {box(ctx, 110, 260)}px; text-align: center; font-family: "Instrument Serif", serif; font-size: {box(ctx, 120, 150)}px; line-height: 1; }}
    .qq {{ position: absolute; top: {box(ctx, 520, 340)}px; left: {box(ctx, 110, 260)}px; right: {box(ctx, 110, 260)}px; display: flex; flex-direction: column; gap: 34px; }}
    .qn {{ font-size: {box(ctx, 38, 36)}px; font-weight: 600; color: {VIOLET}; letter-spacing: 0.02em; }}
    .qt {{ font-family: "Instrument Serif", serif; font-size: {box(ctx, 96, 100)}px; line-height: 1.04; }}"""
    return scene(sid, ctx, css, "\n".join(rows), "\n".join(js), round(dur, 2)) + (sfx,)


def s_schedule(ctx, sid):
    """The 90-minute meet-up as a bar per activity, minutes to scale."""
    dur = 6.2
    rows = []
    unit = box(ctx, 12, 16)  # px per minute
    for i, (name, m) in enumerate(SCHEDULE):
        rows.append(f'<div class="srow" id="{sid}-r{i}"><span class="sname">{name}</span><span class="sbar"><i style="width:{m * unit:.0f}px"></i><b>{m} min</b></span></div>')
    css = f"""
    #{sid}-h {{ position: absolute; top: {box(ctx, 330, 190)}px; left: {box(ctx, 110, 200)}px; right: {box(ctx, 110, 200)}px; font-family: "Instrument Serif", serif; font-size: {box(ctx, 120, 130)}px; line-height: 1; text-align: {box(ctx, "center", "left")}; }}
    #{sid}-list {{ position: absolute; top: {box(ctx, 700, 410)}px; left: {box(ctx, 110, 200)}px; right: {box(ctx, 110, 200)}px; display: flex; flex-direction: column; gap: {box(ctx, 36, 44)}px; }}
    .srow {{ display: flex; flex-direction: {box(ctx, "column", "row")}; gap: {box(ctx, 12, 30)}px; align-items: {box(ctx, "flex-start", "center")}; }}
    .sname {{ font-size: {box(ctx, 46, 50)}px; font-weight: 600; width: {box(ctx, "auto", "520px")}; }}
    .sbar {{ display: flex; align-items: center; gap: 18px; }}
    .sbar i {{ display: block; height: 30px; border-radius: 99px; background: {GRAD}; transform-origin: 0 50%; }}
    .sbar b {{ font-size: 34px; font-weight: 500; color: {SOFT}; white-space: nowrap; }}"""
    body = f'''    <h2 id="{sid}-h" class="clip" data-start="0" data-duration="{dur}">A <span class="grad">90-minute</span>{box(ctx, "<br>", " ")}meet-up</h2>
    <div id="{sid}-list" class="clip" data-start="0" data-duration="{dur}">{"".join(rows)}</div>'''
    js = [f'    tl.fromTo("#{sid}-h", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }}, 0.05);']
    sfx = [(0.05, "whoosh", 0.5)]
    for i in range(len(SCHEDULE)):
        t = 0.7 + i * 0.45
        js.append(f'    tl.fromTo("#{sid}-r{i}", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }}, {t:.2f});')
        js.append(f'    tl.fromTo("#{sid}-r{i} .sbar i", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.6, ease: "power3.out" }}, {t + 0.1:.2f});')
        sfx.append((t, "pop" if i % 2 == 0 else "click-soft", 0.55))
    return scene(sid, ctx, css, body, "\n".join(js), dur) + (sfx,)


def s_people(ctx, sid):
    """The nine organizers: photo, name, affiliation."""
    dur = 6.0
    cols = box(ctx, 3, 5)
    cells = []
    for i, (n, a, f) in enumerate(PEOPLE):
        src = ctx.asset(SITE / "assets/people" / f, f"assets/people/{f}")
        cells.append(f'<div class="pp" id="{sid}-p{i}"><img src="{src}" alt=""><b>{n}</b><span>{a}</span></div>')
    css = f"""
    #{sid}-h {{ position: absolute; top: {box(ctx, 260, 90)}px; left: 100px; right: 100px; text-align: center; font-family: "Instrument Serif", serif; font-size: {box(ctx, 110, 110)}px; line-height: 1; }}
    #{sid}-g {{ position: absolute; top: {box(ctx, 450, 260)}px; left: {box(ctx, 60, 160)}px; right: {box(ctx, 60, 160)}px; display: grid; grid-template-columns: repeat({cols}, 1fr); gap: {box(ctx, "44px 24px", "34px 30px")}; }}
    .pp {{ display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; }}
    .pp img {{ width: {box(ctx, 220, 200)}px; height: {box(ctx, 220, 200)}px; border-radius: 50%; object-fit: cover; box-shadow: 0 20px 40px -24px rgba(30,40,70,.5); }}
    .pp b {{ font-size: {box(ctx, 30, 28)}px; font-weight: 600; line-height: 1.15; margin-top: 6px; }}
    .pp span {{ font-size: {box(ctx, 22, 20)}px; color: {SOFT}; line-height: 1.2; }}"""
    if not ctx.v:  # 5 + 4: center the last row
        css += f"\n    #{sid}-g {{ grid-template-columns: repeat(10, 1fr); }} .pp {{ grid-column: span 2; }} .pp:nth-child(6) {{ grid-column: 2 / span 2; }}"
    body = f'''    <h2 id="{sid}-h" class="clip" data-start="0" data-duration="{dur}">Organized by</h2>
    <div id="{sid}-g" class="clip" data-start="0" data-duration="{dur}">{"".join(cells)}</div>'''
    js = [f'    tl.fromTo("#{sid}-h", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }}, 0.05);']
    for i in range(len(PEOPLE)):
        js.append(f'    tl.fromTo("#{sid}-p{i}", {{ opacity: 0, scale: 0.85 }}, {{ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }}, {0.5 + i * 0.16:.2f});')
    sfx = [(0.05, "whoosh", 0.5)] + [(0.5 + i * 0.16, "pop" if i % 2 == 0 else "click-soft", 0.4) for i in range(0, 9, 2)]
    return scene(sid, ctx, css, body, "\n".join(js), dur) + (sfx,)


def s_about(ctx, sid):
    """What the meet-up is, in the site's own words (About page)."""
    dur = 6.4
    css = f"""
    .ab {{ position: absolute; left: {box(ctx, 110, 240)}px; right: {box(ctx, 110, 240)}px; text-align: {box(ctx, "center", "left")}; }}
    #{sid}-a {{ top: {box(ctx, 380, 300)}px; font-size: {box(ctx, 40, 40)}px; font-weight: 600; color: {VIOLET}; letter-spacing: 0.02em; }}
    #{sid}-b {{ top: {box(ctx, 450, 360)}px; font-family: "Instrument Serif", serif; font-size: {box(ctx, 84, 86)}px; line-height: 1.06; }}
    #{sid}-c {{ top: {box(ctx, 900, 680)}px; font-size: {box(ctx, 44, 42)}px; color: {SOFT}; line-height: 1.35; font-weight: 500; }}"""
    body = f'''    <p id="{sid}-a" class="ab clip" data-start="0" data-duration="{dur}">A CHI 2027 meet-up</p>
    <p id="{sid}-b" class="ab clip" data-start="0" data-duration="{dur}">Researchers who build <span class="grad">creativity tools</span>, and the creators who use them.</p>
    <p id="{sid}-c" class="ab clip" data-start="0" data-duration="{dur}">CHI is the leading international conference on human-computer interaction. Pittsburgh, May 10–14.</p>'''
    js = f"""    tl.fromTo("#{sid}-a", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }}, 0.05);
    tl.fromTo("#{sid}-b", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }}, 0.4);
    tl.fromTo("#{sid}-c", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }}, 1.6);"""
    return scene(sid, ctx, css, body, js, dur) + ([(0.05, "whoosh", 0.5), (1.6, "click-soft", 0.5)],)


def s_tour(ctx, sid, picks):
    """Any medium: one real work per medium, each labelled, landing as a grid."""
    dur = 6.6
    cells = []
    for i, (m, key) in enumerate(picks):
        face, _ = work_face(ctx, WORKS[key], "tpoem")
        cells.append(f'<div class="tc" id="{sid}-c{i}" data-layout-allow-overlap><div class="tf">{face}</div><span class="tl">{svg(m)}{m}</span></div>')
    css = f"""
    #{sid}-h {{ position: absolute; top: {box(ctx, 290, 110)}px; left: 100px; right: 100px; text-align: center; font-family: "Instrument Serif", serif; font-size: {box(ctx, 120, 120)}px; line-height: 1; }}
    #{sid}-g {{ position: absolute; top: {box(ctx, 470, 290)}px; left: {box(ctx, 90, 150)}px; right: {box(ctx, 90, 150)}px; display: grid; grid-template-columns: repeat({box(ctx, 2, 4)}, 1fr); gap: 30px; }}
    .tc {{ display: flex; flex-direction: column; gap: 16px; }}
    .tf {{ height: {box(ctx, 320, 470)}px; border-radius: 22px; background: #fdfcf8; border: 1px solid #f0ede4; box-shadow: 0 24px 50px -30px rgba(30,40,70,.5); padding: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; }}
    .tf > img {{ width: 100%; height: 100%; object-fit: contain; }}
    .tpoem {{ font-size: 30px; padding: 18px; }}
    .tl {{ display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 40px; font-weight: 600; }}
    .tl svg {{ width: 42px; height: 42px; color: {VIOLET}; }}
    #{sid}-s {{ position: absolute; top: {box(ctx, 1330, 900)}px; left: 100px; right: 100px; text-align: center; font-size: 46px; font-weight: 600; }}"""
    body = f'''    <h2 id="{sid}-h" class="clip" data-start="0" data-duration="{dur}">Any <span class="grad">medium.</span></h2>
    <div id="{sid}-g" class="clip" data-start="0" data-duration="{dur}">{"".join(cells)}</div>
    <p id="{sid}-s" class="clip" data-start="0" data-duration="{dur}">Made by hand or with AI.</p>'''
    js = [f'    tl.fromTo("#{sid}-h", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }}, 0.05);']
    sfx = [(0.05, "whoosh", 0.5)]
    for i in range(len(picks)):
        t = 0.6 + i * 0.55
        js.append(f'    tl.fromTo("#{sid}-c{i}", {{ opacity: 0, y: 60, rotation: {(-4, 3, -2, 4)[i]} }}, {{ opacity: 1, y: 0, rotation: 0, duration: 0.5, ease: "back.out(1.4)" }}, {t:.2f});')
        sfx.append((t, "whoosh-short" if i % 2 else "pop", 0.55))
    js.append(f'    tl.fromTo("#{sid}-s", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, 3.2);')
    return scene(sid, ctx, css, body, "\n".join(js), dur) + (sfx,)


SCENES = dict(rounds=s_rounds, wall=s_wall, card=s_card, share=s_share, end=s_end, type=s_type,
              questions=s_questions, schedule=s_schedule, people=s_people, about=s_about, tour=s_tour)

# ---------------------------------------------------------------- music
MUSIC = {
    "joplin": ("joplin.mp3", "Scott Joplin, Maple Leaf Rag (1916 piano roll, public domain)"),
    "bach": ("bach.mp3", "Bach, Prelude in C major BWV 846, played by Kimiko Ishizaka (CC0)"),
    "satie": ("satie.mp3", "Satie, Gymnopédie No. 1 (public domain, via Wikimedia Commons)"),
    "chopin": ("chopin.mp3", "Chopin, Nocturne Op. 9 No. 2 (public domain, via Wikimedia Commons)"),
    "beat": (None, "Original beat synthesized for this video (no copyright)"),
}


def music_file(ctx, key, total, bpm):
    name, credit = MUSIC[key]
    if name:
        return ctx.asset(SITE / "assets/works" / name, f"assets/music/{name}"), credit, 25.0
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / f"beat_{bpm}_{total:.1f}.wav"
    if not out.exists():
        subprocess.run([sys.executable, str(SYNTH), f"{total + 0.5:.1f}", "--out", str(out), "--bpm", str(bpm)], check=True, capture_output=True)
    return ctx.asset(out, f"assets/music/beat.wav"), credit, total + 0.5


# ---------------------------------------------------------------- versions
TYPE_BEATS = [
    dict(text="Made by hand.", d=1.0), dict(text='Made with <span class="grad">AI.</span>', d=1.0),
    dict(flash="hokusai", d=0.4), dict(flash="ai_wave", d=0.4), dict(flash="vermeer", d=0.4), dict(flash="ai_portrait", d=0.4),
    dict(text="Can you tell?", d=1.2, cls="serif"),
    dict(flash="patience", d=0.5), dict(flash="hope", d=0.5),
    dict(text="Does it matter?", d=1.3, cls="serif"),
    dict(text='Share your <span class="grad">work.</span>', d=1.2), dict(text="Text. Image. Video. Sound.", d=1.4, size=110),
    dict(text="No need to attend CHI.", d=1.3, size=110),
]
VERSIONS = [
    ("01", "spot-the-ai", "Human or AI? Three real works from the wall, guessed and turned over.", "joplin",
     [("rounds", dict(items=["ai_wave", "hokusai", "ai_portrait"])), ("share", {}), ("end", {})]),
    ("02", "into-the-wall", "The wall flips; the camera dives into a poem that becomes a printed card, which turns over to show how it was made.", "bach",
     [("wall", {}), ("card", {}), ("share", {}), ("end", {})]),
    ("03", "kinetic-type", "Kinetic type on a dark ground, cut on the beat, with flashes of real works.", "beat",
     [("type", dict(beats=TYPE_BEATS)), ("end", {})]),
    ("04", "wall-to-game", "The wall flips; the camera dives into an AI woodblock print that opens the guessing game.", "joplin",
     [("wall", dict(target=WORKS["ai_wave"])), ("rounds", dict(items=["ai_wave", "hokusai", "ai_portrait"])), ("share", {}), ("end", dict(dur=3.2))]),
    ("05", "every-medium-game", "The guessing game across media: a poem, a film, a poem written by AI.", "satie",
     [("rounds", dict(items=["hope", "tram", "patience"])), ("share", {}), ("end", {})]),
    ("06", "four-questions", "The four questions the meet-up will explore.", "chopin",
     [("questions", {}), ("share", {}), ("end", {})]),
    ("07", "who-and-what", "What the meet-up is, and who organizes it.", "bach",
     [("about", {}), ("people", {}), ("share", {}), ("end", {})]),
    ("08", "ninety-minutes", "The 90-minute meet-up, then a taste of its first game.", "joplin",
     [("schedule", {}), ("rounds", dict(items=["vermeer", "ai_night"])), ("share", {}), ("end", dict(dur=3.0))]),
    ("09", "any-medium", "Any medium: one real work each for text, image, video and sound.", "beat",
     [("tour", dict(picks=[("Text", "whitman"), ("Image", "jeongseon"), ("Video", "train"), ("Sound", "satie_wave")])), ("rounds", dict(items=["ai_jinkyeong"])), ("share", {}), ("end", {})]),
    ("10", "teaser-loop", "A short teaser: the wall turns over, then where to submit.", "satie",
     [("wall", dict(dive=False, dur=5.0)), ("end", {})]),
]
BPM = {"03": 120, "09": 108}


def build(num, slug, desc, music, plan, W, H, folder):
    root = OUT / folder / f"{num}-{slug}"
    if root.exists():
        for p in ("index.html", "compositions"):
            q = root / p
            shutil.rmtree(q) if q.is_dir() else q.unlink() if q.exists() else None
    (root / "compositions").mkdir(parents=True, exist_ok=True)
    ctx = Ctx(W, H, root)
    t, hosts, sfx = 0.0, [], []
    used = {}
    for kind, opts in plan:
        used[kind] = used.get(kind, 0) + 1
        sid = kind if used[kind] == 1 else f"{kind}{used[kind]}"
        html, dur, ssfx = SCENES[kind](ctx, sid, **opts)
        (root / "compositions" / f"{sid}.html").write_text(html)
        hosts.append(f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{t:.2f}" data-duration="{dur}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}"></div>')
        sfx += [(t + a, f, v) for a, f, v in ssfx]
        t += dur
    total = round(t, 2)
    mfile, credit, mlen = music_file(ctx, music, total, BPM.get(num, 110))
    sfx.sort()
    for _, f, _ in sfx:
        ctx.asset(SFX_SRC / f"{f}.mp3", f"assets/sfx/{f}.mp3")
    ctx.asset(SFX_SRC / "CREDITS.md", "assets/sfx/CREDITS.md")
    for f in ("geist-latin.woff2", "instrument-serif-latin.woff2"):
        ctx.asset(SITE / "assets/fonts" / f, f"assets/fonts/{f}")
    auds = "\n".join(f'      <audio id="sfx-{i}" src="assets/sfx/{f}.mp3" data-start="{a:.2f}" data-volume="{v}"></audio>' for i, (a, f, v) in enumerate(sfx))
    index = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <!-- {num} {slug} ({W}x{H}): {desc}
         Music: {credit}. Sound effects: Pixabay Content License (assets/sfx/CREDITS.md).
         Generated by promotion/videos/_tools/build.py; editable by hand. -->
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: #fdfcf8; }}
      #bg {{ position: absolute; inset: 0;
        background: radial-gradient(900px 900px at 0% 0%, #ffd9e8, transparent 70%),
                    radial-gradient(900px 900px at 100% 30%, #e7defe, transparent 70%),
                    radial-gradient(900px 900px at 30% 100%, #d6ebff, transparent 70%), #fdfcf8; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="{W}" data-height="{H}">
      <div id="bg"></div>
{chr(10).join(hosts)}
      <audio id="music" src="{mfile}" data-start="0" data-duration="{min(total, mlen):.2f}" data-volume="0.55" data-fade-in="0.3" data-fade-out="1.4"></audio>
{auds}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
    (root / "index.html").write_text(index)
    for src, dest in ctx.assets:
        d = root / dest
        d.parent.mkdir(parents=True, exist_ok=True)
        if not d.exists() or d.stat().st_size != Path(src).stat().st_size:
            shutil.copy2(src, d)
    tpl = OUT / "_tools" / "project"
    for f in ("package.json", "hyperframes.json"):
        shutil.copy2(tpl / f, root / f)
    (root / "meta.json").write_text(json.dumps({"id": f"{folder}-{num}-{slug}", "name": f"{num} {slug} ({folder})"}, indent=2) + "\n")
    return total


if __name__ == "__main__":
    only = set(sys.argv[1:])
    for num, slug, desc, music, plan in VERSIONS:
        if only and num not in only:
            continue
        for folder, (W, H) in (("vertical", (1080, 1920)), ("landscape", (1920, 1080))):
            print(folder, num, slug, build(num, slug, desc, music, plan, W, H, folder))
