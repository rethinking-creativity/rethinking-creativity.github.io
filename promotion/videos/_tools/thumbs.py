"""YouTube thumbnails (1280x720), one per kinetic look, in that look's colours and texture.

    python3 promotion/videos/_tools/thumbs.py            # writes promotion/videos/thumbs/NN-look.html
    node ~/Projects/scratch/rc-submit/demo/shoot-thumbs.mjs   # screenshots them to _out/thumbs/*.jpg

Same hook as the films: "Which part is still yours?", with a human work and its AI counterpart.
"""
from pathlib import Path

SITE = Path(__file__).resolve().parents[3]
OUT = SITE / "promotion" / "videos" / "thumbs"
W = "../../../assets/works/"
F = "../../../assets/fonts/"

LOOKS = {
    "01-punch": dict(
        bg="#ff3d8b", ink="#fff", acc_bg="#ffd23f", acc_ink="#160b2e", badge_bg="#160b2e", badge_ink="#fff",
        extra="", font="Geist", weight=900, upper=False),
    "02-zoom": dict(
        bg="#050505", ink="#fff", acc_bg="transparent", acc_ink="#d4ff3a", badge_bg="#d4ff3a", badge_ink="#050505",
        extra="".join(f'<div class="ring" style="width:{s}px;height:{s}px;margin:-{s//2}px 0 0 -{s//2}px"></div>' for s in (300, 560, 820, 1080, 1340)),
        font="Geist", weight=900, upper=True),
    "03-fly": dict(
        bg="linear-gradient(180deg,#0b0020 0%,#2a0845 55%,#6b0f6a 74%,#120022 74.5%)", ink="#fff", acc_bg="transparent", acc_ink="#4df3ff",
        badge_bg="#4df3ff", badge_ink="#120022",
        extra='<div class="sun"></div><div class="floor"></div>', font="Geist", weight=900, upper=False, glow=True),
    "04-scroll": dict(
        bg="#fbf8f1", ink="#1c1530", acc_bg="linear-gradient(transparent 60%,#ffc2df 60%)", acc_ink="#6d3be8",
        badge_bg="#6d3be8", badge_ink="#fff", extra='<div class="dots"></div>', font="Geist", weight=900, upper=False),
    "05-glitch": dict(
        bg="#000", ink="#fff", acc_bg="#2b5bff", acc_ink="#fff", badge_bg="#fff", badge_ink="#000",
        extra='<div class="grid">' + "".join(f'<img src="{W}{k}.jpg" alt="">' for k in
              ["vangogh", "ai_night", "vermeer", "ai_portrait", "monet", "ai_harbor", "klimt", "ai_park", "seurat",
               "rembrandt", "ai_oldman", "jeongseon"]) + '</div><div class="veil"></div>',
        font="Geist", weight=900, upper=False, bars=True),
}

