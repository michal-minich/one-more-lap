import { roadHalfWidth } from "../course/road-width.ts";
import { StuntCourse } from "./stunt.ts";
import type { ConditionChange, Conditions } from "./conditions.ts";
import { RaceWeather } from "./race-weather.ts";
import { LapClock } from "./lap-clock.ts";
import type { LapTiming } from "./lap-clock.ts";
import type { LapRecord } from "./records.ts";
import { crossesBoostStrip } from "../course/boost-strips.ts";
import type { Course } from "../course/course.ts";
import type { CircuitLine } from "../course/circuit-line.ts";
import { LapProgress } from "./lap-progress.ts";
import { gridOffset, Opponents } from "./opponents.ts";
import { reefSuspended } from "../course/reef-tunnel.ts";
import { pointOnRoute, ROAD_HALF } from "../course/route.ts";
import { waterContact } from "../course/water.ts";
import type { WaterContact } from "../course/water.ts";
import type { ActivePower, ActivePowerView, PowerId } from "../progression/powers.ts";
import { CoinField } from "./coin-field.ts";
import { RacePowers } from "./active-powers.ts";
import type { Setup } from "./setup.ts";
import { TrackPosition } from "./track-position.ts";
import type { BendWarning } from "./track-position.ts";
import { createWorld, STEP } from "../vehicle/world.ts";
import { Vehicle } from "../vehicle/vehicle.ts";
import type { DriveInput } from "../vehicle/driver-input.ts";
import type { VehiclePose } from "../vehicle/pose.ts";

const START_TICKS = 180;
const TELEPORT_METERS = 100;

export type Finish = "finished" | "wrecked";

interface RaceResult {
    readonly elapsed: number;
    readonly place: number;
}

export interface Telemetry {
    readonly speed: number;
    readonly forwardSpeed: number;
    readonly progress: number;
    readonly lapProgress: number;
    readonly lap: number;
    readonly totalLaps: number;
    readonly place: number;
    readonly drivers: number;
    readonly elapsed: number;
    readonly lapTiming: LapTiming;
    readonly startIn: number;
    readonly conditions: Conditions;
    readonly damage: number;
    readonly stripBoosting: boolean;
    readonly water: WaterContact | undefined;
    readonly powers: ActivePowerView;
    readonly finish: Finish | null;
    readonly result: RaceResult | undefined;
    readonly wrongWay: boolean;
    readonly missedGate: boolean;
    readonly bend?: BendWarning;
}

export interface RaceFrame {
    readonly impact: number;
    readonly recovered: boolean;
    readonly teleport: "used" | "blocked" | undefined;
    readonly completedLaps: readonly LapRecord[];
    readonly pickedCoins: readonly number[];
}

export interface RaceProfile {
    readonly fastestLap: LapRecord | undefined;
    readonly owned: readonly PowerId[];
}

export class RaceRun {
    readonly course: Course;
    readonly line: CircuitLine;
    readonly #setup: Setup;
    readonly vehicle: Vehicle;
    readonly opponents: Opponents;
    readonly coins: CoinField;
    readonly #laps: LapProgress;
    readonly #lapClock: LapClock;
    readonly #powers: RacePowers;
    readonly #track: TrackPosition;
    readonly #weather: RaceWeather;
    readonly #stunt: StuntCourse | undefined;
    readonly #world: ReturnType<typeof createWorld>;
    #raceTicks = 0;
    #driveTicks = 0;
    #stripUntil = 0;
    #countdown = START_TICKS;
    #freeDriveDistance = 0;
    #accumulator = 0;
    #result: RaceResult | undefined;
    #wrecked = false;
    paused = false;

