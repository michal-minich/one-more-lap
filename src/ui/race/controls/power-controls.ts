import type { ActivePower, ActivePowerView } from "../../../game/progression/powers.ts";
import { element } from "../../dom.ts";

export class PowerControls {
    readonly #jump = element("race-jump", HTMLButtonElement);
    readonly #boost = element("race-boost", HTMLButtonElement);
    readonly #teleport = element("race-teleport", HTMLButtonElement);
    readonly #panel = element("race-powers");

    connect(activate: (power: ActivePower) => void): void {
        this.#jump.addEventListener("click", () => activate("jump"));
        this.#boost.addEventListener("click", () => activate("boost"));
        this.#teleport.addEventListener("click", () => activate("teleport"));
    }

    show(powers: ActivePowerView, driving: boolean): void {
        this.#panel.hidden = powers.jump === undefined && powers.boost === undefined && powers.teleport === undefined;
        showPower(this.#jump, "Jump", powers.jump, driving);
        showPower(this.#boost, "Boost", powers.boost, driving, powers.boosting);
        showPower(this.#teleport, "Teleport", powers.teleport, driving, powers.teleporting);
    }
}

function showPower(button: HTMLButtonElement, name: string, charge: number | undefined, driving: boolean, active = false): void {
    button.hidden = charge === undefined;
    if (charge === undefined) return;
    const percent = Math.floor(charge * 100);
    button.style.setProperty("--charge", String(percent) + "%");
    button.disabled = !driving || charge < 1;
    button.dataset.active = String(active);
    const amount = button.querySelector("small")!;
    amount.textContent = active ? "Active" : percent === 100 ? "Ready" : String(percent) + "%";
    button.setAttribute("aria-label", name + " " + amount.textContent);
}
