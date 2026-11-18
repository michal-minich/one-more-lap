import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { roadHalfWidth } from "./road-width.ts";
import { pointOnRoute } from "./route.ts";
import type { Surface } from "./surface.ts";
import { strip } from "./surface.ts";
import { channelPoint } from "./water.ts";
import type { WaterBody } from "./water.ts";

export const glasswaterCrossing = 945;

interface BridgeColumn extends Point {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
    readonly yaw: number;
}

interface Member {
    readonly from: Point;
    readonly to: Point;
}

export interface GlasswaterRiverworks {
    readonly deck: Surface;
    readonly arches: Surface;
    readonly walks: readonly Surface[];
    readonly parapets: readonly Surface[];
    readonly quays: readonly Surface[];
    readonly columns: readonly BridgeColumn[];
    readonly lamps: readonly Point[];
    readonly hangers: readonly Member[];
    readonly ties: readonly Member[];
}

export function glasswaterRiverworks(course: Course, river: WaterBody): GlasswaterRiverworks {
    const first = glasswaterCrossing - 34;
    const last = glasswaterCrossing + 34;
    const rows = Array.from({ length: 69 }, (_, i) => course.at(first + i));
    const deck = strip(rows, row => {
        const edge = roadHalfWidth("metro", row.distance);
        return [-edge - 1.99, -edge - 1.83, -edge - 1.48, edge + 1.48, edge + 1.83, edge + 1.99];
    }, (row, offset) => {
        const out = Math.abs(offset) - roadHalfWidth("metro", row.distance);
        return out > 1.90 ? -0.032 : out > 1.72 ? -0.46 : -1.06;
    });
    const walks = [-1, 1].map(side => strip(rows, row => {
        const half = roadHalfWidth("metro", row.distance);
        return side < 0 ? [-half - 1.99, -half + 0.03] : [half - 0.03, half + 1.99];
    }, () => -0.033));
    const parapets = [-1, 1].map(side => strip(rows, row => {
        const half = roadHalfWidth("metro", row.distance);
        const edge = [0.53, 0.58, 0.67, 0.93, 1.0, 1.06].map(width => side * (half + width));
        return side < 0 ? edge.toReversed() : edge;
    }, (row, offset) => {
        const width = Math.abs(offset) - roadHalfWidth("metro", row.distance);
        const rise = width > 1.04 || width < 0.55 ? 0.04 : width < 0.62 || width > 0.97 ? 0.3 : 0.42;
        const taper = Math.min(1, (row.distance - first) / 3, (last - row.distance) / 3);
        return rise * taper - 0.026;
    }));
    const arch = tiedArches(course, first, last);
    const columns: BridgeColumn[] = [];
    const lamps: Point[] = [];
    for (const distance of [921, 969]) {
        const row = course.at(distance);
        const yaw = Math.atan2(row.dx, row.dz);
        for (const side of [-1, 1]) {
            const at = pointOnRoute(row, side * 4.45);
            const bottom = course.ground.at(at.x, at.z, row.y - 1) ?? river.center.y - 2;
            const floor = Math.min(bottom, river.center.y - 0.8);
            const top = row.y - 0.81;
            columns.push({ ...at, y: (top + floor) / 2, height: top - floor, width: 2.3, depth: 3.1, yaw });
        }
    }
    for (const distance of [903, 913, 977, 989]) {
        const row = course.at(distance);
        const edge = roadHalfWidth("metro", distance);
        for (const side of [-1, 1]) lamps.push(pointOnRoute(row, side * (edge + 1.33), -0.18));
    }
    const quays = [
        quay(course, river, 1, 0.21, 0.96), quay(course, river, -1, 0.22, 0.93),
        quay(course, river, 1, -0.94, -0.28), quay(course, river, -1, -0.92, -0.26),
    ];
    return { deck, walks, parapets, quays, columns, lamps, ...arch };
}

