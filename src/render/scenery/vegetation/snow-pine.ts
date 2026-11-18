import type { Scene } from "@babylonjs/core/scene.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Surface } from "../../../game/course/surface.ts";
import { seededRandom } from "../../../game/random.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surface } from "../surface-mesh.ts";

interface Bough {
    readonly height: number;
    readonly width: number;
    readonly rise: number;
}

interface CanopyFinishes {
    readonly needles: StandardMaterial;
    readonly snow: StandardMaterial;
}

const sides = 14;
const tiers: readonly Bough[] = [
    { height: 1.37, width: 1.64, rise: 1.91 },
    { height: 2.16, width: 1.52, rise: 1.89 },
    { height: 3.01, width: 1.3, rise: 1.82 },
    { height: 3.79, width: 1.01, rise: 1.62 },
    { height: 4.47, width: 0.75, rise: 1.38 },
    { height: 5.12, width: 0.49, rise: 1.08 },
];

type Ring = readonly [radius: number, rise: number];
const boughProfile: readonly Ring[] = [[0.16, 0], [1, 0.13], [0.8, 0.34], [0.5, 0.65], [0.18, 0.89], [0.025, 1]];
const snowProfile: readonly Ring[] = [[0.84, 0.38], [0.59, 0.66], [0.20, 0.92], [0.026, 1.023]];

export function stampSnowPine(scene: Scene, instances: readonly Stamp[], finishes: CanopyFinishes, seed: number): void {
    const random = seededRandom(seed);
    const needles = { positions: [], indices: [], uv: [] } satisfies Geometry;
    const snow = { positions: [], indices: [], uv: [] } satisfies Geometry;
    for (const [index, tier] of tiers.entries()) {
        const turn = random() * Math.PI * 2;
        const rim = Array.from({ length: sides }, (_, edge) => {
            const angle = edge / sides * Math.PI * 2;
            return 0.82 + 0.19 * Math.sin(angle * 3 + turn) + 0.19 * random();
        });
        const drift = (seed === 71 ? 0.25 : -0.16) * (tier.height / 5.12) ** 2;
        addBough(needles, tier, rim, turn, drift, boughProfile);
        if (index % 3 === (seed === 71 ? 1 : 2)) continue;
        const snowRim = rim.map((width, edge) => width * (0.99 + 0.12 * Math.sin(edge * 2.9 + index)));
        addBough(snow, tier, snowRim, turn, drift, snowProfile);
    }
    stamp(surface(scene, "standalone pine needles", typed(needles), finishes.needles), instances);
    stamp(surface(scene, "standalone pine snow", typed(snow), finishes.snow), instances);
}

interface Geometry {
    readonly positions: number[];
    readonly indices: number[];
    readonly uv: number[];
}

function addBough(
    geometry: Geometry, tier: Bough, rim: readonly number[], turn: number, drift: number, rings: readonly Ring[],
): void {
    const base = geometry.positions.length / 3;
    for (const [row, [radius, rise]] of rings.entries()) {
        for (let edge = 0; edge <= sides; edge++) {
            const theta = edge / sides * Math.PI * 2 + turn;
            const width = tier.width * radius * rim[edge % sides]!;
            const sway = 0.12 * Math.sin(theta * 4 + turn) * radius;
            geometry.positions.push(drift + Math.cos(theta) * width,
                tier.height + rise * tier.rise + sway, Math.sin(theta) * width * 0.93);
            geometry.uv.push(edge / sides, tier.height * 0.25 + rise);
            if (row === 0 || edge === 0) continue;
            const top = base + row * (sides + 1) + edge;
            const bottom = top - sides - 1;
            geometry.indices.push(bottom - 1, bottom, top - 1, bottom, top, top - 1);
        }
    }
}

function typed(geometry: Geometry): Surface {
    return {
        positions: Float32Array.from(geometry.positions),
        indices: Uint32Array.from(geometry.indices),
        uv: Float32Array.from(geometry.uv),
    };
}
