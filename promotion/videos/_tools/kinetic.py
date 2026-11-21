"""Five kinetic promo films for the meet-up, each cut to its own original track (kmusic.py).

Every film is one HyperFrames composition: a "world" holding the scenes and a "camera" that moves
over it. Every reveal and every camera move sits on the beat grid of the film's track, and the
track's arrangement follows the film (drop on the four questions, break before CHI, final hit on
the outro). One script (SCENES), five looks (LOOKS), two shapes each.

    uv run --with numpy --with scipy promotion/videos/_tools/kinetic.py          # all
    uv run --with numpy --with scipy promotion/videos/_tools/kinetic.py 01 03    # some

Output: promotion/videos/kinetic/{vertical,landscape}/NN-look/ (index.html + compositions/film.html).
"""
import json
import math
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build import SITE, OUT as VOUT, SFX_SRC, WORKS, PEOPLE, Ctx, work_face, who_label  # noqa: E402
from story import split_words  # noqa: E402
import kmusic  # noqa: E402

OUT = VOUT / "kinetic"
CACHE = VOUT / "_tools" / ".cache"

# ------------------------------------------------------------------ the script, in beats
# (scene, beats, music section). Sections: intro 8, build 4, drop 16, break 4, groove 16, drop 16, outro 10.
TIMELINE = [("hook", 8, "intro"), ("four", 4, "build"), ("questions", 16, "drop"), ("together", 4, "break"),
            ("chi", 6, "groove"), ("meetup", 6, "groove"), ("who", 4, "groove"),
            ("share", 6, "drop"), ("game", 6, "drop"), ("cant", 12, "drop"), ("outro", 10, "outro")]
SECTIONS = [("intro", 8), ("build", 4), ("drop", 16), ("break", 4), ("groove", 16), ("drop", 24), ("outro", 10)]
QUESTIONS = [("Contribution", "Can creativity be *shared* with AI?"),
             ("Delegation", "What do you want to *keep* for yourself?"),
             ("Growth", "How do you *grow* when AI can do the work?"),
             ("Evaluation", "How do we know a tool really *supports* creativity?")]
VERBS = [("write.", "patience"), ("paint.", "ai_wave"), ("film.", "tram"), ("compose.", "ai_waltz_wave")]
TILES = ["hokusai", "ai_wave", "vermeer", "ai_portrait"]


def P(id_, text, cls):
    return f'<p class="l {cls}" id="{id_}">{split_words(text, False)}</p>'


