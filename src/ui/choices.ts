import { element } from "./dom.ts";
import { icon } from "./icons.ts";

export function appendChoice(
    container: string, label: string, value: string, activate: () => void, symbol?: string,
): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.choice = value;
    if (symbol) button.append(icon(symbol));
    const text = document.createElement("span");
    text.textContent = label;
    button.append(text);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", activate);
    element(container).append(button);
    return button;
}

export function markChoice(container: string, value: string): void {
    for (const button of element(container).querySelectorAll("button")) {
        button.setAttribute("aria-pressed", String(button.dataset.choice === value));
    }
}
