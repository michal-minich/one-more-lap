import { element } from "../../dom.ts";
import { icon } from "../../icons.ts";
import type { TouchPadFrame } from "./touch-drive.ts";

export class TouchPadView {
    readonly #group = element("driving-pads");
    readonly #keys = ["left", "right", "throttle", "brake"].map(action => {
        const key = document.createElement("div");
        key.className = "driving-key";
        key.dataset.action = action;
        key.append(action === "left" || action === "right" ? icon(action) : document.createElement("span"));
        this.#group.append(key);
        return key;
    });
    #last: TouchPadFrame | undefined;

    show(frame: TouchPadFrame | undefined): void {
        if (frame === this.#last) return;
        this.#last = frame;
        this.#group.hidden = frame === undefined;
        if (frame === undefined) return;
        const brakeLabel = frame.brakeBeforeReverse ? "Brake" : "Reverse";
        for (const [index, pad] of frame.pads.entries()) {
            const key = this.#keys[index]!;
            const { x, y, size, pressed, action } = pad;
            key.style.left = x + "px";
            key.style.top = y + "px";
            key.style.width = size + "px";
            key.style.height = size + "px";
            key.classList.toggle("pressed", pressed);
            const label = key.querySelector("span");
            if (label) label.textContent = action === "throttle" ? "Go" : brakeLabel;
        }
    }
}
