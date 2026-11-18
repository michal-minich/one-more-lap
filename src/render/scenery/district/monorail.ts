import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { smoothBetween } from "../../../game/course/terrain-profile.ts";
import type { Point } from "../../../game/point.ts";
import { material } from "../../materials.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

const START = 336;
const END = 756;
const metal = "#d8e3da";
const railing = "#6d9a98";
const green = "#789755";

export function drawMonorail(scene: Scene, course: Course): (time: number) => void {
    const city = new UrbanParts(scene);
    const build = city.add;
    const rail = (distance: number): Point => pointOnRoute(course.at(distance), offset(distance), elevation(distance));
    let from = rail(START);
    for (let distance = START + 4; distance <= END; distance += 4) {
        const to = rail(distance);
        linkRail(build, from, to);
        if ((distance - START) % 28 === 0 && Math.abs(offset(distance)) > 11.4) footing(build, course, to);
        from = to;
    }
    for (const distance of [START, END]) station(build, course, distance, rail(distance));
    city.draw();

    const cabins = createTrain(scene);
    return (time: number): void => {
        const center = START + 10 + (END - START - 20) * (0.5 + Math.sin(time * 0.066 - 0.34) * 0.5);
        for (const [i, car] of cabins.entries()) {
            const distance = center + (i - 1) * 7.25;
            const here = rail(distance);
            const next = rail(distance + 1.5);
            car.position.set(here.x, here.y, here.z);
            car.rotation.y = Math.atan2(next.x - here.x, next.z - here.z);
            car.rotation.x = -Math.atan2(next.y - here.y, Math.hypot(next.x - here.x, next.z - here.z));
        }
    };
}

function offset(distance: number): number {
    const t = (distance - START) / (END - START);
    const route = 25.2 * Math.cos(t * 2 * Math.PI);
    // The existing suspended line passes on the other side of the garden from its platform.
    const approach = smoothBetween(472, 536, distance);
    const arcade = smoothBetween(472, 506, distance) * (1 - smoothBetween(545, 588, distance));
    return -33.5 + (route + 33.5) * approach + arcade * 7.8;
}

function elevation(distance: number): number {
    const t = (distance - START) / (END - START);
    return 10.6 + 6.65 * Math.sin(t * Math.PI);
}

function linkRail(build: BuildPart, from: Point, to: Point): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const center = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: (from.z + to.z) / 2 };
    const direction = { yaw: Math.atan2(dx, dz), pitch: -Math.atan2(dy, Math.hypot(dx, dz)) };
    const length = Math.hypot(dx, dy, dz) + 0.11;
    build("suspended rail beam", { ...center, ...direction, sx: 0.83, sy: 0.60, sz: length }, metal);
    build("suspended rail guide", { ...center, ...direction, y: center.y - 0.26, sx: 0.47, sy: 0.27, sz: length }, railing);
}

function footing(build: BuildPart, course: Course, at: Point): void {
    const ground = course.ground.at(at.x, at.z);
    if (ground === undefined || at.y - ground < 3) return;
    const height = at.y - ground + 0.2;
    build("monorail pier", { ...at, y: ground + height / 2 - 0.37, sx: 1.17, sy: height, sz: 1.34, yaw: 0 }, metal, "oval");
    build("monorail capital", { ...at, y: at.y - 0.46, sx: 2.8, sy: 0.71, sz: 2.3, yaw: 0 }, railing, "oval");
}

function station(build: BuildPart, course: Course, distance: number, at: Point): void {
    const row = course.at(distance);
    const yaw = Math.atan2(row.dx, row.dz);
    const ground = course.ground.at(at.x, at.z) ?? row.y;
    build("monorail station core", { ...at, y: (ground + at.y) / 2 - 1.65,
        sx: 4.1, sy: at.y - ground - 2.6, sz: 11.4, yaw }, metal, "oval");
    build("planted station deck", { ...at, y: at.y - 3.63, sx: 11.7, sy: 0.52, sz: 18.7, yaw }, green, "oval");
    build("monorail solar canopy", { ...at, y: at.y + 0.59, sx: 11.2, sy: 0.46, sz: 16.9, yaw }, metal, "oval");
    build("Aurora photovoltaic panels", { ...at, y: at.y + 0.9, sx: 8.6, sy: 0.16, sz: 12.2, yaw }, "#456684");
}

function createTrain(scene: Scene): TransformNode[] {
    const ceramic = material(scene, "monorail ceramic", "#e1e7e0");
    ceramic.diffuseTexture = surfaceTexture(scene, "aurora ivory");
    const windows = material(scene, "monorail glass", "#548b9b");
    windows.emissiveColor.set(0.09, 0.19, 0.20);
    const bogie = material(scene, "monorail suspension", "#52636a");
    bogie.diffuseTexture = surfaceTexture(scene, "weathered steel");
    return Array.from({ length: 3 }, (_, i) => {
        const car = new TransformNode("monorail cabin " + (i + 1), scene);
        const mesh = new ActorMeshes(scene, car);
        mesh.oval("rounded monorail shell", [3.12, 2.76, 7.25], [0, -2.07, 0], ceramic);
        mesh.oval("ribbon windows", [3.19, 1.18, 7.03], [0, -1.66, 0], windows);
        for (const z of [-2.14, 2.14]) {
            mesh.box("hanging bogie", [0.79, 0.96, 0.51], [0, -0.61, z], bogie);
        }
        return car;
    });
}
