import type { RaceAudio } from "../audio/race-audio.ts";
import type { Point } from "../game/point.ts";
import { conditions, precipitationFor } from "../game/race/conditions.ts";
import type { ConditionChange, Conditions } from "../game/race/conditions.ts";
import type { Course } from "../game/course/course.ts";
import { RaceRun } from "../game/race/run.ts";
import type { RaceProfile, Telemetry } from "../game/race/run.ts";
import type { LapRecord } from "../game/race/records.ts";
import type { ActivePower } from "../game/progression/powers.ts";
import type { RivalPosition } from "../game/race/opponents.ts";
import type { CameraKick } from "../render/camera/race-camera.ts";
import type { DrivingEffects } from "../render/hud/driving-effects.ts";
import type { RaceScene, RaceSceneFactory } from "../render/race-scene.ts";
import type { Setup } from "../game/race/setup.ts";
import type { DriveInput } from "../game/vehicle/driver-input.ts";
import { GaragePreviews, garagePreviewKey } from "./garage-previews.ts";

interface GaragePreview {
    readonly mode: "garage";
    readonly key: string;
    readonly scene: RaceScene;
    readonly conditions: Conditions;
}

interface ActiveRace {
    readonly mode: "race";
    readonly scene: RaceScene;
    readonly run: RaceRun;
}

interface RacePositions {
    readonly position: Point;
    readonly rivals: readonly RivalPosition[];
}

interface RaceViewFrame extends RacePositions {
    readonly cameraWaterDepth: number;
    readonly completedLaps: readonly LapRecord[];
    readonly collectedCoins: number;
    readonly teleportBlocked: boolean;
    readonly telemetry?: Telemetry;
}

export class RaceSession {
    readonly #scenes: RaceSceneFactory;
    readonly #previews: GaragePreviews;
    readonly #audio: RaceAudio;
    readonly #effects: DrivingEffects;
    #view: GaragePreview | ActiveRace | undefined;
    #firstPerson = false;
    #untilTelemetry = 0;

    constructor(scenes: RaceSceneFactory, audio: RaceAudio, effects: DrivingEffects) {
        this.#scenes = scenes;
        this.#previews = new GaragePreviews(scenes);
        this.#audio = audio;
        this.#effects = effects;
    }

