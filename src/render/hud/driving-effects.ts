import type { CameraKick } from "../camera/race-camera.ts";

const CRACK_TIME = 1.14;
const KICK_TIME = 0.29;
const SPEED_START = 185 / 3.6;
const SPEED_FULL = 240 / 3.6;
const CRACK_IMPACT = 7;

export class DrivingEffects {
    readonly #streaks: SVGElement;
    readonly #glass: SVGElement;
    readonly #motion: MediaQueryList;
    #speed = 0;
    #hit = 0;
    #age = CRACK_TIME;
    #side = -1;

    constructor(streaks: SVGElement, glass: SVGElement, motion: MediaQueryList) {
        this.#streaks = streaks;
        this.#glass = glass;
        this.#motion = motion;
    }

    update(seconds: number, speed: number, boosting: boolean, impact: number): CameraKick | undefined {
        const reducedMotion = this.#motion.matches;
        this.#age += seconds;
        if (impact >= CRACK_IMPACT) {
            this.#hit = Math.min(1, 0.49 + (impact - CRACK_IMPACT) / 46);
            this.#age = 0;
            this.#side = -this.#side;
            this.#glass.classList.toggle("impact-mirror", this.#side < 0);
        }

        const aboveThreshold = Math.max(0, Math.min(1, (speed - SPEED_START) / (SPEED_FULL - SPEED_START)));
        const target = Math.max(aboveThreshold * 0.64, boosting ? 0.92 : 0);
        this.#speed = reducedMotion ? 0 : this.#speed + (target - this.#speed) * (1 - Math.exp(-seconds * 11));
        const glass = this.#hit * Math.min(1, Math.max(0, (CRACK_TIME - this.#age) / 0.85)) ** 2;
        this.#opacity(this.#streaks, this.#speed);
        this.#opacity(this.#glass, glass * (reducedMotion ? 0.64 : 1));

        if (reducedMotion || this.#age >= KICK_TIME) return undefined;
        const strength = this.#hit * (1 - this.#age / KICK_TIME) ** 2;
        const recoil = Math.cos(this.#age * 33) * strength;
        return { pitch: -recoil * 0.024, yaw: recoil * this.#side * 0.015, roll: recoil * this.#side * 0.021 };
    }

    reset(): void {
        this.#speed = 0;
        this.#age = CRACK_TIME;
        this.#opacity(this.#streaks, 0);
        this.#opacity(this.#glass, 0);
    }

    #opacity(layer: SVGElement, value: number): void {
        const visible = value >= 0.008;
        if (visible) {
            layer.style.opacity = value.toFixed(3);
            layer.classList.add("effect-visible");
        } else if (layer.classList.contains("effect-visible")) {
            layer.classList.remove("effect-visible");
            layer.style.removeProperty("opacity");
        }
    }
}
