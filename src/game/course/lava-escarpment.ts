import type { GroundHeight } from "./ground-height.ts";
import type { Surface } from "./surface.ts";
import { channelPoint } from "./water.ts";
import type { WaterBody } from "./water.ts";

// The first and last shelves meet the bank with their feet embedded in the terrain.
const shelves = [
    [1.55, 0], [1.94, 0.8], [2.01, 2.5], [2.33, 2.9], [2.43, 5.4], [2.89, 6.5], [3.39, 7.9], [4.2, -1.8],
] as const;

export function lavaEscarpment(ground: GroundHeight, lava: WaterBody): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const rows = 24;
    const columns = shelves.length;
    for (let row = 0; row <= rows; row++) {
        const t = row / rows;
        const downriver = -0.83 + t * 0.69;
        const taper = Math.sin(Math.PI * t) ** 0.68;
        const profile = taper * (1.05 + 0.33 * Math.sin(row * 0.91) + 0.15 * Math.cos(row * 2.67));
        for (const [column, [bank, rise]] of shelves.entries()) {
            const fracture = Math.sin(row * 1.7 + column * 1.3) * 0.105 + Math.sin(row * 0.48) * 0.19;
            const at = channelPoint(lava, downriver, bank + fracture * taper);
            const bed = ground.at(at.x, at.z) ?? lava.center.y;
            const y = bed + rise * profile - 0.52;
            positions.push(at.x, y, at.z);
            uv.push(t * 7.1 + at.x * 0.018, (y + at.z * 0.019) / 9.4);
            if (row === 0 || column === 0) continue;
            const i = row * columns + column;
            indices.push(i - columns - 1, i - 1, i - columns, i - columns, i - 1, i);
        }
    }
    return {
        positions: new Float32Array(positions), indices: new Uint32Array(indices),
        uv: new Float32Array(uv),
    };
}
