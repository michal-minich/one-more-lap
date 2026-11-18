import { powers } from "../../game/progression/powers.ts";
import type { PowerId } from "../../game/progression/powers.ts";
import type { PlayerProfile } from "../../game/progression/profile.ts";
import { element } from "../dom.ts";
import { icon } from "../icons.ts";
import { showPrice } from "./coin-price.ts";

export class UpgradeShop {
    readonly #list = element("upgrade-list");
    readonly #balance = element("garage-coins");
    readonly #wallet = element("shop-coins");
    readonly #buttons = new Map<PowerId, HTMLButtonElement>();

    connect(purchase: (power: PowerId) => Promise<void>): void {
        for (const power of powers) {
            const card = document.createElement("section");
            const symbol = document.createElement("span");
            const title = document.createElement("h3");
            const detail = document.createElement("p");
            const button = document.createElement("button");
            card.className = "upgrade-card";
            symbol.className = "upgrade-symbol";
            symbol.append(icon(power.id));
            title.textContent = power.name;
            detail.textContent = power.detail;
            button.type = "button";
            button.className = "quiet";
            button.addEventListener("click", () => void purchase(power.id));
            card.append(symbol, title, button, detail);
            this.#list.append(card);
            this.#buttons.set(power.id, button);
        }
    }

    show(profile: PlayerProfile): void {
        this.#balance.textContent = String(profile.coins);
        this.#wallet.textContent = String(profile.coins);
        for (const power of powers) {
            const button = this.#buttons.get(power.id)!;
            const owned = profile.owned.includes(power.id);
            showPrice(button, power.name, power.coins, profile.coins, owned);
        }
    }
}
