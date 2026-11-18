import { STEP } from "../vehicle/world.ts";
import type { Difficulty } from "./setup.ts";

interface Pace {
    readonly speed: number;
    readonly acceleration: number;
    readonly turnGrip: number;
}

const difficultyPace: Record<Difficulty, Pace> = {
    Rookie: { speed: 15, acceleration: 2.8, turnGrip: 3.1 },
    Easy: { speed: 20, acceleration: 3.7, turnGrip: 4 },
    Normal: { speed: 25, acceleration: 4.6, turnGrip: 5 },
    Hard: { speed: 31, acceleration: 5.8, turnGrip: 6.4 },
    Expert: { speed: 37, acceleration: 7.1, turnGrip: 7.8 },
    Legend: { speed: 43, acceleration: 8.4, turnGrip: 9.1 },
};

export interface RivalStyle {
    readonly speed: number;
    readonly launch: number;
    readonly cornering: number;
    readonly headway: number;
}

export const rivalStyles: readonly RivalStyle[] = [
    { speed: 1.13, launch: 1.02, cornering: 1.07, headway: 4.1 },
    { speed: 0.92, launch: 0.99, cornering: 1.16, headway: 6.2 },
    { speed: 1.03, launch: 1.15, cornering: 0.91, headway: 4.8 },
    { speed: 0.79, launch: 0.83, cornering: 1.04, headway: 7.4 },
    { speed: 0.85, launch: 0.93, cornering: 0.89, headway: 5.9 },
    { speed: 0.94, launch: 1.01, cornering: 0.96, headway: 5.5 },
    { speed: 0.74, launch: 0.98, cornering: 1.20, headway: 4.5 },
    { speed: 1.06, launch: 1.03, cornering: 0.97, headway: 5.1 },
    { speed: 0.89, launch: 1.08, cornering: 1.12, headway: 6.1 },
    { speed: 0.98, launch: 0.96, cornering: 1.04, headway: 5.7 },
    { speed: 0.82, launch: 0.87, cornering: 1.09, headway: 7.0 },
    { speed: 1.09, launch: 0.91, cornering: 0.93, headway: 6.7 },
];

export class RivalPace {
    readonly #base: Pace;
    readonly #reference: number;
    #playerSpeed: number;

    constructor(difficulty: Difficulty) {
        this.#base = difficultyPace[difficulty];
        this.#reference = this.#base.speed * 0.82;
        this.#playerSpeed = this.#reference;
    }

    observe(playerSpeed: number | undefined): void {
        const speed = playerSpeed ?? this.#reference;
        this.#playerSpeed += (speed - this.#playerSpeed) * (STEP / 2.5);
    }

    acceleration(style: RivalStyle): number {
        return this.#base.acceleration * style.launch;
    }

    speedLimit(style: RivalStyle, grip: number, bend: number, playerLead: number): number {
        const matching = 1 + clamp((this.#playerSpeed - this.#reference) / this.#base.speed * 0.35, -0.17, 0.19);
        const gapCorrection = clamp(playerLead * 0.00048, -0.045, 0.055);
        const straight = this.#base.speed * style.speed * (matching + gapCorrection) * (0.74 + grip * 0.26);
        const corner = Math.sqrt(this.#base.turnGrip * style.cornering * grip * 24 / Math.max(0.04, bend));
        return Math.min(straight, corner);
    }
}

function clamp(value: number, low: number, high: number): number {
    return Math.max(low, Math.min(high, value));
}
