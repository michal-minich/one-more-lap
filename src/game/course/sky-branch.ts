import type { Point } from "../point.ts";
import type { Barrier } from "./barriers.ts";
import { GroundHeight } from "./ground-height.ts";
import { pointOnRoute, sampleAt } from "./route.ts";
import type { RouteSample } from "./route.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";

const FORK = 231;
const MERGE = 345;
export const SKY_BRANCH_HALF = 4.2;
const SWEEP = 28;

export class SkyBranch {
    readonly route: readonly RouteSample[];
    readonly deck: Surface;
    readonly barriers: readonly Barrier[];
    readonly #ground: GroundHeight;

    constructor(unramped: readonly RouteSample[]) {
        const positions = Array.from({ length: 58 }, (_, index) => {
            const distance = FORK + index * 2;
            const row = sampleAt(unramped, distance);
            return { ...row, ...pointOnRoute(row, branchOffset(distance), -0.052) };
        });
        this.route = positions.map((point, index) => {
            const before = positions[Math.max(0, index - 1)]!;
            const after = positions[Math.min(positions.length - 1, index + 1)]!;
            const tangent = Math.hypot(after.x - before.x, after.z - before.z);
            return { ...point, dx: (after.x - before.x) / tangent, dz: (after.z - before.z) / tangent };
        });
        this.deck = strip(this.route, [-SKY_BRANCH_HALF, 0, SKY_BRANCH_HALF], () => 0);
        this.#ground = new GroundHeight([this.deck]);
        const barriers: Barrier[] = [];
        for (const [index, row] of this.route.entries()) {
            const next = this.route[index + 1];
            if (!next) break;
            const separation = Math.min(branchOffset(row.distance), branchOffset(next.distance));
            if (separation > 6.3) barriers.push({
                a: pointOnRoute(row, SKY_BRANCH_HALF - 0.18), b: pointOnRoute(next, SKY_BRANCH_HALF - 0.18),
            });
            if (separation > 14.8) barriers.push({
                a: pointOnRoute(row, -SKY_BRANCH_HALF + 0.18), b: pointOnRoute(next, -SKY_BRANCH_HALF + 0.18),
            });
        }
        this.barriers = barriers;
    }

    supports(point: Point): boolean {
        const y = this.#ground.at(point.x, point.z);
        return y !== undefined && point.y > y - 0.15 && point.y < y + 2.8;
    }

    interruptsRail(from: number, to: number): boolean {
        return from < MERGE && to > FORK;
    }
}

function branchOffset(distance: number): number {
    return SWEEP * Math.sin(Math.PI * (distance - FORK) / (MERGE - FORK)) ** 2;
}
