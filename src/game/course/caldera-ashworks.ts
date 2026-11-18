import type { Course } from "./course.ts";
import { GroundHeight } from "./ground-height.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import { roadHalfWidth } from "./road-width.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";
import { calderaRimReach, smoothBetween } from "./terrain-profile.ts";

export interface CalderaAshworks {
    readonly notch: Surface;
    readonly overlooks: readonly Surface[];
    readonly banks: readonly Surface[];
    readonly aprons: readonly Surface[];
    readonly apronHeight: GroundHeight;
}

export function calderaAshworks(course: Course): CalderaAshworks {
    const overlooks: Surface[] = [];
    const banks: Surface[] = [];
    for (const [from, to] of [[1_057, 1_112], [1_118, 1_174]] as const) {
        const rows = samples(course, from, to, 1.75);
        overlooks.push(strip(rows, row => [-10.25, -8.85, -roadHalfWidth("caldera", row.distance) - 0.34],
            (row, across) => overlookHeight(course, row, across)));
        const edges = [-32.1, -28.3, -24.2, -22.9, -19.5, -18.3, -15.2, -13.97, -10.25];
        const levels = [-7.65, -7.65, -6.92, -5.37, -4.96, -3.57, -3.1, -1.8, -0.61];
        banks.push(strip(rows, edges, (row, across) => {
            const grade = shoulder(course, row, across);
            if (across === edges[0]) return grade - 0.12;
            if (across === edges.at(-1)) return overlookHeight(course, row, across);
            const fade = Math.min(1, (row.distance - from) / 9, (to - row.distance) / 9);
            return grade + (levels[edges.indexOf(across)]! * calderaRimReach(row.distance) - grade + 0.09) * fade - 0.04;
        }));
    }
    const aprons: Surface[] = [];
    const stations = [[482, 567, 1, 24.5], [1_826, 1_909, 1, 18.2],
        [2_043, 2_135, -1, 21.6], [2_273, 2_328, 1, 18.5]] as const;
    for (const [from, to, side, reach] of stations) {
        aprons.push(strip(samples(course, from, to, 1.67), row => {
            const edge = roadHalfWidth("caldera", row.distance) + 0.82;
            const offsets = [edge, edge + 0.49, 11.1, reach - 2.1, reach].map(value => side * value);
            return side < 0 ? offsets.toReversed() : offsets;
        }, (row, across) => {
            const fade = Math.min(1, (row.distance - from) / 12, (to - row.distance) / 12);
            const offset = Math.abs(across);
            const lift = smoothBetween(8.7, 12.2, offset) * (1 - smoothBetween(reach - 2.1, reach, offset));
            return shoulder(course, row, across) + 0.026 + fade * lift * 0.39;
        }));
    }
    const apronHeight = new GroundHeight(aprons);
    return { notch: ashNotch(course), overlooks, banks, aprons, apronHeight };
}

function overlookHeight(course: Course, row: RouteSample, across: number): number {
    return shoulder(course, row, across) + 0.025;
}

function shoulder(course: Course, row: RouteSample, across: number): number {
    const point = pointOnRoute(row, across);
    return (course.ground.at(point.x, point.z, row.y + 9) ?? row.y) - row.y;
}

function samples(course: Course, from: number, to: number, step: number): RouteSample[] {
    const count = Math.ceil((to - from) / step);
    return Array.from({ length: count + 1 }, (_, index) => course.at(from + (to - from) * index / count));
}

// Each section follows a single extended basalt bed from the tip to its buried foot.
const cleft = [
    [1_421, 11.2, 9.9, 0.35], [1_427, 5.7, 9.1, 1.92], [1_434, -1.6, 9.4, 2.61],
    [1_442, -5.4, 9.28, 3.26], [1_449, -6.75, 10.35, 3.93], [1_457, -4.34, 9.7, 4.34],
    [1_466, -5.93, 10.64, 3.69], [1_474, -2.77, 9.53, 4.71], [1_481, -4.22, 10.3, 3.64],
    [1_491, 1.72, 9.08, 3.58], [1_500, 6.89, 9.45, 2.7], [1_508, 11.5, 8.7, 0.32],
] as const;

function ashNotch(course: Course): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const [rowIndex, [distance, lip, roof, depth]] of cleft.entries()) {
        const row = course.at(distance);
        const tread = 13.8 - lip;
        const width = 17.6 - lip;
        const tooth = Math.cos(rowIndex * 1.97) * 0.36;
        const ring = [
            [lip, roof], [lip + tread * 0.32, roof - 0.74 + tooth], [lip + tread * 0.62, roof - 1.07],
            [lip + tread * 0.86, 6.95 - tooth], [lip + tread * 0.93, 4.63 + tooth], [13.8, 0.78],
            [17.45, 0.73], [17.6, 5], [lip + width * 0.86, roof + depth * 0.18],
            [lip + width * 0.68, roof + depth * 0.63], [lip + width * 0.44, roof + depth],
            [lip + width * 0.055, roof + depth * 0.44],
        ] as const;
        for (const [column, [across, height]] of ring.entries()) {
            const at = pointOnRoute(row, across, height);
            const along = Math.sin(column * 1.19 + rowIndex * 1.33) * 0.44;
            positions.push(at.x + row.dx * along, at.y, at.z + row.dz * along);
            uv.push((distance - 1_421) / 7.3, column * 0.51 + height * 0.035);
            if (rowIndex === 0) continue;
            const previous = (rowIndex - 1) * ring.length;
            const current = previous + ring.length;
            const next = (column + 1) % ring.length;
            indices.push(previous + column, current + column, previous + next,
                previous + next, current + column, current + next);
        }
    }
    const columns = 12;
    for (const start of [0, (cleft.length - 1) * columns]) {
        const center = positions.length / 3;
        const point = [0, 0, 0];
        for (let i = start; i < start + columns; i++) {
            for (let axis = 0; axis < 3; axis++) point[axis] = point[axis]! + positions[i * 3 + axis]! / columns;
        }
        positions.push(...point);
        uv.push(start === 0 ? 0.16 : 11.76, 2.55);
        for (let column = 0; column < columns; column++) {
            const a = start + column;
            const b = start + (column + 1) % columns;
            if (start === 0) indices.push(center, a, b);
            else indices.push(center, b, a);
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