def content(ctx, look):
    """Scene HTML and timed events (beat offset, action, selector) shared by every look."""
    v = ctx.v
    S = {}
    # 1 hook: AI can write / paint / film / compose (an AI-made work for each), then the question
    verbs = "".join(f'<span class="vb acc-solid" id="hook-v{i}">{w}</span>' for i, (w, _) in enumerate(VERBS))
    cw, ch = (300, 360) if v else (310, 350)
    spots = ([(110, 250, -7), (670, 290, 6), (120, 1070, 5), (660, 1040, -6)] if v else
             [(120, 90, -7), (1490, 110, 6), (170, 690, 5), (1450, 680, -6)])
    arts = []
    for i, (_, key) in enumerate(VERBS):
        face, _ = work_face(ctx, WORKS[key], "apoem")
        x, y, r = spots[i]
        arts.append(f'<div class="art" id="hook-a{i}" style="left:{x}px;top:{y}px;width:{cw}px;height:{ch}px;--r:{r}deg"><div class="artin">{face}</div><span class="tag">AI</span></div>')
    S["hook"] = (f'''<div class="part" id="hook-p1">{"".join(arts)}<div class="safe"><p class="l big hookrow"><span id="hook-ai">{split_words("AI can", False)}</span> <span class="verbs">{verbs}</span></p></div></div>
<div class="part" id="hook-p2"><div class="safe">{P("hook-q", "So which part is still *yours?*", "big")}</div></div>''',
                 [(0, "in", "#hook-ai .wi")] + [(i, "pop", f"#hook-v{i}") for i in range(4)] + [(i + 1, "out", f"#hook-v{i}") for i in range(3)]
                 + [(i, "card", f"#hook-a{i}") for i in range(4)] + [(4, "outpart", "#hook-p1"), (4, "in", "#hook-q .wi")])
    # 2 four questions
    S["four"] = (f'''<div class="safe">{P("four-a", "We’ve got", "mid")}<div class="row4"><p class="l qbig acc-text" id="four-n">4</p>{P("four-t", "questions", "qbig")}</div>{P("four-b", "for you.", "mid")}</div>''',
                 [(0, "in", "#four-a .wi"), (0.5, "pop", "#four-n"), (1, "in", "#four-t .wi"), (2.5, "in", "#four-b .wi")])
    # 3 the questions, back to back
    rows, ev = [], []
    for i, (lab, q) in enumerate(QUESTIONS):
        rows.append(f'<div class="q" id="q{i}"><span class="qn" id="q{i}-n">0{i + 1}</span><span class="qlab" id="q{i}-l">{lab}</span>{P(f"q{i}-t", q, "qt")}</div>')
        ev += [(4 * i, "pop", f"#q{i}-n"), (4 * i, "pop", f"#q{i}-l"), (4 * i + 0.25, "in", f"#q{i}-t .wi")]
        if i:
            ev.append((4 * i, "dim" if look.q_mode == "stack" else "out", f"#q{i - 1}"))
    S["questions"] = (f'<div class="safe qs {look.q_mode}">{"".join(rows)}</div>', ev)
    # 4 bridge
    S["together"] = (f'<div class="safe">{P("tg", "Let’s figure it out *together*", "big")}</div>', [(0, "in", "#tg .wi")])
    # 5 CHI
    S["chi"] = (f'''<div class="safe">{P("chi-at", "at", "mid")}<p class="l huge acc-text" id="chi-n">{split_words("CHI 2027", False)}</p>
{P("chi-what", "The leading conference on human–computer interaction", "small")}{P("chi-when", "May 10–14 · Pittsburgh", "meta")}</div>''',
                [(0, "in", "#chi-at .wi"), (0.5, "in", "#chi-n .wi"), (2, "in", "#chi-what .wi"), (4, "in", "#chi-when .wi")])
    # 6 the meet-up
    S["meetup"] = (f'''<div class="safe">{P("mu-a", "A *90-minute* meet-up.", "big")}{P("mu-b", "Informal. Open to anyone at CHI.", "mid")}{P("mu-c", "No sign-up.", "mid")}</div>''',
                   [(0, "in", "#mu-a .wi"), (2, "in", "#mu-b .wi"), (4, "in", "#mu-c .wi")])
    # 7 who
    S["who"] = (f'<div class="safe">{P("who-a", "For people who *build* creative tools,", "big")}{P("who-b", "and people who *use* them.", "big")}</div>',
                [(0, "in", "#who-a .wi"), (2, "in", "#who-b .wi")])
    # 8 share
    media = "".join(f'<span class="md" id="md{i}">{m}</span>' for i, m in enumerate(["Text", "Image", "Video", "Sound"]))
    S["share"] = (f'''<div class="safe">{P("sh-a", "Make art?", "big")}{P("sh-b", "*Share a piece.*", "big")}{P("sh-c", "By hand or with AI.", "mid")}<p class="l mediarow">{media}</p></div>''',
                  [(0, "in", "#sh-a .wi"), (1, "in", "#sh-b .wi"), (3, "in", "#sh-c .wi")] + [(4 + i * 0.25, "pop", f"#md{i}") for i in range(4)])
    # 9 the game
    tiles = []
    for i, k in enumerate(TILES):
        w = WORKS[k]
        face, _ = work_face(ctx, w)
        lab, cls = who_label(w)
        tiles.append(f'<div class="tt" id="tt{i}"><div class="ti" id="tt{i}-in"><div class="tf">{face}</div><div class="tf tb"><b class="{cls}">{lab}</b></div></div></div>')
    S["game"] = (f'''<div class="safe"><div class="tiles">{"".join(tiles)}</div>{P("gm-a", "We want to learn about *your practice,*", "mid")}{P("gm-b", "and talk about how research can better support your creativity.", "small")}</div>''',
                 [(0, "tiles", "#sc-game .tt"), (1, "in", "#gm-a .wi")] + [(2 + i * 0.5, "flip", f"#tt{i}-in") for i in range(4)] + [(4, "in", "#gm-b .wi")])
    # 10 can't come
    # 10 can't come: why it still matters, and what happens to the work (consent terms on submit.html)
    S["cant"] = (f'''<div class="safe">{P("ct-a", "Can’t make it to CHI?", "big")}{P("ct-b", "*Send it anyway.*", "big")}
{P("ct-c", "Help the people who build creative tools *see through your eyes.*", "mid")}
<p class="l fine" id="ct-d">This is a meet-up for creativity support tool researchers on how technology can better support human creativity. Your work is used only for non-commercial research and education, never to train AI.</p></div>''',
                 [(0, "in", "#ct-a .wi"), (2, "in", "#ct-b .wi"), (4, "in", "#ct-c .wi"), (6.5, "pop", "#ct-d")])
    # 11 outro
    ppl = []
    for i, (name, _, f) in enumerate(PEOPLE):
        src = ctx.asset(SITE / "assets/people" / f, f"assets/people/{f}")
        first, last = name.rsplit(" ", 1)
        ppl.append(f'<div class="pp"><img src="{src}" alt=""><span>{first}<br>{last}</span></div>')
    S["outro"] = (f'''<div class="safe">{P("ou-t", "Rethinking *Human Creativity* ✦ in the Generative AI Era", "title")}{P("ou-m", "CHI 2027 Meet-Up · Pittsburgh · May 10–14", "meta")}
<div class="people" id="ou-p">{"".join(ppl)}</div><p class="l url" id="ou-u">rethinking-creativity.github.io</p></div>''',
                  [(0, "in", "#ou-t .wi"), (2, "in", "#ou-m .wi"), (3, "people", "#ou-p .pp"), (5, "pop", "#ou-u")])
    return S


