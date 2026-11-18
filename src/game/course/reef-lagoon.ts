import type { Course } from "./course.ts";
import { pointOnRoute } from "./route.ts";
import { reefTunnelProfile } from "./reef-tunnel.ts";
import type { Surface } from "./surface.ts";

export const pirateCove = { distance: 806, lateral: -63 } as const;

export function pirateBerth(course: Course): ReturnType<typeof pointOnRoute> {
    return pointOnRoute(course.at(pirateCove.distance), pirateCove.lateral);
}

interface PlanPoint {
    readonly x: number;
    readonly z: number;
}

function dryOpenings(course: Course): PlanPoint[][] {
    const shell = course.reefTunnel!.positions;
    const stride = reefTunnelProfile.length * 3;
    const openings: PlanPoint[][] = [];
    let port: PlanPoint[] = [];
    let starboard: PlanPoint[] = [];
    // The surface intersects the tube twice on a partial row and misses it on a fully submerged or dry row.
    for (let row = 0; row <= shell.length; row += stride) {
        const rim: PlanPoint[] = [];
        for (let j = row + 3; j < Math.min(row + stride, shell.length); j += 3) {
            const start = shell[j - 2]!;
            const end = shell[j + 1]!;
            if ((start >= 0) === (end >= 0)) continue;
            const t = start / (start - end);
            const x = shell[j - 3]! + (shell[j]! - shell[j - 3]!) * t;
            const z = shell[j - 1]! + (shell[j + 2]! - shell[j - 1]!) * t;
            rim.push({ x, z });
        }
        if (rim.length === 2) {
            if (port.length === 0 && row > 0) {
                starboard.push(tangentPoint(shell, row - stride, row, row - stride));
            }
            starboard.push(rim[0]!);
            port.push(rim[1]!);
        } else if (port.length > 0) {
            if (row < shell.length) starboard.push(tangentPoint(shell, row - stride, row, row));
            openings.push([...starboard, ...port.toReversed()]);
            port = [];
            starboard = [];
        }
    }
    return openings;
}

function tangentPoint(shell: Float32Array, a: number, b: number, uncut: number): PlanPoint {
    const bottom = (reefTunnelProfile.length - 1) / 2 * 3;
    const column = shell[uncut + 1]! < 0 ? 0 : bottom;
    const from = a + column;
    const to = b + column;
    const height = shell[from + 1]!;
    const t = height / (height - shell[to + 1]!);
    return { x: shell[from]! + (shell[to]! - shell[from]!) * t,
        z: shell[from + 2]! + (shell[to + 2]! - shell[from + 2]!) * t };
}

export function lagoonSurface(course: Course): Surface {
    const halfWidth = 805;
    const halfDepth = 840;
    const west = course.center.x - halfWidth;
    const south = course.center.z - halfDepth;
    const east = west + halfWidth * 2;
    const north = south + halfDepth * 2;
    const openings = dryOpenings(course);
    const edges = openings.flatMap(loop => loop.map((from, i) => ({ from, to: loop[(i + 1) % loop.length]! })));
    const waterColumns = Array.from({ length: 71 }, (_, i) => west + (east - west) * i / 70);
    const stations = [...new Set([...waterColumns, ...openings.flatMap(loop => loop.map(at => at.x))])].toSorted((a, b) => a - b);
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    // Slice the water plane at every opening vertex, then fill the intervals outside the openings.
    for (let i = 1; i < stations.length; i++) {
        const x0 = stations[i - 1]!;
        const x1 = stations[i]!;
        const middle = (x0 + x1) / 2;
        const crossings: [number, number][] = [[south, south], [north, north]];
        for (const { from, to } of edges) {
            if (middle <= Math.min(from.x, to.x) || middle >= Math.max(from.x, to.x)) continue;
            const slope = (to.z - from.z) / (to.x - from.x);
            crossings.push([from.z + (x0 - from.x) * slope, from.z + (x1 - from.x) * slope]);
        }
        crossings.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
        for (let j = 0; j < crossings.length - 1; j += 2) {
            const [low0, low1] = crossings[j]!;
            const [high0, high1] = crossings[j + 1]!;
            const strips = Math.max(1, Math.ceil(Math.max(high0 - low0, high1 - low1) / 27));
            for (let step = 0; step <= strips; step++) {
                const t = step / strips;
                const start = positions.length / 3;
                for (const [x, z] of [[x0, low0 + (high0 - low0) * t], [x1, low1 + (high1 - low1) * t]] as const) {
                    positions.push(x, 0, z);
                    uv.push((x - west) / (2 * halfWidth), (z - south) / (2 * halfDepth));
                }
                if (step > 0) indices.push(start - 2, start - 1, start, start - 1, start + 1, start);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
