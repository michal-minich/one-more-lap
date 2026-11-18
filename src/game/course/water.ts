import type { Point } from "../point.ts";
import { coursePassages, bridgeDrop } from "./passages.ts";
import { pointOnRoute, sampleAt } from "./route.ts";
import type { RouteSample } from "./route.ts";
import { smoothBetween } from "./terrain-profile.ts";
import type { Biome } from "./tracks.ts";

export type WaterKind = "ocean" | "ice" | "river" | "creek" | "lake" | "lava";

export interface WaterBody {
    readonly kind: WaterKind;
    readonly center: Point;
    readonly across: number;
    readonly along: number;
    readonly dx: number;
    readonly dz: number;
    readonly depth: number;
    readonly bankRise?: number;
}

export interface WaterContact {
    readonly level: number;
    readonly depth: number;
}

interface LakeSite {
    readonly distance: number;
    readonly offset: number;
    readonly drop: number;
    readonly across: number;
    readonly along: number;
    readonly depth: number;
}

const lakes: Partial<Record<Biome, LakeSite>> = {
    forest: { distance: 152, offset: 39, drop: 1.65, across: 35, along: 62, depth: 1.38 },
    alpine: { distance: 604, offset: 91, drop: 7.1, across: 68, along: 107, depth: 4.2 },
    mars: { distance: 60, offset: 34, drop: 1.9, across: 24, along: 42, depth: 1.35 },
};

const horizon: Partial<Record<Biome, readonly [WaterKind, number]>> = {
    coast: ["ocean", -4.6],
    ruins: ["ocean", 0],
    arctic: ["ice", -1.7],
    gorge: ["river", 39.5],
};

export function courseWater(biome: Biome, route: readonly RouteSample[], center: Point): WaterBody[] {
    const bodies: WaterBody[] = [];
    const distant = horizon[biome];
    if (distant) {
        const [kind, y] = distant;
        bodies.push({ kind, center: { x: center.x, y, z: center.z }, across: 1_450, along: 1_450, dx: 0, dz: 1, depth: 0 });
    }
    for (const passage of coursePassages(biome)) {
        if (passage.kind !== "bridge") continue;
        const row = sampleAt(route, passage.distance);
        if (biome === "caldera") {
            // Cross the road diagonally. The upstream end runs beside the gallery.
            const dx = -0.29;
            const dz = Math.sqrt(1 - dx * dx);
            bodies.push({
                kind: "lava", center: { x: row.x, y: row.y - 6.2, z: row.z },
                across: 178, along: 10.4, dx, dz, depth: 3.2,
            });
            continue;
        }
        bodies.push({
            kind: biome === "arctic" ? "ice" : "creek",
            center: pointOnRoute(row, 0, 1.55 - bridgeDrop(biome, passage.distance)),
            across: biome === "metro" ? 86 : biome === "future" ? 49 : biome === "arctic" ? 43 : 37,
            along: biome === "metro" ? 22.4 : (biome === "arctic" || biome === "future") ? 24 : 19.8,
            dx: row.dx,
            dz: row.dz,
            depth: biome === "metro" ? 2.45 : biome === "future" ? 2.6 : biome === "gorge" ? 2.9 : 1.8,
        });
    }
    if (biome === "canyon") {
        const pools = [[407, -52, -8.9, 10.6, 23], [457, -61, -12.0, 14.8, 23], [507, -61, -12.8, 10.1, 18]] as const;
        for (const [distance, offset, drop, across, along] of pools) {
            const row = sampleAt(route, distance);
            bodies.push({ kind: "creek", center: pointOnRoute(row, offset, drop),
                across, along, dx: row.dx, dz: row.dz, depth: 1.35, bankRise: 3.5 });
        }
    }
    const lake = lakes[biome];
    if (lake) {
        const row = sampleAt(route, lake.distance);
        bodies.push({
            kind: "lake", center: pointOnRoute(row, lake.offset, -lake.drop), across: lake.across, along: lake.along,
            dx: row.dx, dz: row.dz, depth: lake.depth,
        });
    }
    return bodies;
}

export function waterDistance(body: WaterBody, x: number, z: number): number {
    const dx = x - body.center.x;
    const dz = z - body.center.z;
    const across = (dx * body.dz - dz * body.dx) / body.across;
    const along = (dx * body.dx + dz * body.dz - channelBend(body, across)) / body.along;
    const distance = Math.hypot(across, along);
    if (body.depth === 0 || distance > 1.65) return distance;
    return distance / shoreRadius(Math.atan2(along, across));
}

export function waterPoint(body: WaterBody, angle: number, fraction: number): Point {
    const radius = fraction * (body.depth === 0 ? 1 : shoreRadius(angle));
    const lateral = Math.cos(angle) * radius;
    return channelPoint(body, lateral, Math.sin(angle) * radius);
}

export function channelPoint(body: WaterBody, downriver: number, bank: number): Point {
    const across = downriver * body.across;
    const along = bank * body.along + channelBend(body, downriver);
    return {
        x: body.center.x + across * body.dz + along * body.dx,
        y: body.center.y,
        z: body.center.z - across * body.dx + along * body.dz,
    };
}

function channelBend(body: WaterBody, across: number): number {
    if (body.kind !== "lava") return 0;
    if (across < 0) {
        const upstream = -across;
        const bend = Math.min(1, upstream / 0.48);
        const galleryReach = smoothBetween(0.025, 0.28, upstream) * (1 - smoothBetween(0.50, 0.91, upstream));
        return -45 * bend ** 2 - 160 * Math.max(0, upstream - 0.48) + 15 * galleryReach;
    }
    return -138 * across;
}

export function reachesLava(body: WaterBody, point: Point, clearance: number): boolean {
    return point.y - clearance < body.center.y + 0.10 && waterDistance(body, point.x, point.z) < 0.94;
}

function shoreRadius(angle: number): number {
    return 1 + Math.sin(angle * 3 + 1.1) * 0.062 + Math.sin(angle * 5 - 0.8) * 0.035;
}

export function waterContact(bodies: readonly WaterBody[], point: Point, clearance: number): WaterContact | undefined {
    let level = -Infinity;
    for (const body of bodies) {
        if (body.kind !== "ice" && body.kind !== "lava" && body.center.y > level && waterDistance(body, point.x, point.z) < 1) {
            level = body.center.y;
        }
    }
    const depth = level - (point.y - clearance);
    return depth > 0.04 ? { level, depth } : undefined;
}
