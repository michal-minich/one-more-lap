import type { Point } from "../../point.ts";
import type { RaceDirection } from "../circuit-line.ts";
import type { Course } from "../course.ts";
import { pointOnRoute } from "../route.ts";
import type { RouteSample } from "../route.ts";
import type { Surface } from "../surface.ts";
import { smoothBetween } from "../terrain-profile.ts";

const radius = 12;
const rise = 10;
const loopOffset = 9.4;
const elevation = 10;
// The runways join the outer shoulders and leave the middle of the bypass flat.
const mergeOffset = 5.2;
export const stuntLoopHalf = 3.5;
export const stuntLoopZ = 252;

export interface LoopRow extends Point {
    readonly distance: number;
    readonly nx: number;
    readonly nz: number;
}

export interface StuntLoop {
    readonly direction: RaceDirection;
    readonly inversion: readonly LoopRow[];
    readonly rows: readonly LoopRow[];
    readonly road: Surface;
    readonly deck: Surface;
    readonly rails: Surface;
    readonly approach: RouteSample;
    readonly mouth: Point;
    readonly exit: Point;
}

export function buildStuntLoops(course: Course): readonly StuntLoop[] {
    if (course.track.id !== "stunt") return [];
    return [buildLoop(course, "forward"), buildLoop(course, "reverse")];
}

function buildLoop(course: Course, direction: RaceDirection): StuntLoop {
    const sign = direction === "forward" ? 1 : -1;
    const x = 20 * sign;
    const line = course.raceLine(direction);
    const start = course.locate({ x: 0, y: 8, z: stuntLoopZ - sign * 164 }).distance;
    const finish = course.locate({ x: 0, y: 8, z: stuntLoopZ + sign * 164 }).distance;
    const enter = line.at(sign > 0 ? start : line.length - start);
    const leave = line.at(sign > 0 ? finish : line.length - finish);
    const startPoint = pointOnRoute(enter, mergeOffset);
    const endPoint = pointOnRoute(leave, mergeOffset);
    const rows: LoopRow[] = [];
    let distance = 0;
    const put = (point: Point, nx: number, nz: number): void => {
        const previous = rows.at(-1);
        if (previous) distance += Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z);
        rows.push({ ...point, distance, nx, nz });
    };
    const approach = { ...enter, ...startPoint };
    const mouth = { x, y: elevation, z: stuntLoopZ };
    const exit = { x: x + sign * loopOffset, y: elevation + rise, z: stuntLoopZ + sign * 13 };
    addStraight(put, startPoint, mouth, sign, true);
    const firstLoopRow = rows.length;
    for (let i = 0; i <= 160; i++) {
        const angle = Math.PI * 2 * i / 160;
        const exitAdvance = i > 132 ? 13 * ((i - 132) / 28) ** 3 : 0;
        const z = radius * Math.sin(angle) + exitAdvance;
        const y = radius * (1 - Math.cos(angle)) + rise * (angle - Math.sin(angle)) / (Math.PI * 2);
        // Spread the sideways shift across the climb and descent so the car can follow it on its wheels.
        const across = loopOffset * smoothBetween(1.8, 5.97, angle);
        put({ x: x + sign * across, y: elevation + y, z: stuntLoopZ + sign * z }, sign, 0);
    }
    const inversion = rows.slice(firstLoopRow);
    addStraight(put, exit, endPoint, sign, false);
    const road = sweep(rows, [[-stuntLoopHalf, 0], [stuntLoopHalf, 0]]);
    const deck = sweep(rows, [[-stuntLoopHalf, -0.018], [-stuntLoopHalf, -0.36],
        [stuntLoopHalf, -0.36], [stuntLoopHalf, -0.018]]);
    const rail = (side: number) => sweep(rows.slice(50, -50), [
        [side * (stuntLoopHalf - 0.12), 0.07], [side * (stuntLoopHalf - 0.12), 0.49],
    ]);
    const rails = combine([rail(-1), rail(1)]);
    return { direction, rows, inversion, approach, mouth, exit, road, deck, rails };
}

function addStraight(
    put: (point: Point, nx: number, nz: number) => void, from: Point, to: Point, sign: number, incoming: boolean,
): void {
    const count = Math.ceil(Math.abs(to.z - from.z) / 0.85);
    for (let i = incoming ? 0 : 1; i <= (incoming ? count - 1 : count); i++) {
        const t = i / count;
        const u = incoming ? Math.min(1, t / 0.52) : Math.max(0, (t - 0.28) / 0.72);
        const blend = u * u * (3 - 2 * u);
        const slope = u > 0 && u < 1 ? 6 * u * (1 - u) / (incoming ? 0.52 : 0.72) : 0;
        const lateral = (to.x - from.x) * slope;
        const nz = to.z - from.z;
        const length = Math.hypot(nz, lateral);
        put({ x: from.x + (to.x - from.x) * blend,
            y: from.y + (to.y - from.y) * (incoming ? blend : t * t * (3 - 2 * t)),
            z: from.z + nz * t }, nz / length || sign, -lateral / length);
    }
}

export function sweep(rows: readonly LoopRow[], profile: readonly (readonly [across: number, above: number])[]): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const [i, row] of rows.entries()) {
        const before = rows[Math.max(0, i - 1)]!;
        const after = rows[Math.min(rows.length - 1, i + 1)]!;
        const dy = after.y - before.y;
        const horizontal = (after.z - before.z) * row.nx - (after.x - before.x) * row.nz;
        const length = Math.hypot(horizontal, dy) || 1;
        for (const [j, [across, above]] of profile.entries()) {
            positions.push(row.x + row.nx * across + row.nz * dy / length * above,
                row.y + horizontal / length * above, row.z + row.nz * across - row.nx * dy / length * above);
            uv.push(across / 3.8 + above * 0.47, row.distance / 3.8);
            if (!i || !j) continue;
            const k = i * profile.length + j;
            indices.push(k - profile.length - 1, k - profile.length, k - 1, k - profile.length, k, k - 1);
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

function combine(surfaces: readonly Surface[]): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const surface of surfaces) {
        const base = positions.length / 3;
        positions.push(...surface.positions);
        indices.push(...surface.indices.map(index => index + base));
        uv.push(...surface.uv);
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
