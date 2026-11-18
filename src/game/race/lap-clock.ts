import { LAP_SPLITS } from "./records.ts";
import type { LapRecord } from "./records.ts";

export interface LapTiming {
    readonly seconds: number;
    readonly delta: number | undefined;
}

export class LapClock {
    readonly #length: number;
    #best: LapRecord | undefined;
    #reference: LapRecord | undefined;
    #start: number | undefined;
    #stop: number | undefined;
    #origin = 0;
    #previousDistance = 0;
    #previousSeconds = 0;
    #splits: number[] = [];

    constructor(length: number, best?: LapRecord) {
        this.#length = length;
        this.#best = best;
    }

    observe(progress: number, now: number, startLineAt: number | undefined, finished: boolean): LapRecord | undefined {
        let completed: LapRecord | undefined;
        if (startLineAt !== undefined) {
            if (this.#start !== undefined) {
                const seconds = startLineAt - this.#start;
                this.#sample(this.#length, seconds);
                completed = { seconds, splits: this.#splits };
                if (!this.#best || seconds < this.#best.seconds) this.#best = completed;
                if (finished) {
                    this.#stop = startLineAt;
                    return completed;
                }
                this.#origin += this.#length;
            }
            this.#start = startLineAt;
            this.#reference = this.#best;
            this.#splits = [0];
            this.#previousDistance = 0;
            this.#previousSeconds = 0;
        }
        if (this.#start !== undefined) {
            const distance = Math.max(0, Math.min(this.#length, progress - this.#origin));
            this.#sample(distance, now - this.#start);
        }
        return completed;
    }

    read(now: number): LapTiming {
        if (this.#start === undefined) return { seconds: 0, delta: undefined };
        const seconds = (this.#stop ?? now) - this.#start;
        const reference = this.#reference;
        if (!reference) return { seconds, delta: undefined };
        const progress = this.#previousDistance / this.#length * LAP_SPLITS;
        const bin = Math.min(LAP_SPLITS - 1, Math.floor(progress));
        const from = reference.splits[bin]!;
        const to = reference.splits[bin + 1]!;
        const target = from + (to - from) * (progress - bin);
        return { seconds, delta: seconds - target };
    }

    #sample(distance: number, seconds: number): void {
        const travel = distance - this.#previousDistance;
        for (let i = this.#splits.length; i <= LAP_SPLITS; i++) {
            const target = this.#length * i / LAP_SPLITS;
            if (target > distance) break;
            const fraction = travel > 0 ? Math.max(0, (target - this.#previousDistance) / travel) : 1;
            this.#splits.push(this.#previousSeconds + (seconds - this.#previousSeconds) * fraction);
        }
        this.#previousDistance = distance;
        this.#previousSeconds = seconds;
    }
}