    showGarage(setup: Setup, course: Course): void {
        const previous = this.#view;
        const key = garagePreviewKey(setup);
        const reuse = previous?.mode === "garage" && previous.key === key;
        const scene = reuse ? previous.scene : this.#previews.take(key, setup, course);
        scene.setPaint(setup.paint);
        if (!reuse) this.#leaveView();
        this.#view = {
            mode: "garage", scene, key,
            conditions: conditions(setup.hour, setup.weather, 0, setup.dynamic, precipitationFor(setup.track.id)),
        };
        this.#audio.showGarage();
    }

    start(setup: Setup, course: Course, profile: RaceProfile): void {
        let run: RaceRun | undefined;
        let scene: RaceScene | undefined;
        try {
            if (this.#view?.mode === "garage") this.#previews.clear();
            run = new RaceRun(course, setup, profile);
            scene = this.#scenes.create(setup, course, { rivals: run.opponents.specs, coins: run.coins.coins });
            scene.useFirstPerson(this.#firstPerson);
            presentRun(scene, run, 0, true);
            this.#leaveView();
            this.#view = { mode: "race", scene, run };
            this.#untilTelemetry = 0;
        } catch (error) {
            disposeRaceView(scene, run);
            throw error;
        }
        this.#audio.startRace(setup.track.id, setup.car);
    }

    get acceptsDriving(): boolean {
        return this.#view?.mode === "race" && !this.#view.run.paused && this.#view.run.canDrive;
    }

    get racing(): boolean {
        return this.#view?.mode === "race";
    }

    get garagePaintAnchor(): Readonly<{ x: number; y: number }> | undefined {
        return this.#view?.mode === "garage" ? this.#view.scene.garagePaintAnchor : undefined;
    }

    get paused(): boolean {
        return this.#view?.mode === "race" && this.#view.run.paused;
    }

    setPaused(paused: boolean): boolean {
        if (this.#view?.mode !== "race" || !this.#view.run.canDrive) return false;
        this.#view.run.paused = paused;
        if (paused) this.#effects.reset();
        this.#audio.playMusic(!paused);
        this.#untilTelemetry = 0;
        return true;
    }

    changeConditions(change: ConditionChange): boolean {
        if (this.#view?.mode !== "race" || !this.#view.run.paused || !this.#view.run.canDrive) return false;
        this.#view.run.changeConditions(change);
        this.#untilTelemetry = 0;
        return true;
    }

    toggleView(): boolean {
        if (this.#view?.mode !== "race") return this.#firstPerson;
        this.#firstPerson = !this.#firstPerson;
        this.#view.scene.useFirstPerson(this.#firstPerson);
        return this.#firstPerson;
    }

    recover(): boolean {
        if (this.#view?.mode !== "race" || !this.#view.run.recover()) return false;
        this.#effects.reset();
        presentRun(this.#view.scene, this.#view.run, 0, true);
        this.#untilTelemetry = 0;
        return true;
    }

    usePower(power: ActivePower): void {
        if (this.#view?.mode === "race") this.#view.run.usePower(power);
    }

    frame(seconds: number, input: DriveInput): RaceViewFrame | undefined {
        if (!this.#view) return undefined;
        const dt = Math.min(seconds, 0.084);
        const view = this.#view;
        if (view.mode === "garage") {
            view.scene.draw(dt, view.conditions);
            this.#audio.update(0, 0, false);
            return undefined;
        }

        const frame = view.run.advance(dt, input);
        const telemetry = view.run.snapshot();
        if (frame.impact > 0) this.#audio.impact(frame.impact);
        if (frame.teleport === "used") {
            view.scene.flashTeleport();
            this.#audio.teleport();
        }
        if (frame.pickedCoins.length > 0) {
            view.scene.pickCoins(frame.pickedCoins);
            this.#audio.coin();
        }
        if (frame.recovered) this.#effects.reset();
        const boosting = telemetry.powers.boosting || telemetry.stripBoosting;
        const driving = view.run.driving;
        const kick = this.#effects.update(dt, driving ? telemetry.speed : 0, driving && boosting, frame.impact);
        const positions = presentRun(view.scene, view.run, dt, frame.recovered, kick);
        view.scene.draw(dt, telemetry.conditions, {
            driveTime: view.run.driveTime, damage: telemetry.damage, impact: frame.impact, speed: telemetry.speed,
            forwardSpeed: telemetry.forwardSpeed,
            braking: input.brake > 0, water: telemetry.water, boosting, phasing: telemetry.powers.phasing,
        });
        this.#audio.update(telemetry.speed, view.run.vehicle.throttle, driving);
        this.#audio.playMusic(!view.run.paused && view.run.canDrive);
        this.#untilTelemetry -= dt;
        const viewFrame: RaceViewFrame = {
            ...positions, cameraWaterDepth: view.scene.cameraWaterDepth,
            completedLaps: frame.completedLaps, collectedCoins: frame.pickedCoins.length,
            teleportBlocked: frame.teleport === "blocked",
        };
        if (this.#untilTelemetry <= 0) {
            this.#untilTelemetry = 0.09;
            return { ...viewFrame, telemetry };
        }
        return viewFrame;
    }

    #leaveView(): void {
        const view = this.#view;
        if (!view) return;
        this.#view = undefined;
        if (view.mode === "garage") this.#previews.retain(view.key, view.scene);
        else {
            this.#effects.reset();
            disposeRaceView(view.scene, view.run);
        }
    }
}

function disposeRaceView(scene?: RaceScene, run?: RaceRun): void {
    try {
        run?.dispose();
    } finally {
        scene?.dispose();
    }
}

function presentRun(scene: RaceScene, run: RaceRun, dt: number, snap: boolean, kick?: CameraKick): RacePositions {
    const pose = run.pose();
    const opponents = run.opponents.specs.map((_, index) => run.opponents.pose(index, run.interpolation));
    scene.follow(pose, opponents, run.vehicle.damage, dt, snap, kick);
    return {
        position: pose.position,
        rivals: opponents.map((other, index) => ({ position: other.position, paint: run.opponents.specs[index]!.paint })),
    };
}
