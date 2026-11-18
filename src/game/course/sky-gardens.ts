import type { Point } from "../point.ts";
import type { BiomeLandmark } from "./biome-landmarks.ts";
import { circuitLandmarkFootprints } from "./circuit-landmarks.ts";
import type { LandmarkSite } from "./circuit-landmarks.ts";
import type { Course } from "./course.ts";
import { GroundHeight } from "./ground-height.ts";
import { pointOnRoute } from "./route.ts";
import type { SkyBranch } from "./sky-branch.ts";

export function cloudfoldGarden(branch: SkyBranch): Point {
    return pointOnRoute(branch.route[26]!, 25.5, -2.35);
}

export type FloatingIsland = readonly [x: number, y: number, z: number, radius: number];

export const cloudfoldIslands: readonly FloatingIsland[] = [
    [-26, 73, 22, 17], [74, 75, 0, 16], [117, 87, -26, 23], [-94, 91, 94, 20],
    [211, 104, -12, 15], [-186, 69, -24, 24], [-81, 66, -130, 26], [38, 61, 122, 29],
    [305, 65, 54, 35], [-284, 54, 73, 39], [160, 57, -180, 39],
];

export const cloudfoldIslandTrees = [0, 2, 3, 5, 6, 8, 9, 10];
type GardenProp = "aurora-succulent" | "cloudfold-pavilion" | "cloudfold-cypress" | "cloudfold-armillary" | "cloudfold-grasses";

interface TerracePlanting {
    readonly kind: GardenProp;
    readonly sites: readonly LandmarkSite[];
    readonly footing: number;
    readonly maximumSlope: number;
    readonly root?: readonly [x: number, z: number];
}

const terraces: readonly TerracePlanting[] = [
    { kind: "cloudfold-pavilion", footing: 0.26, maximumSlope: 0.24, sites: [
        [121, -20.3, 7.7, -1.15], [203, -24.6, 9.1, 0.43], [341, -19.8, 7.1, 1.26],
        [523, 24.6, 10.1, -1.6], [1_229, -21.5, 8.6, 0.38], [1_344, 20.2, 7.2, -0.72],
    ] },
    { kind: "cloudfold-armillary", footing: 0.235, maximumSlope: 0.28, root: [0, -0.09], sites: [
        [132, -25.8, 6.6, 0.9], [193, -26.3, 7.6, -0.48], [334, -27.9, 6.3, 1.18],
        [513, 17.4, 7.7, -1.19], [1_189, -17.7, 6.4, 1.18], [1_242, 15.3, 6.5, 0.83],
        [1_276, 17.8, 6.6, -1.15], [1_355, 24.3, 6.5, 0.75],
    ] },
    { kind: "cloudfold-cypress", footing: 0.165, maximumSlope: 0.39, root: [0.17, 0.17], sites: [
        [91, -15.8, 8.2, -0.83], [105, -23.5, 10.2, 1.26], [141, -17.8, 8.7, -0.28],
        [185, -17.8, 9.5, 0.62], [218, -21.5, 8.9, 1.63], [230, -15.2, 8.7, -1.07],
        [310, -17.8, 8.4, -0.53], [326, -24.8, 9.2, 1.74], [352, -20.2, 8.5, -1.22],
        [477, 18.2, 9.2, 0.84], [494, 25.3, 10.5, -0.71], [507, 27.5, 9.3, 1.03],
        [540, 23.9, 11.4, 1.19], [555, 19.8, 8.7, -1.17], [566, 13.8, 7.2, 0.94],
        [1_197, -18.7, 8.8, 1.9], [1_214, -22.8, 11.1, -1.04], [1_245, -20.3, 8.5, 1.3],
        [1_258, 17.2, 8.9, 0.62], [1_275, -20.9, 9.6, -0.59], [1_292, -16.1, 8.1, 1.59],
        [1_332, 15.6, 7.8, 0.28], [1_360, 18.9, 9.2, -0.93], [1_371, 15.7, 7.6, 1.5],
    ] },
    { kind: "cloudfold-grasses", footing: 0.37, maximumSlope: 0.47, sites: [
        [91, -11.1, 0.91, -0.82], [102, -11.9, 1.15, 1.09], [110, -12.3, 0.83, -1.28],
        [118, -10.7, 0.93, 0.54], [127, -12.6, 1.09, 1.18], [137, -11.4, 0.83, -1.79], [144, -10.7, 0.89, 0.90],
        [178, -10.8, 0.85, -0.61], [185, -11.6, 0.96, 1.06], [192, -12.3, 1.13, -1.74],
        [199, -11.1, 0.82, 0.25], [208, -12.9, 0.92, 1.27], [216, -11.4, 1.06, -0.68],
        [223, -12.2, 0.96, 0.49], [231, -10.8, 0.83, 1.85],
        [302, -10.7, 0.98, 0.43], [311, -12.4, 1.12, -0.55], [321, -11.6, 0.91, 2.06],
        [328, -10.9, 0.89, 1.17], [338, -12.5, 0.96, -0.70], [345, -10.8, 1.01, 0.51],
        [355, -11.9, 0.88, 1.83],
        [469, 10.9, 0.92, -0.69], [479, 11.1, 1.05, 1.38], [488, 12.8, 0.68, -1.24],
        [496, 11.5, 0.84, 0.52], [512, 11.8, 0.87, 1.52], [520, 10.8, 1.02, -0.42],
        [535, 12.3, 0.83, 0.67], [544, 11.1, 1.05, -0.82], [550, 13.5, 0.89, 1.29],
        [562, 11.1, 0.86, 1.09], [569, 10.8, 1.01, -0.65],
        [1_188, -11.4, 0.90, 0.81], [1_201, -11.3, 1.08, 1.52], [1_210, 11.1, 0.87, -0.48],
        [1_224, -11.6, 0.94, 1.02], [1_229, 11.6, 0.99, 2.08], [1_244, -11.1, 1.16, -1.29],
        [1_254, 12.2, 0.81, 1.55], [1_261, 11.3, 1.06, 0.51], [1_267, -11.8, 0.92, -0.67],
        [1_280, 11.7, 0.86, 1.43], [1_293, -11.3, 0.95, 0.93], [1_299, -10.9, 1.07, 0.68],
        [1_329, 11.9, 1.06, 0.49], [1_343, 10.8, 0.86, -0.42], [1_353, 11.8, 0.93, 1.77],
        [1_364, 11.4, 0.80, 0.36], [1_375, 10.8, 0.98, -0.95],
    ] },
    { kind: "aurora-succulent", footing: 0.54, maximumSlope: 0.35, sites: [
        [85, -10.4, 1.34, -1.41], [99, -16, 1.34, -1.43], [127, -23.2, 1.34, -1.49],
        [146.6, -12.8, 1.34, -1.55], [196.6, -20, 1.34, -1.59], [202.2, -12.8, 1.34, -1.44],
        [316.8, -16.8, 1.34, -1.54], [347.6, -19.2, 1.34, -1.48], [481.2, 22.4, 1.34, 1.54],
        [489.6, 17.6, 1.34, 1.45], [506.4, 19.2, 1.34, 1.54], [1_184.8, -12.8, 1.34, -1.45],
        [1_224, 16, 1.34, -1.59], [1_235.2, 15.2, 1.34, 1.45], [1_282.8, 10.4, 1.34, 1.58],
        [1_316, 11.2, 1.34, 1.52], [1_338.4, 20, 1.34, 1.58], [1_358, 10.4, 1.34, 1.61],
    ] },
];

