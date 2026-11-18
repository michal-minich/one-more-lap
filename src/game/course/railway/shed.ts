import type { BiomeLandmark } from "../biome-landmarks.ts";
import { circuitLandmarkFootprints } from "../circuit-landmarks.ts";
import type { Course } from "../course.ts";
import { goodsShed, railwayOffset, railwayPoint } from "./line.ts";

const modelYaw = -0.80;
const widthRatio = 0.87;
const lengthRatio = 1.18;

export function placeJuniperShed(course: Course): BiomeLandmark {
    const kind = "juniper-shed";
    const height = 10.6;
    const { x, offset } = goodsShed;
    const at = railwayOffset(x, offset, -0.52);
    const from = railwayPoint(x - 0.5);
    const to = railwayPoint(x + 0.5);
    const yaw = Math.atan2(to.x - from.x, to.z - from.z);
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const ground = [-1, 1].flatMap(side => [-1, 1].map(end => {
        const width = height * widthRatio * side / 2;
        const length = height * lengthRatio * end / 2;
        return course.ground.at(at.x + width * cos + length * sin, at.z - width * sin + length * cos) ?? at.y;
    }));
    for (const end of [-6.7, 6.7]) {
        const point = railwayOffset(x + end, offset - 6.8);
        ground.push(course.ground.at(point.x, point.z) ?? at.y);
    }
    const footing = Math.min(at.y - 0.6, ...ground) - 0.45;
    return { ...at, kind, yaw: yaw - Math.PI / 2 + modelYaw, height, radius: height * circuitLandmarkFootprints[kind], footing };
}

export function juniperShedBase({ x, y, z, yaw, height, footing }: BiomeLandmark) {
    const bottom = footing ?? y - 1;
    const top = y + 0.14 * height;
    return { x, y: (top + bottom) / 2, z, width: height * widthRatio, depth: height * lengthRatio,
        height: top - bottom, yaw: yaw + Math.PI / 2 - modelYaw };
}


export function juniperShedLoadingDeck({ yaw, footing }: BiomeLandmark) {
    const at = railwayOffset(goodsShed.x, goodsShed.offset - 4.76, 0.34);
    const bottom = footing ?? at.y - 1;
    return { ...at, y: (at.y + bottom) / 2, width: 4.7, depth: 13.3, height: at.y - bottom, yaw: yaw + Math.PI / 2 - modelYaw };
}
