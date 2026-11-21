"""Builds the meet-up story film: topic -> four questions -> what CHI is -> what a meet-up is ->
who comes -> share your work -> outro with the organizers. One script (STORY), several looks
(STYLES), each in two shapes: vertical (Reels, 1080x1920) and landscape (web, 1920x1080).
No voice: kinetic type and sound effects, with a quiet music bed.

    python3 promotion/videos/_tools/story.py           # every look
    python3 promotion/videos/_tools/story.py 01 03     # only these

Projects land in promotion/videos/story/{vertical,landscape}/NN-look/ (HyperFrames: index.html +
compositions/). A re-run overwrites the generated files. Copy follows the site (Home, About).
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build import (SITE, OUT as VOUT, SFX_SRC, SYNTH, CACHE, WORKS, WALL, PEOPLE, QUESTIONS, ICON,  # noqa: E402
                   svg, Ctx, work_face, who_label, box)

OUT = VOUT / "story"
MUSIC_DIR = VOUT / "_tools" / "music"
INK, SOFT, VIOLET, BLUE = "#2a2140", "#655c7a", "#6d3be8", "#2563eb"
GRAD = "linear-gradient(140deg, #6d3be8, #e79ad0)"
GRAD_LIGHT = "linear-gradient(140deg, #b18cff, #ffb3dd)"


# ---------------------------------------------------------------- the script (one for every look)
def _q(n):
    lab, q = QUESTIONS[n]
    return dict(id=f"q{n + 1}", q=True, items=[("kicker", f"{n + 1} / 4 · {lab}"), ("head", q)])


STORY = [
    dict(id="topic", wall=True, items=[("head", "Generative AI is changing how we create.")]),
    dict(id="why", items=[("head", "But what does it mean to support *human* creativity?")]),
    dict(id="four", items=[("head", "We’re rethinking *four* questions.")]),
    _q(0), _q(1), _q(2), _q(3),
    dict(id="where", items=[("head", "Let’s rethink them together"), ("head", "at a *CHI 2027 Meet-Up.*")]),
    dict(id="chi", items=[("kicker", "What is CHI?"),
                          ("head", "The leading international conference on human-computer interaction."),
                          ("meta", "May 10–14, 2027 · Pittsburgh")]),
    dict(id="meetup", items=[("kicker", "What is a meet-up?"),
                             ("head", "An informal, 90-minute session for facilitated discussion."),
                             ("meta", "Open to anyone registered for CHI. No sign-up needed.")]),
    dict(id="who", items=[("kicker", "Our meet-up"),
                          ("head", "Researchers who build *creativity tools,* and the creators who use them.")]),
    dict(id="share", items=[("head", "Share your work, made by hand or with *AI.*"), ("chips", None),
                            ("meta", "You can share your artwork even if you won’t be at CHI.")]),
    dict(id="game", items=[("tiles", ["hokusai", "ai_wave", "hope", "patience"]),
                           ("body", "At the meet-up, attendees guess which works used AI, then read your note on how each was made.")]),
    dict(id="outro", outro=True, items=[("title", "Rethinking *Human Creativity* ✦ in the Generative AI Era"),
                                        ("meta", "CHI 2027 Meet-Up · Pittsburgh · May 10–14"),
                                        ("people", None), ("url", "rethinking-creativity.github.io"), ("cta", None)]),
]
TEXT_ROLES = ("kicker", "head", "body", "meta", "title")


def split_words(text, chars):
    """Each word in a masked span (.w > .wi); `*a b*` marks accent words; chars=True also wraps letters (.c)."""
    out, acc = [], False
    for tok in text.split(" "):
        a = acc
        if tok.startswith("*"):
            a = acc = True
        if tok.endswith("*"):
            acc = False
        clean = tok.replace("*", "")
        inner = "".join(f'<span class="c">{ch}</span>' for ch in clean) if chars else clean
        out.append(f'<span class="w{" acc" if a else ""}"><span class="wi">{inner}</span></span>')
    return " ".join(out)


def first_accent(text):
    for i, tok in enumerate(text.split(" ")):
        if tok.startswith("*"):
            return i
    return None


# ---------------------------------------------------------------- looks
class Look:
    """Defaults; each look overrides what it changes."""
    num = slug = desc = music = ""
    chars = False          # reveal letter by letter (typewriter) instead of word by word
    stagger = 0.05         # seconds between words (or letters)
    spw = 0.29             # reading time per word, seconds
    dark = False
    exit_d = 0.35
    align_l = "left"       # text alignment in landscape (vertical is always centred)
    global_wall = False

    def css(self, ctx):
        return ""

    def text_in(self, sel, t, role):
        return f'    tl.fromTo("{sel}", {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.6, ease: "expo.out", stagger: {self.stagger} }}, {t:.2f});'

    def enter(self, sid, i):
        return ""

    def exit(self, sid, dur):
        return f'    tl.to("#{sid}-stage", {{ opacity: 0, y: -40, duration: {self.exit_d}, ease: "power2.in" }}, {dur - self.exit_d:.2f});'

    def text_sfx(self, t, role, count, acc_at):
        s = [(t, "whoosh-short", 0.3)] if role in ("head", "title") else []
        if acc_at is not None:
            s.append((acc_at, "pop", 0.55))
        return s

    def scene_bg(self, sid, i):
        return ""

    def wrap(self, sid, i, inner, n):
        return inner


class Editorial(Look):
    num, slug, music = "01", "editorial", "bach"
    desc = "Light, like the site: serif lines rise out of a mask, word by word. Bach."

    def css(self, ctx):
        return f"""
    .w {{ display: inline-block; overflow: hidden; vertical-align: top; padding: 0 0 .1em; margin-bottom: -.1em; }}
    .wi {{ display: inline-block; }}
    .r-head, .r-title, .r-body {{ font-family: "Instrument Serif", serif; color: {INK}; line-height: 1.04; }}
    .r-head {{ font-size: {box(ctx, 104, 118)}px; }} .q .r-head {{ font-size: {box(ctx, 88, 96)}px; }}
    .r-body {{ font-size: {box(ctx, 62, 64)}px; line-height: 1.12; }}
    .r-title {{ font-size: {box(ctx, 96, 100)}px; }}
    .acc .wi {{ background: {GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; }}
    .r-kicker {{ font-size: {box(ctx, 38, 40)}px; font-weight: 600; color: {VIOLET}; letter-spacing: .02em; }}
    .r-meta {{ font-size: {box(ctx, 42, 44)}px; font-weight: 500; color: {SOFT}; line-height: 1.3; }}"""


class Kinetic(Look):
    num, slug, music = "02", "kinetic", "beat"
    desc = "Dark and fast: heavy sans words punch in one at a time, a new colour field each scene, cut on the beat."
    stagger, spw, dark, exit_d, align_l = 0.085, 0.27, True, 0.0, "center"
    FIELDS = ["#130e22", "#2a1a52", "#1d2a6b", "#3b1d6e", "#130e22", "#24124a"]

    def css(self, ctx):
        return f"""
    .w {{ display: inline-block; vertical-align: top; }} .wi {{ display: inline-block; }}
    .r-head, .r-title, .r-body {{ color: #fff; font-weight: 800; letter-spacing: -0.045em; line-height: 1.0; }}
    .r-head {{ font-size: {box(ctx, 100, 124)}px; }} .q .r-head {{ font-size: {box(ctx, 84, 96)}px; }}
    .r-body {{ font-size: {box(ctx, 58, 60)}px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }}
    .r-title {{ font-size: {box(ctx, 88, 96)}px; }}
    .acc .wi {{ background: #ff7ab8; color: #130e22; padding: 0 .1em; border-radius: .08em; }}
    .r-kicker {{ font-size: {box(ctx, 40, 40)}px; font-weight: 700; color: #b18cff; letter-spacing: .14em; text-transform: uppercase; }}
    .r-meta {{ font-size: {box(ctx, 44, 46)}px; font-weight: 500; color: rgba(255,255,255,.78); line-height: 1.3; }}"""

    def text_in(self, sel, t, role):
        return f'    tl.fromTo("{sel}", {{ scale: 0.2, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.28, ease: "back.out(2.2)", stagger: {self.stagger} }}, {t:.2f});'

    def enter(self, sid, i):
        return f'    tl.fromTo("#{sid}-stage", {{ scale: 1.07 }}, {{ scale: 1, duration: 0.32, ease: "power3.out" }}, 0);'

    def exit(self, sid, dur):
        return ""  # hard cut

    def text_sfx(self, t, role, count, acc_at):
        s = [(t, "click-soft", 0.5)] if role in ("head", "title", "body") else []
        if acc_at is not None:
            s.append((acc_at, "pop", 0.6))
        return s

    def scene_bg(self, sid, i):
        return f"#root {{ background: {self.FIELDS[i % len(self.FIELDS)]}; }}"

    def enter_sfx(self, i):
        return [(0, "impact-bass-1", 0.35)] if i in (0, 7, 11, 13) else [(0, "whoosh-short", 0.35)]


class Cards(Look):
    num, slug, music = "03", "cards", "joplin"
    desc = "A deck of cards like the meet-up's printed ones: each scene is a card that turns over, typed letter by letter. Joplin."
    chars, stagger, spw, exit_d, align_l = True, 0.02, 0.29, 0.4, "left"

    def css(self, ctx):
        inset = box(ctx, "top: 240px; bottom: 430px; left: 70px; right: 70px;", "top: 90px; bottom: 90px; left: 160px; right: 160px;")
        return f"""
    #root {{ perspective: 2600px; }}
    .card {{ position: absolute; {inset} border-radius: 44px; background: #fdfcf8; border: 1px solid #f0ede4;
             box-shadow: 0 50px 100px -50px rgba(30,40,70,.5); transform-style: preserve-3d; backface-visibility: hidden; }}
    .card .brand {{ position: absolute; top: 40px; left: 54px; font-size: 28px; font-weight: 600; color: {SOFT}; }}
    .card .brand b {{ background: {GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 600; }}
    .card .no {{ position: absolute; top: 40px; right: 54px; font-size: 28px; font-weight: 600; color: #8a829c; font-variant-numeric: tabular-nums; }}
    .w {{ display: inline-block; white-space: nowrap; vertical-align: top; }} .wi {{ display: inline-block; }}
    .r-head, .r-title, .r-body {{ font-family: "Instrument Serif", serif; color: {INK}; line-height: 1.06; }}
    .r-head {{ font-size: {box(ctx, 96, 110)}px; }} .q .r-head {{ font-size: {box(ctx, 82, 92)}px; }}
    .r-body {{ font-size: {box(ctx, 58, 62)}px; line-height: 1.14; }}
    .r-title {{ font-size: {box(ctx, 88, 96)}px; }}
    .acc .c {{ background: {GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; }}
    .r-kicker {{ font-size: {box(ctx, 38, 40)}px; font-weight: 600; color: {VIOLET}; letter-spacing: .02em; }}
    .r-meta {{ font-size: {box(ctx, 40, 42)}px; font-weight: 500; color: {SOFT}; line-height: 1.3; }}"""

    def text_in(self, sel, t, role):
        return f'    tl.fromTo("{sel}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.01, stagger: {self.stagger} }}, {t:.2f});'

    def enter(self, sid, i):
        return f'    tl.fromTo("#{sid}-card", {{ rotationY: -88, opacity: 1 }}, {{ rotationY: 0, duration: 0.5, ease: "power3.out" }}, 0);'

    def exit(self, sid, dur):
        return f'    tl.to("#{sid}-card", {{ rotationY: 88, duration: {self.exit_d}, ease: "power2.in" }}, {dur - self.exit_d:.2f});'

    def text_sfx(self, t, role, count, acc_at):
        if role not in TEXT_ROLES:
            return []
        span = count * self.stagger
        s, k = [], 0.0
        if span < 0.7:  # the typing clip opens with a short silence: short lines get one key press
            return [(t, "key-press", 0.4)]
        while k < span - 0.15:  # the typing clip is 1.5 s: repeat it under longer lines
            s.append((t + k, "typing", 0.35, min(1.5, span - k)))
            k += 1.5
        return s

    def enter_sfx(self, i):
        return [(0, "whoosh", 0.45)]

    def wrap(self, sid, i, inner, n):
        return (f'<div class="card" id="{sid}-card"><span class="brand">Rethinking <b>Human Creativity</b> ✦</span>'
                f'<span class="no">{i + 1:02d} / {n:02d}</span>{inner}</div>')


class Wall(Look):
    num, slug, music = "04", "wall", "satie"
    desc = "The site's wall of works drifts behind the whole film; white serif words come into focus over it. Satie."
    stagger, spw, dark, exit_d, align_l, global_wall = 0.07, 0.29, True, 0.45, "center", True

    def css(self, ctx):
        return f"""
    .w {{ display: inline-block; vertical-align: top; }} .wi {{ display: inline-block; }}
    .r-head, .r-title, .r-body {{ font-family: "Instrument Serif", serif; color: #fff; line-height: 1.04; text-shadow: 0 4px 40px rgba(10,6,24,.6); }}
    .r-head {{ font-size: {box(ctx, 104, 118)}px; }} .q .r-head {{ font-size: {box(ctx, 88, 96)}px; }}
    .r-body {{ font-size: {box(ctx, 60, 64)}px; line-height: 1.12; }}
    .r-title {{ font-size: {box(ctx, 96, 100)}px; }}
    .acc .wi {{ background: {GRAD_LIGHT}; -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }}
    .r-kicker {{ font-size: {box(ctx, 38, 40)}px; font-weight: 600; color: #cdb6ff; letter-spacing: .04em; }}
    .r-meta {{ font-size: {box(ctx, 42, 44)}px; font-weight: 500; color: rgba(255,255,255,.82); line-height: 1.3; }}"""

    def text_in(self, sel, t, role):
        return (f'    tl.fromTo("{sel}", {{ opacity: 0, y: 18, filter: "blur(14px)" }}, {{ opacity: 1, y: 0, filter: "blur(0px)", '
                f'duration: 0.8, ease: "power2.out", stagger: {self.stagger} }}, {t:.2f});')

    def exit(self, sid, dur):
        return f'    tl.to("#{sid}-stage", {{ opacity: 0, filter: "blur(10px)", duration: {self.exit_d}, ease: "power1.in" }}, {dur - self.exit_d:.2f});'

    def text_sfx(self, t, role, count, acc_at):
        s = [(t, "whoosh-short", 0.22)] if role in ("head", "title") else []
        if acc_at is not None:
            s.append((acc_at, "sparkle", 0.35))
        return s


STYLES = [Editorial(), Kinetic(), Cards(), Wall()]


# ---------------------------------------------------------------- blocks shared by every look
def wall_html(ctx, sid, dark):
    """The site's wall of works as a big tilted grid (images and verse), to drift behind the type."""
    TW, TH, GAP = 250, 320, 26
    cols, rows = box(ctx, 6, 9), box(ctx, 8, 5)
    keys = [k for k in WALL if k] * 4
    tiles = []
    for i in range(cols * rows):
        c, r = i % cols, i // cols
        face, _ = work_face(ctx, WORKS[keys[(i * 7) % len(keys)]], "wpoem")
        tiles.append(f'<div class="wt" style="left:{c * (TW + GAP)}px;top:{r * (TH + GAP) + (60 if c % 2 else 0)}px">{face}</div>')
    w, h = cols * (TW + GAP), rows * (TH + GAP) + 60
    veil = ("linear-gradient(180deg, rgba(19,14,34,.78), rgba(19,14,34,.70) 50%, rgba(19,14,34,.84))" if dark else
            "linear-gradient(180deg, rgba(253,252,248,.86), rgba(253,252,248,.80) 50%, rgba(253,252,248,.92))")
    css = f"""
    #{sid}-wall {{ position: absolute; left: {(ctx.W - w) / 2:.0f}px; top: {(ctx.H - h) / 2:.0f}px; width: {w}px; height: {h}px; transform: rotate(-7deg); }}
    .wt {{ position: absolute; width: {TW}px; height: {TH}px; border-radius: 16px; background: #fdfcf8; padding: 14px; overflow: hidden;
           display: flex; align-items: center; justify-content: center; box-shadow: 0 18px 40px -24px rgba(30,40,70,.45); }}
    .wt > img {{ width: 100%; height: 100%; object-fit: contain; }}
    .wt .wpoem {{ font-size: 26px; padding: 8px; }}
    #{sid}-veil {{ position: absolute; inset: 0; background: {veil}; }}"""
    html = f'<div id="{sid}-wall" data-layout-ignore>{"".join(tiles)}</div><div id="{sid}-veil"></div>'
    return css, html


def chips_html(ctx, sid, dark):
    bg = "rgba(255,255,255,.1)" if dark else "#fff"
    col = "#fff" if dark else INK
    ic = "#cdb6ff" if dark else VIOLET
    css = f"""
    .chips {{ display: flex; flex-wrap: wrap; gap: {box(ctx, 22, 26)}px; justify-content: inherit; }}
    .chip {{ display: flex; align-items: center; gap: 16px; padding: {box(ctx, "20px 28px", "22px 32px")}; border-radius: 999px; background: {bg};
             box-shadow: 0 20px 50px -30px rgba(30,40,70,.45); font-size: {box(ctx, 40, 42)}px; font-weight: 600; color: {col}; }}
    .chip svg {{ width: 46px; height: 46px; color: {ic}; flex: none; }}"""
    return css, f'<div class="chips">{"".join(f"<div class=chip>{svg(m)}{m}</div>" for m in ICON)}</div>'


def tiles_html(ctx, sid, keys):
    tw, th = box(ctx, 205, 280), box(ctx, 270, 350)
    css = f"""
    .tiles {{ display: flex; gap: {box(ctx, 20, 34)}px; justify-content: inherit; }}
    .tt {{ position: relative; width: {tw}px; height: {th}px; perspective: 1400px; }}
    .ti {{ position: absolute; inset: 0; transform-style: preserve-3d; }}
    .tf {{ position: absolute; inset: 0; border-radius: 20px; background: #fdfcf8; border: 1px solid #f0ede4; padding: 14px;
           box-shadow: 0 24px 50px -28px rgba(30,40,70,.55); backface-visibility: hidden; -webkit-backface-visibility: hidden;
           display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }}
    .tf > img {{ width: 100%; height: 100%; object-fit: contain; }}
    .tf .tpoem {{ font-size: {box(ctx, 25, 31)}px; padding: 8px; }}
    .tb {{ transform: rotateY(180deg); gap: 10px; }}
    .tb b {{ font-family: "Instrument Serif", serif; font-weight: 400; font-size: {box(ctx, 64, 84)}px; line-height: .9; }}
    .tb i {{ font-style: normal; font-size: 28px; color: {SOFT}; text-align: center; line-height: 1.2; }}"""
    cells = []
    for i, k in enumerate(keys):
        w = WORKS[k]
        face, _ = work_face(ctx, w, "tpoem")
        lab, cls = who_label(w)
        how = f'<i>{w["how"]}</i>' if w["how"] else ""
        cells.append(f'<div class="tt" id="{sid}-t{i}"><div class="ti" id="{sid}-t{i}-in"><div class="tf">{face}</div>'
                     f'<div class="tf tb"><b class="{cls}">{lab}</b>{how}</div></div></div>')
    return css, f'<div class="tiles">{"".join(cells)}</div>'


def people_html(ctx, sid, dark):
    ph, cw = box(ctx, 100, 112), box(ctx, 160, 160)
    col = "#fff" if dark else INK
    css = f"""
    .people {{ display: flex; flex-wrap: wrap; gap: {box(ctx, "22px 0", "0")}; justify-content: center; width: {box(ctx, 5 * 160, 9 * 160)}px; max-width: 100%; }}
    .pp {{ width: {cw}px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; }}
    .pp img {{ width: {ph}px; height: {ph}px; border-radius: 50%; object-fit: cover; box-shadow: 0 14px 30px -18px rgba(30,40,70,.6);
               border: 3px solid {"rgba(255,255,255,.85)" if dark else "#fff"}; }}
    .pp span {{ font-size: 28px; font-weight: 500; line-height: 1.15; color: {col}; opacity: .86; }}"""
    cells = []
    for i, (name, _, f) in enumerate(PEOPLE):
        src = ctx.asset(SITE / "assets/people" / f, f"assets/people/{f}")
        first, last = name.rsplit(" ", 1)
        cells.append(f'<div class="pp" id="{sid}-p{i}"><img src="{src}" alt=""><span>{first}<br>{last}</span></div>')
    return css, f'<div class="people">{"".join(cells)}</div>'


# ---------------------------------------------------------------- one scene
def build_scene(ctx, look, spec, i, n):
    sid = spec["id"]
    dark = look.dark
    css = [look.css(ctx), look.scene_bg(sid, i)]
    parts, js, sfx = [], [], []
    enter_sfx = getattr(look, "enter_sfx", None)
    if enter_sfx:
        sfx += enter_sfx(i)
    t, words, flip_end = 0.3, 0, 0.0
    for k, (role, val) in enumerate(spec["items"]):
        eid = f"{sid}-{k}"
        if role in TEXT_ROLES:
            parts.append(f'<p id="{eid}" class="r-{role}">{split_words(val, look.chars)}</p>')
            nw = len(val.split(" "))
            unit = ".c" if look.chars else ".wi"
            count = len(val.replace("*", "").replace(" ", "")) if look.chars else nw
            words += nw if role != "kicker" else 1
            js.append(look.text_in(f"#{eid} {unit}", t, role))
            fa = first_accent(val)
            acc_at = None
            if fa is not None:
                before = len("".join(val.split(" ")[:fa]).replace("*", "")) if look.chars else fa
                acc_at = t + before * look.stagger + 0.15
            sfx += look.text_sfx(t, role, count, acc_at)
            t += 0.2 + count * look.stagger + (0.25 if role == "kicker" else 0.4)
        elif role == "chips":
            c, h = chips_html(ctx, sid, dark); css.append(c); parts.append(f'<div id="{eid}">{h}</div>')
            js.append(f'    tl.fromTo("#{eid} .chip", {{ opacity: 0, scale: 0.6 }}, {{ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)", stagger: 0.13 }}, {t:.2f});')
            sfx += [(t + j * 0.13, "pop" if j % 2 == 0 else "click-soft", 0.5) for j in range(4)]
            t += 1.0
        elif role == "tiles":
            c, h = tiles_html(ctx, sid, val); css.append(c); parts.append(f'<div id="{eid}">{h}</div>')
            js.append(f'    tl.fromTo("#{eid} .tt", {{ opacity: 0, y: 60, rotation: -4 }}, {{ opacity: 1, y: 0, rotation: 0, duration: 0.5, ease: "back.out(1.4)", stagger: 0.12 }}, {t:.2f});')
            sfx.append((t, "whoosh-short", 0.4))
            for j in range(len(val)):
                ft = t + 2.4 + j * 0.35
                js.append(f'    tl.fromTo("#{sid}-t{j}-in", {{ rotationY: 0 }}, {{ rotationY: 180, duration: 0.55, ease: "power2.inOut" }}, {ft:.2f});')
                sfx.append((ft + 0.3, "pop", 0.45))
                flip_end = ft + 0.55
            t += 0.8
        elif role == "people":
            c, h = people_html(ctx, sid, dark); css.append(c); parts.append(f'<div id="{eid}">{h}</div>')
            js.append(f'    tl.fromTo("#{eid} .pp", {{ opacity: 0, y: 24, scale: 0.85 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)", stagger: 0.07 }}, {t:.2f});')
            sfx += [(t + j * 0.07, "click-soft", 0.35) for j in range(0, 9, 3)]
            t += 1.0
        elif role == "url":
            pill = "#fff" if dark else GRAD
            fg = INK if dark else "#fff"
            css.append(f"#{eid} {{ align-self: center; padding: 22px 42px; border-radius: 999px; background: {pill}; color: {fg}; font-size: {box(ctx, 40, 40)}px; font-weight: 600; white-space: nowrap; }}")
            parts.append(f'<p id="{eid}">{val}</p>')
            js.append(f'    tl.fromTo("#{eid}", {{ opacity: 0, scale: 0.8 }}, {{ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }}, {t:.2f});')
            sfx.append((t, "chime", 0.4))
            t += 0.5
        elif role == "cta":
            col = "rgba(255,255,255,.8)" if dark else SOFT
            css.append(f"#{eid} {{ align-self: center; font-size: {box(ctx, 36, 34)}px; font-weight: 500; color: {col}; }}")
            parts.append(f'<p id="{eid}">{box(ctx, "Link in bio", "Submit your work")}</p>')
            js.append(f'    tl.fromTo("#{eid}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {t:.2f});')
            t += 0.4
    dur = max(t + 1.4, 1.0 + look.spw * words, 2.6) + (1.8 if spec.get("outro") else 0)
    if flip_end:
        dur = max(dur, flip_end + 2.4)
    dur = round(dur, 2)
    if spec.get("outro"):
        dur = round(dur, 2)
    else:
        js.append(look.exit(sid, dur))
    js.insert(0, look.enter(sid, i))
    wall = ""
    if spec.get("wall") and not look.global_wall:
        c, wall = wall_html(ctx, sid, dark); css.append(c)
        js.append(f'    tl.fromTo("#{sid}-wall", {{ x: 0, y: 0, scale: 1.08 }}, {{ x: {box(ctx, -120, -160)}, y: -60, scale: 1, duration: {dur}, ease: "none" }}, 0);')
    al = box(ctx, "center", look.align_l)
    stage_box = box(ctx, "top: 250px; bottom: 450px; left: 100px; right: 100px;", "top: 120px; bottom: 120px; left: 220px; right: 220px;")
    if isinstance(look, Cards):
        stage_box = box(ctx, "top: 340px; bottom: 470px; left: 140px; right: 140px;", "top: 200px; bottom: 150px; left: 280px; right: 280px;")
    css.append(f"""
    #{sid}-stage {{ position: absolute; {stage_box} display: flex; flex-direction: column; justify-content: center;
                    align-items: {"center" if al == "center" else "flex-start"}; text-align: {al}; gap: {box(ctx, 40, 42)}px; }}
    #{sid}-stage .chips, #{sid}-stage .tiles {{ justify-content: {"center" if al == "center" else "flex-start"}; }}""")
    if spec.get("outro") and ctx.v:
        css.append(f"#{sid}-stage {{ gap: 30px; }} #{sid}-stage .r-title {{ font-size: 80px; }} #{sid}-stage .r-meta {{ font-size: 36px; }}")
    stage = f'<div id="{sid}-stage" class="{"q" if spec.get("q") else ""}">{"".join(parts)}</div>'
    body = f'    <div class="clip" data-start="0" data-duration="{dur}" data-layout-allow-overlap data-layout-allow-overflow>{wall}{look.wrap(sid, i, stage, n)}</div>'
    html = f"""<template>
  <style>
    @font-face {{ font-family: "Instrument Serif"; src: url("assets/fonts/instrument-serif-latin.woff2") format("woff2"); }}
    @font-face {{ font-family: "Geist"; src: url("assets/fonts/geist-latin.woff2") format("woff2"); font-weight: 100 900; }}
    #root {{ position: absolute; inset: 0; overflow: hidden; font-family: "Geist", sans-serif; color: {INK}; }}
    .is-ai {{ color: {BLUE}; }} .is-human {{ color: {VIOLET}; }}
    .poem {{ font-family: "Instrument Serif", serif; background: #fff; border-radius: 8px; line-height: 1.28; }}
    .still {{ position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }}
    .still img {{ width: 100%; height: 100%; object-fit: contain; }}
    {"".join(css)}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="{ctx.W}" data-height="{ctx.H}">
{body}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(j for j in js if j)}
    window.__timelines["{sid}"] = tl;
  </script>
</template>
"""
    return html, dur, sfx


def bg_wall_scene(ctx, total):
    """Wall look: one composition under every scene, drifting for the whole film."""
    css, wall = wall_html(ctx, "bg", True)
    html = f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; overflow: hidden; }}
    .poem {{ font-family: "Instrument Serif", serif; background: #fff; border-radius: 8px; line-height: 1.28; }}
    @font-face {{ font-family: "Instrument Serif"; src: url("assets/fonts/instrument-serif-latin.woff2") format("woff2"); }}
    {css}
  </style>
  <div id="root" data-composition-id="bgwall" data-width="{ctx.W}" data-height="{ctx.H}">
    <div class="clip" data-start="0" data-duration="{total}" data-layout-allow-overlap data-layout-allow-overflow data-layout-ignore>{wall}</div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#bg-wall", {{ x: {box(ctx, 160, 260)}, y: 120, scale: 1.12 }}, {{ x: {box(ctx, -160, -260)}, y: -120, scale: 1, duration: {total}, ease: "none" }}, 0);
    window.__timelines["bgwall"] = tl;
  </script>
</template>
"""
    return html


# ---------------------------------------------------------------- music
CREDITS = {
    "bach": "Bach, Prelude in C major BWV 846, played by Kimiko Ishizaka (CC0, Wikimedia Commons)",
    "satie": "Satie, Gymnopédie No. 1 (CC0, Wikimedia Commons)",
    "chopin": "Chopin, Nocturne Op. 9 No. 2 (public domain, Wikimedia Commons)",
    "joplin": "Scott Joplin, Maple Leaf Rag (public domain, Wikimedia Commons)",
    "beat": "Original beat synthesized for this video (no copyright)",
}


def music_asset(ctx, key, total):
    if key == "beat":
        CACHE.mkdir(parents=True, exist_ok=True)
        out = CACHE / f"beat_120_{total:.1f}.wav"
        if not out.exists():
            subprocess.run([sys.executable, str(SYNTH), f"{total + 0.5:.1f}", "--out", str(out), "--bpm", "120"], check=True, capture_output=True)
        return ctx.asset(out, "assets/music/beat.wav")
    return ctx.asset(MUSIC_DIR / f"{key}-full.mp3", f"assets/music/{key}.mp3")


# ---------------------------------------------------------------- one project
def build(look, W, H, folder):
    root = OUT / folder / f"{look.num}-{look.slug}"
    for p in ("index.html", "compositions"):
        q = root / p
        if q.is_dir():
            shutil.rmtree(q)
        elif q.exists():
            q.unlink()
    (root / "compositions").mkdir(parents=True, exist_ok=True)
    ctx = Ctx(W, H, root)
    t, hosts, sfx = 0.0, [], []
    for i, spec in enumerate(STORY):
        html, dur, ssfx = build_scene(ctx, look, spec, i, len(STORY))
        sid = spec["id"]
        (root / "compositions" / f"{sid}.html").write_text(html)
        hosts.append(f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{t:.2f}" data-duration="{dur}" data-track-index="2" data-track-kind="graphics" data-width="{W}" data-height="{H}"></div>')
        sfx += [(t + s[0], *s[1:]) for s in ssfx]
        t += dur
    total = round(t, 2)
    if look.global_wall:
        (root / "compositions" / "bgwall.html").write_text(bg_wall_scene(ctx, total))
        hosts.insert(0, f'      <div id="bgwall" data-composition-id="bgwall" data-composition-src="compositions/bgwall.html" data-start="0" data-duration="{total}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}"></div>')
    mfile = music_asset(ctx, look.music, total)
    sfx.sort()
    for s in sfx:
        ctx.asset(SFX_SRC / f"{s[1]}.mp3", f"assets/sfx/{s[1]}.mp3")
    ctx.asset(SFX_SRC / "CREDITS.md", "assets/sfx/CREDITS.md")
    for f in ("geist-latin.woff2", "instrument-serif-latin.woff2"):
        ctx.asset(SITE / "assets/fonts" / f, f"assets/fonts/{f}")
    auds = []
    for k, s in enumerate(sfx):
        a, f, v = s[:3]
        d = f' data-duration="{s[3]:.2f}"' if len(s) > 3 else ""
        if a + (s[3] if len(s) > 3 else 0) > total:
            continue
        auds.append(f'      <audio id="sfx-{k}" src="assets/sfx/{f}.mp3" data-start="{a:.2f}"{d} data-volume="{v}"></audio>')
    bg = "#130e22" if look.dark else ("radial-gradient(900px 900px at 0% 0%, #ffd9e8, transparent 70%), "
                                      "radial-gradient(900px 900px at 100% 30%, #e7defe, transparent 70%), "
                                      "radial-gradient(900px 900px at 30% 100%, #d6ebff, transparent 70%), #fdfcf8")
    index = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <!-- story {look.num} {look.slug} ({W}x{H}): {look.desc}
         Music: {CREDITS[look.music]}. Sound effects: Pixabay Content License (assets/sfx/CREDITS.md).
         Generated by promotion/videos/_tools/story.py; editable by hand. -->
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: #fdfcf8; }}
      #bg {{ position: absolute; inset: 0; background: {bg}; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="{W}" data-height="{H}">
      <div id="bg"></div>
{chr(10).join(hosts)}
      <audio id="music" src="{mfile}" data-start="0" data-duration="{total:.2f}" data-volume="0.4" data-fade-in="0.4" data-fade-out="2.0"></audio>
{chr(10).join(auds)}
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
    tpl = VOUT / "_tools" / "project"
    for f in ("package.json", "hyperframes.json"):
        shutil.copy2(tpl / f, root / f)
    (root / "meta.json").write_text(json.dumps({"id": f"story-{folder}-{look.num}-{look.slug}", "name": f"story {look.num} {look.slug} ({folder})"}, indent=2) + "\n")
    return total


if __name__ == "__main__":
    only = set(sys.argv[1:])
    for look in STYLES:
        if only and look.num not in only:
            continue
        for folder, (W, H) in (("vertical", (1080, 1920)), ("landscape", (1920, 1080))):
            print(folder, look.num, look.slug, build(look, W, H, folder))