# ------------------------------------------------------------------ looks
class Look:
    num = slug = desc = genre = ""
    bpm = 120
    q_mode = "stack"
    perspective = False
    sizes = dict(huge=(300, 300), big=(112, 120), mid=(68, 70), small=(46, 46), meta=(40, 40), qt=(64, 60), title=(84, 92))
    accent = "#ff7ab8"
    ink = "#fff"

    def sz(self, ctx, k):
        return self.sizes[k][0 if ctx.v else 1]

    def base_css(self, ctx):
        z = lambda k: self.sz(ctx, k)
        safe = "top: 250px; bottom: 450px; left: 100px; right: 100px;" if ctx.v else "top: 110px; bottom: 110px; left: 200px; right: 200px;"
        return f"""
    #root {{ position: absolute; inset: 0; overflow: hidden; font-family: "Geist", sans-serif; color: {self.ink}; }}
    #cam {{ position: absolute; left: 0; top: 0; width: {ctx.W}px; height: {ctx.H}px; transform-origin: 50% 50%; }}
    #world {{ position: absolute; left: 0; top: 0; width: {ctx.W}px; height: {ctx.H}px; }}
    .sc {{ position: absolute; left: 0; top: 0; width: {ctx.W}px; height: {ctx.H}px; }}
    .part {{ position: absolute; inset: 0; }}
    .safe {{ position: absolute; {safe} display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: {30 if ctx.v else 26}px; }}
    .l {{ margin: 0; line-height: 1.0; }}
    .w {{ display: inline-block; vertical-align: top; }} .wi {{ display: inline-block; }}
    .huge {{ font-size: {z("huge")}px; font-weight: 900; letter-spacing: -0.06em; line-height: .9; }}
    .big {{ font-size: {z("big")}px; font-weight: 800; letter-spacing: -0.045em; }}
    .mid {{ font-size: {z("mid")}px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.08; }}
    .small {{ font-size: {z("small")}px; font-weight: 500; letter-spacing: -0.01em; line-height: 1.2; opacity: .85; }}
    .meta {{ font-size: {z("meta")}px; font-weight: 600; letter-spacing: .02em; opacity: .85; }}
    .title {{ font-size: {z("title")}px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.02; }}
    .hookrow {{ white-space: nowrap; }}
    .verbs {{ display: inline-grid; text-align: left; margin-left: .22em; }} .vb {{ grid-area: 1 / 1; justify-self: start; }}
    .art {{ position: absolute; transform: rotate(var(--r)); }}
    .artin {{ position: absolute; inset: 0; border-radius: 18px; background: #fdfcf8; padding: 14px; overflow: hidden; display: flex; align-items: center; justify-content: center;
              box-shadow: 0 30px 60px -30px rgba(0,0,0,.6); }}
    .artin > img, .artin .still img {{ width: 100%; height: 100%; object-fit: contain; }}
    .still {{ position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }}
    .still .play {{ position: absolute; width: 22%; aspect-ratio: 1; border-radius: 50%; background: rgba(255,255,255,.92); display: flex; align-items: center; justify-content: center; font-size: 200%; color: #2a2140; }}
    .poem {{ font-family: "Instrument Serif", serif; color: #2a2140; background: #fff; border-radius: 8px; line-height: 1.28; }}
    .apoem {{ font-size: 30px; padding: 14px; }}
    .art .tag {{ position: absolute; right: -14px; top: -14px; padding: 6px 16px; border-radius: 999px; background: {self.accent}; color: #111; font-size: 30px; font-weight: 800; }}
    .row4 {{ display: flex; flex-direction: {"column" if ctx.v else "row"}; align-items: {"center" if ctx.v else "baseline"}; gap: {0 if ctx.v else 36}px; }}
    .qbig {{ font-size: {180 if ctx.v else 220}px; font-weight: 900; letter-spacing: -0.06em; line-height: .92; }}
    .qs {{ align-items: flex-start; text-align: left; gap: {34 if ctx.v else 30}px; }}
    .q {{ display: grid; grid-template-columns: auto 1fr; column-gap: 22px; row-gap: 6px; align-items: baseline; }}
    .qn {{ font-size: {z("meta") + 6}px; font-weight: 800; color: {self.accent}; font-variant-numeric: tabular-nums; }}
    .qlab {{ font-size: {z("meta") - 6}px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; opacity: .7; }}
    .qt {{ grid-column: 1 / -1; font-size: {z("qt")}px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; }}
    .qs.cycle {{ display: grid; align-content: center; }} .qs.cycle .q {{ grid-area: 1 / 1; }}
    .qs.cycle .qt {{ font-size: {z("big")}px; }} .qs.cycle .qn {{ font-size: {z("huge") * .55:.0f}px; line-height: .9; }}
    .mediarow {{ display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; }}
    .md {{ font-size: {z("meta")}px; font-weight: 700; padding: 12px 26px; border-radius: 999px; border: 3px solid currentColor; }}
    .tiles {{ display: flex; gap: {18 if ctx.v else 28}px; }}
    .tt {{ position: relative; width: {200 if ctx.v else 230}px; height: {250 if ctx.v else 280}px; perspective: 1200px; }}
    .ti {{ position: absolute; inset: 0; transform-style: preserve-3d; }}
    .tf {{ position: absolute; inset: 0; border-radius: 16px; background: #fdfcf8; padding: 12px; backface-visibility: hidden; -webkit-backface-visibility: hidden;
           display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 24px 50px -28px rgba(0,0,0,.6); }}
    .tf > img {{ width: 100%; height: 100%; object-fit: contain; }}
    .tb {{ transform: rotateY(180deg); }} .tb b {{ font-family: "Instrument Serif", serif; font-weight: 400; font-size: {64 if ctx.v else 76}px; }}
    .is-ai {{ color: #2563eb; }} .is-human {{ color: #6d3be8; }}
    .people {{ display: flex; flex-wrap: wrap; justify-content: center; width: {800 if ctx.v else 1440}px; row-gap: 16px; }}
    .pp {{ width: 160px; display: flex; flex-direction: column; align-items: center; gap: 8px; }}
    .pp img {{ width: {96 if ctx.v else 104}px; height: {96 if ctx.v else 104}px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,.85); }}
    .pp span {{ font-size: 28px; font-weight: 500; line-height: 1.1; opacity: .9; }}
    .url {{ padding: 20px 40px; border-radius: 999px; background: {self.accent}; color: #111; font-size: 40px; font-weight: 700; }}
    .fine {{ font-size: {32 if ctx.v else 28}px; font-weight: 500; line-height: 1.35; opacity: .78; max-width: {860 if ctx.v else 1100}px; letter-spacing: 0; }}"""

    # --- defaults each look may override
    def css(self, ctx):
        return ""

    def background(self, ctx):
        return ""

    def place(self, ctx, i, name):
        return "", ""  # (inline style, extra class)

    def word_in(self, sel, t):
        return f'tl.fromTo("{sel}", {{ scale: 0.2, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.26, ease: "back.out(2.2)", stagger: 0.06 }}, {t:.3f});'

    def scene_in(self, ctx, i, name, t, beat):
        return [f'tl.set("#sc-{name}", {{ autoAlpha: 1 }}, {t:.3f});']

    def scene_out(self, ctx, i, name, t, beat):
        return [f'tl.set("#sc-{name}", {{ autoAlpha: 0 }}, {t:.3f});']

    def camera(self, ctx, timeline, beat, total):
        return []

    def extra(self, ctx, timeline, beat, total):
        return []

    def sfx_scene(self, i, name, t):
        return [(t, "whoosh-short", 0.3)] if i else []


