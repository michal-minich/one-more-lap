import { element } from "../dom.ts";

export class Stepper<T> {
    readonly #previous: HTMLButtonElement;
    readonly #next: HTMLButtonElement;
    readonly #label: HTMLElement;
    readonly #choices: readonly [T, ...T[]];
    readonly #name: (value: T) => string;
    readonly #wrap: boolean;
    #selected = 0;

    constructor(prefix: string, label: string, choices: readonly [T, ...T[]], name: (value: T) => string, wrap = false) {
        this.#previous = element(prefix + "-prev", HTMLButtonElement);
        this.#next = element(prefix + "-next", HTMLButtonElement);
        this.#label = element(label);
        this.#choices = choices;
        this.#name = name;
        this.#wrap = wrap;
    }

    connect(change: (value: T) => void): void {
        let loading = false;
        const step = (direction: number, button: HTMLButtonElement): void => {
            if (loading) return;
            const next = this.#selected + direction;
            const count = this.#choices.length;
            const index = this.#wrap ? (next + count) % count : next;
            const choice = this.#choices[index];
            if (choice === undefined) return;
            loading = true;
            button.setAttribute("aria-busy", "true");
            requestAnimationFrame(() => requestAnimationFrame(() => {
                try {
                    change(choice);
                } finally {
                    button.removeAttribute("aria-busy");
                    loading = false;
                }
            }));
        };
        this.#previous.addEventListener("click", () => step(-1, this.#previous));
        this.#next.addEventListener("click", () => step(1, this.#next));
    }

    show(value: T, enabled = true): void {
        this.#selected = Math.max(0, this.#choices.indexOf(value));
        this.#label.textContent = enabled ? this.#name(this.#choices[this.#selected]!) : "—";
        this.#previous.disabled = !enabled || (!this.#wrap && this.#selected === 0);
        this.#next.disabled = !enabled || (!this.#wrap && this.#selected === this.#choices.length - 1);
    }
}