CSS = """
@font-face { font-family: "Geist"; src: url("{F}geist-latin.woff2") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Instrument Serif"; src: url("{F}instrument-serif-latin.woff2") format("woff2"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1280px; height: 720px; overflow: hidden; }
.t { position: relative; width: 1280px; height: 720px; overflow: hidden; background: {bg}; font-family: "{font}", sans-serif; color: {ink}; }
.ring { position: absolute; left: 70%; top: 50%; border-radius: 50%; border: 3px solid rgba(212,255,58,.25); }
.sun { position: absolute; left: 860px; top: 300px; width: 300px; height: 300px; margin-left: -150px; border-radius: 50%; opacity: .45;
       background: linear-gradient(180deg,#ffd36e,#ff4f9a 70%); -webkit-mask: repeating-linear-gradient(180deg,#000 0 20px,transparent 20px 27px); }
.floor { position: absolute; left: -50%; width: 200%; top: 536px; height: 600px; transform-origin: 50% 0; transform: perspective(400px) rotateX(70deg);
         background-image: linear-gradient(rgba(255,79,154,.8) 2px,transparent 2px), linear-gradient(90deg,rgba(255,79,154,.8) 2px,transparent 2px); background-size: 70px 70px; }
.dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(28,21,48,.13) 2px, transparent 2px); background-size: 36px 36px; }
.grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 1fr); }
.grid img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.15); opacity: .35; }
.veil { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.55) 60%, rgba(0,0,0,.2) 100%); }
.kick { position: absolute; left: 64px; top: 52px; font-size: 40px; font-weight: 800; letter-spacing: -0.02em; {glow} }
.kick .acc { display: inline-block; background: {acc_bg}; color: {acc_ink}; padding: 0 .1em; border-radius: .06em; }
.head { position: absolute; left: 64px; top: 124px; width: 840px; font-weight: {weight}; font-size: 64px; line-height: 1.0; letter-spacing: -0.045em; {upper} {glow} }
.head .acc { display: inline-block; background: {acc_bg}; color: {acc_ink}; padding: 0 .08em .08em; border-radius: .06em; }
{bars}
.sub { display: none; position: absolute; left: 64px; top: 372px; width: 640px; font-size: 40px; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; opacity: .92; }
{subbar}
.badge { position: absolute; left: 64px; top: 360px; padding: 14px 26px; border-radius: 999px; background: {badge_bg}; color: {badge_ink};
         font-size: 30px; font-weight: 700; letter-spacing: -0.01em; }
.faces { position: absolute; left: 64px; bottom: 52px; display: flex; gap: 14px; }
.faces img { width: 104px; height: 104px; border-radius: 50%; object-fit: cover; border: 4px solid {face_border}; box-shadow: 0 10px 24px -12px rgba(0,0,0,.6); }
.card { position: absolute; width: 230px; height: 290px; border-radius: 20px; background: #fdfcf8; padding: 14px; box-shadow: 0 30px 60px -24px rgba(0,0,0,.6); }
.card img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.card b { position: absolute; right: -16px; top: -16px; padding: 8px 18px; border-radius: 999px; font-size: 26px; font-weight: 800; }
.c1 { left: 905px; top: 70px; transform: rotate(-7deg); } .c1 b { background: #6d3be8; color: #fff; }
.c2 { left: 1010px; top: 190px; transform: rotate(6deg); } .c2 b { background: #2563eb; color: #fff; }
"""

for name, L in LOOKS.items():
    css = CSS
    subs = dict(F=F, bg=L["bg"], font=L["font"], ink=L["ink"], weight=L["weight"], acc_bg=L["acc_bg"], acc_ink=L["acc_ink"],
                badge_bg=L["badge_bg"], badge_ink=L["badge_ink"], face_border="#fff",
                upper="text-transform: uppercase; font-size: 56px;" if L.get("upper") else "",
                glow="text-shadow: 0 0 30px rgba(255,79,154,.8);" if L.get("glow") else "",
                bars=".head { word-spacing: -0.1em; } .head .w, .kick .w { background: #000; padding: 0 .08em; }" if L.get("bars") else "",
                subbar=".sub span { background: #000; padding: 0 .12em; }" if L.get("bars") else "")
    for k, v in subs.items():
        css = css.replace("{" + k + "}", str(v))
    W2 = lambda t: " ".join(f'<span class="w">{x}</span>' for x in t.split())
    kick = W2("Which part is still") + ' <span class="acc">yours?</span>'
    title = W2("Rethinking") + '<br><span class="acc">Human Creativity</span> ' + W2("✦") + "<br>" + W2("in the Generative AI Era")
    faces = "".join(f'<img src="../../../assets/people/{f}" alt="">' for f in
                    ["hye-young.jpg", "elise.jpg", "erzhen.jpg", "david.jpg", "nic.jpg", "jun.jpg", "juho.jpg", "takeo.jpg", "ryo.jpg"])
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="t">{L["extra"]}
  <p class="kick">{kick}</p>
  <h1 class="head">{title}</h1>
  <p class="sub"><span>Share artwork made with or without AI.</span></p>
  <div class="card c1"><img src="{W}hokusai.jpg" alt=""><b>Human</b></div>
  <div class="card c2"><img src="{W}ai_wave.jpg" alt=""><b>AI</b></div>
  <p class="badge">CHI 2027 Meet-Up · Call for artwork</p>
  <div class="faces">{faces}</div>
</div></body></html>"""
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.html").write_text(html)
    print("wrote", OUT / f"{name}.html")
