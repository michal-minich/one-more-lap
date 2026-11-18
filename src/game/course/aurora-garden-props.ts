import type { BiomeLandmark } from "./biome-landmarks.ts";
import { circuitLandmarkFootprints } from "./circuit-landmarks.ts";
import type { Course } from "./course.ts";
import { GroundHeight } from "./ground-height.ts";
import { channelPoint } from "./water.ts";

export function placeAuroraGardenProps(course: Course): BiomeLandmark[] {
    const channel = course.water.find(body => body.kind === "creek");
    const gardens = course.auroraWaterside;
    if (!channel || !gardens) return [];
    const terraces = new GroundHeight(gardens.terraces);
    const heading = Math.atan2(channel.dx, channel.dz);
    const placements: BiomeLandmark[] = [];
    const kind = "glasswater-reeds";
    const planter = "aurora-succulent";
    for (const bank of [-1, 1]) for (const bankEnd of [-1, 1]) {
        for (const distance of [0.53, 0.63, 0.77, 0.89]) {
            const edge = 0.875 - 0.27 * distance ** 2;
            const spot = channelPoint(channel, distance * bankEnd, edge * bank);
            const y = terraces.at(spot.x, spot.z);
            if (y === undefined || (course.ground.at(spot.x, spot.z) ?? y) > y + 0.18) continue;
            const height = 1.22 + distance * 0.36;
            const yaw = heading - 0.389 + (bank < 0 ? Math.PI : 0);
            placements.push({ ...spot, y: y - 0.034, yaw, height, kind, radius: circuitLandmarkFootprints[kind] * height });
        }
        for (const distance of [0.54, 0.86]) {
            const edge = 1.12 - 0.27 * distance ** 2;
            const spot = channelPoint(channel, distance * bankEnd, edge * bank);
            const y = terraces.at(spot.x, spot.z);
            if (y === undefined || (course.ground.at(spot.x, spot.z) ?? y) > y + 0.15) continue;
            const height = 1.42 + distance * 0.25;
            const yaw = heading + (bank < 0 ? Math.PI : 0);
            placements.push({ ...spot, y: y - 0.058, yaw, height, kind: planter,
                radius: circuitLandmarkFootprints[planter] * height });
        }
    }
    const sculpture = "aurora-orbit";
    for (const direction of [-1, 1]) {
        const site = channelPoint(channel, direction * 0.65, direction * 1.02);
        const y = terraces.at(site.x, site.z);
        if (y === undefined || (course.ground.at(site.x, site.z) ?? y) > y + 0.22) continue;
        const height = direction < 0 ? 5.55 : 5.85;
        placements.push({ ...site, y: y - 0.075, yaw: heading + direction * 0.97, kind: sculpture,
            height, radius: circuitLandmarkFootprints[sculpture] * height });
    }
    return placements;
}