class Punch(Look):
    num, slug, genre, bpm = "01", "punch", "house", 124
    desc = "Colour fields that switch every scene, words slammed in, a camera that punches on every kick and whip-pans between scenes. Original house track, 124 BPM."
    FIELDS = {"hook": "#160b2e", "four": "#ff3d8b", "questions": "#1c1446", "together": "#3a1c7a", "chi": "#0f2a6b", "meetup": "#1c1446",
              "who": "#5a1fb8", "share": "#160b2e", "game": "#24124a", "cant": "#ff3d8b", "outro": "#1c1446"}
    accent = "#ffd23f"

    def css(self, ctx):
        return f"""
    #bgc {{ position: absolute; inset: 0; background: #160b2e; }}
    .acc .wi, .acc-solid {{ background: {self.accent}; color: #160b2e; padding: 0 .1em; border-radius: .06em; }}
    .acc-text {{ color: {self.accent}; }}
    #sc-four .acc-text, #sc-cant .acc .wi {{ color: #160b2e; }} #sc-four .acc-text {{ color: #fff; }}
    #sc-cant .acc .wi {{ background: #160b2e; color: #fff; }}"""

    def background(self, ctx):
        return '<div id="bgc"></div>'

    def scene_in(self, ctx, i, name, t, beat):
        js = [f'tl.set("#sc-{name}", {{ autoAlpha: 1 }}, {t:.3f});', f'tl.set("#bgc", {{ backgroundColor: "{self.FIELDS[name]}" }}, {t:.3f});']
        if i:
            js.append(f'tl.fromTo("#sc-{name}", {{ xPercent: 45, skewX: -10, filter: "blur(14px)" }}, {{ xPercent: 0, skewX: 0, filter: "blur(0px)", duration: 0.26, ease: "power3.out" }}, {t:.3f});')
        return js

    def scene_out(self, ctx, i, name, t, beat):
        return [f'tl.to("#sc-{name}", {{ xPercent: -45, skewX: 10, filter: "blur(14px)", duration: 0.18, ease: "power3.in" }}, {t - 0.18:.3f});',
                f'tl.set("#sc-{name}", {{ autoAlpha: 0 }}, {t:.3f});']

    def camera(self, ctx, timeline, beat, total):
        js, b = [], 0
        for name, beats, sec in timeline:
            for k in range(beats):
                if sec in ("break",) or (sec == "outro" and k > 0):
                    continue
                t = (b + k) * beat
                s = 1.05 if sec == "drop" else 1.03
                js.append(f'tl.fromTo("#cam", {{ scale: {s} }}, {{ scale: 1, duration: {beat * 0.8:.3f}, ease: "power2.out" }}, {t:.3f});')
            b += beats
        return js


