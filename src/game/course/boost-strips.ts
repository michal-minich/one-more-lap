import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";

export interface BoostStrip {
    readonly row: RouteSample;
    readonly offset: number;
}

export const BOOST_STRIP_HALF_WIDTH = 1.52;
export const BOOST_STRIP_HALF_LENGTH = 4.2;

export function placeBoostStrips(course: Course): readonly BoostStrip[] {
    if (course.track.id !== "sky") return [];
    return [{ row: course.at(525), offset: 3.25 }, { row: course.at(1_247), offset: -3.25 }];
}

export function crossesBoostStrip({ row, offset }: BoostStrip, before: Point, after: Point): boolean {
    const center = pointOnRoute(row, offset);
    const longitudinal = (point: Point): number => (point.x - center.x) * row.dx + (point.z - center.z) * row.dz;
    const start = longitudinal(before);
    const end = longitudinal(after);
    if ((start < 0) === (end < 0)) return false;
    const at = -start / (end - start);
    const x = before.x + (after.x - before.x) * at - center.x;
    const z = before.z + (after.z - before.z) * at - center.z;
    const y = before.y + (after.y - before.y) * at - center.y;
    return Math.abs(x * row.dz - z * row.dx) < BOOST_STRIP_HALF_WIDTH && y > 0.13 && y < 1.44;
}
