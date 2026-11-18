import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";
import { SpotLight } from "@babylonjs/core/Lights/spotLight.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { stuntLoopZ } from "../../game/course/stunt/loop.ts";
import type { GroundHeight } from "../../game/course/ground-height.ts";
import type { RouteSample } from "../../game/course/route.ts";
import type { Point } from "../../game/point.ts";
import { bodyForward } from "../../game/vehicle/pose.ts";
import type { VehiclePose } from "../../game/vehicle/pose.ts";
import { ChaseRig } from "./chase-rig.ts";

const garageFraming = {
    standard: [0.58, -6.9, 4.2, 1.18],
    panorama: [0.79, -6.9, 4.2, 1.71],
    caldera: [0.83, -7.5, 1.55, 1.95],
} as const;

export interface CameraKick {
    readonly pitch: number;
    readonly yaw: number;
    readonly roll: number;
}

interface ChaseFraming {
    readonly lift: number;
    readonly fov: number;
}

export class RaceCamera {
    readonly #car: TransformNode;
    readonly view: FreeCamera;
    readonly #headlight: SpotLight;
    readonly #ground: GroundHeight;
    readonly #chase = new ChaseRig();
    readonly #framing: ChaseFraming;
    #garageFov = 0.58;
    #firstPerson = false;
    #snap = true;

    constructor(scene: Scene, car: TransformNode, ground: GroundHeight, framing: ChaseFraming = { lift: 0, fov: 0.96 }) {
        this.#car = car;
        this.#ground = ground;
        this.#framing = framing;
        this.view = new FreeCamera("view", new Vector3(), scene);
        this.view.minZ = 0.24;
        this.view.maxZ = 1_950;
        scene.activeCamera = this.view;
        this.#headlight = new SpotLight("driving lights", new Vector3(), new Vector3(0, -0.08, 1), 1.18, 16, scene);
        this.#headlight.diffuse.set(0.95, 0.91, 0.72);
        this.#headlight.range = 100;
        this.#headlight.intensity = 0;
    }

    park(row: RouteSample, side: number, framing: keyof typeof garageFraming): void {
        const [fov, along, offset, aim] = garageFraming[framing];
        this.#garageFov = fov;
        this.view.position.set(
            row.x + row.dz * side * offset + row.dx * along,
            row.y + 1.56,
            row.z - row.dx * side * offset + row.dz * along,
        );
        this.view.setTarget(new Vector3(row.x + 0.10, row.y + aim, row.z));
    }

    parkLandmark(row: RouteSample, landmark: Point, offset: number): void {
        const bearing = Math.atan2(landmark.x - row.x, landmark.z - row.z);
        const eyeAngle = bearing + offset * 0.24;
        this.#garageFov = 0.74;
        const x = row.x - Math.sin(eyeAngle) * 7.65;
        const z = row.z - Math.cos(eyeAngle) * 7.65;
        const floor = this.#ground.at(x, z, row.y + 4.2) ?? row.y;
        this.view.position.set(x, Math.max(row.y + 1.77, floor + 0.92), z);
        this.view.setTarget(new Vector3(row.x + Math.sin(bearing) * 1.9, row.y + 2.08,
            row.z + Math.cos(bearing) * 1.9));
    }

    fitGarage(): void {
        const aspect = this.view.getEngine().getAspectRatio(this.view);
        const vertical = 2 * Math.atan(Math.tan(0.38) / Math.max(0.55, aspect));
        this.view.fov = Math.max(this.#garageFov, vertical);
    }

    get firstPerson(): boolean {
        return this.#firstPerson;
    }

    useFirstPerson(firstPerson: boolean): void {
        this.#firstPerson = firstPerson;
        this.#car.setEnabled(!firstPerson);
        this.view.fov = firstPerson ? 0.87 : this.#framing.fov;
        this.#snap = true;
    }

    set light(value: number) {
        this.#headlight.intensity = value;
    }

    follow(pose: VehiclePose, seconds: number, snap: boolean, kick?: CameraKick, stunt = false): void {
        const { x, y, z } = pose.position;
        const direction = bodyForward(pose.rotation);
        const length = Math.hypot(direction.x, direction.z) || 1;
        const dx = direction.x / length;
        const dz = direction.z / length;
        const showLoop = stunt && Math.abs(z - stuntLoopZ) < 16 && Math.abs(x) > 14 && y > 12;
        if (showLoop && !this.#firstPerson) {
            const side = Math.sign(x);
            this.view.position.set(x - side * 15, y + 3.4, stuntLoopZ - side * 6.8);
            this.view.setTarget(new Vector3(x, y + 0.2, z));
            this.#snap = true;
        } else if (this.#firstPerson) {
            const eye = this.view.position;
            eye.set(x + dx * 0.72, y + 1.06, z + dz * 0.72);
            this.view.setTarget(new Vector3(eye.x + direction.x * 22, eye.y + direction.y * 22, eye.z + direction.z * 22));
        } else {
            const { eye, aim } = this.#chase.follow(pose, seconds, snap || this.#snap);
            const floor = this.#ground.at(eye.x, eye.z, y + 4.2) ?? this.#ground.at(eye.x, eye.z);
            const lift = floor === undefined ? 0 : Math.max(0, floor + 0.48 - eye.y);
            this.view.position.set(eye.x, eye.y + lift + this.#framing.lift, eye.z);
            this.view.setTarget(new Vector3(aim.x, aim.y + lift + this.#framing.lift * 0.55, aim.z));
        }
        if (kick) {
            this.view.rotation.x += kick.pitch;
            this.view.rotation.y += kick.yaw;
        }
        this.view.rotation.z = kick?.roll ?? 0;
        this.#snap = showLoop && !this.#firstPerson;
        this.#headlight.position.set(x + dx * 1.84, y + 0.02, z + dz * 1.84);
        this.#headlight.direction.set(dx, -0.07, dz);
    }
}