class Zoom(Look):
    num, slug, genre, bpm = "02", "zoom", "breaks", 136
    desc = "Black and lime, huge capitals; the camera keeps diving forward, each scene flying out past the lens as the next one comes up from the depth. Questions take over the screen one by one. Original breakbeat track, 136 BPM."
    q_mode = "cycle"
    accent = "#d4ff3a"
    sizes = dict(Look.sizes, big=(104, 116), qt=(58, 58))

    def css(self, ctx):
        return f"""
    #bgc {{ position: absolute; inset: 0; background: #050505; overflow: hidden; }}
    .ring {{ position: absolute; left: 50%; top: 50%; width: 900px; height: 900px; margin: -450px 0 0 -450px; border-radius: 50%; border: 2px solid rgba(212,255,58,.22); }}
    .big, .huge, .title, .qt {{ text-transform: uppercase; }}
    .qbig {{ text-transform: uppercase; font-size: {150 if ctx.v else 200}px; }}
    .acc .wi, .acc-text, .acc-solid {{ color: {self.accent}; }}
    .qn {{ color: {self.accent}; }}"""

    def background(self, ctx):
        return '<div id="bgc">' + "".join(f'<div class="ring" id="ring{i}"></div>' for i in range(6)) + "</div>"

    def word_in(self, sel, t):
        return f'tl.fromTo("{sel}", {{ y: 90, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.24, ease: "power4.out", stagger: 0.045 }}, {t:.3f});'

    def scene_in(self, ctx, i, name, t, beat):
        return [f'tl.set("#sc-{name}", {{ autoAlpha: 1 }}, {t:.3f});',
                f'tl.fromTo("#sc-{name}", {{ scale: 0.25, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.42, ease: "expo.out" }}, {t:.3f});']

    def scene_out(self, ctx, i, name, t, beat):
        return [f'tl.to("#sc-{name}", {{ scale: 6, opacity: 0, duration: 0.3, ease: "power2.in" }}, {t - 0.3:.3f});', f'tl.set("#sc-{name}", {{ autoAlpha: 0 }}, {t:.3f});']

    def camera(self, ctx, timeline, beat, total):
        js, b = [], 0
        for i, (name, beats, sec) in enumerate(timeline):
            t, d = b * beat, beats * beat
            js.append(f'tl.fromTo("#cam", {{ rotation: {(-2.5, 2.5)[i % 2]} }}, {{ rotation: {(2.5, -2.5)[i % 2] * 0.3}, duration: {d:.3f}, ease: "sine.inOut" }}, {t:.3f});')
            js.append(f'tl.fromTo("#world", {{ scale: 1 }}, {{ scale: 1.08, duration: {d:.3f}, ease: "none" }}, {t:.3f});')
            b += beats
        return js

    def extra(self, ctx, timeline, beat, total):
        n = int(total / beat)
        js = []
        for k in range(6):
            js.append(f'tl.fromTo("#ring{k}", {{ scale: 0.05, opacity: 0 }}, {{ scale: 3.2, opacity: 1, duration: {beat * 6:.3f}, ease: "power1.in", repeat: {n // 6 + 1} }}, {k * beat:.3f});')
        return js


class Fly(Look):
    num, slug, genre, bpm = "03", "fly", "synthwave", 112
    desc = "Synthwave sky and a moving grid floor; the scenes hang in 3D space and the camera flies from one to the next, banking as it turns. Original synthwave track, 112 BPM."
    perspective = True
    accent = "#4df3ff"

    def css(self, ctx):
        return f"""
    #bgc {{ position: absolute; inset: 0; background: linear-gradient(180deg, #0b0020 0%, #2a0845 50%, #6b0f6a 80%, #120022 80.5%); overflow: hidden; }}
    #sun {{ position: absolute; left: 50%; top: {ctx.H * (0.8 if ctx.v else 0.8) - 200:.0f}px; width: 400px; height: 400px; margin-left: -200px; border-radius: 50%;
            background: linear-gradient(180deg, #ffd36e, #ff4f9a 70%); opacity: .3;
            -webkit-mask: repeating-linear-gradient(180deg, #000 0 26px, transparent 26px 34px); mask: repeating-linear-gradient(180deg, #000 0 26px, transparent 26px 34px); }}
    #floor {{ position: absolute; left: -50%; width: 200%; top: {ctx.H * (0.8 if ctx.v else 0.8):.0f}px; height: {ctx.H * 0.9:.0f}px; opacity: .7; transform-origin: 50% 0; transform: perspective(500px) rotateX(70deg);
              background-image: linear-gradient(rgba(255,79,154,.75) 2px, transparent 2px), linear-gradient(90deg, rgba(255,79,154,.75) 2px, transparent 2px);
              background-size: 90px 90px; }}
    #cam {{ perspective: 1300px; }}
    #world {{ transform-style: preserve-3d; }}
    .sc {{ transform-style: preserve-3d; }}
    .big, .huge, .title, .mid, .qt, .qbig {{ text-shadow: 0 0 24px rgba(255,79,154,.75), 0 0 2px #fff; }}
    .acc .wi, .acc-text, .acc-solid {{ color: {self.accent}; text-shadow: 0 0 24px rgba(77,243,255,.9); }}"""

    def background(self, ctx):
        return '<div id="bgc"><div id="sun"></div><div id="floor"></div></div>'

    def pos(self, ctx, i):
        x = math.sin(i * 1.1) * ctx.W * 0.55
        y = math.cos(i * 0.8) * ctx.H * 0.12
        z = -i * 2200
        ry = (14, -14)[i % 2]
        return x, y, z, ry

    def place(self, ctx, i, name):
        x, y, z, ry = self.pos(ctx, i)
        return f"transform: translate3d({x:.0f}px, {y:.0f}px, {z}px) rotateY({ry}deg);", ""

    def word_in(self, sel, t):
        return f'tl.fromTo("{sel}", {{ rotationX: -90, opacity: 0, transformOrigin: "50% 100%" }}, {{ rotationX: 0, opacity: 1, duration: 0.4, ease: "back.out(1.6)", stagger: 0.05 }}, {t:.3f});'

    def scene_in(self, ctx, i, name, t, beat):
        return [f'tl.fromTo("#sc-{name}", {{ autoAlpha: 0 }}, {{ autoAlpha: 1, duration: {beat:.3f}, ease: "power1.out" }}, {max(0, t - 1.2 * beat):.3f});']

    def scene_out(self, ctx, i, name, t, beat):
        return [f'tl.to("#sc-{name}", {{ autoAlpha: 0, duration: 0.2 }}, {t + 0.15:.3f});']

    def camera(self, ctx, timeline, beat, total):
        js, b = [], 0
        for i, (name, beats, sec) in enumerate(timeline):
            x, y, z, ry = self.pos(ctx, i)
            t = b * beat
            if i == 0:
                js.append(f'tl.set("#world", {{ x: {-x:.0f}, y: {-y:.0f}, z: {-z} }}, 0);')
            else:
                js.append(f'tl.to("#world", {{ x: {-x:.0f}, y: {-y:.0f}, z: {-z}, duration: {beat * 1.1:.3f}, ease: "power3.inOut" }}, {t - beat * 0.55:.3f});')
                js.append(f'tl.fromTo("#cam", {{ rotation: 0 }}, {{ rotation: {(-6, 6)[i % 2]}, duration: {beat * 0.55:.3f}, ease: "sine.in", yoyo: true, repeat: 1 }}, {t - beat * 0.55:.3f});')
                js.append(f'tl.fromTo("#world", {{ rotationY: {ry * 0.6:.1f} }}, {{ rotationY: 0, duration: {beat * 1.1:.3f}, ease: "power2.out" }}, {t - beat * 0.55:.3f});')
            b += beats
        return js

    def extra(self, ctx, timeline, beat, total):
        return [f'tl.fromTo("#floor", {{ backgroundPosition: "0px 0px" }}, {{ backgroundPosition: "0px {int(total * 260)}px", duration: {total:.3f}, ease: "none" }}, 0);',
                f'tl.fromTo("#sun", {{ y: 40 }}, {{ y: -20, duration: {total:.3f}, ease: "none" }}, 0);']


