import { cars } from "../game/vehicle/cars.ts";
import type { CarId } from "../game/vehicle/cars.ts";
import { climateWeather, startingConditions, timeChoices, weatherChoices } from "../game/race/conditions.ts";
import type { ConditionChange } from "../game/race/conditions.ts";
import { tracks } from "../game/course/tracks.ts";
import type { Biome } from "../game/course/tracks.ts";
import type { RaceDirection } from "../game/course/circuit-line.ts";
import { LAP_SPLITS } from "../game/race/records.ts";
import type { LapRecord, TrackRecords } from "../game/race/records.ts";
import { DEFAULT_DIFFICULTY, DEFAULT_LAPS, DEFAULT_OPPONENTS, difficulties, lapChoices, opponentChoices } from "../game/race/setup.ts";
import type { LapCount, OpponentCount, Setup } from "../game/race/setup.ts";
import type { AudioPreferences } from "../audio/race-audio.ts";

const setupKey = "redline-setup";
const audioKey = "redline-audio-v1";

type LocalStore = Pick<Storage, "getItem" | "setItem">;

export class RaceStorage {
    readonly #openStorage: () => LocalStore;
    readonly #pending = new Map<string, string>();
    constructor(openStorage: () => LocalStore) {
        this.#openStorage = openStorage;
    }

