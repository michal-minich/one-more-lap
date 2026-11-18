"""Render the original One More Lap themes as stereo MP3 loops."""

from argparse import ArgumentParser
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from wave import open as wave_open

import numpy as np

from instruments import RATE, drum, note
from scores import SCORES, Score

BARS = 24
MUSIC = Path(__file__).resolve().parents[2] / ".runtime" / "original-music"

KICKS = {
    "four": (0, 1, 2, 3),
    "break": (0, 1.5, 2.25, 3.5),
    "shuffle": (0, .75, 2, 2.75),
    "wood": (0, 1.5, 2.75),
    "half": (0, 1.25, 2.75, 3.5),
}
BASS = {
    "four": ((.5, 0, .45), (1.5, 0, .42), (2.5, 4, .44), (3.5, 7, .43)),
    "break": ((0, 0, .64), (1, 7, .37), (1.75, 0, .42), (2.5, 4, .38), (3.25, 0, .50)),
    "shuffle": ((0, 0, .69), (1.25, 0, .41), (2, 4, .67), (3.25, 1, .49)),
    "wood": ((0, 0, .65), (1.5, 4, .48), (2.5, 0, .37), (3.5, 7, .39)),
    "half": ((0, 0, .80), (1.25, 0, .48), (2.5, 7, .38), (3, 4, .46), (3.5, 0, .43)),
}


