import type { Point } from "../../game/point.ts";
import { blendAngle, bodyForward } from "../../game/vehicle/pose.ts";
import type { VehiclePose } from "../../game/vehicle/pose.ts";

interface ViewPose {
    readonly eye: Point;
    readonly aim: Point;
}

export class ChaseRig {
    #height = 0;
    #yaw = 0;
    #pitch = 0;
    #initialized = false;

    follow(pose: VehiclePose, seconds: number, snap: boolean): ViewPose {
        const direction = bodyForward(pose.rotation);
        const horizontal = Math.hypot(direction.x, direction.z);
        const yaw = horizontal > 0.08 ? Math.atan2(direction.x, direction.z) : this.#yaw;
        const pitch = Math.max(-0.24, Math.min(0.24, Math.atan2(direction.y, horizontal)));
        const { x, y, z } = pose.position;
        if (snap || !this.#initialized) {
            this.#height = y;
            this.#yaw = yaw;
            this.#pitch = pitch;
            this.#initialized = true;
        } else {
            this.#height += (y - this.#height) * (1 - Math.exp(-seconds * 8));
            this.#yaw = blendAngle(this.#yaw, yaw, 1 - Math.exp(-seconds * 5.5));
            this.#pitch += (pitch - this.#pitch) * (1 - Math.exp(-seconds * 6));
        }
        const dx = Math.sin(this.#yaw);
        const dz = Math.cos(this.#yaw);
        return {
            eye: { x: x - dx * 7.6, y: this.#height + 2.85 - this.#pitch * 1.7, z: z - dz * 7.6 },
            aim: { x: x + dx * 10.5, y: this.#height + 0.38 + this.#pitch * 4.5, z: z + dz * 10.5 },
        };
    }
}