    constructor(course: Course, setup: Setup, profile?: RaceProfile) {
        this.course = course;
        this.line = course.raceLine(setup.direction);
        this.#setup = setup;
        this.#weather = new RaceWeather(setup);
        this.#laps = new LapProgress(this.line, setup.laps);
        this.#lapClock = new LapClock(course.length, profile?.fastestLap);
        this.#powers = new RacePowers(course.length, profile?.owned ?? []);
        this.coins = new CoinField(course, this.#powers.has("magnet"));
        const start = this.line.at(this.line.startLine.distance + gridOffset(setup.opponents));
        this.#track = new TrackPosition(this.line, course.water, start);
        const world = createWorld(course);
        this.#world = world;
        let vehicle: Vehicle | undefined;
        try {
            this.#stunt = course.stuntLoops.length ? new StuntCourse(world, course, setup.direction) : undefined;
            vehicle = new Vehicle(world, setup.car, start, this.#powers.vehicleUpgrades, setup.noDamage);
            this.opponents = new Opponents(world, course, setup);
            this.vehicle = vehicle;
        } catch (error) {
            disposePhysics(world, vehicle);
            throw error;
        }
    }

    dispose(): void {
        disposePhysics(this.#world, this.vehicle);
    }

    get finished(): boolean {
        return this.#result !== undefined || this.#wrecked;
    }

    get canDrive(): boolean {
        return !this.#wrecked;
    }

    get #freeDriving(): boolean {
        return this.#result !== undefined;
    }

    get driving(): boolean {
        return !this.paused && this.canDrive && this.#countdown === 0;
    }

    usePower(power: ActivePower): void {
        if (this.driving) this.#powers.request(power);
    }

    get interpolation(): number {
        return Math.min(1, this.#accumulator / STEP);
    }

    pose(): VehiclePose {
        return this.vehicle.pose(this.interpolation);
    }

    #conditions(): Conditions {
        return this.#weather.read(this.driveTime);
    }

    get driveTime(): number {
        return this.#driveTicks * STEP;
    }

    changeConditions(change: ConditionChange): void {
        this.#weather.change(change, this.driveTime);
    }

    advance(dt: number, input: DriveInput): RaceFrame {
        let impact = 0;
        let recovered = false;
        const completedLaps: LapRecord[] = [];
        const pickedCoins: number[] = [];
        let teleport: RaceFrame["teleport"];
        if (this.paused) return { impact, recovered, teleport, completedLaps, pickedCoins };

        this.#accumulator += dt;
        while (this.#accumulator >= STEP) {
            this.#accumulator -= STEP;
            if (this.#wrecked) {
                this.#stepOpponents(this.#grip());
                this.#stunt?.moveGates(this.driveTime);
                this.#world.step();
                this.#driveTicks++;
                continue;
            }
            if (this.#countdown > 0) {
                this.#countdown--;
                continue;
            }
            const jump = this.#teleport();
            if (jump !== undefined) teleport = jump === "blocked" ? "blocked" : "used";
            const snapped = this.#step(input, completedLaps, pickedCoins, jump === "lap");
            recovered = recovered || snapped || jump === "lap" || jump === "sector";
            impact = Math.max(impact, this.vehicle.impact);
        }
        return { impact, recovered, teleport, completedLaps, pickedCoins };
    }

    #step(input: DriveInput, completedLaps: LapRecord[], pickedCoins: number[], teleportedAcrossLap: boolean): boolean {
        const grip = this.#grip();
        const { distance, lateral } = this.#track.location;
        const before = this.vehicle.body.translation();
        const wading = waterContact(this.course.water, before, this.vehicle.waterClearance);
        this.#stepOpponents(grip);
        const open = !this.#powers.phasing || this.opponents.clearAt(
            distance - this.line.startLine.distance, lateral,
        );
        this.#powers.step(this.#freeDriving ? this.#freeDriveDistance : this.#laps.distance(distance), this.vehicle, open);
        const forwardDistance = this.#setup.direction === "forward" ? distance : this.course.length - distance;
        const offRoad = Math.abs(lateral) > roadHalfWidth(this.course.track.id, forwardDistance) && !this.course.branch?.supports(before) &&
            !this.#stunt?.surfaceAt(before);
        this.#stunt?.moveGates(this.driveTime + STEP);
        this.#stunt?.guideLoop(this.vehicle, input.steer);
        this.vehicle.step(input, this.#powers.grip(grip), offRoad, wading?.depth ?? 0);
        this.#driveTicks++;
        if (!this.#result) this.#raceTicks++;

        const after = this.vehicle.body.translation();
        if (this.#stunt?.observe(before, after, this.vehicle.forwardSpeed)) return this.recover();
        if (this.course.calderaRunoff?.reaches(after, this.vehicle.waterClearance)) return this.recover();
        if (this.#driveTicks >= this.#stripUntil &&
            this.course.boostStrips.some(strip => crossesBoostStrip(strip, before, after)) && this.vehicle.receiveCourseBoost()) {
            this.#stripUntil = this.#driveTicks + 46;
        }
        this.coins.collect(before, after, pickedCoins);
        const current = this.#track.observe(after, this.vehicle.body.linvel(), this.vehicle.waterClearance);
        if (this.course.reefTunnel && Math.abs(current.lateral) < 11 && after.y < current.elevation - 2) {
            const distance = this.#setup.direction === "forward" ? current.distance : this.course.length - current.distance;
            if (distance >= reefSuspended.from && distance <= reefSuspended.to) return this.recover();
        }
        if (this.#freeDriving) {
            this.#freeDriveDistance += Math.hypot(after.x - before.x, after.z - before.z);
            this.#track.markSafe(after.y);
            if (this.vehicle.damage >= 100) this.#wreck();
            return after.y < this.course.ground.floor - 30 && this.recover();
        }
        const timingBefore = this.#stunt?.timingPoint(this.line, before) ?? before;
        const timingAfter = this.#stunt?.timingPoint(this.line, after) ?? after;
        const crossing = teleportedAcrossLap ? 0 : this.#laps.observe(timingBefore, timingAfter);
        const lap = this.#lapClock.observe(
            this.#laps.distance(current.distance),
            this.#raceTicks * STEP,
            crossing === undefined ? undefined : (this.#raceTicks - 1 + crossing) * STEP,
            this.#laps.finished,
        );
        if (lap) {
            completedLaps.push(lap);
            if (this.#powers.has("pit") && this.vehicle.damage < 100) {
                this.vehicle.damage = Math.max(0, this.vehicle.damage - 13);
            }
        }
        if (this.#laps.acceptsRecoveryAt(current.distance)) this.#track.markSafe(after.y);
        if (this.vehicle.damage >= 100) {
            this.#wreck();
        }
        else if (this.#laps.finished) {
            const finishDistance = this.course.length * this.#setup.laps;
            this.#result = {
                elapsed: (this.#raceTicks - 1 + (crossing ?? 1)) * STEP,
                place: this.opponents.aheadOf(finishDistance) + 1,
            };
            this.#freeDriveDistance = finishDistance;
        }
        else if (after.y < this.course.ground.floor - 30 || this.#track.submergedTooLong()) return this.recover();
        return false;
    }

    #wreck(): void {
        this.vehicle.freeze();
        this.#powers.stop(this.vehicle);
        this.#wrecked = true;
    }

    #teleport(): "lap" | "sector" | "blocked" | undefined {
        if (!this.#powers.takeTeleportRequest()) return undefined;
        const { distance, lateral, elevation } = this.#track.location;
        const height = this.vehicle.body.translation().y - elevation;
        if (Math.abs(lateral) > ROAD_HALF + 8 || Math.abs(height) > 4) return "blocked";
        let span = this.#freeDriving ? TELEPORT_METERS : this.#laps.teleportSpan(distance, TELEPORT_METERS);
        if (span <= 0) return "blocked";
        while (span >= 60 && this.line.isGap(distance + span, 3)) span -= 12;
        const row = this.line.at(distance + span);
        if (this.line.isGap(row.distance, 3)) return "blocked";
        const lane = this.opponents.arrivalLane(row.distance - this.line.startLine.distance, lateral);
        const at = pointOnRoute(row, lane);
        this.vehicle.teleport({ ...row, ...at });
        this.#track.reset(at);
        const crossed = !this.#freeDriving && this.#laps.observeTeleport(distance, span);
        const chargeDistance = this.#freeDriving ? this.#freeDriveDistance : this.#laps.distance(this.#track.location.distance);
        this.#powers.teleported(chargeDistance, this.vehicle);
        return crossed ? "lap" : "sector";
    }

    #grip(): number {
        return this.#conditions().grip * (this.course.track.id === "arctic" ? 0.84 : 1);
    }

    #stepOpponents(grip: number): void {
        if (this.opponents.specs.length === 0) return;
        const { distance, lateral, elevation, index } = this.#track.location;
        const row = this.line.route[index]!;
        const velocity = this.vehicle.body.linvel();
        const offDeck = Math.abs(this.vehicle.body.translation().y - elevation) > 3;
        this.opponents.step(grip, this.#powers.phasing || offDeck ? undefined : {
            distance: this.#result ? distance - this.line.startLine.distance : this.#laps.distance(distance),
            lane: lateral,
            speed: Math.max(0, velocity.x * row.dx + velocity.z * row.dz),
            driving: this.driving && !this.#result,
        });
    }

    recover(): boolean {
        if (!this.canDrive) return false;
        const retry = this.#stunt?.retry();
        const row = retry ?? this.line.at(this.#track.safeDistance);
        const lane = this.opponents.arrivalLane(row.distance - this.line.startLine.distance, 0);
        const arrival = retry ?? pointOnRoute(row, lane);
        this.vehicle.reset({ ...row, ...arrival }, this.#freeDriving);
        this.#track.reset(arrival);
        this.#powers.recovered(this.vehicle);
        this.#stripUntil = 0;
        return true;
    }

    snapshot(): Telemetry {
        const at = this.#track.location.distance;
        const distance = this.#laps.distance(at);
        const lap = this.#laps.lap;
        const bend = !this.#freeDriving && this.driving ? this.#track.nextBend() : undefined;
        return {
            speed: this.vehicle.speed,
            forwardSpeed: this.vehicle.forwardSpeed,
            progress: Math.max(0, distance) / (this.course.length * this.#setup.laps),
            lapProgress: this.#laps.finished ? 1 : Math.max(0, Math.min(1, distance / this.course.length - (lap - 1))),
            lap,
            totalLaps: this.#setup.laps,
            place: this.#result?.place ?? this.opponents.aheadOf(distance) + 1,
            drivers: this.opponents.specs.length + 1,
            elapsed: this.#result?.elapsed ?? this.#raceTicks * STEP,
            lapTiming: this.#lapClock.read(this.#raceTicks * STEP),
            startIn: Math.ceil(this.#countdown * STEP),
            conditions: this.#conditions(),
            damage: this.vehicle.damage,
            stripBoosting: this.driving && this.#driveTicks < this.#stripUntil,
            water: this.#track.water,
            powers: this.#powers.view(),
            finish: this.#wrecked ? "wrecked" : this.#result ? "finished" : null,
            result: this.#result,
            wrongWay: !this.#freeDriving && this.#track.wrongWay && this.driving,
            missedGate: !this.#freeDriving && this.driving && this.#laps.missedGate(at),
            ...(bend && { bend }),
        };
    }
}

function disposePhysics(world: ReturnType<typeof createWorld>, vehicle?: Vehicle): void {
    try {
        vehicle?.dispose();
    } finally {
        world.free();
    }
}
