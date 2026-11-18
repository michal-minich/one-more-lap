import { element, formatTime } from "../../dom.ts";

const resultDuration = 7_000;
const metals = ["gold", "silver", "bronze"] as const;

export class RaceResults {
    readonly #banner = element("race-finish");
    readonly #rank = element("finish-position");
    readonly #place = element("finish-place");
    readonly #time = element("finish-time");
    readonly #record = element("finish-record");
    readonly #best = element("finish-best");
    readonly #cup = element("finish-cup", SVGElement);

    readonly #keepDriving = element("keep-driving", HTMLButtonElement);
    readonly #dismissed: () => void;
    #timeout: number | undefined;

    constructor(dismissed: () => void) {
        this.#dismissed = dismissed;
        this.#keepDriving.addEventListener("click", () => this.#dismiss());
    }

    show(elapsed: number, place: number, drivers: number, best?: number): void {
        this.hide();
        const metal = drivers > 1 ? metals[place - 1] : undefined;
        this.#cup.classList.toggle("podium-visible", metal !== undefined);
        this.#cup.dataset.metal = metal ?? "";
        this.#rank.hidden = drivers < 2;
        this.#place.textContent = place + " / " + drivers;
        this.#time.textContent = formatTime(elapsed);
        this.#record.textContent = best === undefined ? "" : formatTime(best);
        this.#best.hidden = best === undefined;
        this.#banner.hidden = false;
        this.#timeout = window.setTimeout(() => this.#dismiss(), resultDuration);
    }

    hide(): void {
        window.clearTimeout(this.#timeout);
        this.#timeout = undefined;
        this.#banner.hidden = true;
    }

    #dismiss(): void {
        const restoreFocus = document.activeElement === this.#keepDriving;
        this.hide();
        this.#dismissed();
        if (restoreFocus) element("pause", HTMLButtonElement).focus();
    }
}
