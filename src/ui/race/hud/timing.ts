import type { LapTiming } from "../../../game/race/lap-clock.ts";
import { element, formatClock, formatTime } from "../../dom.ts";

interface Notice {
    readonly title: string;
    readonly seconds: number;
}

export class TimingView {
    readonly #lap = element("lap-time");
    readonly #lapLabel = element("lap-time-label");
    readonly #pace = element("pace");
    readonly #delta = element("pace-delta");
    readonly #mark = element("pace-mark");
    readonly #badge = element("record-badge");
    readonly #recordText = element("record-text");
    readonly #notices: Notice[] = [];
    #timer: number | undefined;
    #lastLap: number | undefined;

    show(lap: LapTiming, finished = false): void {
        const lastLap = lap.seconds < 2.5 || finished ? this.#lastLap : undefined;
        const label = lastLap === undefined ? "Lap time" : "Last lap";
        const clock = lastLap !== undefined || finished ? formatTime(lastLap ?? lap.seconds) : formatClock(lap.seconds);
        if (this.#lapLabel.textContent !== label) this.#lapLabel.textContent = label;
        if (this.#lap.textContent !== clock) this.#lap.textContent = clock;
        this.#pace.hidden = lap.delta === undefined;
        if (lap.delta === undefined) return;
        const seconds = Math.round(Math.abs(lap.delta));
        const sign = seconds === 0 ? "±" : lap.delta < 0 ? "−" : "+";
        this.#delta.textContent = sign + seconds + " s";
        this.#delta.dataset.pace = seconds === 0 ? "even" : lap.delta < 0 ? "ahead" : "behind";
        this.#mark.style.left = String(50 - Math.max(-1, Math.min(1, lap.delta / 4)) * 47) + "%";
    }

    completeLap(seconds: number): void {
        this.#lastLap = seconds;
    }

    record(title: string, seconds: number): void {
        this.#notices.push({ title, seconds });
        if (this.#timer === undefined) this.#next();
    }

    reset(): void {
        if (this.#timer !== undefined) window.clearTimeout(this.#timer);
        this.#timer = undefined;
        this.#notices.length = 0;
        this.#lastLap = undefined;
        this.#badge.hidden = true;
        this.show({ seconds: 0, delta: undefined });
    }

    #next(): void {
        const notice = this.#notices.shift();
        if (!notice) {
            this.#badge.hidden = true;
            this.#timer = undefined;
            return;
        }
        this.#badge.hidden = false;
        this.#recordText.textContent = notice.title + " · " + formatTime(notice.seconds);
        this.#timer = window.setTimeout(() => this.#next(), 2_550);
    }
}
