"""Original music for the kinetic promo films, synthesized from scratch (numpy + scipy).

Five genres, each a pattern set over a chord loop. The arrangement follows the film: a list of
(section, beats) pairs, so a drop lands exactly when the four questions start, a break when the
camera calms down, and a final hit on the outro. Nothing sampled, so no copyright question.

    uv run --with numpy --with scipy kmusic.py house 124 out.wav intro:8 build:4 drop:16 ...
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
RNG = np.random.default_rng(7)
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
NOTE.update({"Db": 1, "Eb": 3, "Gb": 6, "Ab": 8, "Bb": 10})


def hz(name):
    """'A3' -> 220.0"""
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69) / 12)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def filt(x, kind, f, order=2):
    if kind == "band":
        sos = butter(order, [f[0] / (SR / 2), min(f[1] / (SR / 2), 0.99)], btype="band", output="sos")
    else:
        sos = butter(order, min(f / (SR / 2), 0.99), btype=kind, output="sos")
    return sosfilt(sos, x)


def saw(f, t, phase=0.0):
    return 2 * np.mod(f * t + phase, 1.0) - 1


def square(f, t, duty=0.5):
    return np.where(np.mod(f * t, 1.0) < duty, 1.0, -1.0)


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.08):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return e * rel


# ------------------------------------------------------------------ instruments
def kick(punch=1.0, decay=0.32, f0=160, f1=46):
    t = t_(0.6)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / decay)
    click = filt(RNG.standard_normal(len(t)), "high", 2500) * np.exp(-t / 0.004) * 0.25 * punch
    return np.tanh(1.6 * (body + click))


def snare(tone=190, decay=0.14, bright=1.0):
    t = t_(0.5)
    n = filt(RNG.standard_normal(len(t)), "band", (1200, 7000 * bright)) * np.exp(-t / decay)
    b = np.sin(2 * np.pi * tone * t) * np.exp(-t / 0.06)
    return 0.8 * n + 0.6 * b


def clap():
    t = t_(0.4)
    n = filt(RNG.standard_normal(len(t)), "band", (900, 3200))
    env = np.zeros(len(t))
    for k in (0.0, 0.011, 0.022):
        env += np.where(t >= k, np.exp(-(t - k) / (0.012 if k < 0.02 else 0.14)), 0)
    return n * env * 0.9


def hat(open_=False, vol=1.0):
    t = t_(0.35 if open_ else 0.08)
    n = filt(RNG.standard_normal(len(t)), "high", 7500)
    return n * np.exp(-t / (0.11 if open_ else 0.022)) * 0.5 * vol


def rim():
    t = t_(0.08)
    return (np.sin(2 * np.pi * 1700 * t) + 0.5 * filt(RNG.standard_normal(len(t)), "band", (2000, 6000))) * np.exp(-t / 0.012) * 0.5


def bass(f, dur, cut=900, kind="saw", detune=0.0, glide_from=None):
    t = t_(dur)
    fr = np.full(len(t), f) if glide_from is None else f + (glide_from - f) * np.exp(-t / 0.05)
    ph = np.cumsum(fr) / SR
    if kind == "sub":
        x = np.sin(2 * np.pi * ph)
        x = np.tanh(2.2 * x)
    elif kind == "reese":
        x = (2 * np.mod(ph * (1 + detune), 1) - 1) + (2 * np.mod(ph * (1 - detune), 1) - 1)
        x = filt(x * 0.5, "low", cut) + 0.5 * np.sin(2 * np.pi * ph)
    else:
        x = filt(2 * np.mod(ph, 1) - 1, "low", cut) + 0.6 * np.sin(2 * np.pi * ph)
    return x * adsr(len(t), 0.004, dur * 0.6, 0.6, 0.03)


def pluck(f, dur=0.3, cut=3200, decay=0.18):
    t = t_(max(dur, 0.25))
    x = saw(f, t) + 0.6 * saw(f * 1.006, t, 0.3)
    return filt(x, "low", cut) * np.exp(-t / decay) * 0.5


def pad(freqs, dur, cut=1400, attack=0.25):
    t = t_(dur)
    x = np.zeros(len(t))
    for f in freqs:
        for d in (0.994, 1.0, 1.007):
            x += saw(f * d, t, RNG.random())
    x = filt(x / (3 * len(freqs)), "low", cut)
    return x * adsr(len(t), attack, 0.5, 0.85, min(0.4, dur / 3))


def stab(freqs, dur=0.18, bright=2600):
    t = t_(dur + 0.1)
    x = sum(square(f, t, 0.35) + 0.7 * saw(f * 1.004, t) for f in freqs) / len(freqs)
    return filt(x, "band", (250, bright)) * np.exp(-t / (dur * 0.55)) * 0.55


def riser(dur):
    t = t_(dur)
    n = RNG.standard_normal(len(t))
    lo = filt(n, "band", (400, 1500)) * (t / dur) ** 2
    hi = filt(n, "high", 4000) * (t / dur) ** 3
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1800 * (t / dur) ** 2) / SR) * (t / dur) ** 2 * 0.25
    return (lo * 0.6 + hi * 0.5 + sweep) * 0.6


def impact():
    t = t_(1.8)
    boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t / 0.6) + 32) / SR) * np.exp(-t / 0.7)
    n = filt(RNG.standard_normal(len(t)), "low", 3000) * np.exp(-t / 0.25) * 0.5
    return np.tanh(1.5 * (boom + n))


def reverb(x, secs=1.6, mix=0.22, tone=5000):
    n = int(secs * SR)
    ir = RNG.standard_normal(n) * np.exp(-np.arange(n) / SR / (secs / 5))
    ir = filt(ir, "low", tone)
    ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x + mix * wet


# ------------------------------------------------------------------ genres
# steps are 16ths within a bar; chords are per bar
GENRES = {
    "house": dict(chords=[["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C4", "E4", "G4"], ["G3", "B3", "D4"]],
                  roots=["A1", "F1", "C2", "G1"], kick=[0, 4, 8, 12], snare=[], clap=[4, 12],
                  hats=[2, 6, 10, 14], open=[2, 6, 10, 14], bass="offbeat", lead="arp16", stabs=[], pad=True),
    "breaks": dict(chords=[["D4", "F4", "A4"], ["A#3", "D4", "F4"], ["F3", "A3", "C4"], ["C4", "E4", "G4"]],
                   roots=["D1", "A#0", "F1", "C1"], kick=[0, 10], snare=[4, 12], ghost=[7, 15], clap=[],
                   hats=list(range(0, 16, 2)), open=[], bass="reese", lead=None, stabs=[0, 3, 6], pad=False),
    "synthwave": dict(chords=[["E3", "G3", "B3"], ["C3", "E3", "G3"], ["G3", "B3", "D4"], ["D3", "F#3", "A3"]],
                      roots=["E1", "C1", "G1", "D1"], kick=[0, 8], snare=[4, 12], clap=[], hats=list(range(16)),
                      open=[], bass="eighths", lead="arpupdown", stabs=[], pad=True, gated=True),
    "disco": dict(chords=[["D3", "F3", "A3", "C4"], ["G3", "B3", "D4", "F4"], ["C3", "E3", "G3", "B3"], ["A3", "C4", "E4", "G4"]],
                  roots=["D1", "G1", "C1", "A1"], kick=[0, 4, 8, 12], snare=[], clap=[4, 12], hats=list(range(16)),
                  open=[2, 6, 10, 14], bass="octave", lead=None, stabs=[2, 6, 10, 14], pad=True),
    "glitch": dict(chords=[["C4", "D#4", "G4"], ["G#3", "C4", "D#4"], ["D#4", "G4", "A#4"], ["A#3", "D4", "F4"]],
                   roots=["C1", "G#0", "D#1", "A#0"], kick=[0, 7, 10], snare=[], clap=[8], hats=list(range(16)),
                   rolls=[13, 14, 15], open=[], bass="808", lead="melody", stabs=[], pad=False),
}
MELODY = [0, 3, 7, 10, 12, 10, 7, 5]  # minor pentatonic-ish steps for the glitch lead


def build(genre, bpm, sections, out):
    g = GENRES[genre]
    beat = 60.0 / bpm
    step = beat / 4
    total_beats = sum(b for _, b in sections)
    n = int((total_beats * beat + 2.5) * SR)
    drums, bassb, music, fx = (np.zeros(n) for _ in range(4))
    kicks = []

    def put(buf, x, at, vol=1.0):
        i = int(at * SR)
        if i >= n:
            return
        j = min(n, i + len(x))
        buf[i:j] += x[: j - i] * vol

    K, S, C, R = kick(), snare(), clap(), rim()
    HC, HO = hat(), hat(True)
    sec_start = 0
    for si, (name, beats) in enumerate(sections):
        nxt = sections[si + 1][0] if si + 1 < len(sections) else None
        for b in range(beats):
            gb = sec_start + b
            bar, beat_in_bar = divmod(gb, 4)
            ch = g["chords"][bar % 4]
            root = hz(g["roots"][bar % 4])
            for s in range(4):
                st = beat_in_bar * 4 + s
                at = gb * beat + s * step
                full = name in ("drop",)
                drums_on = name not in ("break", "outro") or (name == "outro" and b == 0)
                # --- drums
                if drums_on:
                    if st in g["kick"] and not (name == "build" and b == beats - 1):
                        put(drums, K, at, 1.0); kicks.append(at)
                    if st in g["snare"] and name != "intro":
                        sn = snare(decay=0.25) if g.get("gated") else S
                        put(drums, sn, at, 0.8)
                    if st in g.get("ghost", []) and name != "intro":
                        put(drums, S, at, 0.22)
                    if st in g["clap"] and name != "intro":
                        put(drums, C, at, 0.75)
                    if st in g["hats"]:
                        acc = 0.55 if st % 4 == 2 else 0.32
                        put(drums, HC, at, acc * (0.6 if name == "intro" else 1))
                    if st in g["open"] and name in ("drop", "groove"):
                        put(drums, HO, at, 0.35)
                    if st in g.get("rolls", []) and full:
                        for r in range(2):
                            put(drums, HC, at + r * step / 2, 0.3)
                    if genre == "breaks" and st in (2, 13) and name in ("drop", "groove"):
                        put(drums, R, at, 0.6)
                if name == "build":  # snare roll, faster in its last beat
                    k = 2 if b < beats - 1 else 4
                    if s % (4 // k) == 0:
                        put(drums, S, at, 0.25 + 0.5 * b / beats)
                    if s % 2 == 1 and b == beats - 1:
                        put(drums, S, at, 0.6)
                # --- bass
                if name in ("intro", "drop", "groove", "break", "build") and not (name == "build" and b == beats - 1):
                    bk = g["bass"]
                    if bk == "offbeat" and s == 2:
                        put(bassb, bass(root * 2, step * 1.6, cut=700), at, 0.9)
                    elif bk == "eighths" and s % 2 == 0:
                        put(bassb, bass(root * (2 if s == 2 else 1) * 2, step * 1.7, cut=1100), at, 0.75)
                    elif bk == "octave" and s % 2 == 0:
                        put(bassb, bass(root * (4 if s == 2 else 2), step * 1.6, cut=1300), at, 0.8)
                    elif bk == "reese" and st == 0:
                        put(bassb, bass(root * 2, beat * 4 * 0.95, cut=600, kind="reese", detune=0.008), at, 0.75)
                    elif bk == "808" and st in g["kick"]:
                        prev = hz(g["roots"][(bar - 1) % 4]) * 2 if st == 0 else None
                        put(bassb, bass(root * 2, step * 5, kind="sub", glide_from=prev), at, 0.9)
                # --- harmony and lead
                has_pad = g["pad"] or name == "break"  # every genre keeps a chord bed in the break
                if has_pad and s == 0 and (b == 0 or beat_in_bar == 0):
                    if name in ("intro", "drop", "groove", "break", "build"):
                        span = min(4, beats - b) * beat
                        cut = 900 if name in ("intro", "build") else 1800
                        put(music, pad([hz(x) for x in ch], span, cut=cut), at, 0.38 if name != "break" else 0.5)
                if st in g["stabs"] and name in ("drop", "groove"):
                    put(music, stab([hz(x) for x in ch]), at, 0.5)
                if name in ("drop", "break") or (name == "groove" and genre == "synthwave"):
                    lead = g["lead"]
                    notes = [hz(x) * 2 for x in ch]
                    if lead == "arp16":
                        put(music, pluck(notes[(st + bar) % len(notes)] * (2 if st % 8 == 7 else 1), step * 1.2), at, 0.3)
                    elif lead == "arpupdown":
                        seq = notes + notes[-2:0:-1]
                        put(music, pluck(seq[st % len(seq)], step * 1.5, cut=4200, decay=0.12), at, 0.28)
                    elif lead == "melody" and st in (0, 3, 6, 8, 11, 14):
                        f = hz(g["roots"][bar % 4]) * 16 * 2 ** (MELODY[(st + bar * 3) % len(MELODY)] / 12)
                        put(music, pluck(f, step * 2, cut=5000, decay=0.2), at, 0.3)
        if name == "build":
            put(fx, riser(beats * beat), sec_start * beat, 0.7)
        if nxt == "drop" or (name == "outro"):
            pass
        if name in ("drop",) or (name == "outro"):
            put(fx, impact(), sec_start * beat, 0.6 if name == "drop" else 0.8)
        if name == "outro":  # final chord rings out
            ch = g["chords"][0]
            put(music, pad([hz(x) for x in ch], beats * beat + 1.5, cut=1600, attack=0.02), sec_start * beat, 0.5)
            put(music, stab([hz(x) for x in ch], 0.4), sec_start * beat, 0.6)
        sec_start += beats

    # sidechain pump on everything tonal
    env = np.ones(n)
    tt = np.arange(n) / SR
    for k in kicks:
        i, j = int(k * SR), min(n, int((k + 0.3) * SR))
        env[i:j] = np.minimum(env[i:j], 1 - 0.55 * np.exp(-(tt[i:j] - k) / 0.09))
    music = reverb(music, 1.8, 0.3) * env
    bassb = bassb * (0.6 + 0.4 * env)
    drums = reverb(drums, 1.2 if g.get("gated") else 0.6, 0.18 if g.get("gated") else 0.08)
    mix = 0.9 * drums + 0.8 * bassb + 0.75 * music + 0.6 * reverb(fx, 2.0, 0.3)
    mix = filt(mix, "high", 28)
    mix = np.tanh(1.3 * mix / (np.max(np.abs(mix)) + 1e-9) * 1.4)
    mix = mix / np.max(np.abs(mix)) * 0.89
    # gentle stereo: a few ms of delay on the right
    right = np.concatenate([np.zeros(int(0.007 * SR)), mix])[:n]
    st = np.stack([mix * 0.98 + right * 0.02, right * 0.6 + mix * 0.4], axis=1)
    pcm = (st * 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    return n / SR


if __name__ == "__main__":
    genre, bpm, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
    secs = [(a.split(":")[0], int(a.split(":")[1])) for a in sys.argv[4:]]
    print(round(build(genre, bpm, secs, out), 2))