class Scroll(Look):
    num, slug, genre, bpm = "04", "scroll", "disco", 118
    desc = "One long sheet of paper in the site's colours; the camera slides diagonally from block to block with a springy overshoot, over a collage of real works. Original disco-funk track, 118 BPM."
    accent = "#6d3be8"
    ink = "#1c1530"

    def css(self, ctx):
        return f"""
    #bgc {{ position: absolute; inset: 0; background: #fbf8f1; }}
    #world {{ background-image: radial-gradient(rgba(28,21,48,.12) 2px, transparent 2px); background-size: 46px 46px; }}
    .acc .wi, .acc-text, .acc-solid {{ color: {self.accent}; }}
    .acc .wi {{ background: linear-gradient(transparent 62%, #ffc2df 62%); }}
    .url {{ background: {self.accent}; color: #fff; }} .art .tag {{ background: {self.accent}; color: #fff; }}
    .md {{ color: {self.accent}; }}
    .pp img {{ border-color: #fff; box-shadow: 0 10px 24px -14px rgba(0,0,0,.5); }}
    .deco {{ position: absolute; border-radius: 14px; background: #fff; padding: 10px; box-shadow: 0 24px 50px -30px rgba(28,21,48,.55); }}
    .deco img {{ width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }}"""

    def background(self, ctx):
        return '<div id="bgc"></div>'

    def pos(self, ctx, i):
        x = (0, 0.62, 0.05, -0.6, 0.1, 0.66, 0, -0.62, 0.04, 0.6, 0)[i] * ctx.W
        y = i * ctx.H * 0.82
        r = (0, -4, 3, -3, 4, -2, 3, -4, 2, -3, 0)[i]
        return x, y, r

    def place(self, ctx, i, name):
        x, y, r = self.pos(ctx, i)
        return f"left:{x:.0f}px; top:{y:.0f}px; transform: rotate({r}deg);", ""

    def world_extra(self, ctx):
        """A collage of real works between the blocks."""
        keys = ["hokusai", "vangogh", "ai_night", "vermeer", "monet", "ai_harbor", "jeongseon", "ai_portrait", "klimt", "seurat", "ai_park", "kimhongdo"]
        out = []
        # decoration only in the gaps between blocks: halfway down, at the frame's side edges
        for k in range(20):
            i, side = k // 2, (-1, 1)[k % 2]
            key = keys[k % len(keys)]
            src = ctx.asset(SITE / "assets/works" / f"{key}.jpg", f"assets/works/{key}.jpg")
            xa, ya, _ = self.pos(ctx, min(i, 10)); xb, yb, _ = self.pos(ctx, min(i + 1, 10))
            x = xb + ctx.W / 2 + side * ctx.W * (0.38 if ctx.v else 0.47) - 130  # sides of the next block, clear of its text
            y = (ya + yb) / 2 + ctx.H / 2 - 160
            out.append(f'<div class="deco" data-layout-ignore style="left:{x:.0f}px;top:{y:.0f}px;width:260px;height:320px;transform:rotate({((k * 29) % 17) - 8}deg)"><img src="{src}" alt=""></div>')
        return "".join(out)

    def word_in(self, sel, t):
        return f'tl.fromTo("{sel}", {{ x: -50, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.3, ease: "power3.out", stagger: 0.045 }}, {t:.3f});'

    def scene_in(self, ctx, i, name, t, beat):
        return []

    def scene_out(self, ctx, i, name, t, beat):
        return []

    def camera(self, ctx, timeline, beat, total):
        js, b = [], 0
        for i, (name, beats, sec) in enumerate(timeline):
            x, y, r = self.pos(ctx, i)
            t = b * beat
            if i == 0:
                js.append(f'tl.set("#world", {{ x: {-x:.0f}, y: {-y:.0f} }}, 0); tl.set("#cam", {{ rotation: {-r} }}, 0);')
            else:
                js.append(f'tl.to("#world", {{ x: {-x:.0f}, y: {-y:.0f}, duration: {beat * 1.2:.3f}, ease: "back.inOut(1.3)" }}, {t - beat * 0.6:.3f});')
                js.append(f'tl.to("#cam", {{ rotation: {-r}, scale: 1, duration: {beat * 1.2:.3f}, ease: "back.inOut(1.3)" }}, {t - beat * 0.6:.3f});')
                js.append(f'tl.fromTo("#cam", {{ scale: 1 }}, {{ scale: 0.82, duration: {beat * 0.6:.3f}, ease: "power2.out", yoyo: true, repeat: 1 }}, {t - beat * 0.6:.3f});')
            b += beats
        return js


