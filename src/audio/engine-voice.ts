import type { CarId, CarSpec } from "../game/vehicle/cars.ts";

interface Tuning {
    readonly idle: number;
    readonly sweep: number;
    readonly load: number;
    readonly baseMix: number;
    readonly upperMix: number;
    readonly ratio: number;
    readonly filter: number;
    readonly brightness: number;
    readonly gears: number;
    readonly harmonics: readonly number[];
}

// The spectra describe the relative strength of consecutive harmonics of the main tone.
const tuning = {
    veloce: { idle: 58, sweep: 205, load: 18, baseMix: 0.09, upperMix: 0.024, ratio: 0.5,
        filter: 270, brightness: 550, gears: 5, harmonics: [1, 0.17, 0.61, 0.07, 0.25, 0.16] },
    summit: { idle: 49, sweep: 163, load: 32, baseMix: 0.073, upperMix: 0.027, ratio: 2.45,
        filter: 250, brightness: 670, gears: 5, harmonics: [1, 0.56, 0.15, 0.28, 0.21, 0.12] },
    mistral: { idle: 97, sweep: 408, load: 50, baseMix: 0.037, upperMix: 0.009, ratio: 2.74,
        filter: 410, brightness: 810, gears: 1, harmonics: [1, 0.085, 0.12] },
    bastion: { idle: 31, sweep: 94, load: 16, baseMix: 0.114, upperMix: 0.018, ratio: 1.5,
        filter: 190, brightness: 365, gears: 4, harmonics: [1, 0.81, 0.63, 0.48, 0.23, 0.14, 0.07] },
    aero: { idle: 143, sweep: 655, load: 72, baseMix: 0.037, upperMix: 0.011, ratio: 1.49,
        filter: 540, brightness: 1_230, gears: 1, harmonics: [1, 0.035, 0.055, 0.025] },
    orbit: { idle: 81, sweep: 312, load: 35, baseMix: 0.071, upperMix: 0.024, ratio: 1.49,
        filter: 370, brightness: 1_040, gears: 6, harmonics: [1, 0.31, 0.25, 0.28, 0.3, 0.2, 0.13, 0.06] },
    buggy: { idle: 41, sweep: 154, load: 24, baseMix: 0.084, upperMix: 0.025, ratio: 1.5,
        filter: 220, brightness: 485, gears: 4, harmonics: [1, 0.38, 0.54, 0.24, 0.08, 0.22] },
    kestrel: { idle: 65, sweep: 233, load: 34, baseMix: 0.077, upperMix: 0.026, ratio: 3.62,
        filter: 290, brightness: 820, gears: 5, harmonics: [1, 0.26, 0.58, 0.53, 0.06, 0.16] },
    manta: { idle: 76, sweep: 214, load: 117, baseMix: 0.057, upperMix: 0.035, ratio: 1.515,
        filter: 370, brightness: 800, gears: 1, harmonics: [1, 0, 0.17, 0.02] },
} satisfies Record<CarId, Tuning>;

export class EngineVoice {
    readonly #context: BaseAudioContext;
    readonly #main: OscillatorNode;
    readonly #upper: OscillatorNode;
    readonly #mainGain: GainNode;
    readonly #upperGain: GainNode;
    readonly #filter: BiquadFilterNode;
    readonly #air: BiquadFilterNode;
    readonly #airGain: GainNode;
    readonly #level: GainNode;
    #car: CarSpec | undefined;
    #audible = false;

    constructor(context: BaseAudioContext, effects: GainNode) {
        this.#context = context;
        this.#main = context.createOscillator();
        this.#upper = context.createOscillator();
        this.#mainGain = context.createGain();
        this.#upperGain = context.createGain();
        this.#filter = context.createBiquadFilter();
        this.#level = context.createGain();
        this.#air = context.createBiquadFilter();
        this.#airGain = context.createGain();
        this.#mainGain.gain.value = 0;
        this.#upperGain.gain.value = 0;
        this.#airGain.gain.value = 0;
        this.#level.gain.value = 0;
        this.#filter.type = "lowpass";
        this.#filter.Q.value = 0.7;
        this.#air.type = "bandpass";
        this.#air.Q.value = 0.9;
        this.#main.connect(this.#mainGain).connect(this.#filter);
        this.#upper.connect(this.#upperGain).connect(this.#filter);
        this.#filter.connect(this.#level).connect(effects);
        this.#main.start();
        this.#upper.start();

        // A loop of air noise provides a broadband exhaust for the hovering craft.
        const loop = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const samples = loop.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * 0.75;
        const airSource = context.createBufferSource();
        airSource.buffer = loop;
        airSource.loop = true;
        airSource.connect(this.#air).connect(this.#airGain).connect(this.#level);
        airSource.start();
    }

    select(car: CarSpec): void {
        if (this.#car?.id === car.id) return;
        this.#car = car;
        const { harmonics, idle, ratio } = tuning[car.id];
        const real = new Float32Array(harmonics.length + 1);
        const imaginary = new Float32Array([0, ...harmonics]);
        this.#main.setPeriodicWave(this.#context.createPeriodicWave(real, imaginary));
        this.#upper.type = car.propulsion === "combustion" ? "triangle" : "sine";
        this.update(0, 0, false);
        const now = this.#context.currentTime;
        this.#main.frequency.setValueAtTime(idle, now);
        this.#upper.frequency.setValueAtTime(idle * ratio, now);
    }

    update(speed: number, throttle: number, active: boolean): void {
        const car = this.#car;
        const audible = car !== undefined && active;
        const now = this.#context.currentTime;
        if (audible !== this.#audible) {
            this.#level.gain.setTargetAtTime(Number(audible), now, 0.044);
            this.#audible = audible;
        }
        if (!car || !audible) return;
        const voice = tuning[car.id];
        const speedRatio = Math.min(1.2, Math.max(0, speed / car.topSpeed));
        const load = Math.min(1, Math.max(0, throttle));
        const geared = car.propulsion === "combustion";
        const shift = speedRatio ** 0.72 * voice.gears;
        const gear = Math.min(voice.gears - 1, Math.floor(shift));
        const revs = geared ? Math.min(1.14, (shift - gear) * 0.47 + Math.min(gear, 1) * 0.35 + speedRatio * 0.19)
            : speedRatio;
        const pitch = voice.idle + revs * voice.sweep + load * voice.load;
        const hover = car.propulsion === "ion";
        const electric = car.propulsion === "electric";
        this.#main.frequency.setTargetAtTime(pitch, now, hover ? 0.18 : 0.058);
        this.#upper.frequency.setTargetAtTime(pitch * voice.ratio + (hover ? 1.8 : 0), now, hover ? 0.24 : 0.083);
        const cutoff = voice.filter + voice.brightness * (revs * 0.74 + load * 0.52);
        const toneLevel = voice.baseMix * ((electric ? 0.07 : 0.24) + load * 0.52 + speedRatio * 0.27);
        this.#filter.frequency.setTargetAtTime(cutoff, now, 0.09);
        this.#mainGain.gain.setTargetAtTime(toneLevel, now, 0.06);
        this.#upperGain.gain.setTargetAtTime(voice.upperMix * (load ** 1.6 + speedRatio * 0.32), now, 0.1);
        this.#airGain.gain.setTargetAtTime(hover ? 0.024 + load * 0.16 + speedRatio * 0.04 : 0, now, 0.17);
        if (hover) this.#air.frequency.setTargetAtTime(510 + load * 640 + speedRatio * 490, now, 0.22);
    }
}
