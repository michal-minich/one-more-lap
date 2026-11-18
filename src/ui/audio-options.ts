import type { AudioChannel, AudioPreferences } from "../audio/race-audio.ts";

export function connectAudioOptions(
    initial: AudioPreferences,
    toggle: (channel: AudioChannel) => AudioPreferences,
): void {
    const controls = (["music", "effects"] as const).flatMap(channel =>
        Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-audio="' + channel + '"]'),
            button => ({ button, channel })));
    const show = (preferences: AudioPreferences): void => {
        for (const { button, channel } of controls) {
            const enabled = preferences[channel];
            button.setAttribute("aria-pressed", String(enabled));
            button.title = (channel === "music" ? "Music" : "Sound effects") + (enabled ? " on" : " off");
        }
    };
    for (const { button, channel } of controls) button.addEventListener("click", () => show(toggle(channel)));
    show(initial);
}