function tiedArches(course: Course, from: number, to: number): Pick<GlasswaterRiverworks, "arches" | "hangers" | "ties"> {
    const segments = 32;
    const section = [[-0.58, -0.72], [-0.77, -0.46], [-0.77, 0.48], [-0.54, 0.72],
        [0.54, 0.72], [0.77, 0.48], [0.77, -0.46], [0.58, -0.72]] as const;
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const hangers: Member[] = [];
    const ties: Member[] = [];
    const base = (distance: number, side: number, height: number): Point =>
        pointOnRoute(course.at(distance), side * (roadHalfWidth("metro", distance) + 1.76), height);
    const lift = (u: number): number => 0.88 + Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) * 9.28;
    for (const side of [-1, 1]) {
        const start = positions.length / 3;
        for (let index = 0; index <= segments; index++) {
            const theta = Math.PI * index / segments;
            const u = (1 - Math.cos(theta)) * 0.5;
            const distance = from + u * (to - from);
            const row = course.at(distance);
            const center = base(distance, side, lift(u));
            const incline = Math.atan2(9.28 * Math.cos(theta), (to - from) * 0.5 * Math.sin(theta));
            const up = Math.cos(incline);
            const fore = -Math.sin(incline);
            for (const [width, radial] of section) {
                positions.push(center.x + row.dz * width + row.dx * radial * fore, center.y + radial * up,
                    center.z - row.dx * width + row.dz * radial * fore);
                uv.push(distance / 2.5 + width * 0.12, (width + radial) / 1.8);
            }
            if (index === 0) continue;
            const ring = start + index * section.length;
            for (let k = 0; k < section.length; k++) {
                const a = ring + k;
                const b = ring + (k + 1) % section.length;
                indices.push(a - section.length, b - section.length, a, b - section.length, b, a);
            }
        }
        for (const u of [0.11, 0.22, 0.33, 0.44, 0.56, 0.67, 0.78, 0.89]) {
            const distance = from + u * (to - from);
            hangers.push({ from: base(distance, side, -0.27), to: base(distance, side, lift(u) - 0.39) });
        }
    }
    for (const u of [0.29, 0.5, 0.71]) {
        const distance = from + u * (to - from);
        const height = lift(u) - 0.17;
        ties.push({ from: base(distance, -1, height), to: base(distance, 1, height) });
    }
    const arches = { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
    return { arches, hangers, ties };
}

function quay(course: Course, river: WaterBody, side: number, start: number, end: number): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const sections = 36;
    const profile = [[0.64, -0.31], [0.69, 0.18], [0.77, 0.18], [0.78, 0.65],
        [0.862, 0.65], [0.87, 1], [1.24, 1], [1.34, 0.65], [1.52, 0]] as const;
    for (let index = 0; index <= sections; index++) {
        const across = start + index * (end - start) / sections;
        const endSlope = Math.min(1, index / 3, (sections - index) / 3);
        const toe = channelPoint(river, across, side * 1.095);
        const floor = course.ground.at(toe.x, toe.z) ?? river.center.y + 1.8;
        const top = Math.min(4.18, Math.max(1.69, floor - river.center.y + 0.18));
        const base = positions.length / 3;
        for (const [column, [bank, tier]] of profile.entries()) {
            const edge = Math.min(0.078, across ** 2 * 0.093);
            const point = channelPoint(river, across, side * (bank - edge + (1 - endSlope) * 0.059));
            let height = river.center.y + top * tier * (0.73 + 0.27 * endSlope) - (1 - endSlope) * 0.24;
            if (bank > 1.24) {
                const grade = (course.ground.at(point.x, point.z) ?? height) + 0.037;
                height = Math.max(height, grade);
            }
            positions.push(point.x, height, point.z);
            uv.push(across * river.across / 4.2, (bank * river.along + height * 0.46) / 3.8);
            if (index > 0 && column > 0) {
                const a = base + column - profile.length;
                const b = base + column;
                if (side < 0) indices.push(a - 1, a, b - 1, a, b, b - 1);
                else indices.push(a - 1, b - 1, a, a, b - 1, b);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
