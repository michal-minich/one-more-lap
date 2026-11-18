import { roadHalfWidth } from "./road-width.ts";
import { ROAD_HALF, sampleAt } from "./route.ts";
import type { RoadGap, RouteSample } from "./route.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";
import type { CourseSurfaces } from "./surfaces.ts";

export const SKY_GAP: RoadGap = { from: 268, to: 284 };
export const SKY_EDGE = ROAD_HALF + 1.35;
const APPROACH = 12;
const LIP_HEIGHT = 2.12;

export function rampedRibbon(route: readonly RouteSample[], gap: RoadGap): RouteSample[] {
    const { from, to } = gap;
    const distances = new Set(route.map(row => row.distance));
    for (const edge of [from - APPROACH, from, to, to + APPROACH]) distances.add(edge);
    const length = route.at(-1)!.distance;
    return [...distances].sort((a, b) => a - b).map(distance => {
        if (distance === length) return route.at(-1)!;
        const row = sampleAt(route, distance);
        const toLip = Math.max(0, from - distance, distance - to);
        return { ...row, y: row.y + LIP_HEIGHT * Math.max(0, 1 - toLip / APPROACH) ** 2 };
    });
}

export function ribbonSurfaces(route: readonly RouteSample[], gap: RoadGap, branch: Surface): CourseSurfaces {
    return {
        branch,
        road: strip(route, row => {
            const width = roadHalfWidth("sky", row.distance);
            return [-width, 0, width];
        }, () => 0, gap),
        left: strip(route, row => [-SKY_EDGE, -roadHalfWidth("sky", row.distance)], () => 0, gap),
        right: strip(route, row => [roadHalfWidth("sky", row.distance), SKY_EDGE], () => 0, gap),
        landscape: [],
        beds: [],
    };
}
