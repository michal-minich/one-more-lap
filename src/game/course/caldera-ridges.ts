import type { GroundHeight } from "./ground-height.ts";
import type { Surface } from "./surface.ts";

type Ridge = readonly [
    x: number, z: number, width: number, depth: number, height: number, yaw: number,
];

const ridges: readonly Ridge[] = [
    [164, 367, 55, 29, 29, 0.32], [238, 421, 82, 44, 51, -0.28],
    [311, 376, 73, 31, 34, 0.23], [374, 432, 86, 45, 56, -0.38],
    [134, 148, 49, 27, 16, 0.48], [222, 105, 54, 25, 23, -0.52],
    [355, -30, 60, 35, 22, 0.63], [95, -173, 82, 33, 27, -0.18],
    [-112, 318, 50, 26, 26, -0.74],
    [502, 166, 112, 33, 36, 0.54], [631, 118, 103, 28, 31, 0.91],
    [767, 284, 126, 38, 58, -0.31], [920, 246, 116, 42, 52, -0.43],
    [837, 26, 89, 26, 30, 1.18], [921, -195, 133, 44, 44, 0.24],
    [693, -252, 118, 34, 33, 0.31], [493, -296, 121, 34, 29, -0.23],
    [416, -120, 66, 29, 22, 0.42],
];

// The narrow transitions between levels form exposed cliff bands and flat ash shelves.
const profile = [
    [-0.31, -0.08], [-0.20, 0.10], [-0.15, 0.33], [0.04, 0.39],
    [0.09, 0.64], [0.30, 0.71], [0.35, 0.92], [0.46, 1],
    [0.59, 0.79], [0.84, -0.12],
] as const;

export function calderaRidges(ground: GroundHeight): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const steps = 16;
    for (const [index, [x, z, width, depth, height, yaw]] of ridges.entries()) {
        const start = positions.length / 3;
        const sin = Math.sin(yaw);
        const cos = Math.cos(yaw);
        for (let step = 0; step <= steps; step++) {
            const t = step / steps;
            const end = Math.sin(Math.PI * t) ** 0.64;
            const spur = 0.87 + Math.sin(step * 1.39 + index * 2) * 0.13 + Math.cos(step * 0.47) * 0.09;
            for (const [band, [recess, heightFraction]] of profile.entries()) {
                const along = (t - 0.5) * width + Math.cos(step * 2 + band * 0.91) * end * 1.6;
                const back = depth * (recess * end + Math.sin(step * 0.72 + index) * 0.15 * end);
                const px = x + along * cos - back * sin;
                const pz = z + along * sin + back * cos;
                const bed = ground.at(px, pz) ?? 0;
                const py = bed - 1.4 + height * heightFraction * end * spur;
                positions.push(px, py, pz);
                uv.push(along / 10.7 + back * 0.035, py / 8.3 + back * 0.069);
                if (step === 0 || band === 0) continue;
                const i = start + step * profile.length + band;
                indices.push(i - profile.length - 1, i - 1, i - profile.length,
                    i - profile.length, i - 1, i);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
