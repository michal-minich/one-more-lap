import { element } from "../dom.ts";

interface Tab {
    readonly button: HTMLButtonElement;
    readonly panel: HTMLElement;
}

export class GaragePanels {
    readonly #tabs: readonly Tab[] = [
        { button: element("race-tab", HTMLButtonElement), panel: element("race-panel") },
        { button: element("open-upgrades", HTMLButtonElement), panel: element("upgrade-panel") },
    ];

    connect(): void {
        for (const [index, { button, panel }] of this.#tabs.entries()) {
            button.addEventListener("click", () => this.show(panel.id));
            button.addEventListener("keydown", event => {
                const last = this.#tabs.length - 1;
                let target: number;
                switch (event.key) {
                    case "ArrowLeft": target = index === 0 ? last : index - 1; break;
                    case "ArrowRight": target = index === last ? 0 : index + 1; break;
                    case "Home": target = 0; break;
                    case "End": target = last; break;
                    default: return;
                }
                event.preventDefault();
                const tab = this.#tabs[target]!;
                this.show(tab.panel.id);
                tab.button.focus();
            });
        }
    }

    show(panelId: string): void {
        for (const { button, panel } of this.#tabs) {
            const selected = panel.id === panelId;
            button.setAttribute("aria-selected", String(selected));
            button.tabIndex = selected ? 0 : -1;
            panel.hidden = !selected;
        }
    }
}
