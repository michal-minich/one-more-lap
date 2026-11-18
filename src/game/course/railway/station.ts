import type { BiomeLandmark } from "../biome-landmarks.ts";
import { circuitLandmarkFootprints } from "../circuit-landmarks.ts";
import type { Course } from "../course.ts";
import { railwayOffset, railwayPoint, railwayStation } from "./line.ts";

const modelYaw = -0.855;
// The station floor and the canopy sit at different levels on the source mesh.
const slabs = [
    { width: 0.81, depth: 0.82, across: 0.355, along: 0.067, top: 0.163 },
    { width: 0.77, depth: 1.17, across: -0.31, along: -0.134, top: 0.128 },
] as const;

export function placeJuniperStation(course: Course): BiomeLandmark {
    const kind = "juniper-station";
    const height = 11.5;
    const at = railwayOffset(railwayStation, -11.7, -1.12);
    const next = railwayPoint(railwayStation + 0.5);
    const rail = railwayPoint(railwayStation);
    const yaw = Math.atan2(next.x - rail.x, next.z - rail.z);
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const ground = slabs.flatMap(({ width, depth, across, along }) =>
        [-1, 1].flatMap(side => [-1, 1].map(end => {
            const x = height * (across + side * width / 2);
            const z = height * (along + end * depth / 2);
            return course.ground.at(at.x + x * cos + z * sin, at.z - x * sin + z * cos) ?? at.y;
        })));
    const platform = stationPlatformAnchor();
    for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
            const x = side * platform.width / 2;
            const z = end * platform.depth / 2;
            ground.push(course.ground.at(platform.x + x * cos + z * sin, platform.z - x * sin + z * cos) ?? at.y);
        }
    }
    const footing = Math.min(at.y - 0.8, ...ground) - 0.45;
    return { ...at, kind, height, radius: circuitLandmarkFootprints[kind] * height, yaw: yaw + modelYaw, footing };
}

export function juniperStationPlinth({ x, y, z, yaw, height, footing }: BiomeLandmark) {
    const turn = yaw - modelYaw;
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    const bottom = footing ?? y - 1;
    return slabs.map(({ width, depth, across, along, top: level }) => {
        const top = y + level * height;
        return {
            x: x + height * (across * cos + along * sin),
            y: (top + bottom) / 2,
            z: z + height * (-across * sin + along * cos),
            width: height * width, depth: height * depth, height: top - bottom, yaw: turn,
        };
    });
}


function stationPlatformAnchor() {
    return { ...railwayOffset(railwayStation, -5.09, 0.15), width: 4.26, depth: 27 };
}

export function juniperStationPlatform({ yaw, footing }: BiomeLandmark) {
    const { x, y: top, z, width, depth } = stationPlatformAnchor();
    const bottom = footing ?? top - 1;
    return { x, y: (top + bottom) / 2, z, width, depth, height: top - bottom, yaw: yaw - modelYaw };
}
