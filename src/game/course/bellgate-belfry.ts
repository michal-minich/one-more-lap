import type { Point } from "../point.ts";
import type { BiomeLandmark } from "./biome-landmarks.ts";
import { circuitLandmarkFootprints } from "./circuit-landmarks.ts";
import type { Course } from "./course.ts";

export function placeBellgateBelfry(course: Course): BiomeLandmark | undefined {
    const site = course.outposts.find(outpost => outpost.kind === "clocktower");
    if (!site) return undefined;
    const kind = "bellgate-belfry";
    const height = 22.4;
    const yaw = 0.54;
    const { position } = site;
    const reach = height * 0.29;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const bed = [position.y];
    for (const x of [-reach, reach]) {
        for (const z of [-reach, reach]) {
            const floor = course.ground.at(position.x + x * cos + z * sin, position.z - x * sin + z * cos);
            if (floor !== undefined) bed.push(floor);
        }
    }
    const y = Math.max(...bed) + 0.16;
    return { ...position, y, footing: Math.min(...bed) - 0.31, kind, height, yaw,
        radius: height * circuitLandmarkFootprints[kind] };
}

interface BelfryFooting extends Point {
    readonly yaw: number;
    readonly sx: number;
    readonly sy: number;
    readonly sz: number;
}

export function bellgateBelfryFooting(belfry: BiomeLandmark): BelfryFooting {
    const { x, y, z, yaw, height } = belfry;
    const bottom = belfry.footing ?? y - 0.65;
    const rim = y + height * 0.064;
    return { x, y: (rim + bottom) / 2, z, yaw, sx: height * 0.58, sy: rim - bottom, sz: height * 0.58 };
}
