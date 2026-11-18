import type { Point } from "../point.ts";

export interface Rotation {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}

export interface WheelPose {
    readonly suspension: number;
    readonly steer: number;
    readonly rotation: number;
}

export interface VehiclePose {
    readonly position: Point;
    readonly rotation: Rotation;
    readonly wheels: readonly WheelPose[];
}

export function yawRotation(yaw: number): Rotation {
    return { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) };
}

export function yawPitchRotation(yaw: number, pitch: number): Rotation {
    const sy = Math.sin(yaw / 2);
    const cy = Math.cos(yaw / 2);
    const sx = Math.sin(pitch / 2);
    const cx = Math.cos(pitch / 2);
    return { x: cy * sx, y: sy * cx, z: -sy * sx, w: cy * cx };
}

export function bodyForward(rotation: Rotation): Point {
    const { x, y, z, w } = rotation;
    return { x: 2 * (x * z + y * w), y: 2 * (y * z - x * w), z: 1 - 2 * (x * x + y * y) };
}

export function blendAngle(from: number, to: number, amount: number): number {
    const delta = to - from;
    return from + Math.atan2(Math.sin(delta), Math.cos(delta)) * amount;
}

function lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
}

function blendRotation(from: Rotation, to: Rotation, amount: number): Rotation {
    const sign = from.x * to.x + from.y * to.y + from.z * to.z + from.w * to.w < 0 ? -1 : 1;
    const x = lerp(from.x, to.x * sign, amount);
    const y = lerp(from.y, to.y * sign, amount);
    const z = lerp(from.z, to.z * sign, amount);
    const w = lerp(from.w, to.w * sign, amount);
    const length = Math.hypot(x, y, z, w);
    return { x: x / length, y: y / length, z: z / length, w: w / length };
}

export function blendPose(from: VehiclePose, to: VehiclePose, amount: number): VehiclePose {
    return {
        position: {
            x: lerp(from.position.x, to.position.x, amount),
            y: lerp(from.position.y, to.position.y, amount),
            z: lerp(from.position.z, to.position.z, amount),
        },
        rotation: blendRotation(from.rotation, to.rotation, amount),
        wheels: to.wheels.map((wheel, index) => {
            const old = from.wheels[index] ?? wheel;
            return {
                suspension: lerp(old.suspension, wheel.suspension, amount),
                steer: lerp(old.steer, wheel.steer, amount),
                rotation: blendAngle(old.rotation, wheel.rotation, amount),
            };
        }),
    };
}
