import type { ConditionChange, Conditions } from "../../../game/race/conditions.ts";
import type { Biome } from "../../../game/course/tracks.ts";
import { ConditionOptions } from "../../condition-options.ts";
import { element } from "../../dom.ts";

export interface RaceMessageCommands {
    readonly leave: () => void;
    readonly start: () => void;
    readonly togglePause: () => void;
    readonly recoverAndResume: () => void;
    readonly changeConditions: (change: ConditionChange) => void;
}

export class RaceMessage {
    readonly #message = element("race-message");
    readonly #title = element("race-result");
    readonly #detail = element("race-detail");
    readonly #weather = element("pause-conditions");
    readonly #audio = element("pause-audio");
    readonly #resume = element("resume", HTMLButtonElement);
    readonly #restart = element("retry", HTMLButtonElement);
    readonly #recover = element("recover", HTMLButtonElement);
    readonly #options = new ConditionOptions("pause-times", "pause-weathers");

    connect(commands: RaceMessageCommands): void {
        element("menu-garage", HTMLButtonElement).addEventListener("click", () => commands.leave());
        this.#restart.addEventListener("click", () => commands.start());
        this.#resume.addEventListener("click", () => commands.togglePause());
        this.#recover.addEventListener("click", () => commands.recoverAndResume());
        this.#options.connect(change => commands.changeConditions(change));
    }

    showConditions(biome: Biome, conditions: Conditions): void {
        this.#options.show(biome, conditions.hour, conditions.weather);
    }

    pause(): void {
        this.#show("Paused", "", false);
    }

    hide(): void {
        this.#message.hidden = true;
    }

    wrecked(): void {
        this.#show("Car wrecked", "Restart the run with a repaired car.", true);
    }

    #show(title: string, detail: string, terminal: boolean): void {
        this.#title.textContent = title;
        this.#detail.textContent = detail;
        this.#detail.hidden = detail.length === 0;
        this.#weather.hidden = terminal;
        this.#audio.hidden = terminal;
        this.#resume.hidden = terminal;
        this.#recover.hidden = terminal;
        this.#message.hidden = false;
        (terminal ? this.#restart : this.#resume).focus();
    }
}
