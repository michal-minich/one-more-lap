import type { CarId, CarSpec } from "../../../game/vehicle/cars.ts";
import { element } from "../../dom.ts";
import parade from "./dashboards/veloce.webp?inline";
import taiga from "./dashboards/summit.webp?inline";
import sprig from "./dashboards/mistral.webp?inline";
import canyon from "./dashboards/bastion.webp?inline";
import glacier from "./dashboards/aero.webp?inline";
import kite from "./dashboards/orbit.webp?inline";
import dune from "./dashboards/buggy.webp?inline";
import comet from "./dashboards/kestrel.webp?inline";
import manta from "./dashboards/manta.webp?inline";

const art = {
    veloce: parade, summit: taiga, mistral: sprig, bastion: canyon, aero: glacier,
    orbit: kite, buggy: dune, kestrel: comet, manta,
} satisfies Record<CarId, string>;

const instruments = {
    veloce: { gauge: "needle", range: 280, clocks: "inset" },
    summit: { gauge: "bar", range: 240, clocks: "inset" },
    mistral: { gauge: "digits", range: 220, clocks: "separate" },
    bastion: { gauge: "needle", range: 180, clocks: "separate" },
    aero: { gauge: "bar", range: 280, clocks: "inset" },
    orbit: { gauge: "bar", range: 300, clocks: "inset" },
    buggy: { gauge: "needle", range: 220, clocks: "separate" },
    kestrel: { gauge: "tape", range: 260, clocks: "inset" },
    manta: { gauge: "flight", range: 300, clocks: "inset" },
} as const satisfies Record<CarId, { gauge: string; range: number; clocks: string }>;

const sweep = 122;
const center = 42;
const svg = "http://www.w3.org/2000/svg";

export class Speedometer {
    readonly #cluster = element("race-instruments");
    readonly #dial = element("speed-dial");
    readonly #face = element("speed-face", HTMLImageElement);
    readonly #readout = element("speed");
    readonly #ticks = element("speed-ticks", SVGGElement);
    readonly #tape = element("speed-tape-marks");
    #maximum = 1;
    #speed = -1;

    select(car: CarSpec): void {
        const { gauge, range, clocks } = instruments[car.id];
        this.#maximum = range;
        this.#cluster.dataset.clocks = clocks;
        this.#cluster.dataset.car = car.id;
        this.#dial.dataset.car = car.id;
        this.#dial.dataset.gauge = gauge;
        this.#face.src = art[car.id];
        if (gauge === "needle") this.#setTicks(range);
        else if (gauge === "tape") this.#setTape(range);
        this.#speed = -1;
        this.show(0);
    }

    show(speed: number): void {
        const kmh = Math.round(Math.max(0, speed * 3.6));
        if (kmh === this.#speed) return;
        this.#speed = kmh;
        const fraction = Math.min(1, kmh / this.#maximum);
        this.#dial.style.setProperty("--speed-fraction", String(fraction));
        this.#dial.style.setProperty("--needle-angle", String(-sweep + 2 * sweep * fraction) + "deg");
        this.#dial.style.setProperty("--tape-offset", String(-fraction * 100) + "%");
        this.#readout.textContent = String(kmh);
    }

    #setTicks(range: number): void {
        const marks: SVGElement[] = [];
        for (let tick = 0; tick <= 16; tick++) {
            const angle = (-sweep + tick * sweep / 8) * Math.PI / 180;
            const major = tick % 8 === 0;
            const mark = document.createElementNS(svg, "line");
            const x = Math.sin(angle);
            const y = -Math.cos(angle);
            const inner = major ? 31.5 : 34.5;
            mark.setAttribute("x1", String(center + x * 37));
            mark.setAttribute("y1", String(center + y * 37));
            mark.setAttribute("x2", String(center + x * inner));
            mark.setAttribute("y2", String(center + y * inner));
            mark.classList.toggle("major", major);
            mark.classList.toggle("high", tick >= 14);
            marks.push(mark);
            if (!major) continue;
            const number = document.createElementNS(svg, "text");
            number.setAttribute("x", String(center + x * 24));
            number.setAttribute("y", String(center + y * 24 + 2.5));
            number.textContent = String(range * tick / 16);
            marks.push(number);
        }
        this.#ticks.replaceChildren(...marks);
    }

    #setTape(range: number): void {
        this.#tape.replaceChildren(...Array.from({ length: range / 20 + 1 }, (_, index) => {
            const tick = document.createElement("i");
            tick.style.left = String(index * 20 / range * 100) + "%";
            if (index % 2 === 0) tick.textContent = String(index * 20);
            return tick;
        }));
    }
}
