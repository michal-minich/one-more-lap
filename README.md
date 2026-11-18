# One More Lap

**Follow the Road**

One More Lap is a 3D browser racer by Possible Matter. Drive sixteen circuits in either direction, race AI drivers or chase your own lap times, and unlock cars and upgrades as you collect coins. The game saves progress on your device and can run offline.

[Play One More Lap](https://possible-matter.com/one-more-lap/)

## Run locally

Install Node.js 24 or newer.

```sh
npm ci
npm run dev
```

Open [127.0.0.1:43195](http://127.0.0.1:43195/). Pick a car and circuit in the garage, then choose **Play** and **Start**. Drive with the arrow keys or WASD. Press **C** to change camera, **R** to recover to the road, and **Esc** to pause. Touch devices have on-screen controls.

## Build and test

```sh
npm run check
npm run build
npm run preview
```

Stop the dev server before starting the preview. Both use port 43195. The build writes to `.build/site/`. To play from disk, open its `index.html` and keep the rest of the directory beside it. To host it, serve the whole directory. An HTTPS or localhost preview can cache the game for offline play.

## Explore the code

| Path | What it contains |
| --- | --- |
| `src/main.ts` and `src/app/` | Browser entry point, garage, and race session |
| `src/game/` | Circuits, vehicle physics, race rules, and progression |
| `src/render/` | Babylon.js scenes, cameras, scenery, and weather |
| `src/ui/`, `src/browser/`, and `src/audio/` | Interface, local saves, offline updates, and audio |
| `test/` | Tests for driving, circuits, race rules, and saved progress |

See [Credits](CREDITS.md) for the soundtrack, fonts, and engine notices.