export function placeCloudfoldGardens(course: Course, branch: SkyBranch): BiomeLandmark[] {
    const garden = cloudfoldGarden(branch);
    const pavilion = "cloudfold-pavilion";
    const pavilionHeight = 10.2;
    const tree = "cloudfold-cypress";
    const sculpture = "cloudfold-armillary";
    const landmarks: BiomeLandmark[] = [
        { ...garden, kind: pavilion, height: pavilionHeight,
            radius: circuitLandmarkFootprints[pavilion] * pavilionHeight, yaw: -0.82 },
        { x: garden.x + 3.6, y: garden.y - 0.04, z: garden.z + 7.3, kind: sculpture,
            height: 4.7, radius: 4.7 * circuitLandmarkFootprints[sculpture], yaw: 0.83 },
        { x: garden.x + 7.9, y: garden.y - 0.08, z: garden.z - 4.8, kind: tree,
            height: 8.1, radius: 8.1 * circuitLandmarkFootprints[tree], yaw: 1.9 },
    ];
    for (const [index, site] of cloudfoldIslandTrees.entries()) {
        const [x, y, z, radius] = cloudfoldIslands[site]!;
        const height = Math.min(16.3, radius * 0.67);
        landmarks.push({ x: x - radius * 0.2, y: y - 0.12, z: z + radius * 0.19, kind: tree,
            height, radius: height * circuitLandmarkFootprints[tree], yaw: index * 1.09 });
    }
    for (const [x, z, height, yaw] of [[-7.3, 1.1, 1.25, 0.74], [-6.1, -5.0, 0.84, 1.19],
        [-2.1, -7.1, 1.13, -0.77], [5.1, -6.9, 0.92, 1.83], [6.3, 4.1, 0.88, -1.25],
        [-3.3, 6.8, 1.09, 2.30]] as const) {
        const kind = "cloudfold-grasses";
        landmarks.push({ x: garden.x + x, y: garden.y - 0.02, z: garden.z + z,
            height, yaw, kind, radius: height * circuitLandmarkFootprints[kind] });
    }
    const ground = new GroundHeight(course.cloudfoldScenery!.ledges);
    for (const { kind, sites, footing, maximumSlope, root = [0, 0] } of terraces) {
        for (const [distance, lateral, height, twist] of sites) {
            const row = course.at(distance);
            const at = pointOnRoute(row, lateral);
            const radius = height * circuitLandmarkFootprints[kind];
            if (landmarks.some(prop => Math.hypot(prop.x - at.x, prop.z - at.z) < prop.radius + radius)) continue;
            const yaw = Math.atan2(row.dx, row.dz) + twist;
            const cos = Math.cos(yaw);
            const sin = Math.sin(yaw);
            const x = at.x + height * (root[0] * cos + root[1] * sin);
            const z = at.z + height * (-root[0] * sin + root[1] * cos);
            const reach = height * footing;
            const elevations = ([[0, 0], [-reach, 0], [reach, 0], [0, -reach], [0, reach]] as const).map(([dx, dz]) =>
                ground.at(x + dx, z + dz) ?? NaN);
            const y = Math.min(...elevations);
            const fits = Number.isFinite(y) && Math.max(...elevations) - y <= height * maximumSlope;
            const deckTooClose = course.route.some(deck => {
                return Math.abs(deck.y - y) < height + 1 && Math.hypot(deck.x - at.x, deck.z - at.z) < radius + 8.6;
            });
            if (!fits || deckTooClose) continue;
            landmarks.push({ ...at, y: y - height * 0.055, kind, height, radius, yaw });
        }
    }
    return landmarks;
}
