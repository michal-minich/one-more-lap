import type { Course } from "./course.ts";
import { roadHalfWidth } from "./road-width.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";
import { smoothBetween } from "./terrain-profile.ts";

export interface BellgateStreets {
    readonly curbs: readonly Surface[];
    readonly terraces: readonly Surface[];
}

export const bellgateCurbRanges = {
    [-1]: [[23, 405], [813, 932]],
    1: [[23, 409], [835, 951]],
} as const;

export function bellgateStreets(course: Course): BellgateStreets {
    const curbs = ([-1, 1] as const).flatMap(side =>
        bellgateCurbRanges[side].map(([start, end]) => curb(course, start, end, side)));
    const terraces = [
        retainingWall(course, 286, 367, 1, 10.8, 1.7),
        retainingWall(course, 382, 460, 1, 10.8, 1.42),
        retainingWall(course, 352, 410, -1, 12.2, 1.4),
        retainingWall(course, 821, 891, -1, 11.8, 1.32),
    ];
    return { curbs, terraces };
}

function rows(course: Course, start: number, end: number): RouteSample[] {
    const segments = Math.ceil((end - start) / 1.7);
    return Array.from({ length: segments + 1 }, (_, index) => course.at(start + (end - start) * index / segments));
}

function curb(course: Course, start: number, end: number, side: number): Surface {
    const profile = [[0.02, -0.04], [0.09, 0.11], [0.17, 0.15], [0.41, 0.15], [0.51, 0.1], [0.56, -0.035]] as const;
    const band = (row: RouteSample): number => roadHalfWidth("old-town", row.distance);
    return strip(rows(course, start, end), row => {
        const offsets = profile.map(([width]) => side * (band(row) + width));
        return side > 0 ? offsets : offsets.toReversed();
    }, (row, across) => {
        const local = Math.abs(across) - band(row);
        const height = profile.find(([offset]) => Math.abs(local - offset) < 0.001)![1];
        const fade = smoothBetween(0, 7, Math.min(row.distance - start, end - row.distance));
        return -0.022 + (height + 0.022) * fade;
    });
}

function retainingWall(
    course: Course, start: number, end: number, side: number, offset: number, height: number,
): Surface {
    const profile = [[-0.56, -0.62], [-0.36, -0.02], [-0.3, 0.79], [-0.41, 0.92], [-0.29, 1],
        [0.4, 1], [0.53, 0.92], [0.46, 0.04], [0.61, -0.47]] as const;
    const band = (row: RouteSample): number => offset + Math.sin(row.distance * 0.06) * 0.14;
    const local = strip(rows(course, start, end), row => {
        const widths = profile.map(([width]) => side * (band(row) + width));
        return side > 0 ? widths : widths.toReversed();
    }, (row, across) => {
        const localWidth = Math.abs(across) - band(row);
        const [, rise] = profile.find(([width]) => Math.abs(localWidth - width) < 0.001)!;
        const at = pointOnRoute(row, side * (band(row) - 0.55));
        const floor = (course.ground.at(at.x, at.z) ?? row.y) - row.y;
        const fade = smoothBetween(0, 8, Math.min(row.distance - start, end - row.distance));
        return floor + (rise * height + 0.25) * fade - 0.35;
    });
    const uv = new Float32Array(local.uv.length);
    for (let index = 0; index < uv.length; index += 2) {
        const elevation = local.positions[(index / 2) * 3 + 1]!;
        uv[index] = local.uv[index + 1]! * 1.08;
        uv[index + 1] = elevation * 0.43 + local.uv[index]! * 0.46;
    }
    return { ...local, uv };
}
