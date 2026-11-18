import type { BiomeLandmark } from "./biome-landmarks.ts";
import { circuitLandmarkFootprints } from "./circuit-landmarks.ts";
import type { Course } from "./course.ts";
import { GroundHeight } from "./ground-height.ts";
import { channelPoint } from "./water.ts";

export function placeGlasswaterHarbor(course: Course): BiomeLandmark[] {
    const river = course.water.find(body => body.kind === "creek");
    const works = course.glasswaterRiverworks;
    if (!river || !works) return [];
    const riverYaw = Math.atan2(river.dx, river.dz);
    const ferry = "glasswater-ferry";
    const landmarks: BiomeLandmark[] = ([
        [-0.59, -0.49, 8.2, 0.06],
        [0.67, 0.46, 7.4, Math.PI - 0.04],
    ] as const).map(([channel, bank, height, heading]) => {
        const dock = channelPoint(river, channel, bank);
        return { ...dock, kind: ferry, height, y: dock.y - height * 0.16, yaw: riverYaw - 0.695 + heading,
            radius: height * circuitLandmarkFootprints[ferry] };
    });
    const quays = new GroundHeight(works.quays);
    const facilities = [
        ["glasswater-crane", -0.66, -1.029, 10.1, 1.86],
        ["glasswater-crane", 0.74, 1.01, 9, -1.42],
        ["glasswater-cafe", -0.40, -1.074, 7.2, Math.PI + 0.12],
        ["glasswater-cafe", 0.45, 1.05, 6.6, -0.13],
        ["glasswater-shelter", -0.81, -1.015, 4, Math.PI + 0.07],
        ["glasswater-shelter", 0.58, 1.03, 3.9, -0.15],
        ["glasswater-sail", -0.31, -0.975, 7.7, 0.92],
        ["glasswater-sail", 0.31, 0.98, 8.3, -1.7],
        ["glasswater-reeds", -0.48, -0.81, 1.42, Math.PI - 0.39],
        ["glasswater-reeds", -0.76, -0.81, 1.52, Math.PI - 0.39],
        ["glasswater-reeds", 0.38, 0.82, 1.44, -0.39],
        ["glasswater-reeds", 0.64, 0.82, 1.48, -0.39],
    ] as const;
    for (const [kind, channel, bank, height, heading] of facilities) {
        const at = channelPoint(river, channel, bank);
        const y = quays.at(at.x, at.z);
        if (y === undefined) continue;
        landmarks.push({ ...at, kind, height, y: y - height * 0.021,
            yaw: riverYaw + heading, radius: height * circuitLandmarkFootprints[kind] });
    }
    return landmarks;
}
