import type { City } from "./district-plans.ts";
import type { Biome } from "./tracks.ts";
import { smoothBetween } from "./terrain-profile.ts";

export interface StreetLandscape {
    readonly start: number;
    readonly end: number;
    readonly side: -1 | 1;
    readonly width: number;
}

export const WALK_EDGE = 7.45;

const streets: Record<City, readonly StreetLandscape[]> = {
    "old-town": [
        { start: 62, end: 171, side: 1, width: 18.4 },
        { start: 95, end: 174, side: -1, width: 7.7 },
        { start: 187, end: 269, side: 1, width: 7.7 },
        { start: 186, end: 259, side: -1, width: 6.3 },
        { start: 278, end: 340, side: -1, width: 8.5 },
        { start: 826, end: 932, side: 1, width: 14.8 },
    ],
    metro: [
        { start: 205, end: 321, side: -1, width: 12.7 },
        { start: 206, end: 286, side: 1, width: 8.8 },
        { start: 853, end: 919, side: -1, width: 13.3 },
        { start: 868, end: 916, side: 1, width: 10.9 },
        { start: 975, end: 1_049, side: 1, width: 13.8 },
        { start: 978, end: 1_026, side: -1, width: 10.2 },
    ],
    future: [
        { start: 214, end: 326, side: -1, width: 11.6 },
        { start: 226, end: 360, side: 1, width: 9.8 },
        { start: 405, end: 487, side: 1, width: 15.1 },
        { start: 435, end: 488, side: -1, width: 9.5 },
        { start: 555, end: 653, side: -1, width: 13.6 },
        { start: 574, end: 674, side: 1, width: 10.8 },
        { start: 1_063, end: 1_215, side: -1, width: 12.4 },
        { start: 866, end: 942, side: 1, width: 11.1 },
    ],
};

export function streetLandscape(biome: Biome): readonly StreetLandscape[] {
    if (biome === "old-town" || biome === "metro" || biome === "future") return streets[biome];
    return [];
}

export function walkWidth(street: StreetLandscape, distance: number): number {
    const width = street.width * smoothBetween(0, 12, Math.min(distance - street.start, street.end - distance));
    return Math.max(0.12, width);
}

export function inStreetWalk(streets: readonly StreetLandscape[], distance: number, lateral: number): boolean {
    const across = Math.abs(lateral);
    if (across < WALK_EDGE - 0.45) return false;
    return streets.some(street => street.side === Math.sign(lateral) && distance >= street.start && distance <= street.end &&
        across <= WALK_EDGE + walkWidth(street, distance) + 0.8);
}
