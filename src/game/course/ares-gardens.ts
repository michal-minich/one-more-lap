import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { hallSetback } from "./halls.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";

export interface AresHabitat {
    readonly at: Point;
    readonly yaw: number;
    readonly side: number;
    readonly scale: number;
    readonly bottom: number;
    readonly base: number;
    readonly lock: Point;
    readonly lockHeight: number;
}

export interface AresCanopy {
    readonly roof: Point;
    readonly yaw: number;
    readonly feet: readonly Point[];
}

export interface AresGardens {
    readonly habitats: readonly AresHabitat[];
    readonly canopies: readonly AresCanopy[];
}

export const aresHabitatSize = { foundation: 17.1, dome: 16, rise: 6.25, lockWidth: 6.5, lockDepth: 4.15 } as const;
export const aresCanopySize = { width: 9, depth: 3.2, thickness: 0.2, post: 0.31 } as const;

export function aresGardens(course: Course): AresGardens {
    const habitats: AresHabitat[] = [];
    const canopies: AresCanopy[] = [];
    const sizes = [1, 0.81, 1.08, 0.9];
    for (let index = 15; index < course.route.length - 8; index += 24) {
        const row = course.route[index]!;
        if (hallSetback("mars", row.distance) > 0) continue;
        const group = Math.floor(index / 24);
        const side = group % 2 ? 1 : -1;
        const yaw = Math.atan2(row.dx, row.dz);
        const scale = sizes[group % sizes.length]!;
        const setback = side * (24 + (1 - scale) * 5);
        const habitat = placeHabitat(course, row, setback, scale, yaw) ??
            placeHabitat(course, row, setback + side * 8, scale, yaw);
        if (habitat) habitats.push(habitat);
        for (const along of [-17, -12, -7]) {
            const at = onVerge(row, -side * 18, along);
            if (overlapsEquipment(course, at, 4.2)) continue;
            const feet = [-3.7, 3.7].map(offset => {
                const foot = onVerge(row, -side * 18 + offset, along);
                return { ...foot, y: (course.ground.at(foot.x, foot.z) ?? at.y) - 0.27 };
            });
            const ground = course.ground.at(at.x, at.z) ?? at.y;
            canopies.push({ roof: { ...at, y: Math.max(ground, ...feet.map(foot => foot.y)) + 2.8 }, feet, yaw });
        }
    }
    return { habitats, canopies };
}

function placeHabitat(
    course: Course, row: RouteSample, setback: number, scale: number, yaw: number,
): AresHabitat | undefined {
    const side = Math.sign(setback);
    const at = onVerge(row, setback, 4);
    if (overlapsEquipment(course, at, 10.2 * scale)) return undefined;
    const y = course.ground.at(at.x, at.z) ?? at.y;
    let bottom = y - 0.8;
    for (const [across, along] of [[-8, 0], [8, 0], [0, -8], [0, 8]] as const) {
        const foot = onVerge(row, setback + across * scale, 4 + along * scale);
        bottom = Math.min(bottom, (course.ground.at(foot.x, foot.z) ?? y) - 0.26);
    }
    const base = y + 0.94;
    if (base - bottom > 4.8 * scale) return undefined;
    const access = onVerge(row, setback - side * 9.25 * scale, 4);
    const ground = course.ground.at(access.x, access.z) ?? y;
    const top = Math.max(base + 1.7, ground + 2.5 * scale);
    const lockHeight = top - ground + 0.45;
    const lock = { ...access, y: top - lockHeight / 2 };
    return { at, yaw, side, scale, bottom, base, lock, lockHeight };
}

function onVerge(row: RouteSample, across: number, along: number): Point {
    const at = pointOnRoute(row, across);
    return { ...at, x: at.x + row.dx * along, z: at.z + row.dz * along };
}

function overlapsEquipment(course: Course, at: Point, radius: number): boolean {
    return course.aresCutworks?.pads.some(pad => Math.hypot(pad.x - at.x, pad.z - at.z) < radius + 6.3) === true ||
        course.biomeLandmarks.some(prop => {
            return prop.kind.startsWith("ares-") && prop.height >= 3 &&
                Math.hypot(prop.x - at.x, prop.z - at.z) < radius + prop.radius;
        });
}
