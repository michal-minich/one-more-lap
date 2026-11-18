import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { roadHalfWidth } from "./road-width.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";
import { aresRimReach } from "./terrain-profile.ts";

interface Footing extends Point {
    readonly width: number;
    readonly depth: number;
    readonly height: number;
    readonly yaw: number;
}

interface GuideLight extends Point {
    readonly yaw: number;
    readonly side: number;
}

export interface AresLandingPad extends Point {
    readonly yaw: number;
    readonly bottom: number;
    readonly showcase: boolean;
    readonly solid: Surface;
}

export interface AresCutworks {
    readonly frames: Surface;
    readonly armor: Surface;
    readonly baffles: readonly Surface[];
    readonly inspectionLane: readonly Surface[];
    readonly retainingLedges: readonly Surface[];
    readonly overlook: readonly Surface[];
    readonly footings: readonly Footing[];
    readonly guidance: readonly GuideLight[];
    readonly pads: readonly AresLandingPad[];
}

const tunnelStops = [443, 456.5, 472, 485.5, 501, 516];
const crossSection = [[-12.5, 1.6], [-11.8, 4.21], [-10.05, 7.75], [-7.86, 9.94],
    [-4.85, 11.27], [-0.7, 11.5], [4.91, 11.22], [8.07, 9.85], [10.12, 7.04], [11.21, 4.39], [11.94, 1.6]] as const;
type Profile = readonly (readonly [longitudinal: number, radial: number])[];
const ceramicProfile: Profile = [[-1.18, -0.34], [-0.9, -0.73], [0.86, -0.73], [1.18, -0.32],
    [1.18, 0.35], [0.89, 0.71], [-0.88, 0.71], [-1.18, 0.35]];
const enamelProfiles: readonly Profile[] = [
    [[-1.22, -0.025], [-1.17, 0.36], [-1.02, 0.54], [-1.06, 0.08]],
    [[1.22, -0.025], [1.06, 0.08], [1.02, 0.54], [1.17, 0.36]],
];

export function aresCutworks(course: Course): AresCutworks {
    const frames = tunnelStops.map(distance => course.at(distance));
    const footings: Footing[] = [];
    const guidance: GuideLight[] = [];
    for (const row of frames) {
        const yaw = Math.atan2(row.dx, row.dz);
        for (const side of [-1, 1]) {
            const across = side < 0 ? crossSection[0][0] : crossSection.at(-1)![0];
            const at = pointOnRoute(row, across);
            const ground = course.ground.at(at.x, at.z) ?? row.y;
            const floor = Math.min(ground, row.y - 0.16) - 0.48;
            const cap = row.y + 1.67;
            footings.push({ ...at, y: (floor + cap) / 2, height: cap - floor, width: 3.3, depth: 3.62, yaw });
            const signal = pointOnRoute(row, across - side * 0.88, 3.02);
            guidance.push({ ...signal, side, yaw });
        }
    }

    const baffles: Surface[] = [];
    const spans = [[445, 453, -1], [458, 469, 1], [474, 483, -1], [488, 499, 1], [504, 514, -1]] as const;
    for (const [from, to, side] of spans) {
        const offsets = (side < 0 ? [-10.05, -7.86, -4.85, -0.7, 1.9] : [-3.7, -0.7, 4.91, 8.07, 10.12]);
        baffles.push(strip(roadSamples(course, from, to, 1.6), offsets, (_row, across) => vaultHeight(across) + 0.075));
    }
    const inspectionLane = [-1, 1].map(side => {
        return strip(roadSamples(course, 436, 522, 1.7), row => {
            const edge = roadHalfWidth("mars", row.distance) + 0.43;
            const widths = [edge, edge + 0.61, 9.22, 10.18].map(width => width * side);
            return side < 0 ? widths.toReversed() : widths;
        }, (row, across) => {
            const point = pointOnRoute(row, across);
            return (course.ground.at(point.x, point.z, row.y + 2) ?? row.y) - row.y + 0.03;
        });
    });
    const retainingLedges: Surface[] = [];
    const overlook: Surface[] = [];
    for (const [from, to] of [[831, 902], [907, 974], [981, 1_043]] as const) {
        const rows = roadSamples(course, from, to, 1.7);
        const edges = [-29.8, -25.1, -23.7, -20.8, -19.9, -16.3, -15.62, -11.2];
        const steps = [-10.4, -8.3, -8.1, -6.41, -6.27, -3.25, -3.12, -0.82];
        retainingLedges.push(strip(rows, edges, (row, across) => {
            const height = steps[edges.indexOf(across)]!;
            const fade = Math.min(1, (row.distance - from) / 11, (to - row.distance) / 11);
            const point = pointOnRoute(row, across);
            const grade = (course.ground.at(point.x, point.z) ?? row.y) - row.y;
            return grade + (height * aresRimReach(row.distance) - grade) * fade + 0.067;
        }));
        overlook.push(strip(rows, row => [-11.2, -10.55, -roadHalfWidth("mars", row.distance) - 0.63],
            (row, across) => {
                const edge = roadHalfWidth("mars", row.distance) + 0.63;
                return -(Math.abs(across) - edge) / (11.2 - edge) * 0.82 * aresRimReach(row.distance) + 0.033;
            }));
    }
    return { frames: metalwork(frames, [ceramicProfile]), armor: metalwork(frames, enamelProfiles),
        baffles, inspectionLane, retainingLedges, overlook, footings, guidance, pads: landingPads(course) };
}

