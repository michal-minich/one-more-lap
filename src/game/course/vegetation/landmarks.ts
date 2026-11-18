import type { Point } from "../../point.ts";
import { seededRandom } from "../../random.ts";
import type { Course } from "../course.ts";
import { roadHalfWidth } from "../road-width.ts";
import { locate, pointOnRoute, ROAD_HALF } from "../route.ts";
import type { Biome } from "../tracks.ts";
import type { BoulderPlacement, PlantPlacement } from "./layout.ts";
import type { TreePlacement } from "./trees.ts";
import { scatterPatch } from "./scatter.ts";

interface VegetationLandmarks {
    readonly trees: TreePlacement[];
    readonly boulders: BoulderPlacement[];
    readonly plants: PlantPlacement[];
}

type LandQuery = (at: Point, margin: number) => Point | undefined;
type RockGarden = readonly [distance: number, lateral: number, scale: number];

const rockGardens: Partial<Record<Biome, readonly RockGarden[]>> = {
    coast: [[114, 20, 6.2], [543, -24, 5.0], [1074, 32, 7.1]],
    forest: [[102, -21, 6.1], [444, -28, 5.6], [877, -33, 6.0]],
    ruins: [[204, 24, 4.3], [684, -28, 5.3]],
    arctic: [[83, -26, 4.9], [695, 25, 5.8]],
    caldera: [[57, 18, 5.8], [206, 27, 5.6], [334, 19, 5.3], [452, -22, 7.9],
        [634, 21, 5.2], [809, -21, 6.3], [1044, 21, 6.7]],
    gorge: [[118, 22, 7.2], [697, -30, 6.0]],
};

export function placeVegetationLandmarks(
    course: Pick<Course, "track" | "at" | "route">, landAt: LandQuery,
): VegetationLandmarks {
    const trees: TreePlacement[] = [];
    const boulders: BoulderPlacement[] = [];
    const plants: PlantPlacement[] = [];
    const id = course.track.id;
    if (id === "forest") {
        const row = course.at(265);
        const ground = landAt(pointOnRoute(row, 24), 0.8);
        if (ground) trees.push({ kind: "ancient-oak", ground, yaw: -0.35, scale: 1.55 });
        plantBlackwoodStands(course, landAt, trees, plants);
    }
    if (id === "ruins") plantAegeanOrchards(course, landAt, trees);
    for (const [distance, lateral, scale] of rockGardens[id] ?? []) {
        const random = seededRandom(distance * 6_337);
        const row = course.at(distance);
        for (let i = 0; i < 5; i++) {
            const delta = i === 0 ? 0 : (i - 2.5) * 4.9;
            const stone = pointOnRoute(row, lateral + Math.sign(lateral) * (i === 0 ? 0 : 3.8 + random() * 4));
            const ground = landAt({ ...stone, x: stone.x + row.dx * delta, z: stone.z + row.dz * delta }, 0.65);
            if (!ground || Math.abs(locate(course.route, ground).lateral) < 14 + scale * 0.33) continue;
            boulders.push({ ground, shape: i % 3 === 1 ? "round" : i % 3 === 2 ? "slab" : "shard",
                yaw: random() * Math.PI * 2, scale: scale * (i === 0 ? 1 : 0.25 + random() * 0.30) });
        }
    }
    if (id === "caldera") {
        dressLavaApproach(course, landAt, boulders, plants);
        const random = seededRandom(79_147);
        for (const [distance, side] of [[466, 1], [912, -1], [1518, 1], [2070, -1]] as const) {
            const along = distance + (random() - 0.5) * 18;
            const ground = landAt(pointOnRoute(course.at(along), side * (roadHalfWidth(id, along) + 2.15)), 0.38);
            if (ground) boulders.push({ shape: "slab", ground, yaw: random() * Math.PI, scale: 0.96 + random() * 0.61 });
        }
    }
    return { trees, boulders, plants };
}

function plantAegeanOrchards(
    course: Pick<Course, "at" | "route">, landAt: LandQuery, trees: TreePlacement[],
): void {
    const random = seededRandom(2_917);
    const orchards = [[221, 43], [489, 33], [739, -37], [1_010, 43]] as const;
    for (const [distance, lateral] of orchards) {
        for (let row = 0; row < 3; row++) {
            for (let index = 0; index < 6; index++) {
                const along = distance + (index - 2.5) * 7.4 + row * 3.6 + (random() - 0.5) * 2;
                const across = lateral + (row * 7.5 + (random() - 0.5) * 2) * Math.sign(lateral);
                const ground = landAt(pointOnRoute(course.at(along), across), 0.6);
                if (!ground || Math.abs(locate(course.route, ground).lateral) < 17) continue;
                const kind = row === 0 && (index === 0 || index === 5) ? "cypress" : "olive";
                trees.push({ ground, kind, yaw: random() * Math.PI * 2, scale: 1.18 + random() * 0.48 });
            }
        }
    }
}

function plantBlackwoodStands(
    course: Pick<Course, "at" | "route">, landAt: LandQuery, trees: TreePlacement[], plants: PlantPlacement[],
): void {
    const random = seededRandom(3_347);
    const stands = [[46, -27, 12, 28], [108, -28, 10, 20], [237, 41, 14, 24], [346, 29, 16, 36],
        [535, -37, 18, 36], [735, 29, 13, 46], [939, -36, 15, 35], [1_089, 31, 13, 37]] as const;
    for (const [distance, lateral, width, depth] of stands) {
        const row = course.at(distance);
        const center = pointOnRoute(row, lateral);
        const yaw = Math.atan2(row.dx, row.dz);
        for (const [index, point] of scatterPatch(center, width, depth, yaw, 23, random).entries()) {
            if (Math.abs(locate(course.route, point).lateral) < 13.5) continue;
            const ground = landAt(point, 0.65);
            if (!ground) continue;
            const rotation = random() * Math.PI * 2;
            if (index % 3 === 0) {
                plants.push({ ground, kind: "scrub", yaw: rotation, scale: 1.1 + random() * 0.96 });
            } else if (!trees.some(tree => Math.hypot(tree.ground.x - ground.x, tree.ground.z - ground.z) < 3.3)) {
                const kind = index % 5 === 0 ? "birch" : index % 2 === 0 ? "spruce" : "fir";
                trees.push({ ground, kind, yaw: rotation, scale: 1.26 + random() * 0.83 });
            }
        }
    }
}

function dressLavaApproach(
    course: Pick<Course, "at" | "route">, landAt: LandQuery, rocks: BoulderPlacement[], plants: PlantPlacement[],
): void {
    const random = seededRandom(2_643);
    const outcrops = [[103, -11.3], [122, -12.8], [148, -12], [170, -11.5],
        [179, 12.6], [197, 12.3], [208, 13.6], [276, 12.3]] as const;
    for (const [distance, lateral] of outcrops) {
        const row = course.at(distance);
        const center = pointOnRoute(row, lateral);
        const yaw = Math.atan2(row.dx, row.dz);
        const candidates = [center, ...scatterPatch(center, 2.4, 4.9, yaw, 7, random)];
        for (const [i, candidate] of candidates.entries()) {
            const ground = landAt(candidate, 0.68);
            if (!ground || Math.abs(locate(course.route, ground).lateral) < ROAD_HALF + 3.3) continue;
            const angle = yaw + (random() - 0.5) * 1.8;
            if (i < 3) rocks.push({ ground, shape: i === 0 ? "slab" : "shard", scale: i === 0 ? 2.25 : 0.95, yaw: angle });
            else plants.push({ ground, kind: "dry-grass", scale: 0.78 + random() * 0.91, yaw: angle });
        }
    }
}
