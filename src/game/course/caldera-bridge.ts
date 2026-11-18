import type { Course } from "./course.ts";
import { pointOnRoute, ROAD_HALF } from "./route.ts";
import type { Surface } from "./surface.ts";
import type { RouteSample } from "./route.ts";
import { bridgeHalfLength } from "./passages.ts";

const end = bridgeHalfLength("caldera");
export const calderaSpanEdges = [-end, -18, 12, end] as const;
export const calderaBridgeEdge = ROAD_HALF + 0.82;

export function archHeight(t: number): number {
    return -6.7 + 4.75 * Math.sin(Math.PI * t);
}

export function calderaBridge(course: Course, crossing: number): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const [span, start] of calderaSpanEdges.slice(0, -1).entries()) {
        const length = calderaSpanEdges[span + 1]! - start;
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const row = course.at(crossing + start + length * (1 - Math.cos(Math.PI * t)) / 2);
            const height = archHeight(t);
            const edge = calderaBridgeEdge;
            const base = positions.length / 3;
            for (const [offset, y] of [[-edge, -0.95], [-edge, height], [edge, height], [edge, -0.95]] as const) {
                const point = pointOnRoute(row, offset, y);
                positions.push(point.x, point.y, point.z);
                uv.push(row.distance / 6.1 + point.y * 0.031, (point.y + offset * 0.62) / 5.8);
            }
            if (i > 0) {
                for (let j = base; j < base + 3; j++) {
                    indices.push(j - 4, j, j - 3, j - 3, j, j + 1);
                }
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

export function calderaBridgePiers(course: Course, crossing: number): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const supports = calderaSpanEdges.map(edge => course.at(crossing + edge));
    const addPier = (row: RouteSample, lateral: number, tiers: readonly PierTier[], cover = false): void => {
        const start = positions.length / 3;
        for (const [tier, [y, width, depth]] of tiers.entries()) {
            for (const [corner, [across, along]] of pierCorners.entries()) {
                const point = pointOnRoute(row, lateral + across * width);
                positions.push(point.x + row.dx * along * depth, y, point.z + row.dz * along * depth);
                uv.push(corner * 0.39, y * 0.24);
                if (tier === 0) continue;
                const a = start + tier * 4 + corner;
                const b = start + tier * 4 + (corner + 1) % 4;
                indices.push(a - 4, b - 4, a, b - 4, b, a);
            }
        }
        if (cover) {
            const crown = positions.length / 3 - 4;
            indices.push(crown, crown + 2, crown + 1, crown, crown + 3, crown + 2);
        }
    };
    for (const row of supports) {
        const bed = Math.min(...pierCorners.map(([across, along]) => {
            const point = pointOnRoute(row, across * 7.44);
            return course.ground.at(point.x + row.dx * along * 2.54,
                point.z + row.dz * along * 2.54, row.y - 0.15) ?? row.y - 1.4;
        }));
        const foot = Math.min(bed - 1.1, row.y - 7.8);
        addPier(row, 0, [[foot, 7.44, 2.54], [row.y - 7.4, 7.44, 2.54],
            [row.y - 6.5, 7.23, 2.05], [row.y - 5.96, 7.28, 2.14]]);
    }
    for (const row of supports) {
        for (const side of [-1, 1]) {
            addPier(row, side * 7.53, [[row.y - 6.45, 0.85, 1.76], [row.y - 0.46, 0.73, 1.54],
                [row.y - 0.33, 0.93, 1.78], [row.y + 0.23, 0.93, 1.78]], true);
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

type PierTier = readonly [y: number, width: number, depth: number];

const pierCorners = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
