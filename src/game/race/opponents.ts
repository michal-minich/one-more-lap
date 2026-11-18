import RAPIER from "@dimforge/rapier3d-compat";
import { cars } from "../vehicle/cars.ts";
import type { CarSpec } from "../vehicle/cars.ts";
import { coachworkColliders } from "../vehicle/coachwork-colliders.ts";
import { rivalCollisionGroups } from "../vehicle/collision-groups.ts";
import type { Course } from "../course/course.ts";
import type { CircuitLine } from "../course/circuit-line.ts";
import type { Point } from "../point.ts";
import { pointOnRoute, wrapDistance } from "../course/route.ts";
import type { RouteSample } from "../course/route.ts";
import { RivalPace, rivalStyles } from "./rival-pace.ts";
import type { RivalStyle } from "./rival-pace.ts";
import type { Setup } from "./setup.ts";
import { STEP } from "../vehicle/world.ts";
import { parkedHeight, parkedSuspension } from "../vehicle/wheels.ts";
import { blendPose } from "../vehicle/pose.ts";
import type { VehiclePose } from "../vehicle/pose.ts";

const paints = ["#30b6c8", "#e8518f", "#ffae36", "#74b84d", "#8a65d5", "#a8dcd9", "#ea6444",
    "#edce78", "#508bd0", "#c4a4ef", "#ed9866", "#afcc76"] as const;
const lanes = [-3.05, 0, 3.05] as const;
const gridLanes = [lanes[0], lanes[2], lanes[1]] as const;
const LANE_CHANGE_SPEED = 2.25;
const PASSING_WIDTH = 2.48;

export function gridOffset(index: number): number {
    return -10 - index * 5;
}
const rivalCars = cars.filter(car => car.unlockCoins === undefined);

export interface RivalSpec {
    readonly car: CarSpec;
    readonly paint: string;
}

export interface RivalPosition {
    readonly position: Point;
    readonly paint: string;
}

interface RoadOccupant {
    readonly distance: number;
    readonly lane: number;
    readonly speed: number;
}

interface PlayerPresence extends RoadOccupant {
    readonly driving: boolean;
}

interface Rival {
    readonly body: RAPIER.RigidBody;
    readonly car: CarSpec;
    readonly style: RivalStyle;
    distance: number;
    lane: number;
    targetLane: number;
    speed: number;
    wheelAngle: number;
    before: VehiclePose;
    after: VehiclePose;
}

export class Opponents {
    readonly specs: readonly RivalSpec[];
    readonly #line: CircuitLine;
    readonly #drivers: readonly Rival[];
    readonly #pace: RivalPace;

    constructor(world: RAPIER.World, course: Course, setup: Setup) {
        this.#line = course.raceLine(setup.direction);
        this.#pace = new RivalPace(setup.difficulty);
        const playerCar = rivalCars.indexOf(setup.car);
        this.specs = paints.slice(0, setup.opponents).map((paint, index) => ({
            paint, car: rivalCars[(playerCar + index + 1) % rivalCars.length]!,
        }));
        this.#drivers = this.specs.map(({ car }, index) => this.#createDriver(world, car, index));
    }

    step(grip: number, player?: PlayerPresence): void {
        if (this.#drivers.length === 0) return;
        this.#pace.observe(player?.driving ? player.speed : undefined);
        const pack: RoadOccupant[] = this.#drivers.map(({ distance, lane, speed }) => ({ distance, lane, speed }));
        if (player) pack.push(player);
        for (const [index, driver] of this.#drivers.entries()) {
            this.#advanceDriver(driver, index, pack, grip, player?.driving ? player.distance - driver.distance : 0);
        }
    }

    pose(index: number, alpha: number): VehiclePose {
        const driver = this.#drivers[index]!;
        return blendPose(driver.before, driver.after, alpha);
    }

    aheadOf(player: number): number {
        return this.#drivers.filter(driver => driver.distance > player + 0.12).length;
    }

    clearAt(distance: number, lane: number): boolean {
        return this.#drivers.every(rival => this.#gap(distance, lane, rival) > 5.8);
    }

    arrivalLane(distance: number, preferred: number): number {
        const candidates = [...lanes].sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred));
        let lane = candidates[0]!;
        let gap = 0;
        for (const candidate of candidates) {
            const nearest = Math.min(...this.#drivers.map(rival => this.#gap(distance, candidate, rival)));
            if (nearest > 5.8) return candidate;
            if (nearest > gap) {
                gap = nearest;
                lane = candidate;
            }
        }
        return lane;
    }

