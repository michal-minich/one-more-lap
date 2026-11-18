import RAPIER from "@dimforge/rapier3d-compat";
import type { CarSpec } from "./cars.ts";
import { buildChassis } from "./chassis.ts";
import { playerCollisionGroups } from "./collision-groups.ts";
import { damageFromImpact } from "./damage.ts";
import { ReverseControl } from "./driver-input.ts";
import type { DriveInput } from "./driver-input.ts";
import type { RouteSample } from "../course/route.ts";
import { blendPose, bodyForward, yawRotation } from "./pose.ts";
import type { VehiclePose } from "./pose.ts";
import { parkedHeight, parkedSuspension, wheelPositions } from "./wheels.ts";
import { STEP } from "./world.ts";

export interface VehicleUpgrades {
    readonly tires: boolean;
    readonly bumpers: boolean;
    readonly splash: boolean;
}

const stock: VehicleUpgrades = { tires: false, bumpers: false, splash: false };

export class Vehicle {
    readonly world: RAPIER.World;
    readonly body: RAPIER.RigidBody;
    readonly controller: RAPIER.DynamicRayCastVehicleController;
    readonly #spec: CarSpec;
    readonly #upgrades: VehicleUpgrades;
    readonly #noDamage: boolean;
    readonly #events: RAPIER.EventQueue;
    readonly #reverse = new ReverseControl();
    #steering = 0;
    #throttle = 0;
    #lastImpact = -1;
    #elapsed = 0;
    #solidToRivals = true;
    #previous: VehiclePose;
    #current: VehiclePose;
    damage = 0;
    impact = 0;

    constructor(world: RAPIER.World, spec: CarSpec, spawn: RouteSample, upgrades = stock, noDamage = false) {
        this.world = world;
        this.#spec = spec;
        this.#upgrades = upgrades;
        this.#noDamage = noDamage;
        this.body = buildChassis(world, spec, spawn);
        const controller = world.createVehicleController(this.body);
        this.controller = controller;
        controller.indexUpAxis = 1;
        controller.setIndexForwardAxis = 2;
        wheelPositions(spec).forEach((position, wheel) => {
            controller.addWheel(position, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, spec.suspension.rest, spec.tire.radius);
            controller.setWheelSuspensionStiffness(wheel, spec.suspension.stiffness);
            controller.setWheelSuspensionCompression(wheel, 4.6);
            controller.setWheelSuspensionRelaxation(wheel, 4.8);
            controller.setWheelMaxSuspensionTravel(wheel, spec.suspension.travel);
            controller.setWheelMaxSuspensionForce(wheel, Math.max(16_000, spec.mass * 11.1));
        });
        this.#current = this.#readPose(true);
        this.#previous = this.#current;
        this.#events = new RAPIER.EventQueue(true);
    }

    reset(row: RouteSample, repair = false): void {
        this.#placeOnRoad(row, 0);
        if (repair) this.damage = 0;
    }

    teleport(row: RouteSample): void {
        this.#placeOnRoad(row, this.speed);
    }

