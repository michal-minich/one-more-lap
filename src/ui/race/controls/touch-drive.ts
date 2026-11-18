export type DriveAction = "left" | "right" | "reverse" | "brake" | "throttle";
type PadAction = Exclude<DriveAction, "reverse">;

export interface TouchPad {
    readonly action: PadAction;
    readonly x: number;
    readonly y: number;
    readonly size: number;
    readonly pressed: boolean;
}

export interface TouchPadFrame {
    readonly width: number;
    readonly height: number;
    readonly pads: readonly TouchPad[];
    readonly brakeBeforeReverse: boolean;
}

export class TouchDrive {
    readonly #canvas: HTMLCanvasElement;
    readonly #coarse = matchMedia("(any-pointer: coarse)");
    readonly #presses = new Map<number, TouchPad>();
    #frame: TouchPadFrame | undefined;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
    }

    connect(racing: () => boolean, canDrive: () => boolean): void {
        const canvas = this.#canvas;
        new ResizeObserver(() => this.#layout()).observe(canvas);
        window.addEventListener("touchstart", event => {
            this.#reconcile(event);
            if (event.target !== canvas || !racing()) return;
            event.preventDefault();
            if (!canDrive()) return;
            const bounds = canvas.getBoundingClientRect();
            for (const touch of Array.from(event.changedTouches)) {
                const pad = this.#frame?.pads.find(pad =>
                    contains(pad, touch.clientX - bounds.left, touch.clientY - bounds.top));
                if (pad) this.#presses.set(touch.identifier, pad);
            }
            this.#showPresses();
        }, { capture: true, passive: false });
        window.addEventListener("touchmove", event => this.#reconcile(event, true), { capture: true, passive: true });
        window.addEventListener("touchend", event => this.#reconcile(event), { capture: true, passive: true });
        window.addEventListener("touchcancel", () => this.release(), { capture: true, passive: true });
        window.addEventListener("pointercancel", event => {
            if (event.pointerType === "touch") this.release();
        }, true);
        canvas.closest(".hero")?.addEventListener("contextmenu", event => {
            if (!racing()) return;
            event.preventDefault();
            this.release();
        });
    }

    get frame(): TouchPadFrame | undefined {
        return this.#coarse.matches || navigator.maxTouchPoints > 0 ? this.#frame : undefined;
    }

    addPressedTo(pressed: Set<DriveAction>): void {
        for (const { action } of this.#presses.values()) {
            pressed.add(action === "brake" && !this.#frame?.brakeBeforeReverse ? "reverse" : action);
        }
    }

    showBrakeBeforeReverse(brake: boolean): void {
        if (this.#frame && brake !== this.#frame.brakeBeforeReverse) {
            this.#frame = { ...this.#frame, brakeBeforeReverse: brake };
        }
    }

    release(): void {
        if (this.#presses.size === 0) return;
        this.#presses.clear();
        this.#showPresses();
    }

    #reconcile(event: TouchEvent, moving = false): void {
        const previous = this.#presses.size;
        if (previous === 0) return;
        const live = new Map(Array.from(event.touches, touch => [touch.identifier, touch]));
        const bounds = moving ? this.#canvas.getBoundingClientRect() : undefined;
        for (const [id, pad] of this.#presses) {
            const touch = live.get(id);
            if (!touch || (bounds && !contains(pad, touch.clientX - bounds.left, touch.clientY - bounds.top, 18))) {
                this.#presses.delete(id);
            }
        }
        if (this.#presses.size !== previous) this.#showPresses();
    }

    #layout(): void {
        const { clientWidth: width, clientHeight: height } = this.#canvas;
        if (!width || !height || (width === this.#frame?.width && height === this.#frame.height)) return;
        this.#presses.clear();
        const safe = getComputedStyle(this.#canvas);
        const size = Math.round(Math.max(44, Math.min(86, width * 0.105, height * 0.19)));
        const gap = Math.max(8, Math.round(size * 0.14));
        const left = 18 + (Number.parseFloat(safe.getPropertyValue("--drive-safe-left")) || 0);
        const right = width - size - 18 - (Number.parseFloat(safe.getPropertyValue("--drive-safe-right")) || 0);
        const bottom = Math.round(height * 0.76) - size;
        this.#frame = { width, height, brakeBeforeReverse: this.#frame?.brakeBeforeReverse ?? false, pads: [
            { action: "left", x: left, y: bottom, size, pressed: false },
            { action: "right", x: left + size + gap, y: bottom, size, pressed: false },
            { action: "throttle", x: right, y: bottom - size - gap, size, pressed: false },
            { action: "brake", x: right, y: bottom, size, pressed: false },
        ] };
    }

    #showPresses(): void {
        const frame = this.#frame;
        if (!frame) return;
        const pressed = new Set(Array.from(this.#presses.values(), pad => pad.action));
        if (frame.pads.every(pad => pad.pressed === pressed.has(pad.action))) return;
        this.#frame = { ...frame, pads: frame.pads.map(pad => ({ ...pad, pressed: pressed.has(pad.action) })) };
    }
}

function contains(pad: TouchPad, x: number, y: number, margin = 0): boolean {
    return x >= pad.x - margin && x <= pad.x + pad.size + margin &&
        y >= pad.y - margin && y <= pad.y + pad.size + margin;
}
