import { icon } from "../icons.ts";

export function showPrice(button: HTMLButtonElement, name: string, price: number, balance: number, owned: boolean): void {
    const cost = price + (price === 1 ? " coin" : " coins");
    const label = owned ? name + " owned" : "Buy " + name + " for " + cost;
    if (button.getAttribute("aria-label") !== label) {
        button.replaceChildren(owned ? icon("owned") : coins(price));
        button.setAttribute("aria-label", label);
    }
    button.disabled = owned || balance < price;
    button.classList.toggle("owned", owned);
}

function coins(price: number): HTMLElement {
    const row = document.createElement("span");
    row.className = "coin-count coin-price";
    row.setAttribute("aria-hidden", "true");
    for (let i = 0; i < price; i++) row.append(document.createElement("i"));
    return row;
}