    setRivalCollision(solid: boolean): void {
        if (solid === this.#solidToRivals) return;
        this.#solidToRivals = solid;
        for (let index = 0; index < this.body.numColliders(); index++) {
            this.body.collider(index).setCollisionGroups(playerCollisionGroups(solid));
        }
    }

    #placeOnRoad(row: RouteSample, speed: number): void {
        this.body.setTranslation({ x: row.x, y: row.y + parkedHeight(this.#spec), z: row.z }, true);
        this.body.setRotation(yawRotation(Math.atan2(row.dx, row.dz)), true);
        this.body.setLinvel({ x: row.dx * speed, y: 0, z: row.dz * speed }, true);
        this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        this.#steering = 0;
        this.#throttle = 0;
        this.#reverse.reset();
        this.#current = this.#readPose(true);
        this.#previous = this.#current;
    }

    get speed(): number {
        const velocity = this.body.linvel();
        return Math.hypot(velocity.x, velocity.z);
    }

    get forwardSpeed(): number {
        return this.#forwardSpeed(this.body.linvel());
    }

    #forwardSpeed(velocity: RAPIER.Vector): number {
        const forward = bodyForward(this.body.rotation());
        return velocity.x * forward.x + velocity.z * forward.z;
    }

    get waterClearance(): number {
        return parkedHeight(this.#spec) - 0.12;
    }

    freeze(): void {
        this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        this.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        this.#current = this.#readPose();
        this.#previous = this.#current;
    }

    jump(): boolean {
        let grounded = 0;
        for (let i = 0; i < 4; i++) if (this.controller.wheelIsInContact(i)) grounded++;
        if (grounded < 2) return false;
        this.body.applyImpulse({ x: 0, y: this.#spec.mass * 5.7, z: 0 }, true);
        return true;
    }

    boost(): void {
        if (this.speed <= this.#spec.topSpeed + 13) this.#forwardImpulse(STEP * 14.5, 0.2);
    }

    receiveCourseBoost(): boolean {
        const speed = this.forwardSpeed;
        if (speed < 8 || speed >= 30 || this.damage >= 100) return false;
        return this.#forwardImpulse(Math.min(4.4, 30 - speed), 0.65);
    }

    #forwardImpulse(speedGain: number, minHorizontal: number): boolean {
        const direction = bodyForward(this.body.rotation());
        const horizontal = Math.hypot(direction.x, direction.z);
        if (horizontal < minHorizontal) return false;
        const impulse = speedGain * this.#spec.mass / horizontal;
        this.body.applyImpulse({ x: direction.x * impulse, y: 0, z: direction.z * impulse }, true);
        return true;
    }

    pose(alpha: number): VehiclePose {
        return blendPose(this.#previous, this.#current, alpha);
    }

    #readPose(reset = false): VehiclePose {
        return {
            position: this.body.translation(),
            rotation: this.body.rotation(),
            wheels: [0, 1, 2, 3].map(i => ({
                suspension: reset ? parkedSuspension(this.#spec)
                    : this.controller.wheelSuspensionLength(i) ?? parkedSuspension(this.#spec),
                steer: reset ? 0 : this.controller.wheelSteering(i) ?? 0,
                rotation: reset ? 0 : this.controller.wheelRotation(i) ?? 0,
            })),
        };
    }

    get throttle(): number {
        return this.#throttle;
    }

    step(input: DriveInput, grip: number, offRoad: boolean, waterDepth = 0): void {
        this.#elapsed += STEP;
        this.impact = 0;
        const velocity = this.body.linvel();
        const speed = Math.hypot(velocity.x, velocity.z);
        const car = this.#spec;
        const forward = this.#forwardSpeed(velocity);
        const drive = this.#reverse.resolve(input, speed, forward);
        const sideways = car.steering.lock / (1 + speed * car.steering.speedFade) * input.steer;
        this.#steering += (sideways - this.#steering) * car.steering.response;
        this.#throttle += (drive.throttle - this.#throttle) * 0.12;
        const wading = Math.min(1, waterDepth / 1.65) * (this.#upgrades.splash ? 0.68 : 1);
        const looseGrip = car.tire.looseGrip + (this.#upgrades.tires ? (1 - car.tire.looseGrip) * 0.6 : 0);
        const traction = grip * (offRoad ? looseGrip : 1) * (1 - wading * 0.38);
        const roadLimit = drive.reverse ? 8 : offRoad ? Math.min(car.topSpeed, this.#upgrades.tires ? 34 : 29) : car.topSpeed;
        const effectiveLimit = Math.min(roadLimit, wading > 0 ? 23 - wading * 17 : roadLimit);
        const torque = Math.max(0, Math.min(1, (effectiveLimit - speed) / 9));
        const power = this.damage >= 100 ? 0 : 1 - this.damage * 0.0052;
        const engine = car.force * this.#throttle * torque * power * (drive.reverse ? -0.56 : 1);
        const brake = drive.brake * car.mass * car.brake * STEP / 4 * traction;
        const drift = car.drift * 0.82 * Math.min(1, Math.max(0, (forward - 8) / 12))
            * Math.min(1, Math.max(0, (Math.abs(input.steer) - 0.13) * 1.42))
            * Math.sqrt(drive.brake) * (1 - wading);
        const drag = car.mass * (0.14 + (offRoad ? 1.35 : 0) + speed * speed * 0.00041) * STEP / 4;
        for (let i = 0; i < 4; i++) {
            const front = i < 2;
            const driven = car.driven === "all" || (front ? car.driven === "front" : car.driven === "rear");
            this.controller.setWheelSteering(i, front ? this.#steering : 0);
            this.controller.setWheelFrictionSlip(i, car.grip * traction);
            const sideGrip = front ? 1 : 1 - drift * 0.82;
            this.controller.setWheelSideFrictionStiffness(i, car.steering.sideGrip * traction * sideGrip);
            this.controller.setWheelEngineForce(i, driven && drive.brake < 0.08 ? engine / (car.driven === "all" ? 4 : 2) : 0);
            this.controller.setWheelBrake(i, brake * (1 - drift * (front ? 0.35 : 0.63))
                + (this.#throttle < 0.08 ? drag : 0));
        }
        if (drift > 0 && this.controller.wheelIsInContact(0) && this.controller.wheelIsInContact(2)) {
            const yaw = this.body.angvel();
            const turn = Math.sign(this.#steering);
            const target = turn * drift * 1.85;
            const missing = Math.max(0, (target - yaw.y) * turn) * turn;
            this.body.setAngvel({ ...yaw, y: yaw.y + missing * 0.22 }, true);
        }
        if (wading > 0) {
            const resistance = car.mass * STEP * wading * (1.3 + speed * 0.16);
            this.body.applyImpulse({ x: -velocity.x * resistance, y: 0, z: -velocity.z * resistance }, true);
        }
        this.controller.updateVehicle(STEP, RAPIER.QueryFilterFlags.ONLY_FIXED);
        this.world.step(this.#events);
        let severity = 0;
        this.#events.drainContactForceEvents(event => {
            const force = event.totalForce();
            severity = Math.max(severity, Math.hypot(force.x, force.z) * STEP / car.mass);
        });
        if (severity > 2.8 && this.#elapsed - this.#lastImpact > 0.28) {
            this.#lastImpact = this.#elapsed;
            this.impact = damageFromImpact(severity) * car.stability.damage * (this.#upgrades.bumpers ? 0.76 : 1);
            if (!this.#noDamage) this.damage = Math.min(100, this.damage + this.impact);
        }
        this.#previous = this.#current;
        this.#current = this.#readPose();
    }

    dispose(): void {
        this.#events.free();
        this.world.removeVehicleController(this.controller);
        this.world.removeRigidBody(this.body);
    }
}
