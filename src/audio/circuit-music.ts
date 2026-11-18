import { FileMusic } from "./file-music.ts";

const FADE = 0.72;
const DECODED_TRACK_LIMIT = 2;

export interface MusicTrack {
    readonly url: string;
    readonly volume: number;
}

export interface CircuitMusic {
    set(track: MusicTrack, playing: boolean): void;
    dispose(): void;
}

export function createCircuitMusic(context: AudioContext): CircuitMusic {
    return location.protocol === "file:" ? new FileMusic(FADE) : new BufferedMusic(context);
}

interface Voice {
    readonly track: MusicTrack;
    readonly buffer: AudioBuffer;
    readonly node: AudioBufferSourceNode;
    readonly gain: AudioParam;
    readonly offset: number;
    readonly started: number;
}

class BufferedMusic implements CircuitMusic {
    readonly #context: AudioContext;
    readonly #decoded = new Map<string, AudioBuffer>();
    #track: MusicTrack | undefined;
    #playing = false;
    #buffer: AudioBuffer | undefined;
    #loading: AbortController | undefined;
    #voice: Voice | undefined;
    #offset = 0;

    constructor(context: AudioContext) {
        this.#context = context;
    }

    set(track: MusicTrack, playing: boolean): void {
        if (this.#track === track && this.#playing === playing && (!playing || this.#voice || this.#loading)) return;
        this.#playing = playing;
        if (this.#track !== track) {
            this.#loading?.abort();
            this.#loading = undefined;
            this.#track = track;
            this.#buffer = this.#decoded.get(track.url);
            if (this.#buffer) this.#remember(track.url, this.#buffer);
            this.#offset = 0;
        }
        if (!playing) {
            this.#fadeOut();
        } else if (this.#buffer) {
            this.#start(track, this.#buffer);
        } else if (!this.#loading) {
            const request = new AbortController();
            this.#loading = request;
            void this.#decode(track, request);
        }
    }

    dispose(): void {
        this.#playing = false;
        this.#loading?.abort();
        this.#loading = undefined;
        this.#voice?.node.stop();
        this.#voice = undefined;
        this.#decoded.clear();
    }

    async #decode(track: MusicTrack, request: AbortController): Promise<void> {
        try {
            const response = await fetch(track.url, { signal: request.signal });
            if (!response.ok) throw new Error("Music download failed");
            const buffer = await this.#context.decodeAudioData(await response.arrayBuffer());
            if (request.signal.aborted) return;
            this.#remember(track.url, buffer);
            this.#buffer = buffer;
            this.#start(track, buffer);
        } catch {
            if (!request.signal.aborted) this.#fadeOut();
        } finally {
            if (this.#loading === request) this.#loading = undefined;
        }
    }

    #remember(url: string, buffer: AudioBuffer): void {
        this.#decoded.delete(url);
        this.#decoded.set(url, buffer);
        if (this.#decoded.size > DECODED_TRACK_LIMIT) this.#decoded.delete(this.#decoded.keys().next().value!);
    }

    #start(track: MusicTrack, buffer: AudioBuffer): void {
        if (!this.#playing || this.#voice?.track === track) return;
        const context = this.#context;
        const node = context.createBufferSource();
        const gain = context.createGain();
        const now = context.currentTime;
        node.buffer = buffer;
        node.loop = true;
        node.connect(gain).connect(context.destination);
        node.addEventListener("ended", () => {
            node.disconnect();
            gain.disconnect();
        }, { once: true });
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(track.volume, now + FADE);
        node.start(now, this.#offset);
        this.#fadeOut();
        this.#voice = { track, buffer, node, gain: gain.gain, offset: this.#offset, started: now };
    }

    #fadeOut(): void {
        const voice = this.#voice;
        if (!voice) return;
        const now = this.#context.currentTime;
        const elapsed = now - voice.started;
        if (voice.track === this.#track) this.#offset = (voice.offset + elapsed) % voice.buffer.duration;
        voice.gain.cancelScheduledValues(now);
        voice.gain.setValueAtTime(voice.track.volume * Math.min(1, elapsed / FADE), now);
        voice.gain.linearRampToValueAtTime(0, now + FADE);
        voice.node.stop(now + FADE);
        this.#voice = undefined;
    }
}
