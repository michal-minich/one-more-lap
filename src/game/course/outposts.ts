import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { locate, pointOnRoute } from "./route.ts";
import type { Biome } from "./tracks.ts";
import { waterDistance } from "./water.ts";

export type OutpostKind = "lighthouse" | "farm" | "timber yard" | "cabins" | "mission" | "theatre"
    | "aqueduct" | "temple" | "guardian" | "forum" | "market" | "clocktower" | "depot" | "habitat" | "lookout" | "mine" | "lodge";

export interface Outpost {
    readonly kind: OutpostKind;
    readonly position: Point;
    readonly yaw: number;
    readonly radius: number;
}

type Plan = readonly [fraction: number, lateral: number, kind: OutpostKind, yaw: number];

const plans: Partial<Record<Biome, readonly Plan[]>> = {
    coast: [[0.096, 41, "farm", 0.52], [0.41, -44, "lighthouse", 0.53], [0.735, 60, "cabins", 0.62]],
    alpine: [[0.16, 54, "farm", 0.30], [0.46, -47, "cabins", 0.2], [0.77, 51, "farm", -0.55]],
    canyon: [[0.10, 47, "mission", -0.61], [0.42, -72, "lookout", 0.32], [0.71, 45, "mine", 0.49]],
    ruins: [[0.079, -23, "guardian", 0.81], [0.217, 49, "temple", -0.37],
        [0.49, 42, "theatre", -1.06], [0.764, 36, "forum", 0.58]],
    forest: [
        [0.46, -53, "cabins", 0.41], [0.72, 56, "lookout", 0.22],
    ],
    "old-town": [[0.074, 24, "market", 0.17], [0.19, 46, "clocktower", 0.36],
        [0.50, -51, "farm", -0.30], [0.85, 67, "aqueduct", 0.27]],
    metro: [[0.24, -63, "depot", 0.23], [0.56, 53, "clocktower", 0.72], [0.84, -59, "depot", -0.51]],
    mars: [[0.12, 49, "habitat", 0.30], [0.43, -53, "habitat", -0.42], [0.76, 58, "depot", 0.71]],
    arctic: [[0.74, 43, "timber yard", 0.17]],
    gorge: [[0.12, 40, "lookout", 0.51], [0.44, 62, "mine", 0.37], [0.77, 48, "mission", -0.42]],
};

const radii: Record<OutpostKind, number> = {
    lighthouse: 13, farm: 19, "timber yard": 17, cabins: 16, mission: 16, theatre: 23,
    aqueduct: 24, temple: 29, guardian: 10, forum: 22, market: 17, clocktower: 14, depot: 25, habitat: 22, lookout: 9, mine: 17, lodge: 10,
};

type Site = Pick<Course, "length" | "track" | "route" | "at" | "ground" | "water">;

export function placeOutposts(site: Site): Outpost[] {
    const placed: Outpost[] = [];
    for (const [fraction, lateral, kind, twist] of plans[site.track.id] ?? []) {
        const radius = radii[kind];
        const row = site.at(fraction * site.length);
        for (const adjustment of [0, 10, -10, 23, -23, -lateral * 2]) {
            const candidate = pointOnRoute(row, lateral + adjustment);
            const nearest = locate(site.route, candidate);
            if (Math.abs(nearest.lateral) < radius + 10) continue;
            if (placed.some(other => Math.hypot(candidate.x - other.position.x, candidate.z - other.position.z) <
                radius + other.radius)) continue;
            const position = settle(site, candidate, radius);
            if (!position) continue;
            placed.push({ kind, position, radius, yaw: Math.atan2(row.dx, row.dz) + twist });
            break;
        }
    }
    return placed;
}

function settle(site: Site, at: Point, radius: number): Point | undefined {
    const y = site.ground.at(at.x, at.z);
    if (y === undefined || site.water.some(body => y <= body.center.y + 1 && waterDistance(body, at.x, at.z) < 1.13)) return undefined;
    const reach = radius * 0.69;
    for (const [dx, dz] of [[-reach, 0], [reach, 0], [0, -reach], [0, reach]] as const) {
        const edge = site.ground.at(at.x + dx, at.z + dz);
        if (edge === undefined || Math.abs(edge - y) > Math.max(3.1, radius * 0.19)) return undefined;
    }
    return { ...at, y };
}