    #gap(distance: number, lane: number, rival: Rival): number {
        if (Math.abs(rival.lane - lane) > 2.3) return Infinity;
        const length = this.#line.length;
        const forward = wrapDistance(rival.distance - distance, length);
        return Math.min(forward, length - forward);
    }

    #createDriver(world: RAPIER.World, car: CarSpec, index: number): Rival {
        const distance = gridOffset(index);
        const lane = gridLanes[index % gridLanes.length]!;
        const pose = this.#pose(car, distance, lane, 0);
        const { x, y, z } = pose.position;
        const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(x, y, z).setRotation(pose.rotation));
        for (const collider of coachworkColliders(car)) {
            world.createCollider(collider.setRestitution(0.08).setFriction(0.18).setCollisionGroups(rivalCollisionGroups), body);
        }
        return { body, car, distance, lane, targetLane: lane, speed: 0, style: rivalStyles[index]!,
            wheelAngle: 0, before: pose, after: pose };
    }

    #advanceDriver(driver: Rival, index: number, pack: readonly RoadOccupant[], grip: number, playerLead: number): void {
        const target = this.#lane(driver, index, pack);
        driver.targetLane = target.lane;
        const limit = this.#speedLimit(driver, grip, playerLead);
        const brake = 8 * grip;
        const headway = driver.style.headway + driver.speed * 0.44;
        const following = Math.min(limit, Math.max(0, target.leadSpeed + (target.clearance - headway) * 1.14));
        const safeSpeed = this.#approachSpeed(driver, index, pack, brake);
        const change = Math.max(-brake * STEP, Math.min(
            this.#pace.acceleration(driver.style) * STEP, Math.min(following, safeSpeed) - driver.speed,
        ));
        driver.speed = Math.max(0, driver.speed + change);
        driver.distance += driver.speed * STEP;
        const laneStep = LANE_CHANGE_SPEED * STEP;
        driver.lane += Math.max(-laneStep, Math.min(laneStep, (driver.targetLane - driver.lane) * 1.3));
        driver.wheelAngle += driver.speed * STEP / driver.car.tire.radius;
        driver.before = driver.after;
        driver.after = this.#pose(driver.car, driver.distance, driver.lane, driver.wheelAngle);
        driver.body.setNextKinematicTranslation(driver.after.position);
        driver.body.setNextKinematicRotation(driver.after.rotation);
    }

    #approachSpeed(driver: Rival, index: number, pack: readonly RoadOccupant[], brake: number): number {
        let limit = Infinity;
        for (const [otherIndex, other] of pack.entries()) {
            if (otherIndex === index || Math.abs(other.lane - driver.lane) >= PASSING_WIDTH) continue;
            const gap = wrapDistance(other.distance - driver.distance, this.#line.length);
            if (gap >= 120) continue;
            const space = Math.max(0, gap - 5.4);
            const closing = driver.speed - other.speed;
            const speed = Math.sqrt(other.speed ** 2 + 2 * brake * space);
            limit = Math.min(limit, speed - 0.35 * Math.max(0, closing));
        }
        return Math.max(0, limit);
    }

    #lane(driver: Rival, index: number, pack: readonly RoadOccupant[]): LaneClearance {
        const options = lanes.map(lane => {
            let clearance = 60;
            let leadSpeed = 0;
            let spaceBehind = 60;
            for (const [otherIndex, other] of pack.entries()) {
                if (otherIndex === index || Math.abs(other.lane - lane) > PASSING_WIDTH) continue;
                const gap = wrapDistance(other.distance - driver.distance, this.#line.length);
                if (gap < clearance) {
                    clearance = gap;
                    leadSpeed = other.speed;
                }
                spaceBehind = Math.min(spaceBehind, this.#line.length - gap);
            }
            return { lane, clearance, leadSpeed, spaceBehind };
        });
        return options.reduce((best, option) => scoreLane(option, driver) > scoreLane(best, driver) ? option : best);
    }

    #speedLimit(driver: Rival, grip: number, playerLead: number): number {
        const here = this.#row(driver.distance);
        const soon = this.#row(driver.distance + 24);
        const after = this.#row(driver.distance + 48);
        const angle = Math.max(turnBetween(here, soon), turnBetween(soon, after));
        return this.#pace.speedLimit(driver.style, grip, angle, playerLead);
    }

    #row(distance: number): RouteSample {
        return this.#line.at(this.#line.startLine.distance + distance);
    }

    #pose(car: CarSpec, distance: number, lane: number, wheelAngle: number): VehiclePose {
        const row = this.#row(distance);
        const ahead = this.#row(distance + 3.5);
        const behind = this.#row(distance - 3.5);
        const yaw = Math.atan2(row.dx, row.dz);
        const pitch = Math.atan2(ahead.y - behind.y, 7);
        const sinYaw = Math.sin(yaw / 2);
        const cosYaw = Math.cos(yaw / 2);
        const sinPitch = Math.sin(-pitch / 2);
        const cosPitch = Math.cos(pitch / 2);
        const wheel = { suspension: parkedSuspension(car), steer: 0, rotation: wheelAngle };
        const gap = this.#line.gap;
        const jump = gap && row.distance > gap.from && row.distance < gap.to
            ? Math.sin(Math.PI * (row.distance - gap.from) / (gap.to - gap.from)) * 0.85 : 0;
        return {
            position: pointOnRoute(row, lane, parkedHeight(car) + jump),
            rotation: { x: cosYaw * sinPitch, y: sinYaw * cosPitch, z: -sinYaw * sinPitch, w: cosYaw * cosPitch },
            wheels: [wheel, wheel, wheel, wheel],
        };
    }
}

interface LaneClearance {
    readonly lane: number;
    readonly clearance: number;
    readonly leadSpeed: number;
    readonly spaceBehind: number;
}

function scoreLane(option: LaneClearance, driver: Rival): number {
    const changing = Math.abs(option.lane - driver.targetLane) * 2.2;
    const merging = Math.abs(option.lane - driver.lane) > 0.8;
    const closeBehind = merging ? Math.max(0, 9 - option.spaceBehind) * 5 : 0;
    return Math.min(option.clearance, 27) - changing - closeBehind;
}

function turnBetween(from: RouteSample, to: RouteSample): number {
    return Math.abs(Math.atan2(from.dz * to.dx - from.dx * to.dz, from.dx * to.dx + from.dz * to.dz));
}
