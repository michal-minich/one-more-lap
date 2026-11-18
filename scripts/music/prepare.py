"""Render the credited circuit loops from the downloaded artist recordings."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
from subprocess import PIPE, run
from tempfile import TemporaryDirectory

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "src" / "audio" / "soundtrack.json"
LICENSE = "CC BY 4.0, https://creativecommons.org/licenses/by/4.0/"
RATE = 44_100
SEAM = round(RATE * 0.18)


def make_loop(source: Path, start_seconds: float, seconds: float) -> np.ndarray:
    decoded = run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(source),
        "-map", "0:a:0", "-ac", "2", "-ar", str(RATE), "-f", "f32le", "pipe:1",
    ], stdout=PIPE, check=True).stdout
    samples = np.frombuffer(decoded, dtype="<f4").reshape(-1, 2)
    start = round(start_seconds * RATE)
    end = start + round(seconds * RATE)
    if start < SEAM or end > len(samples):
        raise ValueError(f"Loop cut lies outside {source.name}")
    loop = samples[start:end].copy()
    fade = np.linspace(0, 1, SEAM, dtype=np.float32)[:, None]
    loop[-SEAM:] = loop[-SEAM:] * (1 - fade) + samples[start - SEAM:start] * fade
    peak = np.max(np.abs(loop))
    rms = np.sqrt(np.mean(loop**2))
    loop *= min(10 ** (-18 / 20) / rms, 10 ** (-1.5 / 20) / peak)
    return loop


def encode(destination: Path, loop: np.ndarray, track: dict):
    run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "f32le",
        "-ac", "2", "-ar", str(RATE), "-i", "pipe:0", "-codec:a", "libmp3lame", "-b:a", "80k",
        "-metadata", "title=" + track["title"], "-metadata", "artist=" + track["artist"],
        "-metadata", "copyright=" + LICENSE,
        "-metadata", "comment=Shortened, looped and level-matched for One More Lap. " + track["source"],
        str(destination),
    ], input=loop.astype("<f4", copy=False).tobytes(), check=True)


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("originals", type=Path, help="Directory containing the original MP3s, named by circuit ID")
    originals = parser.parse_args().originals
    tracks = {name: track for name, track in json.loads(CATALOG.read_text()).items() if "sha256" in track}
    for circuit, track in tracks.items():
        source = originals / (circuit + ".mp3")
        if sha256(source.read_bytes()).hexdigest() != track["sha256"]:
            raise ValueError(f"The source file for {circuit} does not match the credited recording")

    runtime = ROOT / ".runtime"
    runtime.mkdir(exist_ok=True)
    destination = ROOT / "public" / "music"
    with TemporaryDirectory(prefix="redline-music-", dir=runtime) as staging:
        output = Path(staging)
        for circuit, track in tracks.items():
            filename = circuit + ".mp3"
            loop = make_loop(originals / filename, track["start"], track["duration"])
            encode(output / filename, loop, track)
            print(f"{circuit:8} {len(loop) / RATE:5.1f}s  {(output / filename).stat().st_size // 1024:3} KiB")
        destination.mkdir(exist_ok=True)
        for file in output.iterdir():
            file.replace(destination / file.name)


if __name__ == "__main__":
    main()