function landingPads(course: Course): AresLandingPad[] {
    const berths = [
        [198, -15.4, 0.73], [221, 15.4, -0.5], [240, -15.4, 0.45], [306, 28, 0.98], [927, 29, 1.49],
    ] as const;
    return berths.map(([distance, lateral, turn]) => {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const y = course.ground.at(at.x, at.z) ?? row.y;
        const yaw = Math.atan2(row.dx, row.dz) + turn;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        const positions: number[] = [at.x, y + 0.635, at.z];
        const uv: number[] = [0.5, 0.5];
        const indices: number[] = [];
        const perimeter = Array.from({ length: 22 }, (_, index) => {
            const angle = index * Math.PI * 2 / 22;
            const across = Math.cos(angle);
            const along = Math.sin(angle);
            const localX = across * 4.38;
            const localZ = along * 5.75;
            const x = at.x + cos * localX + sin * localZ;
            const z = at.z - sin * localX + cos * localZ;
            return { x, z, u: (1 + across) / 2, v: (1 + along) / 2 };
        });
        const bottom = Math.min(y - 0.54, ...perimeter.map(({ x,z }) => (course.ground.at(x,z) ?? y) - 0.32));
        for (const [index, { x, z, u, v }] of perimeter.entries()) {
            positions.push(x, y + 0.635, z, x, bottom, z);
            uv.push(u, v, u, v);
            const a = index * 2 + 1;
            const b = (index + 1) % perimeter.length * 2 + 1;
            indices.push(0, a, b, a, a + 1, b, b, a + 1, b + 1);
        }
        const solid = {
            positions: new Float32Array(positions),
            indices: new Uint32Array(indices),
            uv: new Float32Array(uv),
        };
        return { ...at, y, bottom, yaw, solid, showcase: distance === 221 };
    });
}

function roadSamples(course: Course, from: number, to: number, step: number): RouteSample[] {
    const count = Math.ceil((to - from) / step);
    return Array.from({ length: count + 1 }, (_, i) => course.at(from + i * (to - from) / count));
}

function vaultHeight(across: number): number {
    const bound = crossSection.findIndex(point => point[0] >= across);
    const [x, y] = crossSection[bound - 1]!;
    const [next, top] = crossSection[bound]!;
    return y + (top - y) * (across - x) / (next - x);
}

function metalwork(frames: readonly RouteSample[], profiles: readonly Profile[]): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const row of frames) for (const profile of profiles) {
        const base = positions.length / 3;
        for (const [station, [x, y]] of crossSection.entries()) {
            const [px, py] = crossSection[Math.max(0, station - 1)]!;
            const [qx, qy] = crossSection[Math.min(crossSection.length - 1, station + 1)]!;
            const span = Math.hypot(qx - px, qy - py);
            for (const [lengthwise, radial] of profile) {
                const p = pointOnRoute(row, x - (qy - py) / span * radial, y + (qx - px) / span * radial);
                positions.push(p.x + row.dx * lengthwise, p.y, p.z + row.dz * lengthwise);
                uv.push(station * 0.84, (lengthwise + radial) * 0.51);
            }
            if (station === 0) continue;
            const ring = base + station * profile.length;
            for (let i = 0; i < profile.length; i++) {
                const a = ring + i;
                const b = ring + (i + 1) % profile.length;
                indices.push(a - profile.length, a, b - profile.length, a, b, b - profile.length);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
