import type { Hall } from "./halls.ts";
import { pointOnRoute } from "./route.ts";
import type { Surface } from "./surface.ts";

export const HALL_WALL_BANDS = 5;

export function hallWalls(hall: Hall): Surface {
    const hangar = hall.kind === "space hangar";
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const lower = hangar ? -0.22 : -0.1;
    const upper = hangar ? 3.9 : 1.12;
    const heights = [lower, lower + 0.31, upper - 0.27, upper - 0.17, upper];
    for (const side of [-1, 1]) {
        for (const [index, { row, posts }] of hall.frames.entries()) {
            const floor = posts[side < 0 ? 0 : 1]?.y ?? row.y;
            const point = pointOnRoute(row, side * (hall.halfWidth - 0.14));
            for (const [band, height] of heights.entries()) {
                positions.push(point.x, floor + height, point.z);
                uv.push(row.distance / 13, height / (hangar ? 2.9 : 1.6));
                if (!index || !band) continue;
                const i = positions.length / 3 - 1;
                const a = i - HALL_WALL_BANDS - 1;
                const b = i - HALL_WALL_BANDS;
                if (side < 0) indices.push(a, i - 1, b, b, i - 1, i);
                else indices.push(a, b, i - 1, b, i, i - 1);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
