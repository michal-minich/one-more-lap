import type { Course } from "./course.ts";
import { bridgeDrop } from "./passages.ts";
import { locate, pointOnRoute, ROAD_HALF } from "./route.ts";
import { waterDistance } from "./water.ts";
import type { Point } from "../point.ts";

export interface WinterCabin extends Point {
    readonly bottom: number;
    readonly yaw: number;
    readonly paint: string;
}

export const winterCabinFootprint = { width: 9.8, depth: 9.2 } as const;
const village = [[-20, "#754943"], [-4, "#74655a"], [14, "#576c79"]] as const;

export function winterCabins(course: Course): WinterCabin[] {
    if (course.track.id !== "arctic") return [];
    const cabins: WinterCabin[] = [];
    const reach = Math.hypot(11, 10.7) / 2;
    for (let index = 39; index < course.route.length - 8; index += 48) {
        const row = course.route[index]!;
        if (bridgeDrop(course.track.id, row.distance) > 0) continue;
        const yaw = Math.atan2(row.dx, row.dz);
        for (const [slot, [along, paint]] of village.entries()) {
            const offset = pointOnRoute(row, 17 + slot % 2 * 6);
            const at = { x: offset.x + row.dx * along, z: offset.z + row.dz * along, y: row.y };
            if (Math.abs(locate(course.route, at).lateral) < ROAD_HALF + reach + 1) continue;
            if (course.outposts.some(outpost => Math.hypot(at.x - outpost.position.x, at.z - outpost.position.z) <
                outpost.radius + reach)) continue;
            const center = course.ground.at(at.x, at.z);
            if (center === undefined || course.water.some(water =>
                center < water.center.y + 0.58 && waterDistance(water, at.x, at.z) < 1.06)) continue;
            let low = center;
            let high = center;
            for (const side of [-1, 1]) {
                for (const end of [-1, 1]) {
                    const lateral = side * winterCabinFootprint.width / 2;
                    const forward = end * winterCabinFootprint.depth / 2;
                    const x = at.x + row.dz * lateral + row.dx * forward;
                    const z = at.z - row.dx * lateral + row.dz * forward;
                    const y = course.ground.at(x, z) ?? center;
                    low = Math.min(low, y);
                    high = Math.max(high, y);
                }
            }
            if (high - low > 4.2) continue;
            cabins.push({ ...at, y: high + 0.035, bottom: low - 0.35, yaw, paint });
        }
    }
    return cabins;
}
