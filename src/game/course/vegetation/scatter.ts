import type { Point } from "../../point.ts";

export function scatterPatch(
    center: Point, radius: number, depth: number, heading: number, count: number, random: () => number,
): Point[] {
    const sin = Math.sin(heading);
    const cos = Math.cos(heading);
    return Array.from({ length: count }, () => {
        const direction = random() * 2 * Math.PI;
        const reach = Math.sqrt(random());
        const x = Math.cos(direction) * radius * reach;
        const z = Math.sin(direction) * depth * reach;
        return { x: center.x + cos * x + sin * z, y: center.y, z: center.z - sin * x + cos * z };
    });
}
