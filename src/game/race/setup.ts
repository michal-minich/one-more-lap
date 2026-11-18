import type { CarSpec } from "../vehicle/cars.ts";
import type { TrackSpec } from "../course/tracks.ts";
import type { RaceDirection } from "../course/circuit-line.ts";
import type { Weather } from "./conditions.ts";

export const lapChoices = [1, 2, 3, 4, 5] as const;
export const opponentChoices = [0, 3, 5, 7, 10, 12] as const;
export const difficulties = ["Rookie", "Easy", "Normal", "Hard", "Expert", "Legend"] as const;
export const DEFAULT_LAPS = 3;
export const DEFAULT_OPPONENTS = 5;
export const DEFAULT_DIFFICULTY = "Normal";

export type LapCount = typeof lapChoices[number];
export type OpponentCount = typeof opponentChoices[number];
export type Difficulty = typeof difficulties[number];

export interface Setup {
    readonly car: CarSpec;
    readonly track: TrackSpec;
    readonly direction: RaceDirection;
    readonly paint: string;
    readonly hour: number;
    readonly weather: Weather;
    readonly dynamic: boolean;
    readonly noDamage?: boolean;
    readonly laps: LapCount;
    readonly opponents: OpponentCount;
    readonly difficulty: Difficulty;
}
