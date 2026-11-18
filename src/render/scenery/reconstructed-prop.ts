import type { Surface } from "../../game/course/surface.ts";

interface PackedProp {
    readonly positions: readonly number[];
    readonly faces: readonly number[];
    readonly colors: readonly number[];
}

export interface ReconstructedProp extends Surface {
    readonly colors: Float32Array;
}

export function unpackProp(data: PackedProp, tint: (value: number) => number): ReconstructedProp {
    const positions = Float32Array.from(data.positions, value => value / 4096);
    const indices = Uint32Array.from(data.faces);
    const uv = new Float32Array(positions.length / 3 * 2);
    const colors = new Float32Array(positions.length / 3 * 4);
    for (let i = 0, vertex = 0; i < positions.length; i += 3, vertex++) {
        const x = positions[i]!;
        const y = positions[i + 1]!;
        const z = positions[i + 2]!;
        uv.set([x * 0.46 + z * 0.34, y * 1.7 + z * 0.18], vertex * 2);
        colors.set([tint(data.colors[i]!), tint(data.colors[i + 1]!), tint(data.colors[i + 2]!), 1], vertex * 4);
    }
    // TripoSR uses right-handed winding. Babylon's left-handed surface normals use the opposite order.
    for (let i = 0; i < indices.length; i += 3) {
        const second = indices[i + 1]!;
        indices[i + 1] = indices[i + 2]!;
        indices[i + 2] = second;
    }
    return { positions, indices, uv, colors };
}
