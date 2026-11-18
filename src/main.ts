import "./ui/shell.css";
import "./ui/garage/garage.css";
import "./ui/garage/preview.css";
import "./ui/garage/panel-options.css";
import "./ui/garage/setup.css";
import "./ui/garage/shop.css";
import "./ui/race/race.css";
import "./ui/race/hud/hud.css";
import "./ui/race/controls/controls.css";
import "./ui/race/overlays/overlays.css";
import "./ui/steel/steel.css";
import { installSteelTextures } from "./ui/steel/parts.ts";
import RAPIER from "@dimforge/rapier3d-compat";
import { RaceAudio } from "./audio/race-audio.ts";
import { connectAudioGestures } from "./browser/audio-gestures.ts";
import { connectAudioOptions } from "./ui/audio-options.ts";
import { element } from "./ui/dom.ts";
import { DriveControls } from "./ui/race/controls/drive-controls.ts";
import { GarageView } from "./ui/garage/view.ts";
import { connectOfflineControls } from "./browser/offline.ts";
import { RaceApp } from "./app/race-app.ts";
import { RaceHud } from "./ui/race/hud.ts";
import { RaceSceneFactory } from "./render/race-scene.ts";
import { RaceStorage } from "./browser/race-storage.ts";
import { PlayerProgress } from "./browser/player-progress.ts";
import { RaceSession } from "./app/race-session.ts";
import { openRenderer } from "./render/renderer.ts";
import { DrivingEffects } from "./render/hud/driving-effects.ts";
import { bindShadowPreference } from "./browser/shadow-preference.ts";

installSteelTextures();

async function start(): Promise<void> {
    const garage = new GarageView();
    try {
        await RAPIER.init();
        const { engine, canvas, backend } = await openRenderer(garage.mount);
        let observer: ResizeObserver | undefined;
        try {
            const controls = new DriveControls(canvas);
            const storage = new RaceStorage(() => window.localStorage);
            const audioPreferences = storage.loadAudio();
            const audio = new RaceAudio(audioPreferences);
            const effects = new DrivingEffects(
                element("speed-streaks", SVGElement), element("impact-glass", SVGElement),
                matchMedia("(prefers-reduced-motion: reduce)"),
            );
            const enhancedShadows = bindShadowPreference(element("enhanced-shadows", HTMLButtonElement));
            const session = new RaceSession(new RaceSceneFactory(engine, enhancedShadows), audio, effects);
            const progress = await PlayerProgress.open(() => window.indexedDB);
            const app = new RaceApp(garage, new RaceHud(), controls, storage, session, progress);
            connectAudioOptions(audioPreferences, channel => {
                const preferences = audio.toggle(channel);
                storage.saveAudio(preferences);
                return preferences;
            });
            connectAudioGestures(audio);
            observer = new ResizeObserver(() => engine.resize());
            observer.observe(garage.mount);
            engine.runRenderLoop(() => {
                app.frame(engine.getDeltaTime() / 1_000);
                garage.showFrameRate(engine.getFps());
            });
            garage.ready(backend);
        } catch (error) {
            observer?.disconnect();
            engine.dispose();
            throw error;
        }
    } catch (error) {
        garage.reportError(error instanceof Error ? error.message : "The 3D view could not start.");
        console.error(error);
    }
}

void start();
void connectOfflineControls(
    element("offline-status"),
    element("update-game", HTMLButtonElement),
    () => !document.body.classList.contains("racing"),
);
