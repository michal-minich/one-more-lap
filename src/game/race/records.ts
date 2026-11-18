import type { LapCount } from "./setup.ts";

export const LAP_SPLITS = 48;

export interface LapRecord {
    readonly seconds: number;
    readonly splits: readonly number[];
}

export interface TrackRecords {
    readonly lap: LapRecord | undefined;
    readonly races: Readonly<Partial<Record<LapCount, number>>>;
}
