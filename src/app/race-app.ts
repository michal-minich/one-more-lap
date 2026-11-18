import { Course } from "../game/course/course.ts";
import type { TrackSpec } from "../game/course/tracks.ts";
import type { DriveControls, DrivingCommands } from "../ui/race/controls/drive-controls.ts";
import type { GarageCommands, GarageView } from "../ui/garage/view.ts";
import type { RaceCommands, RaceHud } from "../ui/race/hud.ts";
import type { RaceStorage } from "../browser/race-storage.ts";
import type { PlayerProgress } from "../browser/player-progress.ts";
import { canDrive } from "../game/progression/profile.ts";
import type { PlayerProfile } from "../game/progression/profile.ts";
import type { ActivePower, PowerId } from "../game/progression/powers.ts";
import { climateWeather } from "../game/race/conditions.ts";
import type { ConditionChange } from "../game/race/conditions.ts";
import type { Setup } from "../game/race/setup.ts";
import type { Finish } from "../game/race/run.ts";
import type { CarId } from "../game/vehicle/cars.ts";
import { REVERSE_BRAKE_SPEED } from "../game/vehicle/driver-input.ts";
import type { RaceSession } from "./race-session.ts";

export class RaceApp implements GarageCommands, RaceCommands, DrivingCommands {
    readonly #garage: GarageView;
    readonly #hud: RaceHud;
    readonly #controls: DriveControls;
    readonly #storage: RaceStorage;
    readonly #session: RaceSession;
    readonly #progress: PlayerProgress;
    readonly #courses = new Map<TrackSpec, Course>();
    #setup: Setup;
    #course: Course;
    #lastFinish: Finish | null = null;
    #pendingCoins = 0;
    #firstDrive = false;

    constructor(
        garage: GarageView,
        hud: RaceHud,
        controls: DriveControls,
        storage: RaceStorage,
        session: RaceSession,
        progress: PlayerProgress,
    ) {
        this.#garage = garage;
        this.#hud = hud;
        this.#controls = controls;
        this.#storage = storage;
        this.#session = session;
        this.#progress = progress;
        this.#setup = storage.loadSetup();
        this.#course = this.#courseFor(this.#setup.track);
        this.#session.showGarage(this.#setup, this.#course);
        this.#garage.connect(this);
        this.#showProfile(progress.profile);
        this.#showSelection();
        this.#hud.connect(this);
        this.#controls.connect(this);
    }

    get racing(): boolean {
        return this.#session.racing;
    }

    get acceptsDriving(): boolean {
        return this.#session.acceptsDriving;
    }

