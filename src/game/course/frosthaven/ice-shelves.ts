import type { BiomeLandmark } from "../biome-landmarks.ts";
import { circuitLandmarkFootprints } from "../circuit-landmarks.ts";
import type { Course } from "../course.ts";
import { pointOnRoute } from "../route.ts";

const floes = [
    [110, -91, 4.8, 0.31], [151, -98, 5.5, -0.70], [183, -101, 4.6, -1.50],
    [208, -115, 5.8, 0.90], [221, -120, 4.9, 0.18], [252, -126, 5.2, -0.57],
    [281, -96, 4.5, 2.74], [310, -86, 5.1, -0.92], [341, -83, 5.4, 0.22],
    [372, -97, 4.0, 2.20], [406, -90, 5.7, -0.90], [450, -108, 6.0, 1.10],
    [483, -94, 5.5, -1.60], [524, -115, 4.3, 0.44], [559, -106, 5.1, 1.28],
    [602, -96, 5.4, -0.71], [644, -113, 5.6, -0.05], [695, -107, 4.3, 0.80],
    [741, -95, 5.1, 2.70], [790, -99, 4.3, 1.27], [839, -90, 5.8, 0.80],
    [902, -85, 4.8, -1.21], [991, -96, 5.1, -0.44], [1_032, -96, 4.1, 0.88],
    [1_078, -90, 4.9, -1.70], [1_145, -88, 4.2, 0.50], [1_195, -83, 6.2, 1.65],
] as const;

export function placeFrosthavenFloes(course: Course): BiomeLandmark[] {
    const harbor = course.frosthavenHarbor;
    if (!harbor) return [];
    const level = harbor.icebreaker.y;
    const ship = harbor.icebreaker;
    const cos = Math.cos(ship.yaw);
    const sin = Math.sin(ship.yaw);
    const kind = "frosthaven-ice-shelf";
    const groups: BiomeLandmark[] = [];
    for (const [distance, lateral, height, yaw] of floes) {
        const point = pointOnRoute(course.at(distance), lateral);
        const radius = height * circuitLandmarkFootprints[kind];
        if ((course.ground.at(point.x, point.z) ?? level) > level + 0.16) continue;
        const dx = point.x - ship.x;
        const dz = point.z - ship.z;
        const across = dx * cos - dz * sin;
        const along = dx * sin + dz * cos;
        if (Math.abs(across) < 8 + radius && Math.abs(along) < 24 + radius) continue;
        if (Math.abs(point.z - harbor.pier.to.z) < radius + 4 && point.x > harbor.pier.to.x - radius - 4) continue;
        if (groups.some(group => Math.hypot(point.x - group.x, point.z - group.z) < radius + group.radius)) continue;
        groups.push({ ...point, y: level - height * 0.60, kind, height, radius, yaw });
    }
    return groups;
}
