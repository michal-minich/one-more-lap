import type { Surface } from "../../game/course/surface.ts";
import { landscapeNoise } from "../../game/course/terrain-profile.ts";

export function weldLand(patches: readonly Surface[]): Surface {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const vertices = new Map<string, number>();
    for (const patch of patches) {
        const remap: number[] = [];
        for (let i = 0; i < patch.positions.length; i += 3) {
            const x = patch.positions[i]!;
            const y = patch.positions[i + 1]!;
            const z = patch.positions[i + 2]!;
            const key = x + "," + y + "," + z;
            let index = vertices.get(key);
            if (index === undefined) {
                index = positions.length / 3;
                vertices.set(key, index);
                positions.push(x, y, z);
                const warpX = landscapeNoise(x * 0.49 + 74, z * 0.56 - 36) * 15
                    + landscapeNoise(z * 1.21 + 9, x * 1.17 - 44) * 4.6;
                const warpZ = landscapeNoise(z * 0.53 - 49, x * 0.61 + 21) * 18
                    + landscapeNoise(x * 1.43 - 51, z * 1.38 + 39) * 5.3;
                uv.push((x * 0.86 - z * 0.51 + y * 0.29 + warpX) / 48,
                    (x * 0.51 + z * 0.86 - y * 0.23 + warpZ) / 37);
            }
            remap.push(index);
        }
        for (const index of patch.indices) indices.push(remap[index]!);
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
