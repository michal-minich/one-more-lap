import type { Point } from "../point.ts";
import { landscapeNoise, smoothBetween } from "./terrain-profile.ts";
import { waterDistance } from "./water.ts";
import type { WaterBody } from "./water.ts";

export function bankElevation(point: Point, water: readonly WaterBody[]): number {
    let height = point.y;
    for (const body of water) {
        const distance = waterDistance(body, point.x, point.z);
        if (distance >= (body.kind === "lava" ? 1.83 : 1.49)) continue;
        const level = body.center.y;
        if (body.depth > 0) {
            if (body.kind === "lava") {
                height = lavaBank(point, body, distance);
                continue;
            }
            const rim = body.bankRise ?? 0.86;
            const bowl = level - body.depth + (body.depth + rim) * Math.min(1, distance ** 2);
            const join = smoothBetween(1.19, 1.49, distance);
            height = bowl + (height - bowl) * join;
        }
        if (body.kind === "ice" && distance < 1) height = Math.max(height, level - 0.035);
    }
    return height;
}

function lavaBank(point: Point, body: WaterBody, distance: number): number {
    const level = body.center.y;
    const shore = level - body.depth + (body.depth + 0.96) * smoothBetween(0.43, 0.96, distance);
    const relief = Math.max(0, point.y - level - 0.96);
    const fracture = landscapeNoise(point.x * 2.8, point.z * 2.8) * 0.09;
    const benches = 0.31 * smoothBetween(0.97, 1.14, distance + fracture)
        + 0.38 * smoothBetween(1.19, 1.38, distance + fracture)
        + 0.31 * smoothBetween(1.48, 1.79, distance + fracture);
    const shaped = shore + relief * benches;
    const join = smoothBetween(1.51, 1.83, distance);
    return shaped + (point.y - shaped) * join;
}
