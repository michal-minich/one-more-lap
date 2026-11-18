import type { Point } from "../../point.ts";

export const railwayEnds = [-182, 405] as const;
export const railwayStation = -74;
export const goodsShed = { x: 207, offset: 10.3 } as const;
export const viaductSpans = [
    [-51, -33, -20, 3, 23, 44, 65, 86],
    [238, 257, 275, 306, 326, 345],
] as const;

export function railwayPoint(x: number): Point {
    return { x, y: 20.5 + (x + 12) * 0.028, z: 125 + 18 * Math.sin((x + 60) * 0.011) };
}

export function railwayOffset(x: number, offset: number, height = 0): Point {
    const point = railwayPoint(x);
    const slope = 0.198 * Math.cos((x + 60) * 0.011);
    const scale = offset / Math.hypot(slope, 1);
    return { x: x - slope * scale, y: point.y + height, z: point.z + scale };
}

export function railwaySpanAt(x: number): boolean {
    return viaductSpans.some(span => x >= span[0] && x <= span.at(-1)!);
}
