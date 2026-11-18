import type { Biome } from "../course/tracks.ts";

export const weatherChoices = [
    { id: "sunny", name: "Clear" },
    { id: "rain", name: "Rain" },
    { id: "snow", name: "Snow" },
    { id: "fog", name: "Fog" },
] as const;

export type Weather = typeof weatherChoices[number]["id"];
export type Precipitation = "rain" | "snow";
export type ConditionChange = Partial<{ hour: number; weather: Weather }>;

export function precipitationFor(biome: Biome): Precipitation {
    return biome === "arctic" ? "snow" : "rain";
}

export function climateWeather(biome: Biome, weather: Weather): Weather {
    return weather === "rain" || weather === "snow" ? precipitationFor(biome) : weather;
}

const sunrise = 6.5;
const midday = 12;
const sunset = 17;

export const timeChoices = [
    { hour: sunrise, name: "Sunrise" },
    { hour: midday, name: "Midday" },
    { hour: sunset, name: "Sunset" },
    { hour: 0, name: "Night" },
] as const;

export function startingConditions(biome: Biome, random = Math.random): Required<ConditionChange> {
    switch (biome) {
        case "coast": return { hour: midday, weather: "fog" };
        case "ruins": return { hour: sunrise, weather: "sunny" };
        case "caldera": return { hour: 16, weather: "sunny" };
        case "old-town": return { hour: sunset, weather: "sunny" };
        case "metro": return { hour: sunset, weather: "rain" };
        case "mars": return { hour: sunrise, weather: "fog" };
        case "arctic": return { hour: midday, weather: "snow" };
        case "gorge": return { hour: random() < 0.5 ? sunrise : midday, weather: "fog" };
        case "sky": return { hour: sunrise, weather: "rain" };
        default: return { hour: midday, weather: "sunny" };
    }
}
export const DAY_SECONDS = 20 * 60;
const WEATHER_PERIOD = 64;
const TRANSITION_SECONDS = 13;

export interface Conditions {
    readonly hour: number;
    readonly daylight: number;
    readonly dusk: number;
    readonly rain: number;
    readonly snow: number;
    readonly fog: number;
    readonly grip: number;
    readonly weather: Weather;
}

const moisture = {
    sunny: [0, 0, 0.06],
    rain: [1, 0, 0.38],
    snow: [0, 1, 0.48],
    fog: [0, 0, 1],
} as const;

const sequences: Record<Precipitation, readonly Weather[]> = {
    rain: ["sunny", "rain", "fog"],
    snow: ["sunny", "snow", "fog"],
};

export function mix(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function smooth(t: number): number {
    const clamped = Math.min(1, Math.max(0, t));
    return clamped ** 2 * (3 - 2 * clamped);
}

export function conditions(
    startHour: number, startWeather: Weather, elapsed: number, dynamic: boolean,
    precipitation: Precipitation = startWeather === "snow" ? "snow" : "rain", weatherElapsed = elapsed,
): Conditions {
    const hour = (startHour + elapsed * 24 / DAY_SECONDS) % 24;
    const solar = Math.sin((hour - 6) * Math.PI / 12);
    const daylight = smooth((solar + 0.17) / 0.66);
    const dusk = Math.exp(-((solar - 0.04) ** 2) * 34);
    const period = dynamic ? Math.floor(weatherElapsed / WEATHER_PERIOD) : 0;
    const sequence = sequences[precipitation];
    const initial = sequence.indexOf(startWeather === "rain" || startWeather === "snow" ? precipitation : startWeather);
    const first = sequence[(initial + period) % sequence.length]!;
    const second = sequence[(initial + period + 1) % sequence.length]!;
    const fade = dynamic
        ? smooth((weatherElapsed % WEATHER_PERIOD - WEATHER_PERIOD + TRANSITION_SECONDS) / TRANSITION_SECONDS)
        : 0;
    const rain = mix(moisture[first][0], moisture[second][0], fade);
    const snow = mix(moisture[first][1], moisture[second][1], fade);
    const fog = mix(moisture[first][2], moisture[second][2], fade);
    return { hour, daylight, dusk, rain, snow, fog, grip: 1 - rain * 0.2 - snow * 0.34, weather: fade >= 0.5 ? second : first };
}
