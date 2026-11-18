import type { CircuitMusic, MusicTrack } from "./circuit-music.ts";

interface Voice {
    readonly track: MusicTrack;
    readonly element: HTMLAudioElement;
    timer: number | undefined;
}

// Browsers block fetch() of adjacent files under file://. Use native media loading there.
export class FileMusic implements CircuitMusic {
    readonly #fadeMs: number;
    #track: MusicTrack | undefined;
    #playing = false;
    #selected: Voice | undefined;
    #active: Voice | undefined;
    #pending: Voice | undefined;
    #revision = 0;

    constructor(fadeSeconds: number) {
        this.#fadeMs = fadeSeconds * 1_000;
    }

    set(track: MusicTrack, playing: boolean): void {
        if (this.#track === track && this.#playing === playing &&
            (!playing || this.#pending || (this.#active && !this.#active.element.paused))) return;
        const revision = ++this.#revision;
        this.#pending = undefined;
        this.#playing = playing;
        if (this.#track !== track) {
            const previous = this.#selected;
            this.#track = track;
            this.#selected = this.#active?.track === track ? this.#active : undefined;
            if (previous && previous !== this.#active) discard(previous);
        }
        if (!playing) {
            this.#retireActive();
            if (this.#selected !== this.#active) this.#selected?.element.pause();
            return;
        }
        const next = this.#selected ??= createVoice(track);
        if (this.#active === next && !next.element.paused) {
            this.#fade(next, track.volume);
            return;
        }
        this.#pending = next;
        void next.element.play().then(() => {
            if (this.#revision !== revision) return;
            this.#pending = undefined;
            if (this.#active !== next) this.#retireActive();
            this.#active = next;
            this.#fade(next, track.volume);
        }, () => {
            if (this.#revision !== revision) return;
            this.#pending = undefined;
            this.#retireActive();
        });
    }

    dispose(): void {
        this.#revision++;
        for (const voice of new Set([this.#selected, this.#active, this.#pending])) {
            if (voice) discard(voice);
        }
        this.#selected = undefined;
        this.#active = undefined;
        this.#pending = undefined;
    }

    #retireActive(): void {
        const voice = this.#active;
        if (!voice) return;
        this.#fade(voice, 0, () => {
            voice.element.pause();
            if (this.#active === voice) this.#active = undefined;
            if (voice !== this.#selected) discard(voice);
        });
    }

    #fade(voice: Voice, target: number, done?: () => void): void {
        clearInterval(voice.timer);
        const from = voice.element.volume;
        if (from === target) {
            voice.timer = undefined;
            done?.();
            return;
        }
        const start = performance.now();
        voice.timer = window.setInterval(() => {
            const progress = Math.min(1, (performance.now() - start) / this.#fadeMs);
            voice.element.volume = from + (target - from) * progress;
            if (progress < 1) return;
            clearInterval(voice.timer);
            voice.timer = undefined;
            done?.();
        }, 24);
    }
}

function createVoice(track: MusicTrack): Voice {
    const element = new Audio();
    element.volume = 0;
    element.loop = true;
    element.src = track.url;
    return { track, element, timer: undefined };
}

function discard({ element, timer }: Voice): void {
    clearInterval(timer);
    element.pause();
    element.removeAttribute("src");
    element.load();
}
