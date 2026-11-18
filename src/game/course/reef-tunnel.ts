import type { Course } from "./course.ts";
import { pointOnRoute, ROAD_HALF } from "./route.ts";
import type { RouteSample } from "./route.ts";
import type { Surface } from "./surface.ts";

export const reefDeckHalfWidth = ROAD_HALF + 0.23;
export const reefTunnelStart = 142;
export const reefTunnelEnd = 675;
export const reefSuspended = { from: 191, to: 623 } as const;
export const reefTubeHalfWidth = 8.35;
export const reefTunnelProfile: readonly (readonly [number, number])[] = Array.from({ length: 33 }, (_, i) => {
    const angle = Math.PI * 2 * i / 32;
    return [Math.sin(angle) * reefTubeHalfWidth, 1.15 + Math.cos(angle) * 6.75];
});

export function reefTunnel(course: Course): Surface | undefined {
    return course.track.id === "reef" ? sweepTunnel(course, reefTunnelProfile) : undefined;
}

export function reefPortalStonework(course: Course): Surface | undefined {
    if (course.track.id !== "reef") return undefined;
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const sections = reefTunnelProfile.length;
    for (const [distance, facing] of [[reefTunnelStart, -1], [reefTunnelEnd, 1]] as const) {
        const front = course.at(distance + facing * 2.24);
        const back = course.at(distance - facing * 2.55);
        const outer = course.at(distance + facing * 1.38);
        const masonryRings = [[front, 1.026], [front, 1.265], [outer, 1.33], [back, 1.27], [back, 1.027], [front, 1.026]] as const;
        const first = positions.length / 3;
        for (const [ring, [row, scale]] of masonryRings.entries()) {
            for (const [section, [across, rise]] of reefTunnelProfile.entries()) {
                const point = pointOnRoute(row, across * scale, 1.15 + (rise - 1.15) * scale);
                positions.push(point.x, point.y, point.z);
                uv.push(section * 0.38, scale * 5.5 + (row.distance - distance) * 0.18);
                if (ring === 0 || section === 0) continue;
                const i = first + ring * sections + section;
                indices.push(i - sections - 1, i - 1, i, i - sections - 1, i, i - sections);
            }
        }
        const row = course.at(distance);
        const yawCorners = [[0, -1], [1, -1], [1, 1], [0, 1]] as const;
        for (const side of [-1, 1]) {
            const base = positions.length / 3;
            const tiers = [[8.74, 14.7, 3.1], [9.16, 13.42, 2.85], [9.05, 13.55, 2.94]] as const;
            for (const [tier, [inner, outerEdge, length]] of tiers.entries()) {
                for (const [edge, end] of yawCorners) {
                    const section = course.at(distance + end * length);
                    const point = pointOnRoute(section, side * (edge ? outerEdge : inner));
                    const bed = course.ground.at(point.x, point.z, row.y + 0.4) ?? row.y - 4.2;
                    const y = tier === 0 ? bed - 0.52 : row.y + (tier === 1 ? 3.32 : 3.58);
                    positions.push(point.x, y, point.z);
                    uv.push((point.x + point.z * 0.46) / 3.8, y / 3.7);
                }
            }
            for (const tier of [0, 1]) {
                for (let corner = 0; corner < 4; corner++) {
                    const a = base + tier * 4 + corner;
                    const b = base + tier * 4 + (corner + 1) % 4;
                    indices.push(a, b, a + 4, b, b + 4, a + 4);
                }
            }
            indices.push(base + 8, base + 9, base + 10, base + 8, base + 10, base + 11);
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

export function sweepTunnel(course: Course, profile: readonly (readonly [number, number])[]): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const width = profile.length;
    const sections = Math.ceil((reefTunnelEnd - reefTunnelStart) / 3.6);
    const distances = Array.from({ length: sections + 1 }, (_, i) =>
        reefTunnelStart + (reefTunnelEnd - reefTunnelStart) * i / sections);
    for (const [segment, distance] of distances.entries()) {
        const row = course.at(distance);
        for (const [column, [x, y]] of profile.entries()) {
            const point = pointOnRoute(row, x, y);
            positions.push(point.x, point.y, point.z);
            uv.push(column * 0.25, row.distance / 12);
            if (segment === 0 || column === 0) continue;
            const i = segment * width + column;
            indices.push(i - width - 1, i - 1, i - width, i - width, i - 1, i);
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

export function reefSeabedRise(row: RouteSample, relief: number): number {
    const { from, to } = reefSuspended;
    const depth = Math.min(1, Math.max(0, Math.min(row.distance - from + 40, to + 40 - row.distance) / 40));
    return depth * depth * (3 - 2 * depth) * Math.min(0, -37 - row.y + relief * 2.7);
}
