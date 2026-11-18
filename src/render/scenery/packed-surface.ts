import type { Surface } from "../../game/course/surface.ts";

interface PackedSurface {
    readonly positions: readonly number[];
    readonly indices: readonly number[];
    readonly uv: readonly number[];
}

const precision = 4_096;

export function unpackSurface(data: PackedSurface): Surface {
    return {
        positions: Float32Array.from(data.positions, value => value / precision),
        indices: Uint32Array.from(data.indices),
        uv: Float32Array.from(data.uv, value => value / precision),
    };
}
