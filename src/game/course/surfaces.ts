import type { Point } from "../point.ts";
import type { TrackSpec } from "./tracks.ts";
import { landscape } from "./landscape.ts";
import { bridgeHalfLength, bridgeRows, coursePassages } from "./passages.ts";
import { roadHalfWidth } from "./road-width.ts";
import { reefSuspended } from "./reef-tunnel.ts";
import { pointOnRoute, ROAD_HALF } from "./route.ts";
import type { RouteSample } from "./route.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";
import { groundHeight, smoothBetween, VERGE_EDGE } from "./terrain-profile.ts";
import { bankElevation } from "./water-banks.ts";
import type { WaterBody } from "./water.ts";

export interface CourseSurfaces {
    readonly road: Surface;
    readonly branch?: Surface;
    readonly left: Surface;
    readonly right: Surface;
    readonly landscape: readonly Surface[];
    readonly beds: readonly Surface[];
}

export function courseSurfaces(
    track: TrackSpec, route: readonly RouteSample[], center?: Point, water: readonly WaterBody[] = [],
): CourseSurfaces {
    const bridges = center ? coursePassages(track.id).filter(passage => passage.kind === "bridge") : [];
    const bridgeReach = bridgeHalfLength(track.id);
    const terrain = (row: RouteSample, offset: number): number => {
        const width = roadHalfWidth(track.id, row.distance);
        let rise = groundHeight(track, row, offset);
        if (track.id === "caldera") {
            const crossing = bridges[0]?.distance ?? -Infinity;
            const clearance = smoothBetween(0, 14, bridgeReach - Math.abs(row.distance - crossing))
                * (1 - smoothBetween(10, 22, Math.abs(offset)));
            rise += (Math.min(rise, -10.2) - rise) * clearance;
        }
        const point = pointOnRoute(row, offset, rise);
        let weight = smoothBetween(width, width + 6, Math.abs(offset));
        for (const bridge of bridges) {
            const reach = bridgeReach - Math.abs(row.distance - bridge.distance);
            weight = Math.max(weight, smoothBetween(0, 6, reach));
        }
        return rise + (bankElevation(point, water) - point.y) * weight;
    };
    const beds = bridges.map(passage => strip(bridgeRows(route, passage.distance, track.id), [-ROAD_HALF, 0, ROAD_HALF], terrain));
    if (track.id === "reef") {
        const seabed = route.filter(row => row.distance >= reefSuspended.from - 37 && row.distance <= reefSuspended.to + 37);
        beds.push(strip(seabed, [-ROAD_HALF, -3, 0, 3, ROAD_HALF], terrain));
    }
    const shoulder = track.id === "caldera"
        ? [ROAD_HALF, 7.1, 8, 9.5, 11, 12.5, 14, 16, 18, 20, VERGE_EDGE]
        : track.id === "old-town" ? [ROAD_HALF, 7.7, 9.5, 11.4, 13.5, 15.5, 18, 20, VERGE_EDGE]
        : track.id === "gorge" || track.id === "rail" || track.id === "reef" ? [ROAD_HALF, 7.9, 9.5, 11.5, 14, 16.5, 19.5, VERGE_EDGE]
            : [ROAD_HALF, 8, 11, 16, VERGE_EDGE];
    const verge = (row: RouteSample): number[] => [roadHalfWidth(track.id, row.distance), ...shoulder.slice(1)];
    return {
        road: strip(route, row => {
            const half = roadHalfWidth(track.id, row.distance);
            return [-half, 0, half];
        }, () => 0),
        left: strip(route, row => verge(row).map(offset => -offset).reverse(), terrain),
        right: strip(route, verge, terrain),
        landscape: center ? [landscape(track, center, route, false, water), landscape(track, center, route, true, water)] : [],
        beds,
    };
}

export function terrainSurfaces(surfaces: CourseSurfaces): readonly Surface[] {
    return [surfaces.left, surfaces.right, ...surfaces.landscape, ...surfaces.beds];
}

export function driveableSurfaces(surfaces: CourseSurfaces): readonly Surface[] {
    const ground = [surfaces.road, ...terrainSurfaces(surfaces)];
    if (surfaces.branch) ground.push(surfaces.branch);
    return ground;
}