    loadSetup(): Setup {
        const data = settingsObject(this.#get(setupKey));
        const car = cars.find(item => item.id === data.car) ?? cars[0];
        const track = tracks.find(item => item.id === data.track) ?? tracks[0];
        if (this.#get(conditionsKey(track.id)) === null) {
            // The old build always saved midday and clear, even when the player never touched the controls.
            this.saveConditions(track.id, readConditions(track.id, {
                hour: data.hour === 12 ? undefined : data.hour,
                weather: data.weather === "sunny" ? undefined : data.weather,
            }));
        }
        return {
            car,
            track,
            direction: data.direction === "reverse" ? "reverse" : "forward",
            paint: typeof data.paint === "string" && /^#[\da-f]{6}$/i.test(data.paint) ? data.paint : car.paint,
            ...this.conditionsFor(track.id),
            dynamic: typeof data.dynamic === "boolean" ? data.dynamic : true,
            noDamage: data.noDamage === true,
            laps: data.laps === 10 ? 5 : lapChoices.find(item => item === data.laps) ?? DEFAULT_LAPS,
            opponents: savedOpponents(data.opponents),
            difficulty: difficulties.find(item => item === data.difficulty) ?? DEFAULT_DIFFICULTY,
        };
    }

    saveSetup(setup: Setup): void {
        this.#put(setupKey, JSON.stringify({
            car: setup.car.id, track: setup.track.id, direction: setup.direction, paint: setup.paint,
            dynamic: setup.dynamic, noDamage: setup.noDamage, laps: setup.laps,
            opponents: setup.opponents, difficulty: setup.difficulty,
        }));
    }

    conditionsFor(track: Biome): Required<ConditionChange> {
        const saved = readConditions(track, settingsObject(this.#get(conditionsKey(track))));
        return { ...startingConditions(track), ...saved };
    }

    hasDriven(track: Biome): boolean {
        return this.#get("redline-driven-v1-" + track) === "1";
    }

    markDriven(track: Biome): void {
        this.#put("redline-driven-v1-" + track, "1");
    }

    saveConditions(track: Biome, change: ConditionChange): void {
        const fields = readConditions(track, change);
        if (fields.hour === undefined && fields.weather === undefined) return;
        const key = conditionsKey(track);
        this.#put(key, JSON.stringify({ ...readConditions(track, settingsObject(this.#get(key))), ...fields }));
    }

    loadAudio(): AudioPreferences {
        const data = settingsObject(this.#get(audioKey));
        return { music: data.music !== false, effects: data.effects !== false };
    }

    saveAudio(preferences: AudioPreferences): void {
        this.#put(audioKey, JSON.stringify(preferences));
    }

    bestTime(setup: Setup): number | undefined {
        const saved = Number(this.#get(bestTimeKey(setup.track.id, setup.car.id, setup.laps, setup.direction)));
        return Number.isFinite(saved) && saved > 0 ? saved : undefined;
    }

    recordTime(setup: Setup, elapsed: number): number {
        const best = this.bestTime(setup);
        if (best !== undefined && best <= elapsed) return best;
        this.#put(bestTimeKey(setup.track.id, setup.car.id, setup.laps, setup.direction), String(elapsed));
        return elapsed;
    }

    trackRecords(track: Biome, direction: RaceDirection = "forward"): TrackRecords {
        const races: Partial<Record<LapCount, number>> = {};
        for (const laps of lapChoices) {
            const best = this.bestRace(track, laps, direction);
            if (best !== undefined) races[laps] = best;
        }
        return { lap: this.bestLap(track, direction), races };
    }

    bestRace(track: Biome, laps: LapCount, direction: RaceDirection = "forward"): number | undefined {
        let time = Infinity;
        for (const car of cars) {
            const saved = Number(this.#get(bestTimeKey(track, car.id, laps, direction)));
            if (Number.isFinite(saved) && saved > 0) time = Math.min(time, saved);
        }
        return time < Infinity ? time : undefined;
    }

    bestLap(track: Biome, direction: RaceDirection = "forward"): LapRecord | undefined {
        const data = settingsObject(this.#get(bestLapKey(track, direction)));
        const { seconds, splits } = data;
        if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0 ||
            !Array.isArray(splits) || splits.length !== LAP_SPLITS + 1) return undefined;
        const checked: number[] = [];
        for (const split of splits as unknown[]) {
            if (typeof split !== "number" || !Number.isFinite(split) || split < (checked.at(-1) ?? 0)) return undefined;
            checked.push(split);
        }
        if (checked[0] !== 0 || Math.abs(checked[LAP_SPLITS]! - seconds) > 0.005) return undefined;
        return { seconds, splits: checked };
    }

    recordLap(track: Biome, lap: LapRecord, direction: RaceDirection = "forward"): boolean {
        const previous = this.bestLap(track, direction);
        if (previous && previous.seconds <= lap.seconds) return false;
        this.#put(bestLapKey(track, direction), JSON.stringify(lap));
        return true;
    }

    #get(key: string): string | null {
        const pending = this.#pending.get(key);
        if (pending !== undefined) return pending;
        try {
            return this.#openStorage().getItem(key);
        } catch {
            return null;
        }
    }

    #put(key: string, value: string): void {
        try {
            this.#openStorage().setItem(key, value);
            this.#pending.delete(key);
        } catch {
            this.#pending.set(key, value);
        }
    }
}

function conditionsKey(track: Biome): string {
    return "redline-conditions-v1-" + track;
}

function readConditions(track: Biome, fields: Record<string, unknown>): ConditionChange {
    const hour = timeChoices.find(item => item.hour === (fields.hour === 17.75 ? 17 : fields.hour))?.hour;
    const weather = weatherChoices.find(item => item.id === fields.weather)?.id;
    return {
        ...(hour === undefined ? {} : { hour }),
        ...(weather === undefined ? {} : { weather: climateWeather(track, weather) }),
    };
}

function savedOpponents(count: unknown): OpponentCount {
    if (count === 1 || count === 2) return 3;
    if (count === 4) return 5;
    return opponentChoices.find(choice => choice === count) ?? DEFAULT_OPPONENTS;
}

function bestTimeKey(track: Biome, car: CarId, laps: LapCount, direction: RaceDirection): string {
    return "redline-circuit-v1-" + timingCourse(track) + "-" + car + "-" + laps + (direction === "reverse" ? "-reverse" : "");
}

function bestLapKey(track: Biome, direction: RaceDirection): string {
    return "redline-lap-v1-" + timingCourse(track) + (direction === "reverse" ? "-reverse" : "");
}

function timingCourse(track: Biome): string {
    switch (track) {
        case "caldera": return "caldera-ridge";
        case "rail": return "rail-high-valley";
        case "forest": return "forest-covered-bridge";
        case "ruins": return "ruins-seaside";
        case "coast": return "coast-lighthouse";
        case "alpine": return "alpine-tarn";
        case "canyon": return "canyon-wash";
        default: return track;
    }
}

function settingsObject(raw: string | null): Record<string, unknown> {
    if (raw === null) return {};
    try {
        const data: unknown = JSON.parse(raw);
        if (typeof data === "object" && data !== null && !Array.isArray(data)) {
            return data as Record<string, unknown>;
        }
    } catch {
        // An older or damaged value can be replaced with the next selection.
    }
    return {};
}
