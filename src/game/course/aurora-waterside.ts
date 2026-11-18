import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { roadHalfWidth } from "./road-width.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";
import { channelPoint } from "./water.ts";
import type { WaterBody } from "./water.ts";

interface Footing extends Point {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
    readonly yaw: number;
}

export interface AuroraWaterside {
    readonly ribs: Surface;
    readonly copperSeams: Surface;
    readonly walks: readonly Surface[];
    readonly solarRoof: readonly Surface[];
    readonly terraces: readonly Surface[];
    readonly footings: readonly Footing[];
    readonly luminaires: readonly Point[];
}

type Section = readonly (readonly [lengthwise: number, radial: number])[];

const ribStations = [491, 505, 519, 533, 547, 561];
const span = 11.65;
const crown = 10.8;
const ribProfile = [[-0.97, 0.14], [-0.68, 0.55], [0.68, 0.55], [0.97, 0.14],
    [0.97, -0.24], [0.59, -0.56], [-0.59, -0.56], [-0.97, -0.24]] as const;
const copperProfiles = [
    [[-0.88, 0.26], [-0.80, 0.40], [-0.76, 0.36], [-0.85, 0.23]],
    [[0.88, 0.26], [0.85, 0.23], [0.76, 0.36], [0.80, 0.40]],
] as const;

export function auroraWaterside(course: Course, creek: WaterBody): AuroraWaterside {
    const rows = ribStations.map(distance => course.at(distance));
    const footings: Footing[] = [];
    const luminaires: Point[] = [];
    for (const row of rows) {
        const yaw = Math.atan2(row.dx, row.dz);
        for (const side of [-1, 1]) {
            const at = pointOnRoute(row, side * span);
            const floor = Math.min(row.y - 0.7, course.ground.at(at.x, at.z) ?? row.y - 1.6) - 0.22;
            const top = row.y + 1.94;
            footings.push({ ...at, y: (floor + top) / 2, height: top - floor, width: 3.28, depth: 3.5, yaw });
            const mount = span - 0.14;
            luminaires.push(pointOnRoute(row, side * (mount - 0.49), roofHeight(mount)));
        }
    }

    const solarRoof: Surface[] = [];
    for (let index = 0; index < rows.length - 1; index++) {
        const start = ribStations[index]! + 0.84;
        const length = ribStations[index + 1]! - start - 0.84;
        const bay = Array.from({ length: 9 }, (_, step) => course.at(start + length * step / 8));
        const wings = index % 2 === 0 ? [[-10.05, -3.85], [3.85, 10.05]] : [[-9.56, -6.36], [6.36, 9.56]];
        for (const [left, right] of wings) {
            const offsets = Array.from({ length: 5 }, (_, step) => left! + (right! - left!) * step / 4);
            solarRoof.push(strip(bay, offsets, (_row, across) => roofHeight(across) + 0.06));
        }
    }

    const bridge = Array.from({ length: 59 }, (_, step) => course.at(491 + step));
    const walks = [-1, 1].map(side => strip(bridge, row => {
        const edge = roadHalfWidth("future", row.distance);
        return side < 0 ? [-edge - 1.42, -edge + 0.015] : [edge - 0.015, edge + 1.42];
    }, () => -0.032));

    const terraces = [
        bank(course, creek, -1, 0.48, 0.97), bank(course, creek, 1, 0.48, 0.97),
        bank(course, creek, -1, -0.96, -0.47), bank(course, creek, 1, -0.96, -0.47),
    ];
    return { ribs: curvedMembers(rows, [ribProfile]), copperSeams: curvedMembers(rows, copperProfiles),
        walks, footings, luminaires, solarRoof, terraces };
}

function roofHeight(across: number): number {
    return 1.4 + crown * Math.max(0, 1 - (across / span) ** 2) ** 0.39;
}

function curvedMembers(rows: readonly RouteSample[], profiles: readonly Section[]): Surface {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const segments = 32;
    for (const row of rows) for (const profile of profiles) {
        const base = positions.length / 3;
        for (let step = 0; step <= segments; step++) {
            const angle = step * Math.PI / segments;
            const x = span * Math.cos(angle);
            const y = roofHeight(x);
            const trim = 0.52 * Math.sin(angle) + 0.72;
            for (const [lengthwise, radial] of profile) {
                const p = pointOnRoute(row, x + radial * Math.cos(angle), y + radial * Math.sin(angle));
                positions.push(p.x + row.dx * lengthwise * trim, p.y, p.z + row.dz * lengthwise * trim);
                uv.push(angle * 3.8, (lengthwise + radial) * 0.42);
            }
            if (step === 0) continue;
            const ring = base + step * profile.length;
            for (let vertex = 0; vertex < profile.length; vertex++) {
                const a = ring + vertex;
                const b = ring + (vertex + 1) % profile.length;
                indices.push(a - profile.length, a, b - profile.length, a, b, b - profile.length);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

function bank(course: Course, creek: WaterBody, side: number, start: number, end: number): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const sections = 30;
    const profile = [[0.61, -0.32], [0.68, 0.25], [0.77, 0.25], [0.81, 0.64], [0.94, 0.64],
        [0.97, 1], [1.24, 1], [1.39, 0.2]] as const;
    for (let step = 0; step <= sections; step++) {
        const across = start + step * (end - start) / sections;
        const fade = Math.min(1, step / 4, (sections - step) / 4);
        const edge = channelPoint(creek, across, side * 1.24);
        const grade = course.ground.at(edge.x, edge.z) ?? creek.center.y + 2;
        const top = Math.max(1.23, Math.min(3.35, grade - creek.center.y + 0.24));
        const base = positions.length / 3;
        for (const [column, [offset, tier]] of profile.entries()) {
            const fit = offset - 0.27 * across ** 2 + (1 - fade) * 0.095;
            const at = channelPoint(creek, across, side * fit);
            const height = creek.center.y + top * tier * (0.56 + 0.44 * fade);
            positions.push(at.x, height, at.z);
            uv.push(across * creek.across / 3.2, (offset * creek.along + height * 0.81) / 3.7);
            if (!step || !column) continue;
            const a = base + column - profile.length;
            const b = base + column;
            if (side < 0) indices.push(a - 1, a, b - 1, a, b, b - 1);
            else indices.push(a - 1, b - 1, a, a, b - 1, b);
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
