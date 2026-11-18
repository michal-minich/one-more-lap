import type { BiomeLandmark } from "./biome-landmarks.ts";
import { circuitLandmarkFootprints } from "./circuit-landmarks.ts";
import type { LandmarkSite } from "./circuit-landmarks.ts";
import type { Course } from "./course.ts";
import { reefTubeHalfWidth } from "./reef-tunnel.ts";
import { pointOnRoute } from "./route.ts";

interface ColonyPlan {
    readonly kind: "coral-bommie" | "coral-sponges";
    readonly sites: readonly LandmarkSite[];
}

const colonies: readonly ColonyPlan[] = [
    { kind: "coral-bommie", sites: [
        [251, 27, 22, -0.72], [293, -26, 24, 1.05], [324, 23, 20, -1.22],
        [369, 29, 26, -0.67], [398, -27, 24, 1.21], [437, 25, 22, -1.95],
        [476, -25.5, 25, 1.14], [515, 26, 26, -0.28], [543, -21.5, 17.5, 1.29],
        [575, 28, 24, -1.16], [616, -30, 31, 0.87],
    ] },
    { kind: "coral-sponges", sites: [
        [235, -23, 20, -1.15], [269, -39, 20, 0.64], [282, 20, 16, -0.49], [310, -39, 18.8, 1.28],
        [349, -42, 19.5, -0.61], [350, 23, 14.6, 0.35], [380, -18.5, 13.6, -1.14], [415, 22, 17.2, 0.89],
        [435, -29, 20, -0.42], [468, 32, 22, 1.48], [489, 22, 16, -1.21], [505, -22, 15, 0.84],
        [536, 21, 17.0, -0.63], [569, -28, 19, 1.76], [598, 22, 19.5, -1.82], [631, 27, 26, 0.83],
    ] },
];

export function placeReefColonies(course: Course): BiomeLandmark[] {
    const landmarks: BiomeLandmark[] = [];
    for (const { kind, sites } of colonies) {
        for (const [distance, lateral, requestedHeight, twist] of sites) {
            const row = course.at(distance);
            const point = pointOnRoute(row, lateral);
            const yaw = Math.atan2(row.dx, row.dz) + twist;
            const foundation = requestedHeight * 0.16;
            const dx = Math.cos(yaw) * foundation;
            const dz = -Math.sin(yaw) * foundation;
            const ground = Math.min(...[-1, 0, 1].map(side =>
                course.ground.at(point.x + dx * side, point.z + dz * side, -0.025) ?? 0));
            const height = Math.min(requestedHeight, -1.15 - ground);
            const radius = circuitLandmarkFootprints[kind] * height;
            if (height < 1.8 || Math.abs(course.locate(point).lateral) < reefTubeHalfWidth + radius + 1.2) continue;
            if (landmarks.some(other => Math.hypot(other.x - point.x, other.z - point.z) < (radius + other.radius) * 0.84)) continue;
            landmarks.push({ ...point, y: ground - height * 0.08, kind, height, yaw, radius });
        }
    }
    return landmarks;
}