class Mix:
    def __init__(self, score: Score):
        self.score = score
        self.beat = 60 / score.bpm
        self.samples = np.zeros((round(BARS * 4 * self.beat * RATE), 2), dtype=np.float32)
        self.random = np.random.default_rng(8_103 + score.bpm + score.key * 30)

    def time(self, beat: float) -> float:
        syncopation = beat % 1
        return (beat + (self.score.swing if syncopation >= .49 else 0)) * self.beat

    def add(self, sound, time: float, amplitude: float, pan: float = 0):
        start = round(time * RATE) % len(self.samples)
        # Wrap note and room tails across the loop seam.
        head = min(len(sound), len(self.samples) - start)
        stereo = sound[:, None] * np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)]) * amplitude
        self.samples[start:start + head] += stereo[:head]
        self.samples[:len(sound) - head] += stereo[head:]

    def pitch(self, degree: int, octave: int) -> int:
        relative, index = divmod(degree, len(self.score.mode))
        return self.score.key + self.score.mode[index] + (octave + relative) * 12

    def play(self, voice: str, beat: float, degree: int, octave: int, duration: float, volume: float, pan: float = 0):
        pitch = self.pitch(degree, octave)
        tone = note(voice, pitch, duration * self.beat, self.random.uniform(0, .5))
        self.add(tone, self.time(beat), volume * self.random.uniform(.94, 1.05), pan)

    def drums(self, bar: int, energy: int):
        start = bar * 4
        for beat in (0, 2.5) if energy == 0 else KICKS[self.score.rhythm]:
            self.add(drum("kick"), self.time(start + beat), .45 if beat == 0 else .38)
        for beat in (2,) if self.score.rhythm == "half" else (1, 3):
            self.add(drum("snare"), self.time(start + beat), .32 if energy else .23, .04)
        if energy == 0:
            return
        for tick in range(8):
            beat = tick * .5
            voice = "ride" if tick in (1, 5) and energy == 2 else "hat"
            pan = -.32 if tick % 2 else .27
            gain = (.18 if tick % 2 else .10) * self.random.uniform(.80, 1.12)
            self.add(drum(voice), self.time(start + beat), gain, pan)
        if self.score.rhythm in ("wood", "shuffle") or bar % 4 == 3:
            for beat in (2.75, 3.5) if bar % 4 == 3 else (1.75, 3.25):
                self.add(drum("tom"), self.time(start + beat), .21 if beat >= 3 else .16, -.32)

    def harmony(self, bar: int, root: int, energy: int):
        start = bar * 4
        for i, interval in enumerate((0, 2, 4, 6) if energy else (0, 2, 4)):
            # Spread chord voices so the bass and lead leave room for the engine.
            octave = -1 if interval == 0 else 0
            pan = (-.64, .53, -.28, .33)[i]
            self.play("pad", start + i * .045, root + interval, octave, 3.67, .14 if energy else .17, pan)
        if energy > 0:
            for beat, degree, duration in BASS[self.score.rhythm]:
                self.play("bass", start + beat, root + degree, -2, duration, .36 if energy == 2 else .28)
            for beat, interval in ((.5, 4), (1.75, 2), (2.5, 4), (3.5, 6)):
                self.play("pluck", start + beat, root + interval, 0, .30, .16, .32 if beat < 2 else -.31)
        else:
            self.play("bass", start, root, -2, 1.7, .24)
            self.play("glass", start + 1.75, root + 4, 1, .77, .16, -.44)
            self.play("glass", start + 3, root + 2, 1, .67, .14, .41)

    def theme(self, bar: int, energy: int):
        for i, (step, degree, length) in enumerate(self.score.melody):
            if energy == 1 and i % 4 == 3:
                continue
            root = self.score.chords[(bar + int(step / 4)) % len(self.score.chords)]
            octave = 1 if self.score.key < 62 or degree < 5 else 0
            onset = bar * 4 + step
            voice = self.score.voice
            self.play(voice, onset, root + degree, octave, length, .29 if energy == 2 else .23, -.10)
            self.play(voice, onset + .74, root + degree, octave, length * .72, .071, .55)
            if energy == 2 and i % 3 == 1:
                self.play("glass", onset + .14, root + degree - 2, octave, length * .68, .090, -.48)

    def render(self):
        for bar in range(BARS):
            energy = 0 if bar in (16, 17, 18) else 2 if 8 <= bar < 16 or bar >= 20 else 1
            self.drums(bar, energy)
            self.harmony(bar, self.score.chords[bar % len(self.score.chords)], energy)
            if bar % 2 == 0 and bar not in (0, 16, 18):
                self.theme(bar, energy)
        clean = self.samples
        room = np.roll(clean[:, ::-1], round(.037 * RATE), axis=0) * .082
        room += np.roll(clean, round(.062 * RATE), axis=0) * .057
        room += np.roll(clean[:, ::-1], round(.111 * RATE), axis=0) * .029
        stereo = clean + room
        stereo -= stereo.mean(axis=0, keepdims=True)
        rms = np.sqrt(np.mean(np.square(stereo)))
        gain = min(1.5, .155 / rms)
        return (np.tanh(stereo * gain) * 30_400).astype("<i2")


def encode(score: Score, temporary: Path):
    wave = temporary / (score.circuit + ".wav")
    pcm = Mix(score).render()
    with wave_open(str(wave), "wb") as audio:
        audio.setnchannels(2)
        audio.setsampwidth(2)
        audio.setframerate(RATE)
        audio.writeframes(pcm.tobytes())
    destination = MUSIC / (score.circuit + ".mp3")
    run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wave), "-codec:a", "libmp3lame",
        "-b:a", "96k", "-metadata", "title=" + score.title, "-metadata", "album=One More Lap",
        "-metadata", "TBPM=" + str(score.bpm), str(destination),
    ], check=True)
    print(f"{score.circuit:8} {score.bpm:3} BPM  {len(pcm) / RATE:5.1f}s  {destination.stat().st_size // 1024:3} KiB")


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("circuits", nargs="*", metavar="CIRCUIT")
    selected = set(parser.parse_args().circuits)
    unknown = selected - {score.circuit for score in SCORES}
    if unknown:
        parser.error("Unknown circuits: " + ", ".join(sorted(unknown)))
    MUSIC.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="redline-score-") as directory:
        for piece in SCORES:
            if not selected or piece.circuit in selected:
                encode(piece, Path(directory))
