import type { Biome } from "../game/course/tracks.ts";
import type { CarSpec } from "../game/vehicle/cars.ts";
import { EngineVoice } from "./engine-voice.ts";
import { createCircuitMusic } from "./circuit-music.ts";
import type { CircuitMusic, MusicTrack } from "./circuit-music.ts";

export type AudioChannel = "music" | "effects";
export type AudioPreferences = Readonly<Record<AudioChannel, boolean>>;

const MUSIC_LEVEL = 0.7;
const garageTrack: MusicTrack = { url: "./music/garage.mp3", volume: 0.23 * MUSIC_LEVEL };
const RESUME_GRACE_MS = 650;

interface AudioSessionNavigator extends Navigator {
    readonly audioSession?: { type: "auto" | "playback" };
}

export class RaceAudio {
    #context: AudioContext | undefined;
    #engine: EngineVoice | undefined;
    #car: CarSpec | undefined;
    #effects: GainNode | undefined;
    #music: CircuitMusic | undefined;
    #preferences: AudioPreferences;
    #track = garageTrack;
    #playingMusic = true;
    #visible = !document.hidden;
    #resumeSince: number | undefined;

    constructor(preferences: AudioPreferences) {
        this.#preferences = preferences;
    }

    toggle(channel: AudioChannel): AudioPreferences {
        const enabled = !this.#preferences[channel];
        this.#preferences = { ...this.#preferences, [channel]: enabled };
        if (channel === "effects" && this.#effects && this.#context) {
            this.#effects.gain.setTargetAtTime(Number(enabled), this.#context.currentTime, 0.045);
        }
        if (enabled) this.unlock();
        else {
            this.#syncMusic();
            this.#routePlayback();
        }
        return this.#preferences;
    }

    setVisible(visible: boolean): void {
        this.#visible = visible;
        if (this.#context) this.#routePlayback();
        if (!visible) this.#engine?.update(0, 0, false);
        this.#syncMusic();
    }

    unlock(): void {
        if (!this.#visible || (!this.#preferences.music && !this.#preferences.effects)) return;
        this.#routePlayback();
        try {
            const now = performance.now();
            if (this.#context?.state === "closed" ||
                (this.#context?.state !== "running" && this.#resumeSince !== undefined && now - this.#resumeSince > RESUME_GRACE_MS)) {
                this.#replaceContext();
            }
            this.#open();
            const context = this.#context!;
            if (context.state !== "running") {
                this.#resumeSince ??= now;
                void context.resume().then(() => {
                    if (context === this.#context && context.state === "running") this.#resumeSince = undefined;
                }, () => {});
            } else this.#resumeSince = undefined;
            this.#syncMusic();
        } catch {
            // Sound is optional on devices without available Web Audio.
        }
    }

    #routePlayback(): void {
        const session = (navigator as AudioSessionNavigator).audioSession;
        if (!session) return;
        const type = this.#visible && (this.#preferences.music || this.#preferences.effects) ? "playback" : "auto";
        try {
            if (session.type !== type) session.type = type;
        } catch {
            // Older implementations can restrict changes to the system audio session.
        }
    }

    #replaceContext(): void {
        this.#music?.dispose();
        this.#music = undefined;
        const previous = this.#context;
        this.#context = undefined;
        this.#engine = undefined;
        this.#effects = undefined;
        this.#resumeSince = undefined;
        if (previous && previous.state !== "closed") void previous.close().catch(() => {});
    }

    #open(): void {
        if (!this.#context) {
            const context = new AudioContext();
            const effects = context.createGain();
            effects.gain.value = Number(this.#preferences.effects);
            effects.connect(context.destination);
            const engine = new EngineVoice(context, effects);
            if (this.#car) engine.select(this.#car);
            this.#context = context;
            this.#engine = engine;
            this.#effects = effects;
            this.#music = createCircuitMusic(context);
        }
    }

    startRace(track: Biome, car: CarSpec): void {
        this.#car = car;
        this.#engine?.select(car);
        const url = "./music/" + track + ".mp3";
        if (this.#track.url !== url) this.#track = { url, volume: 0.31 * MUSIC_LEVEL };
        this.#playingMusic = true;
        this.#syncMusic();
        this.unlock();
    }

    playMusic(playing: boolean): void {
        if (this.#playingMusic === playing) return;
        this.#playingMusic = playing;
        this.#syncMusic();
    }

    showGarage(): void {
        this.#car = undefined;
        this.#engine?.update(0, 0, false);
        this.#track = garageTrack;
        this.#playingMusic = true;
        this.#syncMusic();
    }

    #syncMusic(): void {
        this.#music?.set(this.#track, this.#visible && this.#playingMusic && this.#preferences.music);
    }

    update(speed: number, throttle: number, active: boolean): void {
        this.#engine?.update(speed, throttle, this.#visible && this.#preferences.effects && active);
    }

    impact(severity: number): void {
        const context = this.#context;
        if (!context || !this.#effects || !this.#preferences.effects) return;
        const duration = 0.17;
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
        const signal = buffer.getChannelData(0);
        for (let i = 0; i < signal.length; i++) signal[i] = (Math.random() - 0.5) * Math.exp(-i / (signal.length * 0.16));
        const hit = context.createBufferSource();
        const gain = context.createGain();
        hit.buffer = buffer;
        gain.gain.value = Math.min(0.4, severity * 0.022);
        hit.connect(gain).connect(this.#effects);
        hit.start();
    }

    coin(): void {
        const context = this.#context;
        if (!context || !this.#effects || !this.#preferences.effects) return;
        const now = context.currentTime;
        const bell = context.createOscillator();
        const gain = context.createGain();
        bell.type = "sine";
        bell.frequency.setValueAtTime(740, now);
        bell.frequency.setValueAtTime(1_109, now + 0.064);
        gain.gain.setValueAtTime(0.085, now);
        gain.gain.exponentialRampToValueAtTime(0.002, now + 0.21);
        bell.connect(gain).connect(this.#effects);
        bell.start(now);
        bell.stop(now + 0.22);
    }

    teleport(): void {
        const context = this.#context;
        if (!context || !this.#effects || !this.#preferences.effects) return;
        const now = context.currentTime;
        const voice = context.createOscillator();
        const gain = context.createGain();
        voice.type = "triangle";
        voice.frequency.setValueAtTime(192, now);
        voice.frequency.exponentialRampToValueAtTime(857, now + 0.124);
        voice.frequency.exponentialRampToValueAtTime(526, now + 0.22);
        gain.gain.setValueAtTime(0.002, now);
        gain.gain.exponentialRampToValueAtTime(0.07, now + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.002, now + 0.26);
        voice.connect(gain).connect(this.#effects);
        voice.start(now);
        voice.stop(now + 0.27);
    }
}
