import RAPIER from "@dimforge/rapier3d-compat";
import type { Course } from "../course/course.ts";
import type { CircuitLine, RaceDirection } from "../course/circuit-line.ts";
import { bladeCenters, gateSites, stuntBladeHeight, stuntGateThickness, stuntGateWidth } from "../course/stunt/gate.ts";
import { stuntLoopHalf, stuntLoopZ } from "../course/stunt/loop.ts";
import type { StuntLoop } from "../course/stunt/loop.ts";
import type { RouteSample } from "../course/route.ts";
import { surfaceCollider } from "../vehicle/surface-collider.ts";
import type { Vehicle } from "../vehicle/vehicle.ts";
import { STEP } from "../vehicle/world.ts";
import { yawRotation } from "../vehicle/pose.ts";
import type { Point } from "../point.ts";

export class StuntCourse {
    readonly #gates: readonly { readonly at: Point; readonly blades: readonly RAPIER.RigidBody[] }[];
    readonly #loops: readonly StuntLoop[];
    readonly #direction: RaceDirection;
    #enteringSlow = false;
    #attempt: StuntLoop | undefined;
    #inverted = false;
    #leaving = false;
    #ticks = 0;
    #loopRow = 0;

    constructor(world: RAPIER.World, course: Course, direction: RaceDirection) {
        this.#direction = direction;
        this.#loops = course.stuntLoops;
        for (const loop of this.#loops) {
            world.createCollider(surfaceCollider([loop.road]).setFriction(0.5));
        }
        this.#gates = gateSites(course).map(at => {
            const rotation = yawRotation(Math.atan2(at.dx, at.dz));
            const blades = bladeCenters(at.y, 0).map(y => {
                const blade = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(at.x, y, at.z).setRotation(rotation));
                const collider = RAPIER.ColliderDesc.cuboid(stuntGateWidth / 2, stuntBladeHeight / 2, stuntGateThickness / 2);
                world.createCollider(collider.setFriction(0.2).setRestitution(0.08), blade);
                return blade;
            });
            return { at, blades };
        });
    }

    moveGates(time: number): void {
        for (const { at, blades } of this.#gates) {
            for (const [index, y] of bladeCenters(at.y, time).entries()) {
                blades[index]!.setNextKinematicTranslation({ x: at.x, y, z: at.z });
            }
        }
    }

    guideLoop(vehicle: Vehicle, steer: number): void {
        const loop = this.#attempt;
        if (!loop || this.#leaving || this.#enteringSlow || Math.abs(steer) > 0.35) return;
        const position = vehicle.body.translation();
        const velocity = vehicle.body.linvel();
        const rows = loop.inversion;
        // Keep the search on the current pass so the offset return does not pull the car across the gap.
        const start = Math.max(0, this.#loopRow - 3);
        const end = Math.min(rows.length - 1, this.#loopRow + 16);
        let nearest = Infinity;
        for (let index = start; index <= end; index++) {
            const row = rows[index]!;
            const offset = (row.y - position.y) ** 2 + (row.z - position.z) ** 2;
            if (offset >= nearest) continue;
            this.#loopRow = index;
            nearest = offset;
        }
        if (nearest > 16) return;
        const here = rows[this.#loopRow]!;
        const ahead = rows[Math.min(rows.length - 1, this.#loopRow + 8)]!;
        const travel = Math.max(0.3, ahead.distance - here.distance);
        const pace = Math.hypot(velocity.y, velocity.z);
        const target = (ahead.x - here.x) / travel * pace + (here.x - position.x) * 8;
        const push = Math.min(60, Math.max(-60, (target - velocity.x) * 18));
        vehicle.body.applyImpulse({ x: push * vehicle.body.mass() * STEP, y: 0, z: 0 }, true);
    }

    surfaceAt(point: Point): boolean {
        return this.#loops.some(loop => loop.rows.some(row =>
            Math.abs(point.x - row.x) < stuntLoopHalf + 0.6 &&
            Math.abs(point.z - row.z) < 0.86 && Math.abs(point.y - row.y) < 3.2));
    }

    timingPoint(line: CircuitLine, point: Point): Point {
        if (Math.abs(point.x) < 7 || !this.surfaceAt(point)) return point;
        return line.at(line.locate(point).distance);
    }

    observe(before: Point, after: Point, entrySpeed: number): boolean {
        if (!this.#attempt) {
            const entered = this.#loops.find(loop => loop.direction === this.#direction && enters(loop, before, after));
            if (!entered) return false;
            this.#attempt = entered;
            this.#enteringSlow = entrySpeed < 15.3;
            this.#inverted = false;
            this.#leaving = false;
        }
        this.#ticks++;
        const loop = this.#attempt;
        const sign = loop.direction === "forward" ? 1 : -1;
        const longitudinal = (after.z - stuntLoopZ) * sign;
        this.#inverted ||= after.y > loop.exit.y + 11;
        this.#leaving ||= this.#inverted && longitudinal > 14 && after.y > loop.exit.y - 1.6 && after.y < loop.exit.y + 3.2;
        if (longitudinal > 55 && this.#leaving) {
            this.reset();
            return false;
        }
        if (this.#leaving) return after.y < loop.exit.y - 4 && Math.abs(after.x - loop.exit.x) < 7;
        if (this.#enteringSlow && (this.#ticks > 135 || longitudinal < -4)) return true;
        const outside = !loop.rows.some(row => Math.abs(after.x - row.x) < stuntLoopHalf + 1.8 &&
            Math.hypot(after.y - row.y, after.z - row.z) < 5.4);
        return outside ||
            after.y < loop.mouth.y - 0.55 ||
            this.#ticks > 490 ||
            (this.#inverted && longitudinal > 19 && after.y < loop.exit.y - 1.7);
    }

    retry(): RouteSample | undefined {
        const loop = this.#attempt;
        this.reset();
        if (!loop) return undefined;
        const row = loop.rows.find(row => Math.abs(row.z - loop.mouth.z) < 76 && row.distance < 145) ?? loop.approach;
        const sign = loop.direction === "forward" ? 1 : -1;
        return { ...row, dx: 0, dz: sign, distance: loop.approach.distance };
    }

    reset(): void {
        this.#attempt = undefined;
        this.#inverted = false;
        this.#leaving = false;
        this.#ticks = 0;
        this.#loopRow = 0;
        this.#enteringSlow = false;
    }
}

function enters(loop: StuntLoop, before: Point, after: Point): boolean {
    const sign = loop.direction === "forward" ? 1 : -1;
    const start = (before.z - stuntLoopZ) * sign;
    const end = (after.z - stuntLoopZ) * sign;
    return start < -0.55 && end >= -0.55 &&
        Math.abs(after.x - loop.mouth.x) < stuntLoopHalf && Math.abs(after.y - loop.mouth.y) < 2.4;
}
