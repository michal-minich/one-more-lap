import type { BiomeLandmark } from "../biome-landmarks.ts";
import { circuitLandmarkFootprints } from "../circuit-landmarks.ts";
import type { Course } from "../course.ts";
import { railwayOffset, railwayPoint } from "./line.ts";

export function placeJuniperSignals(course: Course): BiomeLandmark[] {
    const kind = "juniper-semaphore";
    return ([[-55, -3.94, 5.5], [222, 3.98, 5.8], [353, 4.13, 5.7]] as const).map(([x, side, height]) => {
        const at = railwayOffset(x, side, -0.30);
        const previous = railwayPoint(x - 0.35);
        const next = railwayPoint(x + 0.35);
        const yaw = Math.atan2(next.x - previous.x, next.z - previous.z) + (side > 0 ? 2.25 : -0.89);
        const footing = (course.ground.at(at.x, at.z) ?? at.y - 0.8) - 0.27;
        return { ...at, kind, yaw, footing, height, radius: height * circuitLandmarkFootprints[kind] };
    });
}

export function juniperSignalBase({ x, y, z, yaw, height, footing }: BiomeLandmark) {
    const across = -height * 0.085;
    const depth = -height * 0.021;
    const bottom = footing ?? y - 0.9;
    const top = y + height * 0.037;
    return {
        x: x + across * Math.cos(yaw) + depth * Math.sin(yaw),
        y: (top + bottom) / 2,
        z: z - across * Math.sin(yaw) + depth * Math.cos(yaw),
        height: top - bottom, width: 0.22 * height, yaw,
    };
}
