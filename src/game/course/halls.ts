import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { coursePassages } from "./passages.ts";
import type { HallKind } from "./passages.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import type { Biome } from "./tracks.ts";

interface HallPlan {
    readonly length: number;
    readonly halfWidth: number;
    readonly eaveHeight: number;
    readonly roofRise: number;
}

export interface HallPost extends Point {
    readonly height: number;
    readonly radius: number;
}

interface HallFrame {
    readonly row: RouteSample;
    readonly posts: readonly HallPost[];
}

export interface HallEquipment extends Point {
    readonly yaw: number;
}

export interface Hall extends HallPlan {
    readonly kind: HallKind;
    readonly frames: readonly HallFrame[];
    readonly coolantModules: readonly HallEquipment[];
}

export const coolantModuleSize = { width: 4.15, height: 2.7, depth: 3.6 } as const;

const halls: Record<HallKind, HallPlan> = {
    "glass hall": { length: 64, halfWidth: 16.2, eaveHeight: 5.85, roofRise: 9.8 },
    "transit hall": { length: 61, halfWidth: 17.4, eaveHeight: 6.45, roofRise: 7.3 },
    "space hangar": { length: 76, halfWidth: 21.6, eaveHeight: 7.8, roofRise: 5.9 },
};

export function isHall(kind: string): kind is HallKind {
    return kind === "glass hall" || kind === "transit hall" || kind === "space hangar";
}

export function hallSetback(biome: Biome, distance: number): number {
    for (const passage of coursePassages(biome)) {
        if (!isHall(passage.kind)) continue;
        const hall = halls[passage.kind];
        if (Math.abs(distance - passage.distance) <= hall.length / 2 + 8) return hall.halfWidth + 4;
    }
    return 0;
}

export function placeHalls(course: Course): Hall[] {
    const placed: Hall[] = [];
    for (const passage of course.passages) {
        const { kind, distance } = passage;
        if (!isHall(kind)) continue;
        const plan = halls[kind];
        const count = Math.ceil(plan.length / 8);
        const frames = Array.from({ length: count + 1 }, (_, i): HallFrame => {
            const row = course.at(distance + (i / count - 0.5) * plan.length);
            const posts = [-1, 1].map(side => {
                const at = pointOnRoute(row, side * plan.halfWidth);
                const floor = (course.ground.at(at.x, at.z) ?? row.y) - 0.19;
                return { ...at, y: floor, height: row.y + plan.eaveHeight - floor, radius: 0.42 };
            });
            return { row, posts };
        });
        const coolantModules = kind === "space hangar" ? placeCoolantModules(course, distance) : [];
        placed.push({ kind, ...plan, frames, coolantModules });
    }
    return placed;
}

function placeCoolantModules(course: Course, center: number): HallEquipment[] {
    const bays = [[-25, 1], [-16, -1], [1, 1], [16, -1], [27, 1]] as const;
    return bays.map(([along, side]) => {
        const row = course.at(center + along);
        const point = pointOnRoute(row, side * 10.2);
        const y = course.ground.at(point.x, point.z) ?? point.y;
        return { ...point, y, yaw: Math.atan2(row.dx, row.dz) + (side < 0 ? Math.PI : 0) + side * 0.23 };
    });
}
