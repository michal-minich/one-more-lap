import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { pointOnRoute } from "./route.ts";

export const gondolaHeight = 5.2;
export const liftLanes = [-2.4, 2.4] as const;
const mastWidth = 0.67;

interface LiftMast {
    readonly foot: Point;
    readonly head: Point;
    readonly width: number;
}

export interface AlpineLift {
    readonly lower: Point;
    readonly upper: Point;
    readonly a: Point;
    readonly b: Point;
    readonly yaw: number;
    readonly masts: readonly LiftMast[];
}

export function alpineLift(course: Course): AlpineLift {
    const at = (distance: number, side: number): Point => {
        const point = pointOnRoute(course.at(distance), side);
        return { ...point, y: course.ground.at(point.x, point.z) ?? point.y };
    };
    const lower = at(479, -25);
    const upper = at(650, 193);
    const yaw = Math.atan2(upper.x - lower.x, upper.z - lower.z);
    const a = { ...lower, y: lower.y + 9.8 };
    const b = { ...upper, y: Math.max(upper.y + 12.8, a.y + 22) };
    const masts = ([[lower, a], [upper, b]] as const).flatMap(([base, top]) => [-1, 1].map(side => {
        const foot = acrossLift(base, yaw, side * 4.3);
        return { foot: { ...foot, y: (course.ground.at(foot.x, foot.z) ?? foot.y) - 0.35 },
            head: acrossLift(top, yaw, side * 1.7), width: mastWidth };
    }));
    return { lower, upper, a, b, yaw, masts };
}

export function liftPoint({ a, b, yaw }: AlpineLift, lane: number, t: number): Point {
    return acrossLift({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - 2.8 * Math.sin(Math.PI * t),
        z: a.z + (b.z - a.z) * t }, yaw, lane);
}

function acrossLift(point: Point, yaw: number, lateral: number): Point {
    return { x: point.x + lateral * Math.cos(yaw), y: point.y, z: point.z - lateral * Math.sin(yaw) };
}
