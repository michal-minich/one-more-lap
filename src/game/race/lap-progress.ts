import type { Point } from "../point.ts";
import type { CircuitLine } from "../course/circuit-line.ts";
import { ROAD_HALF, wrapDistance } from "../course/route.ts";
import type { RouteSample } from "../course/route.ts";

const GATE_HALF_WIDTH = ROAD_HALF + 8;
type TimingLine = Pick<CircuitLine, "length" | "gates" | "startLine">;

export class LapProgress {
    readonly #course: TimingLine;
    readonly totalLaps: number;
    #nextGate = 0;

    constructor(course: TimingLine, totalLaps: number) {
        this.#course = course;
        this.totalLaps = totalLaps;
    }

    get lap(): number {
        return Math.min(this.totalLaps, 1 + Math.floor(Math.max(0, this.#nextGate - 1) / this.#course.gates.length));
    }

    get finished(): boolean {
        return this.#nextGate > this.totalLaps * this.#course.gates.length;
    }

    get #nextDistance(): number {
        return this.#nextGate * this.#course.length / this.#course.gates.length;
    }

    observe(before: Point, after: Point): number | undefined {
        if (this.finished) return undefined;
        const index = this.#nextGate % this.#course.gates.length;
        const gate = this.#course.gates[index]!;
        const crossing = crossingFraction(gate, before, after);
        if (crossing === undefined) return undefined;
        this.#nextGate++;
        return index === 0 ? crossing : undefined;
    }

    #relativeDistance(distance: number): number {
        const length = this.#course.length;
        const position = wrapDistance(distance - this.#course.startLine.distance, length);
        return position + Math.round((this.#nextDistance - position) / length) * length;
    }

    distance(distance: number): number {
        if (this.finished) return this.#course.length * this.totalLaps;
        const sector = this.#course.length / this.#course.gates.length;
        return Math.min(this.#nextDistance - 0.05, Math.max(this.#nextDistance - sector, this.#relativeDistance(distance)));
    }

    acceptsRecoveryAt(distance: number): boolean {
        const ahead = this.#relativeDistance(distance) - this.#nextDistance;
        return ahead <= -2 && ahead >= -this.#course.length / this.#course.gates.length - 2;
    }

    teleportSpan(distance: number, meters: number): number {
        const from = this.#relativeDistance(distance);
        const sector = this.#course.length / this.#course.gates.length;
        if (this.finished || from > this.#nextDistance + 0.12 || from < this.#nextDistance - sector - 0.12) return 0;
        return Math.max(0, Math.min(meters, this.totalLaps * this.#course.length - from));
    }

    observeTeleport(distance: number, span: number): boolean {
        const target = this.#relativeDistance(distance) + span;
        let lapLine = false;
        while (!this.finished && this.#nextDistance <= target + 1e-6) {
            if (this.#nextGate % this.#course.gates.length === 0) lapLine = true;
            this.#nextGate++;
        }
        return lapLine;
    }

    missedGate(distance: number): boolean {
        return !this.finished && this.#relativeDistance(distance) > this.#nextDistance + 22;
    }
}

function crossingFraction(gate: RouteSample, before: Point, after: Point): number | undefined {
    const from = (before.x - gate.x) * gate.dx + (before.z - gate.z) * gate.dz;
    const to = (after.x - gate.x) * gate.dx + (after.z - gate.z) * gate.dz;
    if (from >= 0 || to < 0) return undefined;
    const t = -from / (to - from);
    const x = before.x + (after.x - before.x) * t - gate.x;
    const z = before.z + (after.z - before.z) * t - gate.z;
    const y = before.y + (after.y - before.y) * t - gate.y;
    return Math.abs(x * gate.dz - z * gate.dx) <= GATE_HALF_WIDTH && Math.abs(y) < 5 ? t : undefined;
}
