import type { DriveInput } from "../../../game/vehicle/driver-input.ts";
import type { ActivePower } from "../../../game/progression/powers.ts";

import { TouchDrive } from "./touch-drive.ts";
import type { DriveAction, TouchPadFrame } from "./touch-drive.ts";

const keys: Readonly<Record<string, DriveAction>> = {
    ArrowUp: "throttle", KeyW: "throttle", ArrowDown: "brake", KeyS: "brake",
    ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", KeyX: "reverse",
};

export interface DrivingCommands {
    readonly racing: boolean;
    readonly acceptsDriving: boolean;
    togglePause: () => void;
    recover: () => void;
    toggleView: () => void;
    pauseForBackground: () => void;
    usePower: (power: ActivePower) => void;
}

export class DriveControls {
    readonly #keyboard = new Map<string, DriveAction>();
    readonly #touch: TouchDrive;

    constructor(canvas: HTMLCanvasElement) {
        this.#touch = new TouchDrive(canvas);
    }

    connect(commands: DrivingCommands): void {
        window.addEventListener("keydown", event => this.#keydown(event, commands));
        window.addEventListener("keyup", event => this.#keyboard.delete(event.code));
        window.addEventListener("blur", () => this.release());
        window.addEventListener("pagehide", () => this.release());
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) return;
            this.release();
            commands.pauseForBackground();
        });
        this.#touch.connect(() => commands.racing, () => commands.acceptsDriving);
    }

    get touchPads(): TouchPadFrame | undefined {
        return this.#touch.frame;
    }

    read(): DriveInput {
        const pressed = new Set(this.#keyboard.values());
        this.#touch.addPressedTo(pressed);
        const reverse = pressed.has("reverse");
        return {
            throttle: Number(reverse || pressed.has("throttle")),
            brake: Number(pressed.has("brake")),
            steer: Number(pressed.has("right")) - Number(pressed.has("left")),
            reverse,
        };
    }

    release(): void {
        this.#keyboard.clear();
        this.#touch.release();
    }

    showBrakeBeforeReverse(brake: boolean): void {
        this.#touch.showBrakeBeforeReverse(brake);
    }

    #keydown(event: KeyboardEvent, commands: DrivingCommands): void {
        if (!commands.racing || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.code === "Space" && commands.acceptsDriving) {
            event.preventDefault();
            if (!event.repeat) commands.usePower("boost");
            return;
        }
        const action = keys[event.code];
        if (action) {
            event.preventDefault();
            if (commands.acceptsDriving) this.#keyboard.set(event.code, action);
        }
        if (event.repeat) return;
        if (event.code === "Escape") commands.togglePause();
        if (event.code === "KeyR") commands.recover();
        if (event.code === "KeyC") commands.toggleView();
        if (event.code === "KeyE") commands.usePower("jump");
        if (event.code === "KeyF") commands.usePower("teleport");
        if (event.code === "ShiftLeft" || event.code === "ShiftRight") commands.usePower("boost");
    }

}
