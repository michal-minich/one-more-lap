import type { Bend, CircuitLine } from "../course/circuit-line.ts";
import type { RouteSample } from "../course/route.ts";
import { ROAD_HALF, wrapDistance } from "../course/route.ts";
import type { RouteLocation } from "../course/route.ts";
import { SKY_EDGE } from "../course/sky-ribbon.ts";
import { waterContact } from "../course/water.ts";
import type { WaterBody, WaterContact } from "../course/water.ts";
import type { Point } from "../point.ts";
import { STEP } from "../vehicle/world.ts";

const BEND_LOOKAHEAD = 128;
const WRONG_WAY_TICKS = 78;
const DEEP_WATER_TIME = 2.4;
const JUMP_RUN_UP = 72;

export interface BendWarning {
    readonly side: Bend["side"];
    readonly distance: number;
}

export class TrackPosition {
    readonly #line: CircuitLine;
    readonly #waterBodies: readonly WaterBody[];
    #location: RouteLocation;
    #safeDistance: number;
    #wrongTicks = 0;
    #wrongWay = false;
    #water: WaterContact | undefined;
    #deepWaterTime = 0;

    constructor(line: CircuitLine, water: readonly WaterBody[], start: RouteSample) {
        this.#line = line;
        this.#waterBodies = water;
        this.#location = line.locate(start);
        this.#safeDistance = start.distance;
    }

    get location(): RouteLocation { return this.#location; }
    get safeDistance(): number {
        const gap = this.#line.gap;
        if (gap && this.#safeDistance >= gap.from - JUMP_RUN_UP && this.#safeDistance < gap.to + 12) {
            return gap.from - JUMP_RUN_UP;
        }
        return this.#safeDistance;
    }
    get wrongWay(): boolean { return this.#wrongWay; }
    get water(): WaterContact | undefined { return this.#water; }

    reset(position: Point): void {
        this.#location = this.#line.locate(position);
        this.#wrongTicks = 0;
        this.#wrongWay = false;
        this.#water = undefined;
        this.#deepWaterTime = 0;
    }

    observe(position: Point, velocity: Point, clearance: number): RouteLocation {
        const current = this.#line.locate(position);
        this.#location = current;
        this.#water = waterContact(this.#waterBodies, position, clearance);
        this.#deepWaterTime = this.#water && this.#water.depth > 1.65 ? this.#deepWaterTime + STEP : 0;
        const row = this.#line.route[current.index]!;
        const backward = velocity.x * row.dx + velocity.z * row.dz < -2.5 && Math.abs(current.lateral) < 24;
        this.#wrongTicks = backward ? Math.min(108, this.#wrongTicks + 1) : Math.max(0, this.#wrongTicks - 4);
        if (this.#wrongTicks >= WRONG_WAY_TICKS) this.#wrongWay = true;
        else if (this.#wrongTicks === 0) this.#wrongWay = false;
        return current;
    }

    markSafe(height: number): void {
        const { distance, lateral, elevation } = this.#location;
        const width = this.#line.gap ? SKY_EDGE - 0.8 : ROAD_HALF + 2;
        if (!this.#water && !this.#line.isGap(distance, 3) && Math.abs(lateral) < width && Math.abs(height - elevation) < 3) {
            this.#safeDistance = distance;
        }
    }

    submergedTooLong(): boolean {
        return this.#deepWaterTime >= DEEP_WATER_TIME;
    }

    nextBend(): BendWarning | undefined {
        if (this.#wrongWay) return undefined;
        let next: BendWarning | undefined;
        for (const bend of this.#line.bends) {
            const distance = wrapDistance(bend.entryDistance - this.#location.distance, this.#line.length);
            if (distance <= BEND_LOOKAHEAD && (!next || distance < next.distance)) next = { side: bend.side, distance };
        }
        return next;
    }
}
