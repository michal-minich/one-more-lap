import type { Biome } from "../game/course/tracks.ts";
import { precipitationFor, timeChoices } from "../game/race/conditions.ts";
import type { ConditionChange, Precipitation, Weather } from "../game/race/conditions.ts";
import { setConditionBadge } from "./steel/parts.ts";
import type { ConditionBadge } from "./steel/parts.ts";
import { appendChoice, markChoice } from "./choices.ts";

export class ConditionOptions {
    readonly #times: string;
    readonly #weathers: string;
    #precipitation: Precipitation = "rain";
    #precipitationButton: HTMLButtonElement | undefined;

    constructor(times: string, weathers: string) {
        this.#times = times;
        this.#weathers = weathers;
    }

    connect(change: (value: ConditionChange) => void): void {
        for (const { name, hour } of timeChoices) {
            this.#append(this.#times, name, String(hour), () => change({ hour }), name.toLowerCase() as ConditionBadge);
        }
        this.#append(this.#weathers, "Clear", "sunny", () => change({ weather: "sunny" }), "clear");
        this.#precipitationButton = this.#append(this.#weathers, "Rain", "rain",
            () => change({ weather: this.#precipitation }), "rain");
        this.#append(this.#weathers, "Fog", "fog", () => change({ weather: "fog" }), "fog");
    }

    show(biome: Biome, hour: number, weather: Weather): void {
        const precipitation = precipitationFor(biome);
        const button = this.#precipitationButton;
        if (button && precipitation !== this.#precipitation) {
            this.#precipitation = precipitation;
            button.dataset.choice = precipitation;
            button.querySelector("span")!.textContent = precipitation === "snow" ? "Snow" : "Rain";
            setConditionBadge(button.querySelector("img")!, precipitation);
        }
        markChoice(this.#times, String(closestHour(hour)));
        markChoice(this.#weathers, weather);
    }

    #append(
        container: string, label: string, value: string, activate: () => void, badge: ConditionBadge,
    ): HTMLButtonElement {
        const button = appendChoice(container, label, value, activate);
        const image = document.createElement("img");
        image.className = "condition-badge";
        image.alt = "";
        image.draggable = false;
        setConditionBadge(image, badge);
        button.prepend(image);
        return button;
    }
}

function closestHour(hour: number): number {
    const gap = (choice: number): number => {
        const difference = Math.abs(hour - choice);
        return Math.min(difference, 24 - difference);
    };
    return timeChoices.reduce((best, choice) => gap(choice.hour) < gap(best.hour) ? choice : best).hour;
}
