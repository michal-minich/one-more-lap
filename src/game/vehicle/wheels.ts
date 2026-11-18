import type { CarSpec } from "./cars.ts";
import type { Point } from "../point.ts";

const WHEEL_MOUNT_Y = -0.08;

export function parkedSuspension(car: CarSpec): number {
    return car.suspension.rest - 0.055;
}

export function parkedHeight(car: CarSpec): number {
    return car.tire.radius + parkedSuspension(car) - WHEEL_MOUNT_Y;
}

export function wheelPositions(spec: CarSpec): readonly Point[] {
    const x = spec.width * 0.43;
    const z = spec.wheelbase * 0.5;
    return [
        { x: -x, y: WHEEL_MOUNT_Y, z }, { x, y: WHEEL_MOUNT_Y, z },
        { x: -x, y: WHEEL_MOUNT_Y, z: -z }, { x, y: WHEEL_MOUNT_Y, z: -z },
    ];
}