class Glitch(Look):
    num, slug, genre, bpm = "05", "glitch", "glitch", 128
    desc = "A wall of real works flickers on the beat behind black type bars; cuts land with an RGB split, a snap of rotation and a zoom-out. Original glitch-pop track, 128 BPM."
    accent = "#2b5bff"
    ink = "#fff"

    def css(self, ctx):
        return f"""
    #bgc {{ position: absolute; inset: 0; background: #000; overflow: hidden; }}
    .gcell {{ position: absolute; overflow: hidden; opacity: .18; }}
    .gcell img {{ width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.2); }}
    #veil {{ position: absolute; inset: 0; background: radial-gradient(closest-side, rgba(0,0,0,.65), rgba(0,0,0,.15)); }}
    .l .wi {{ background: #000; padding: 0 .12em; }}
    .acc .wi, .acc-solid {{ background: {self.accent} !important; color: #fff; padding: 0 .12em; }}
    .acc-text .wi, #four-n {{ background: {self.accent} !important; color: #fff; }}
    .qn {{ color: #fff; background: {self.accent}; padding: 0 .2em; }}
    .url {{ background: #fff; color: #000; }} .art .tag {{ background: {self.accent}; color: #fff; }}
    .md {{ background: #000; }}"""

    def background(self, ctx):
        keys = ["hokusai", "ai_wave", "vangogh", "ai_night", "vermeer", "ai_portrait", "monet", "ai_harbor", "klimt", "ai_park", "seurat", "rembrandt",
                "ai_oldman", "jeongseon", "ai_jinkyeong", "kimhongdo", "ai_pungsok", "botticelli", "ai_shell", "hiroshige", "ai_rain", "chaekgado", "ai_chaekgado", "ai_miin"]
        cols, rows = (4, 6) if ctx.v else (6, 4)
        cw, ch = ctx.W / cols, ctx.H / rows
        cells = []
        for i in range(cols * rows):
            k = keys[i % len(keys)]
            src = ctx.asset(SITE / "assets/works" / f"{k}.jpg", f"assets/works/{k}.jpg")
            cells.append(f'<div class="gcell" id="g{i}" style="left:{(i % cols) * cw:.0f}px;top:{(i // cols) * ch:.0f}px;width:{cw + 1:.0f}px;height:{ch + 1:.0f}px"><img src="{src}" alt=""></div>')
        self.ncells = cols * rows
        return f'<div id="bgc" data-layout-ignore>{"".join(cells)}<div id="veil"></div></div>'

    def word_in(self, sel, t):
        return f'tl.fromTo("{sel}", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.1, ease: "steps(3)", stagger: 0.05 }}, {t:.3f});'

    def scene_in(self, ctx, i, name, t, beat):
        return [f'tl.set("#sc-{name}", {{ autoAlpha: 1 }}, {t:.3f});',
                f'tl.fromTo("#sc-{name}", {{ x: {(-40, 40)[i % 2]}, skewX: 18, textShadow: "-14px 0 #ff2a6d, 14px 0 #2bd9ff" }}, {{ x: 0, skewX: 0, textShadow: "0px 0 rgba(0,0,0,0), 0px 0 rgba(0,0,0,0)", duration: 0.22, ease: "steps(5)" }}, {t:.3f});']

    def scene_out(self, ctx, i, name, t, beat):
        return [f'tl.set("#sc-{name}", {{ autoAlpha: 0 }}, {t:.3f});']

    def camera(self, ctx, timeline, beat, total):
        js, b = [], 0
        for i, (name, beats, sec) in enumerate(timeline):
            t = b * beat
            js.append(f'tl.fromTo("#cam", {{ rotation: {(-4, 3, -3, 4)[i % 4]}, scale: 1.18 }}, {{ rotation: 0, scale: 1, duration: 0.32, ease: "expo.out" }}, {t:.3f});')
            b += beats
        return js

    def extra(self, ctx, timeline, beat, total):
        js = []
        n = int(total / beat)
        for k in range(n):
            for j in range(3):
                c = (k * 7 + j * 11) % 24
                js.append(f'tl.fromTo("#g{c}", {{ opacity: 0.85 }}, {{ opacity: 0.18, duration: {beat * 0.9:.3f}, ease: "power2.out" }}, {k * beat:.3f});')
        return js


LOOKS = [Punch(), Zoom(), Fly(), Scroll(), Glitch()]


