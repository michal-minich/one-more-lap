import type { Point } from "../point.ts";
import type { TrackSpec } from "./tracks.ts";

export const ROAD_HALF = 6.2;

export interface RouteSample extends Point {
    readonly dx: number;
    readonly dz: number;
    readonly distance: number;
}

export interface RoadGap {
    readonly from: number;
    readonly to: number;
}

export function crossesGap(gap: RoadGap | undefined, start: number, end: number): boolean {
    return gap !== undefined && start < gap.to && end > gap.from;
}

function cubic(a: number, b: number, c: number, d: number, t: number): number {
    return b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
}

export function buildRoute(track: TrackSpec): RouteSample[] {
    const positions: Point[] = [];
    const controls = track.points;
    const count = controls.length;
    if (count < 4) throw new Error("A circuit needs at least four control points: " + track.name);
    for (let i = 0; i < count; i++) {
        const a = controls[(i + count - 1) % count]!;
        const b = controls[i]!;
        const c = controls[(i + 1) % count]!;
        const d = controls[(i + 2) % count]!;
        const steps = Math.ceil(Math.hypot(c.x - b.x, c.z - b.z) / 4.5);
        for (let j = 0; j < steps; j++) {
            const t = j / steps;
            positions.push({ x: cubic(a.x, b.x, c.x, d.x, t), y: cubic(a.y, b.y, c.y, d.y, t), z: cubic(a.z, b.z, c.z, d.z, t) });
        }
    }
    if (positions.length === 0) throw new Error("Missing route geometry for " + track.name);
    let distance = 0;
    const route = positions.map((point, index) => {
        const previous = positions[(index + positions.length - 1) % positions.length]!;
        const next = positions[(index + 1) % positions.length]!;
        const tangent = Math.hypot(next.x - previous.x, next.z - previous.z);
        if (index > 0) distance += Math.hypot(point.x - previous.x, point.z - previous.z, point.y - previous.y);
        return { ...point, dx: (next.x - previous.x) / tangent, dz: (next.z - previous.z) / tangent, distance };
    });
    const first = route[0]!;
    const last = route.at(-1)!;
    route.push({ ...first, distance: distance + Math.hypot(first.x - last.x, first.z - last.z, first.y - last.y) });
    return route;
}

export function wrapDistance(distance: number, length: number): number {
    const remainder = distance % length;
    return remainder < 0 ? remainder + length : remainder;
}

export function sampleAt(route: readonly RouteSample[], distance: number): RouteSample {
    const target = wrapDistance(distance, route.at(-1)!.distance);
    let left = 0;
    let right = route.length - 1;
    while (right - left > 1) {
        const middle = Math.floor((left + right) / 2);
        if (route[middle]!.distance <= target) left = middle;
        else right = middle;
    }
    const a = route[left]!;
    const b = route[right]!;
    const t = (target - a.distance) / (b.distance - a.distance);
    const dx = a.dx + (b.dx - a.dx) * t;
    const dz = a.dz + (b.dz - a.dz) * t;
    const length = Math.hypot(dx, dz);
    return {
        x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t,
        dx: dx / length, dz: dz / length, distance: target,
    };
}

export function pointOnRoute(row: RouteSample, offset: number, dy = 0): Point {
    return { x: row.x + row.dz * offset, y: row.y + dy, z: row.z - row.dx * offset };
}

export interface RouteLocation {
    readonly index: number;
    readonly lateral: number;
    readonly distance: number;
    readonly elevation: number;
}

export function locate(route: readonly RouteSample[], position: Point, stacked = false): RouteLocation {
    let result: RouteLocation | undefined;
    let closest = Infinity;
    for (let i = 1; i < route.length; i++) {
        const a = route[i - 1]!;
        const b = route[i]!;
        const x = position.x - a.x;
        const z = position.z - a.z;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const square = dx * dx + dz * dz;
        const along = Math.min(1, Math.max(0, (x * dx + z * dz) / square));
        const elevation = a.y + (b.y - a.y) * along;
        const height = stacked ? Math.max(0, Math.abs(position.y - elevation) - 2) : 0;
        const gap = (x - dx * along) ** 2 + (z - dz * along) ** 2 + height ** 2;
        if (gap >= closest) continue;
        closest = gap;
        result = {
            index: along < 0.5 ? i - 1 : i,
            lateral: (x * dz - z * dx) / Math.sqrt(square),
            distance: a.distance + (b.distance - a.distance) * along,
            elevation,
        };
    }
    if (!result) throw new Error("A route must contain at least two samples");
    return result;
}
