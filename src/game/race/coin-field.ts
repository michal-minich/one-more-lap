import type { Course } from "../course/course.ts";
import { pointOnRoute } from "../course/route.ts";
import type { Point } from "../point.ts";

export interface RaceCoin {
    readonly index: number;
    readonly position: Point;
}

const sites = [[0.058, 0], [0.382, 2.6], [0.723, -2.5]] as const;

export class CoinField {
    readonly coins: readonly RaceCoin[];
    readonly #picked = new Set<number>();
    readonly #radius: number;

    constructor(course: Course, magnet: boolean) {
        this.#radius = magnet ? 4.2 : 1.45;
        this.coins = sites.map(([fraction, lane], index) => {
            const distance = course.startLine.distance + fraction * course.length;
            const row = course.at(distance);
            const site = course.gap && course.isGap(row.distance, 2) ? course.at(course.gap.to + 8) : row;
            return { index, position: pointOnRoute(site, lane, 0.92) };
        });
    }

    collect(before: Point, after: Point, picked: number[]): void {
        for (const coin of this.coins) {
            if (this.#picked.has(coin.index) || !touches(coin.position, before, after, this.#radius)) continue;
            this.#picked.add(coin.index);
            picked.push(coin.index);
        }
    }
}

function touches(coin: Point, before: Point, after: Point, radius: number): boolean {
    const dx = after.x - before.x;
    const dz = after.z - before.z;
    const lengthSquared = dx * dx + dz * dz;
    const projection = lengthSquared > 0
        ? ((coin.x - before.x) * dx + (coin.z - before.z) * dz) / lengthSquared : 0;
    const t = Math.max(0, Math.min(1, projection));
    const x = before.x + dx * t - coin.x;
    const z = before.z + dz * t - coin.z;
    const y = before.y + (after.y - before.y) * t;
    return x * x + z * z <= radius * radius && Math.abs(y - coin.y) < 1.24;
}