# ------------------------------------------------------------------ assemble one film
def film(ctx, look, beat):
    S = content(ctx, look)
    scenes, js, sfx = [], [], []
    b = 0
    for i, (name, beats, sec) in enumerate(TIMELINE):
        html, events = S[name]
        style, cls = look.place(ctx, i, name)
        scenes.append(f'<section class="sc {cls}" id="sc-{name}" style="{style}">{html}</section>')
        t0, t1 = b * beat, (b + beats) * beat
        js += look.scene_in(ctx, i, name, t0, beat)
        sfx += look.sfx_scene(i, name, t0)
        for off, act, sel in events:
            t = t0 + off * beat
            if act == "in":
                js.append(look.word_in(sel, t))
            elif act == "pop":
                js.append(f'tl.fromTo("{sel}", {{ scale: 0.3, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.24, ease: "back.out(2.4)" }}, {t:.3f});')
            elif act == "out":
                js.append(f'tl.to("{sel}", {{ opacity: 0, duration: 0.08 }}, {t - 0.04:.3f});')
            elif act == "outpart":
                js.append(f'tl.to("{sel}", {{ opacity: 0, scale: 1.25, duration: 0.2, ease: "power2.in" }}, {t - 0.2:.3f});')
            elif act == "dim":
                js.append(f'tl.to("{sel}", {{ opacity: 0.32, duration: 0.2 }}, {t:.3f});')
            elif act == "card":
                js.append(f'tl.fromTo("{sel}", {{ scale: 0.4, opacity: 0, rotation: -12 }}, {{ scale: 1, opacity: 1, rotation: 0, duration: 0.3, ease: "back.out(1.8)" }}, {t:.3f});')
                sfx.append((t, "click-soft", 0.45))
            elif act == "tiles":
                js.append(f'tl.fromTo("{sel}", {{ y: 80, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.5)", stagger: 0.08 }}, {t:.3f});')
            elif act == "flip":
                js.append(f'tl.fromTo("{sel}", {{ rotationY: 0 }}, {{ rotationY: 180, duration: 0.35, ease: "power2.inOut" }}, {t:.3f});')
                sfx.append((t + 0.2, "pop", 0.4))
            elif act == "people":
                js.append(f'tl.fromTo("{sel}", {{ y: 30, opacity: 0, scale: 0.8 }}, {{ y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)", stagger: 0.05 }}, {t:.3f});')
        if i < len(TIMELINE) - 1:
            js += look.scene_out(ctx, i, name, t1, beat)
        b += beats
    total_beats = b
    total = round(total_beats * beat + 1.2, 3)
    js += look.camera(ctx, TIMELINE, beat, total)
    js += look.extra(ctx, TIMELINE, beat, total)
    world_extra = look.world_extra(ctx) if hasattr(look, "world_extra") else ""
    hidden = "" if isinstance(look, (Fly, Scroll)) else ".sc { visibility: hidden; }"
    html = f"""<template>
  <style>
    @font-face {{ font-family: "Instrument Serif"; src: url("assets/fonts/instrument-serif-latin.woff2") format("woff2"); }}
    @font-face {{ font-family: "Geist"; src: url("assets/fonts/geist-latin.woff2") format("woff2"); font-weight: 100 900; }}
    {look.base_css(ctx)}
    {look.css(ctx)}
    {hidden}
  </style>
  <div id="root" data-composition-id="film" data-width="{ctx.W}" data-height="{ctx.H}">
    <div id="film-clip" class="clip" data-start="0" data-duration="{total}" data-layout-allow-overlap data-layout-allow-overflow>
      {look.background(ctx)}
      <div id="cam"><div id="world">{world_extra}
{chr(10).join(scenes)}
      </div></div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10) + "    ".join(js)}
    window.__timelines["film"] = tl;
  </script>
</template>
"""
    return html, total, sfx


def music(look, total):
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / f"k_{look.genre}_{look.bpm}.wav"
    if not out.exists():
        kmusic.build(look.genre, look.bpm, SECTIONS, str(out))
    return out


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
    beat = 60.0 / look.bpm
    html, total, sfx = film(ctx, look, beat)
    (root / "compositions" / "film.html").write_text(html)
    m = music(look, total)
    ctx.asset(m, "assets/music/track.wav")
    for _, f, _ in sfx:
        ctx.asset(SFX_SRC / f"{f}.mp3", f"assets/sfx/{f}.mp3")
    ctx.asset(SFX_SRC / "CREDITS.md", "assets/sfx/CREDITS.md")
    for f in ("geist-latin.woff2", "instrument-serif-latin.woff2"):
        ctx.asset(SITE / "assets/fonts" / f, f"assets/fonts/{f}")
    auds = "\n".join(f'      <audio id="sfx-{k}" src="assets/sfx/{f}.mp3" data-start="{a:.3f}" data-volume="{v}"></audio>' for k, (a, f, v) in enumerate(sorted(sfx)) if a < total - 0.5)
    index = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <!-- kinetic {look.num} {look.slug} ({W}x{H}): {look.desc}
         Music: original, synthesized by _tools/kmusic.py ({look.genre}, {look.bpm} BPM); no samples, no copyright question.
         Sound effects: Pixabay Content License (assets/sfx/CREDITS.md). Generated by _tools/kinetic.py; editable by hand. -->
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: #000; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="{W}" data-height="{H}">
      <div id="film" data-composition-id="film" data-composition-src="compositions/film.html" data-start="0" data-duration="{total}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}"></div>
      <audio id="music" src="assets/music/track.wav" data-start="0" data-duration="{total:.3f}" data-volume="0.75" data-fade-out="0.8"></audio>
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
    tpl = VOUT / "_tools" / "project"
    for f in ("package.json", "hyperframes.json"):
        shutil.copy2(tpl / f, root / f)
    (root / "meta.json").write_text(json.dumps({"id": f"kinetic-{folder}-{look.num}-{look.slug}", "name": f"kinetic {look.num} {look.slug} ({folder})"}, indent=2) + "\n")
    return total


if __name__ == "__main__":
    only = set(sys.argv[1:])
    for look in LOOKS:
        if only and look.num not in only:
            continue
        for folder, (W, H) in (("vertical", (1080, 1920)), ("landscape", (1920, 1080))):
            print(folder, look.num, look.slug, build(look, W, H, folder))
