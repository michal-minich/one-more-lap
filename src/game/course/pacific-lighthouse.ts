import type { Point } from "../point.ts";
import type { GroundHeight } from "./ground-height.ts";

export const pacificLighthouse = {
    height: 23.6,
    footing: { width: 0.97, depth: 0.94 },
    tower: { across: -0.23, depth: -0.07 },
    lantern: { across: -0.236, depth: -0.082, rise: 0.859 },
};

export function pacificLighthouseBase(at: Point, yaw: number, ground: GroundHeight): number {
    const { height, footing } = pacificLighthouse;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    let bottom = at.y;
    for (const x of [-height * footing.width / 2, 0, height * footing.width / 2]) {
        for (const z of [-height * footing.depth / 2, 0, height * footing.depth / 2]) {
            const y = ground.at(at.x + x * cos + z * sin, at.z - x * sin + z * cos);
            if (y !== undefined) bottom = Math.min(bottom, y);
        }
    }
    return bottom - 0.31;
}
