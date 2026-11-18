"""Small deterministic instruments for the offline soundtrack render."""

from functools import lru_cache

import numpy as np

RATE = 44_100
TAU = 2 * np.pi


def note(kind: str, midi: int, duration: float, phase_offset: float = 0):
    tail = .28 if kind in ("glass", "pad", "mallet") else .17
    t = np.arange(round((duration + tail) * RATE)) / RATE
    frequency = 440 * 2 ** ((midi - 69) / 12)
    phase = TAU * frequency * t + phase_offset
    release = np.exp(-np.maximum(0, t - duration) / (tail * .29))
    cutoff = np.clip((t[-1] - t) * 150, 0, 1)
    sine = np.sin(phase)
    if kind == "bass":
        signal = .76 * sine + .21 * np.sin(2 * phase) + .10 * np.sin(3 * phase) * np.exp(-9 * t)
        envelope = np.minimum(1, t / .008) * (.70 + .30 * np.exp(-5 * t))
    elif kind == "pad":
        left = np.sin(phase * .997) + .18 * np.sin(3 * phase * .997)
        right = np.sin(phase * 1.004) + .13 * np.sin(5 * phase * 1.004)
        signal = .41 * (left + right)
        envelope = np.minimum(1, t / .13) * (.88 + .12 * np.exp(-t * 3))
    elif kind in ("lute", "pluck"):
        brightness = (1.6 if kind == "lute" else .85) * np.exp(-t * 16)
        signal = .68 * np.sin(phase + brightness * np.sin(phase * 2)) + .19 * np.sin(phase * 2.005)
        signal += .09 * np.sin(phase * 3.012) * np.exp(-t * 14)
        envelope = np.minimum(1, t / .004) * np.exp(-t * (5.1 if kind == "lute" else 4.0))
    elif kind in ("glass", "mallet"):
        ratio = 2.012 if kind == "glass" else 3.98
        strike = .29 * np.sin(ratio * phase) * np.exp(-t * 14)
        sparkle = .09 * np.sin(phase * (4.14 if kind == "glass" else 9.5)) * np.exp(-t * 31)
        signal = .71 * sine + strike + sparkle
        envelope = np.minimum(1, t / .006) * np.exp(-t * (3.0 if kind == "glass" else 5.6))
    elif kind == "reed":
        signal = .66 * sine + .20 * np.sin(3 * phase) + .072 * np.sin(5 * phase + .38)
        signal *= 1 - .06 * np.sin(t * TAU * 6.7)
        envelope = np.minimum(1, t / .021) * (.75 + .25 * np.exp(-t * 7))
    elif kind == "pulse":
        signal = sum(np.sin(harmonic * phase) * np.exp(-.4 * (harmonic - 1)) / harmonic
                     for harmonic in range(1, 8))
        signal = (.72 * signal + .15 * np.sin(phase * 1.003)) * (1 - .13 * np.sin(t * TAU * 5.2))
        envelope = np.minimum(1, t / .014) * (.71 + .29 * np.exp(-t * 11))
    else:
        raise ValueError(kind)
    return (signal * envelope * release * cutoff).astype(np.float32)


@lru_cache(maxsize=8)
def drum(kind: str):
    seed = sum(ord(character) for character in kind)
    random = np.random.default_rng(seed)
    duration = .38 if kind in ("kick", "tom") else .24
    t = np.arange(round(duration * RATE)) / RATE
    noise = random.uniform(-1, 1, t.size)
    hiss = noise - np.roll(noise, 1)
    if kind == "kick":
        phase = TAU * (49 * t + 3.7 * (1 - np.exp(-t * 39)))
        signal = np.sin(phase) * np.exp(-t * 15) + .065 * hiss * np.exp(-t * 150)
    elif kind == "snare":
        tone = np.sin(TAU * (162 * t + .33 * (1 - np.exp(-t * 33)))) * np.exp(-t * 34)
        signal = .57 * noise * np.exp(-t * 18) + .22 * hiss * np.exp(-t * 67) + .25 * tone
    elif kind == "hat":
        signal = .62 * hiss * np.exp(-t * 66)
    elif kind == "ride":
        cymbal = sum(np.sin(TAU * pitch * t) for pitch in (4_513, 5_103, 6_213, 7_743, 8_497)) * .09
        signal = (.45 * hiss + cymbal) * np.exp(-t * 19)
    elif kind == "tom":
        phase = TAU * (99 * t + .76 * (1 - np.exp(-t * 39)))
        signal = .89 * np.sin(phase) * np.exp(-t * 19) + .1 * hiss * np.exp(-t * 103)
    else:
        raise ValueError(kind)
    onset = np.clip(t * 780, 0, 1)
    end = np.clip((duration - t) * 230, 0, 1)
    return (signal * onset * end).astype(np.float32)
