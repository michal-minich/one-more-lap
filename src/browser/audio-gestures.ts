import type { RaceAudio } from "../audio/race-audio.ts";

export function connectAudioGestures(audio: RaceAudio): void {
    const unlock = (event: Event): void => {
        if (event.isTrusted) audio.unlock();
    };
    document.addEventListener("click", unlock, { capture: true });
    document.addEventListener("keydown", unlock, { capture: true });
    document.addEventListener("touchend", unlock, { capture: true, passive: true });
    document.addEventListener("visibilitychange", () => audio.setVisible(!document.hidden));
    window.addEventListener("pagehide", () => audio.setVisible(false));
    window.addEventListener("pageshow", () => audio.setVisible(!document.hidden));
}
