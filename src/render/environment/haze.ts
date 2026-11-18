import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { Biome } from "../../game/course/tracks.ts";
import type { Conditions } from "../../game/race/conditions.ts";

type Climate = readonly [day: string, night: string, density: number];

const climates: Record<Biome, Climate> = {
    stunt: ["#c8ded5", "#30324c", 0.77],
    rail: ["#bed1ce", "#243443", 0.82],
    reef: ["#7ec8ce", "#133750", 0.89],
    coast: ["#abd4df", "#182d41", 0.92],
    alpine: ["#c1d8e4", "#1a293b", 0.69],
    caldera: ["#9ba8be", "#241f30", 0.74],
    canyon: ["#ddc8b6", "#33293a", 0.79],
    ruins: ["#c4d3c7", "#1d2b3d", 0.84],
    forest: ["#abc5c1", "#192a38", 1.02],
    "old-town": ["#d5c7bc", "#292b3e", 0.82],
    metro: ["#c2ced9", "#232d41", 0.88],
    future: ["#b4cedf", "#252842", 0.87],
    mars: ["#dfa685", "#382635", 0.8],
    arctic: ["#bcd6e7", "#22334e", 0.88],
    gorge: ["#d8c5b7", "#342b38", 0.73],
    sky: ["#b6bedf", "#232342", 0.66],
};

const sunset = Color3.FromHexString("#e4a181");
const stormDay = Color3.FromHexString("#91a4b5");
const stormNight = Color3.FromHexString("#1c2a3d");
const winterDay = Color3.FromHexString("#c7d8e5");
const winterNight = Color3.FromHexString("#28384d");

export class HorizonHaze {
    readonly #day: Color3;
    readonly #night: Color3;
    readonly #density: number;

    constructor(biome: Biome) {
        const [day, night, density] = climates[biome];
        this.#day = Color3.FromHexString(day);
        this.#night = Color3.FromHexString(night);
        this.#density = density;
    }

    color(env: Conditions): Color3 {
        const { daylight, dusk, fog, rain, snow } = env;
        const color = Color3.Lerp(this.#night, this.#day, daylight);
        const clouds = Math.max(rain, snow, fog * 0.41);
        Color3.LerpToRef(color, sunset, dusk * (1 - clouds) * 0.63, color);
        const rainColor = Color3.Lerp(stormNight, stormDay, daylight);
        const snowColor = Color3.Lerp(winterNight, winterDay, daylight);
        Color3.LerpToRef(color, rainColor, Math.max(rain, fog * 0.33) * (0.25 + daylight * 0.29), color);
        Color3.LerpToRef(color, snowColor, snow * (0.20 + daylight * 0.20), color);
        return color;
    }

    density(env: Conditions): number {
        const { fog, rain, snow, daylight } = env;
        const mist = Math.max(0, fog - 0.06 - rain * 0.26 - snow * 0.31);
        return (mist * 0.00285 + rain * 0.00047 + snow * 0.00070) *
            this.#density * (0.79 + daylight * 0.21);
    }
}
