import type { Surface } from "./surface.ts";

const CELL = 24;

interface Triangle {
    readonly vertices: Float32Array;
    readonly a: number;
    readonly b: number;
    readonly c: number;
}

export class GroundHeight {
    readonly floor: number;
    readonly #cells = new Map<string, Triangle[]>();

    constructor(surfaces: readonly Surface[]) {
        let floor = Infinity;
        for (const surface of surfaces) {
            const { positions, indices } = surface;
            for (let i = 1; i < positions.length; i += 3) floor = Math.min(floor, positions[i]!);
            for (let i = 0; i < indices.length; i += 3) {
                const a = indices[i]! * 3;
                const b = indices[i + 1]! * 3;
                const c = indices[i + 2]! * 3;
                const ax = positions[a]!;
                const bx = positions[b]!;
                const cx = positions[c]!;
                const az = positions[a + 2]!;
                const bz = positions[b + 2]!;
                const cz = positions[c + 2]!;
                const triangle = { vertices: positions, a, b, c };
                const startX = cell(Math.min(ax, bx, cx));
                const endX = cell(Math.max(ax, bx, cx));
                const startZ = cell(Math.min(az, bz, cz));
                const endZ = cell(Math.max(az, bz, cz));
                for (let z = startZ; z <= endZ; z++) {
                    for (let x = startX; x <= endX; x++) {
                        const key = x + "," + z;
                        const bucket = this.#cells.get(key);
                        if (bucket) bucket.push(triangle);
                        else this.#cells.set(key, [triangle]);
                    }
                }
            }
        }
        this.floor = floor;
    }

    // A bridge and the stream bed can share x and z.
    at(x: number, z: number, ceiling = Infinity): number | undefined {
        const bucket = this.#cells.get(cell(x) + "," + cell(z));
        if (!bucket) return undefined;
        let highest: number | undefined;
        for (const triangle of bucket) {
            const y = elevation(triangle, x, z);
            if (y !== undefined && y <= ceiling && (highest === undefined || y > highest)) highest = y;
        }
        return highest;
    }
}

function cell(value: number): number {
    return Math.floor(value / CELL);
}

function elevation({ vertices, a, b, c }: Triangle, x: number, z: number): number | undefined {
    const ax = vertices[a]!;
    const az = vertices[a + 2]!;
    const bx = vertices[b]!;
    const bz = vertices[b + 2]!;
    const cx = vertices[c]!;
    const cz = vertices[c + 2]!;
    if (x < Math.min(ax, bx, cx) || x > Math.max(ax, bx, cx) ||
        z < Math.min(az, bz, cz) || z > Math.max(az, bz, cz)) return undefined;
    const dx = bx - ax;
    const dz = bz - az;
    const ex = cx - ax;
    const ez = cz - az;
    const det = dx * ez - dz * ex;
    if (Math.abs(det) < 0.000001) return undefined;
    const u = ((x - ax) * ez - (z - az) * ex) / det;
    const v = (dx * (z - az) - dz * (x - ax)) / det;
    if (u < -0.00001 || v < -0.00001 || u + v > 1.00001) return undefined;
    const ay = vertices[a + 1]!;
    return ay + (vertices[b + 1]! - ay) * u + (vertices[c + 1]! - ay) * v;
}
