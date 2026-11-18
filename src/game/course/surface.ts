import { crossesGap, pointOnRoute } from "./route.ts";
import type { RoadGap, RouteSample } from "./route.ts";

export interface Surface {
    readonly positions: Float32Array;
    readonly indices: Uint32Array;
    readonly uv: Float32Array;
    readonly seamColumns?: number;
}

export function strip(
    route: readonly RouteSample[],
    offsets: readonly number[] | ((row: RouteSample) => readonly number[]),
    elevation: (row: RouteSample, offset: number) => number,
    gap?: RoadGap,
): Surface {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const first = route[0];
    const last = route.at(-1);
    const closed = first !== undefined && last !== undefined && route.length > 2 &&
        first.x === last.x && first.z === last.z;
    const repeatLength = closed ? last.distance / Math.round(last.distance / 4) : 4;
    const width = typeof offsets === "function" ? (first ? offsets(first).length : 0) : offsets.length;
    route.forEach((row, index) => {
        const joined = index > 0 && !crossesGap(gap, route[index - 1]!.distance, row.distance);
        const columns = typeof offsets === "function" ? offsets(row) : offsets;
        if (columns.length !== width) throw new Error("Strip rows must have the same number of offsets");
        columns.forEach((offset, column) => {
            const point = pointOnRoute(row, offset, elevation(row, offset));
            positions.push(point.x, point.y, point.z);
            uv.push(offset / 4, row.distance / repeatLength);
            if (joined && column) {
                const c = index * width + column;
                indices.push(c - width - 1, c - width, c - 1, c - width, c, c - 1);
            }
        });
    });
    return {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
        ...(closed ? { seamColumns: width } : {}),
    };
}
