import { difficulties, lapChoices, opponentChoices } from "../../game/race/setup.ts";
import type { LapCount, Setup } from "../../game/race/setup.ts";
import type { TrackRecords } from "../../game/race/records.ts";
import { element, formatTime } from "../dom.ts";
import { appendChoice, markChoice } from "../choices.ts";
import { ConditionOptions } from "../condition-options.ts";
import { Stepper } from "./stepper.ts";

export class RaceOptionsView {
    readonly #summary = element("start-summary");
    readonly #best = element("garage-best");
    readonly #track = element("setup-track");
    readonly #car = element("setup-car");
    readonly #dynamic = element("dynamic", HTMLButtonElement);
    readonly #noDamage = element("no-damage", HTMLButtonElement);
    readonly #laps = new Stepper("laps", "laps-value", lapChoices, String);
    readonly #rivals = new Stepper(
        "opponents", "opponents-value", opponentChoices, count => count === 0 ? "Solo" : String(count),
    );
    readonly #conditions = new ConditionOptions("times", "weathers");
    readonly #difficulty = new Stepper("difficulty", "difficulty-value", difficulties, String);

    connect(change: (value: Partial<Setup>) => void): void {
        this.#conditions.connect(change);
        appendChoice("directions", "Forward", "forward", () => change({ direction: "forward" }), "forward");
        appendChoice("directions", "Reverse", "reverse", () => change({ direction: "reverse" }), "reverse");
        this.#laps.connect(laps => change({ laps }));
        this.#rivals.connect(opponents => change({ opponents }));
        this.#dynamic.addEventListener("click", () => {
            change({ dynamic: this.#dynamic.getAttribute("aria-pressed") !== "true" });
        });
        this.#noDamage.addEventListener("click", () => {
            change({ noDamage: this.#noDamage.getAttribute("aria-pressed") !== "true" });
        });
        this.#difficulty.connect(difficulty => change({ difficulty }));
    }

    show(setup: Setup, records: TrackRecords): void {
        this.#track.textContent = setup.track.name;
        this.#car.textContent = setup.car.name;
        showTrackRecords(this.#best, records, setup.laps);
        this.#conditions.show(setup.track.id, setup.hour, setup.weather);
        markChoice("directions", setup.direction);
        this.#laps.show(setup.laps);
        this.#rivals.show(setup.opponents);
        this.#dynamic.setAttribute("aria-pressed", String(setup.dynamic));
        this.#noDamage.setAttribute("aria-pressed", String(setup.noDamage === true));
        this.#difficulty.show(setup.difficulty, setup.opponents > 0);
        const laps = setup.laps + (setup.laps === 1 ? " lap" : " laps");
        const rivals = setup.opponents === 0 ? "Solo" : setup.opponents + " rivals";
        const summary = laps + " · " + rivals;
        const direction = setup.direction === "reverse" ? " · Reverse" : "";
        this.#summary.textContent = summary + direction + (setup.noDamage === true ? " · No Damage" : "");
    }
}

function showTrackRecords(container: HTMLElement, records: TrackRecords, selectedLaps: LapCount): void {
    const entries: HTMLElement[] = [];
    const add = (label: string, seconds: number): void => {
        const row = document.createElement("div");
        const name = document.createElement("span");
        const time = document.createElement("strong");
        name.textContent = label;
        time.textContent = formatTime(seconds);
        row.append(name, time);
        entries.push(row);
    };
    if (records.lap) add("Best lap", records.lap.seconds);
    const distances = new Set<LapCount>([3, 5, selectedLaps]);
    for (const laps of distances) {
        const time = records.races[laps];
        if (time !== undefined) add(String(laps) + (laps === 1 ? " lap" : " laps"), time);
    }
    container.replaceChildren(...entries);
    container.hidden = entries.length === 0;
}
