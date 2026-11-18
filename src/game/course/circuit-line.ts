import type { Point } from "../point.ts";
import { crossesGap, locate, sampleAt, wrapDistance } from "./route.ts";
import type { RoadGap, RouteLocation, RouteSample } from "./route.ts";

const GRID_DISTANCE = 42;
const SECTOR_COUNT = 8;

export type RaceDirection = "forward" | "reverse";

export interface Bend {
    readonly side: "left" | "right";
    readonly sign: RouteSample;
    readonly entryDistance: number;
    readonly angle: number;
}

interface LineOptions {
    readonly startDistance?: number;
    readonly gap?: RoadGap | undefined;
    readonly stacked?: boolean;
}

export class CircuitLine {
    readonly route: readonly RouteSample[];
    readonly length: number;
    readonly bends: readonly Bend[];
    readonly startLine: RouteSample;
    readonly start: RouteSample;
    readonly gates: readonly RouteSample[];
    readonly gap: RoadGap | undefined;
    readonly #stacked: boolean;

    constructor(route: readonly RouteSample[], { startDistance = GRID_DISTANCE, gap, stacked = false }: LineOptions = {}) {
        this.route = route;
        this.length = route.at(-1)!.distance;
        this.gap = gap;
        this.#stacked = stacked;
        this.startLine = this.at(startDistance);
        this.start = this.at(startDistance - 10);
        this.gates = Array.from({ length: SECTOR_COUNT }, (_, index) =>
            this.at(startDistance + this.length * index / SECTOR_COUNT));
        this.bends = describeBends(route);
    }

    reversed(): CircuitLine {
        const route = this.route.toReversed().map(row => {
            return { ...row, dx: -row.dx, dz: -row.dz, distance: this.length - row.distance };
        });
        const gap = this.gap && { from: this.length - this.gap.to, to: this.length - this.gap.from };
        return new CircuitLine(route, { startDistance: this.length - this.startLine.distance, gap, stacked: this.#stacked });
    }

    at(distance: number): RouteSample {
        return sampleAt(this.route, distance);
    }

    locate(position: Point): RouteLocation {
        return locate(this.route, position, this.#stacked);
    }

    isGap(distance: number, padding = 0): boolean {
        if (!this.gap) return false;
        const at = wrapDistance(distance, this.length);
        return crossesGap(this.gap, at - padding, at + padding);
    }
}

function describeBends(route: readonly RouteSample[]): Bend[] {
    const bends: Bend[] = [];
    let lastSign = -130;
    for (let i = 0; i < route.length - 1; i++) {
        const sign = route[i]!;
        if (sign.distance - lastSign < 135) continue;
        const entry = sampleAt(route, sign.distance + 21);
        const exit = sampleAt(route, sign.distance + 71);
        const turn = Math.atan2(entry.dz * exit.dx - entry.dx * exit.dz, entry.dx * exit.dx + entry.dz * exit.dz);
        const angle = Math.abs(turn);
        if (angle < 0.43) continue;
        bends.push({ side: turn > 0 ? "right" : "left", sign, entryDistance: entry.distance, angle });
        lastSign = sign.distance;
    }
    return bends;
}
