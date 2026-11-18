import type { Point } from "../../point.ts";
import type { Course } from "../course.ts";
import { GroundHeight } from "../ground-height.ts";
import { pointOnRoute } from "../route.ts";
import type { RouteSample } from "../route.ts";
import { strip } from "../surface.ts";
import type { Surface } from "../surface.ts";

interface GroundBox extends Point {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
    readonly yaw: number;
}

export interface SkywheelGrounds {
    readonly ribs: Surface;
    readonly roof: readonly Surface[];
    readonly footings: readonly GroundBox[];
    readonly catwalk: GroundBox;
    readonly paving: readonly Surface[];
    readonly terraces: readonly Surface[];
    readonly pavingHeight: GroundHeight;
    readonly wheelPad: GroundBox;
    readonly carousel: Point;
}

export const skywheelTerraceStops = [
    [533, 634, -1], [683, 753, 1], [824, 908, -1], [1_037, 1_133, -1], [1_230, 1_320, 1],
] as const;

const crown = [
    [-10.42, 2.59], [-10.24, 5.34], [-8.79, 7.48], [-6.49, 8.94], [-3.45, 9.88], [0, 10.18],
    [3.45, 9.88], [6.49, 8.94], [8.79, 7.48], [10.24, 5.34], [10.42, 2.59],
] as const;
const chamfer = [
    [-0.61, -0.22], [-0.37, -0.49], [0.37, -0.49], [0.61, -0.22],
    [0.61, 0.26], [0.37, 0.51], [-0.37, 0.51], [-0.61, 0.26],
] as const;

export function buildSkywheelGrounds(course: Course): SkywheelGrounds {
    const bays = [180, 190, 200, 210, 220].map(distance => course.at(distance));
    const footings = bays.flatMap(row => {
        return [-1, 1].map(side => {
            const at = pointOnRoute(row, side * 10.38);
            const bottom = (course.ground.at(at.x, at.z) ?? row.y) - 0.47;
            const top = row.y + 3.48;
            return { ...at, y: (top + bottom) / 2, width: 2.22, depth: 2.59,
                height: top - bottom, yaw: Math.atan2(row.dx, row.dz) };
        });
    });
    const middle = course.at(199.5);
    const catwalk = { ...middle, y: middle.y + 6.45, width: 19.8, depth: 4.8,
        height: 0.76, yaw: Math.atan2(middle.dx, middle.dz) };
    const roofStops = crown.slice(2, -2).map(([across]) => across);
    const sections = [[181, 188.7], [191.1, 208.8], [211.3, 218.7]] as const;
    const roof = sections.map(([from, to]) => {
        return strip(samples(course, from, to), roofStops, (_row, across) => roofHeight(across));
    });
    const paving = [-1, 1].map(side => {
        return strip(samples(course, 169, 232),
            signed([6.78, 7.18, 8.15, 9.7, 10.9], side),
            (row, across) => verge(course, row, across) + 0.05);
    });
    const terraces = skywheelTerraceStops.map(([from, to, side]) => {
        const offsets = [9.68, 11.36, 11.71, 14.6, 15.03, 17.2];
        const steps = [0.024, 0.03, 0.61, 0.59, 1.16, 1.16];
        return strip(samples(course, from, to), signed(offsets, side), (row, across) => {
            const lift = steps[offsets.indexOf(Math.abs(across))]!;
            const fade = Math.min(1, (row.distance - from) / 8, (to - row.distance) / 8);
            return verge(course, row, across) + 0.044 + lift * fade;
        });
    });
    const carouselRow = course.at(764);
    const carouselSite = pointOnRoute(carouselRow, -29);
    const carouselEdge = nearbyGround(course, carouselSite, 5.7);
    const carousel = { ...carouselSite, y: Math.min(...carouselEdge) - 0.21 };
    const wheelSite = { x: 51.8, y: 9.2, z: 245.9 };
    const wheelGround = nearbyGround(course, wheelSite, 8.65);
    const deck = Math.max(...wheelGround) + 0.29;
    const bottom = Math.min(...wheelGround) - 0.43;
    const wheelPad = { ...wheelSite, y: (deck + bottom) / 2, width: 17.38,
        height: deck - bottom, depth: 18.1, yaw: -0.54 };
    const pavingHeight = new GroundHeight([...paving, ...terraces]);
    return { ribs: galleryRibs(bays), roof, footings, catwalk, paving, terraces, pavingHeight, wheelPad, carousel };
}

function nearbyGround(course: Course, site: Point, radius: number): number[] {
    const { x, y, z } = site;
    const corners = [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]] as const;
    return corners.map(([east, north]) => course.ground.at(x + east * radius, z + north * radius) ?? y);
}

function signed(offsets: readonly number[], side: number): number[] {
    const edges = offsets.map(offset => offset * side);
    return side < 0 ? edges.toReversed() : edges;
}

function verge(course: Course, row: RouteSample, across: number): number {
    const at = pointOnRoute(row, across);
    return (course.ground.at(at.x, at.z, row.y + 8) ?? row.y) - row.y;
}

function samples(course: Course, from: number, to: number): RouteSample[] {
    const count = Math.ceil((to - from) / 1.75);
    return Array.from({ length: count + 1 }, (_, index) => course.at(from + (to - from) * index / count));
}

function roofHeight(across: number): number {
    return crown.find(([x]) => x === across)![1] + 0.39;
}

function galleryRibs(bays: readonly RouteSample[]): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const row of bays) {
        const base = positions.length / 3;
        for (const [station, [across, height]] of crown.entries()) {
            for (const [index, [along, rise]] of chamfer.entries()) {
                const outward = Math.sign(across) * (1 - Math.min(1, Math.max(0, (height - 5) / 3))) * rise;
                const at = pointOnRoute(row, across + outward, height + rise * (1 - 0.87 * Math.abs(outward / 0.51)));
                positions.push(at.x + row.dx * along, at.y, at.z + row.dz * along);
                uv.push(along + rise * 0.43, station * 0.72);
                if (station === 0) continue;
                const next = (index + 1) % chamfer.length;
                const prev = base + (station - 1) * chamfer.length;
                const curr = prev + chamfer.length;
                indices.push(prev + index, prev + next, curr + index, prev + next, curr + next, curr + index);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
