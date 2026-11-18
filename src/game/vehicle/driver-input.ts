import { STEP } from "./world.ts";

export const REVERSE_BRAKE_SPEED = 0.75;

export interface DriveInput {
    readonly throttle: number;
    readonly brake: number;
    readonly steer: number;
    readonly reverse: boolean;
}

export class ReverseControl {
    #brakeHold = 0;
    #reversing = false;

    reset(): void {
        this.#brakeHold = 0;
        this.#reversing = false;
    }

    resolve(input: DriveInput, speed: number, longitudinal: number): DriveInput {
        if (input.reverse) {
            this.reset();
            return longitudinal > REVERSE_BRAKE_SPEED ? { ...input, throttle: 0, brake: 1 } : { ...input, throttle: 1, brake: 0 };
        }
        if (input.brake > 0 && input.throttle === 0) {
            if (!this.#reversing) {
                this.#brakeHold = speed < 0.7 ? this.#brakeHold + STEP : 0;
                this.#reversing = this.#brakeHold >= 0.28;
            }
            return this.#reversing ? { ...input, throttle: input.brake, brake: 0, reverse: true } : input;
        }
        this.reset();
        if (input.throttle > 0 && longitudinal < -0.9) return { ...input, throttle: 0, brake: 1 };
        return input;
    }
}