    changeSetup(change: Partial<Setup>): void {
        if (this.racing) return;
        const track = change.track ?? this.#setup.track;
        const preset = track === this.#setup.track ? {} : this.#storage.conditionsFor(track.id);
        const selection = { ...this.#setup, ...preset, ...change };
        const noviceDifficulty = change.difficulty === "Rookie" || change.difficulty === "Easy";
        const setup = { ...selection,
            weather: climateWeather(selection.track.id, selection.weather),
            noDamage: noviceDifficulty || selection.noDamage === true,
        };
        if (this.#course.track !== setup.track) this.#course = this.#courseFor(setup.track);
        this.#setup = setup;
        this.#storage.saveConditions(track.id, change);
        this.#storage.saveSetup(setup);
        this.#showGarage();
    }

    start(): void {
        if (!canDrive(this.#progress.profile, this.#setup.car)) return;
        this.#controls.release();
        const firstDrive = !this.#storage.hasDriven(this.#setup.track.id);
        this.#session.start({ ...this.#setup, dynamic: this.#setup.dynamic && !firstDrive }, this.#course, {
            fastestLap: this.#setup.noDamage ? undefined : this.#storage.bestLap(this.#course.track.id, this.#setup.direction),
            owned: this.#progress.profile.owned,
        });
        this.#firstDrive = firstDrive;
        this.#lastFinish = null;
        this.#controls.showBrakeBeforeReverse(false);
        const wallet = Math.min(Number.MAX_SAFE_INTEGER, this.#progress.profile.coins + this.#pendingCoins);
        this.#hud.open(this.#course, this.#setup, wallet);
    }

    leave(): void {
        this.#controls.release();
        this.#showGarage();
        this.#hud.close();
        this.#garage.focusStart();
    }

    togglePause(): void {
        this.#pause(!this.#session.paused);
    }

    pauseForBackground(): void {
        if (!this.#session.paused) this.#pause(true);
    }

    changeConditions(change: ConditionChange): void {
        if (!this.#session.changeConditions(change)) return;
        const setup = { ...this.#setup, ...change };
        this.#setup = { ...setup, weather: climateWeather(setup.track.id, setup.weather) };
        this.#storage.saveConditions(setup.track.id, change);
    }

    toggleView(): void {
        if (this.racing) this.#hud.setCamera(this.#session.toggleView());
    }

    recover(): void {
        if (this.#session.recover()) this.#controls.release();
    }

    recoverAndResume(): void {
        this.recover();
        this.#pause(false);
    }

    usePower(power: ActivePower): void {
        this.#session.usePower(power);
    }

    async purchase(power: PowerId): Promise<void> {
        if (this.racing) return;
        const profile = await this.#progress.purchase(power);
        this.#showProfile(profile);
    }

    async purchaseCar(car: CarId): Promise<void> {
        if (this.racing) return;
        const profile = await this.#progress.purchaseCar(car);
        this.#showProfile(profile);
    }

    frame(seconds: number): void {
        if (this.#garage.setupOpen) return;
        const view = this.#session.frame(seconds, this.#controls.read());
        this.#hud.showTouchPads(this.acceptsDriving ? this.#controls.touchPads : undefined);
        if (!view) {
            const anchor = this.#session.garagePaintAnchor;
            if (anchor) this.#garage.placePaint(anchor.x, anchor.y);
            return;
        }
        if (view.teleportBlocked) this.#hud.showTeleportBlocked();
        this.#hud.setCameraWaterDepth(view.cameraWaterDepth);
        if (view.collectedCoins > 0) {
            this.#hud.addCoins(view.collectedCoins);
            void this.#award(view.collectedCoins);
        }
        for (const lap of view.completedLaps) {
            this.#hud.completeLap(lap.seconds);
            if (!this.#setup.noDamage && this.#storage.recordLap(this.#course.track.id, lap, this.#setup.direction)) {
                this.#hud.showRecord("Best lap", lap.seconds);
            }
        }
        const data = view.telemetry;
        if (!data) return;
        this.#hud.moveMarkers(view.position, view.rivals);
        this.#controls.showBrakeBeforeReverse(data.forwardSpeed > REVERSE_BRAKE_SPEED);
        if (this.#firstDrive && data.elapsed > 0) {
            this.#storage.markDriven(this.#setup.track.id);
            this.#firstDrive = false;
        }
        this.#hud.render(data, this.#session.paused);
        if (!data.finish || this.#lastFinish === data.finish) return;
        let best: number | undefined;
        if (data.result && this.#lastFinish === null && !this.#setup.noDamage) {
            const { elapsed } = data.result;
            const before = this.#storage.bestRace(this.#course.track.id, this.#setup.laps, this.#setup.direction);
            this.#storage.recordTime(this.#setup, elapsed);
            best = Math.min(before ?? Infinity, elapsed);
        }
        if (data.finish === "wrecked") this.#controls.release();
        this.#lastFinish = data.finish;
        this.#hud.showFinish(data, best);
    }

    #showGarage(): void {
        this.#session.showGarage(this.#setup, this.#course);
        this.#showSelection();
    }

    #courseFor(track: TrackSpec): Course {
        const course = this.#courses.get(track) ?? new Course(track);
        this.#courses.delete(track);
        this.#courses.set(track, course);
        if (this.#courses.size > 3) this.#courses.delete(this.#courses.keys().next().value!);
        return course;
    }

    #showSelection(): void {
        const records = this.#storage.trackRecords(this.#course.track.id, this.#setup.direction);
        this.#garage.show(this.#setup, this.#course, records);
    }

    async #award(coins: number): Promise<void> {
        this.#pendingCoins += coins;
        try {
            this.#showProfile(await this.#progress.award(coins));
        } finally {
            this.#pendingCoins -= coins;
        }
    }

    #showProfile(profile: PlayerProfile): void {
        this.#garage.showProfile(profile);
    }

    #pause(paused: boolean): void {
        if (!this.#session.setPaused(paused)) return;
        this.#controls.release();
        if (paused) this.#hud.showPause();
        else this.#hud.resume();
    }

}
