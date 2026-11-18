import type { Biome } from "../course/tracks.ts";
import { climateWeather, conditions, precipitationFor } from "./conditions.ts";
import type { ConditionChange, Conditions, Precipitation, Weather } from "./conditions.ts";
import type { Setup } from "./setup.ts";

export class RaceWeather {
    readonly #biome: Biome;
    readonly #precipitation: Precipitation;
    readonly #dynamic: boolean;
    #hour: number;
    #weather: Weather;
    #sunEpoch = 0;
    #weatherEpoch = 0;

    constructor(setup: Setup) {
        this.#biome = setup.track.id;
        this.#precipitation = precipitationFor(this.#biome);
        this.#dynamic = setup.dynamic;
        this.#hour = setup.hour;
        this.#weather = climateWeather(this.#biome, setup.weather);
    }

    change(change: ConditionChange, seconds: number): void {
        if (change.hour !== undefined) {
            this.#hour = change.hour;
            this.#sunEpoch = seconds;
        }
        if (change.weather !== undefined) {
            this.#weather = climateWeather(this.#biome, change.weather);
            this.#weatherEpoch = seconds;
        }
    }

    read(seconds: number): Conditions {
        return conditions(this.#hour, this.#weather, seconds - this.#sunEpoch,
            this.#dynamic, this.#precipitation, seconds - this.#weatherEpoch);
    }
}
