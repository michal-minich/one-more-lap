import { cars, paintChoices } from "../../game/vehicle/cars.ts";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { appendChoice, markChoice } from "../choices.ts";
import { element } from "../dom.ts";
import { showPrice } from "./coin-price.ts";

const drivetrain = {
    all: ["All-wheel drive", "Power goes to all four wheels."],
    front: ["Front-wheel drive", "The front wheels pull the car."],
    rear: ["Rear-wheel drive", "The rear wheels push the car."],
} as const;

const speedScore = (car: CarSpec) => car.topSpeed;
const turnScore = (car: CarSpec) => Math.tan(car.steering.lock) / car.wheelbase * car.steering.response;
const gripScore = (car: CarSpec) => car.grip * car.tire.looseGrip;

export class CarPanel {
    readonly #carSpeed = element("car-top-speed");
    readonly #speedMeter = element("car-speed-meter");
    readonly #turnMeter = element("car-turn-meter");
    readonly #gripMeter = element("car-grip-meter");
    readonly #driftMeter = element("car-drift-meter");
    readonly #carDrive = element("car-drive");
    readonly #paintControl = element("paint-control");
    readonly #paint = element("choose-paint", HTMLButtonElement);
    readonly #paintOptions = element("paint");
    readonly #carUnlock = element("car-unlock");
    readonly #buyCar = element("buy-car", HTMLButtonElement);
    #paintX = -1;
    #paintY = -1;

    connect(choosePaint: (paint: string) => void, purchase: () => Promise<void>): void {
        this.#paint.addEventListener("click", () => {
            if (!this.#paintOptions.hidden) {
                this.closePaint();
                return;
            }
            this.#paintOptions.hidden = false;
            this.#paint.setAttribute("aria-expanded", "true");
            this.#paint.focus({ preventScroll: true });
        });
        const closeOutside = (event: Event): void => {
            if (!this.#paintOptions.hidden && !event.composedPath().includes(this.#paintControl)) this.closePaint();
        };
        document.addEventListener("pointerdown", closeOutside);
        document.addEventListener("focusin", closeOutside);
        this.#paintControl.addEventListener("keydown", event => {
            if (event.key !== "Escape" || this.#paintOptions.hidden) return;
            event.preventDefault();
            this.closePaint();
            this.#paint.focus({ preventScroll: true });
        });
        for (const { color, name } of paintChoices) {
            const button = appendChoice("paint", "", color, () => choosePaint(color));
            button.className = "swatch";
            button.setAttribute("aria-label", name + " paint");
            button.style.setProperty("--swatch", color);
        }
        this.#buyCar.addEventListener("click", () => void purchase());
    }

    placePaint(x: number, y: number): void {
        if (x === this.#paintX && y === this.#paintY) return;
        this.#paintX = x;
        this.#paintY = y;
        this.#paintControl.style.setProperty("--paint-x", x * 100 + "%");
        this.#paintControl.style.setProperty("--paint-y", y * 100 + "%");
        this.#paintControl.hidden = false;
    }

    closePaint(): void {
        this.#paintOptions.hidden = true;
        this.#paint.setAttribute("aria-expanded", "false");
    }

    show(car: CarSpec, paint: string): void {
        markChoice("paint", paint);
        this.#paint.style.setProperty("--swatch", paint);
        this.#carSpeed.textContent = Math.round(car.topSpeed * 3.6) + " km/h";
        showCarMeter(this.#speedMeter, "Relative top speed", car, speedScore);
        showCarMeter(this.#turnMeter, "How quickly the car turns in", car, turnScore);
        showCarMeter(this.#gripMeter, "Grip on grass and gravel", car, gripScore);
        showCarMeter(this.#driftMeter, "Ease of drifting while braking and steering", car, spec => spec.drift);
        const [drive, detail] = drivetrain[car.driven];
        if (car.propulsion === "ion") {
            this.#carDrive.textContent = "Twin ion drive";
            this.#carDrive.title = "Paired ion thrusters propel the craft while two lift pods keep it hovering.";
        } else {
            this.#carDrive.textContent = car.propulsion === "electric" ? "Electric · " + drive.toLowerCase() : drive;
            this.#carDrive.title = car.propulsion === "electric" ? "Electric motors supply the drive. " + detail : detail;
        }
    }

    showAccess(car: CarSpec, owned: boolean, coins: number): void {
        this.#carUnlock.hidden = car.unlockCoins === undefined || owned;
        if (car.unlockCoins !== undefined && !owned) {
            showPrice(this.#buyCar, car.name, car.unlockCoins, coins, false);
        }
    }
}

function showCarMeter(meter: HTMLElement, label: string, car: CarSpec, score: (car: CarSpec) => number): void {
    const range = cars.map(score);
    const min = Math.min(...range);
    const max = Math.max(...range);
    const filled = max > min ? 2 + Math.round(5 * (score(car) - min) / (max - min)) : 7;
    meter.setAttribute("role", "meter");
    meter.setAttribute("aria-label", label);
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", "7");
    meter.setAttribute("aria-valuenow", String(filled));
    meter.title = label + " · " + filled + " / 7 compared with the other cars";
    meter.replaceChildren(...Array.from({ length: 7 }, (_, index) => {
        const bar = document.createElement("i");
        bar.style.setProperty("--bar", String(index + 1));
        bar.classList.toggle("filled", index < filled);
        return bar;
    }));
}
