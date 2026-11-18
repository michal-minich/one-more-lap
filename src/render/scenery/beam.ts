import type { Point } from "../../game/point.ts";
import type { Stamp } from "./instances.ts";

export function beamBetween(a: Point, b: Point, width: number, height: number, overlap = 0): Stamp {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const flat = Math.hypot(dx, dz);
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        z: (a.z + b.z) / 2,
        sx: width, sy: height, sz: Math.hypot(flat, dy) + overlap,
        yaw: Math.atan2(dx, dz), pitch: -Math.atan2(dy, flat),
    };
}
