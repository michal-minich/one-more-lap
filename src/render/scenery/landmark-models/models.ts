import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { Biome } from "../../../game/course/tracks.ts";
import { material } from "../../materials.ts";
import { fromPacked, unpackMeshes } from "../../packed-mesh.ts";
import arch from "./arch.bin?inline";
import archColor from "./arch.jpg?inline";
import pier from "./pier.bin?inline";
import pierColor from "./pier.jpg?inline";
import greenery from "./greenery.bin?inline";
import greeneryColor from "./greenery.jpg?inline";
import pine from "./pine.bin?inline";
import pineColor from "./pine.jpg?inline";
import coral from "./coral.bin?inline";
import coralColor from "./coral.jpg?inline";

const models = {
    arch: { name: "mossy limestone arch", geometry: arch, color: archColor },
    pier: { name: "weathered limestone pier", geometry: pier, color: pierColor },
    greenery: { name: "textured roadside groundcover", geometry: greenery, color: greeneryColor },
    pine: { name: "windswept pine", geometry: pine, color: pineColor },
    coral: { name: "Pixal3D coral colony", geometry: coral, color: coralColor },
};

type Model = keyof typeof models;
type Site = readonly [model: Model, distance: number, lateral: number, height: number, turn: number];

const sites: Partial<Record<Biome, readonly Site[]>> = {
    coast: [["greenery", 235, 11, 1.6, 0.7], ["pier", 374, 20, 4.3, 1.4]],
    forest: [["pine", 265, -21, 11.6, 0.4], ["pine", 267, -28, 9.1, 2.1], ["pine", 277, -33, 13.4, -0.6],
        ["greenery", 336, 10.8, 1.06, 0.8], ["greenery", 340, 12, 1.35, 1.5], ["greenery", 347, 13, 1.1, 2.7]],
    alpine: [["pine", 236, 15, 10.1, 2.2], ["pine", 719, -24, 12.2, 0.6],
        ["pine", 708, -33, 9.7, 1.7], ["pine", 737, -30, 11.2, 2.5], ["greenery", 450, 12, 1.2, 1.1]],
    canyon: [["greenery", 210, 13, 1.1, 1.3], ["greenery", 214, 14.5, 0.9, 2.1],
        ["greenery", 710, -13, 1.15, 0.6], ["greenery", 1_032, -16.5, 1.05, -0.9]],
    ruins: [["arch", 372, -24, 10.1, 1.0], ["pier", 625, 15, 4.6, 0.7],
        ["pier", 617, 18, 3.3, 1.4], ["pier", 634, 15, 2.9, 1.15], ["pier", 790, 18, 3.1, 2.2],
        ["greenery", 68, 13, 1.4, 0.95], ["greenery", 415, 12, 1.4, 0.2],
        ["greenery", 622, 12.4, 1.5, 1.7], ["greenery", 633, 13, 1.1, 2.5],
        ["greenery", 895, -17.4, 1.6, -0.6], ["greenery", 902, -20, 1.2, 1.8]],
    "old-town": [["pier", 233, -19, 4.8, 1.25], ["greenery", 535, -12, 1.7, 0.6]],
    metro: [["greenery", 544, 17, 1.6, 1.0]],
    future: [["greenery", 207, 16, 1.6, 1.9], ["greenery", 534, -16, 1.8, 1.0]],
    arctic: [["pine", 331, -25, 11.7, 2.2], ["pine", 575, 18, 10.9, 0.7]],
    gorge: [["pier", 431, 19, 5.6, 1.0], ["pier", 427, 22.5, 3.25, 1.8],
        ["greenery", 517, 12, 1.3, 0.9], ["greenery", 526, 10.5, 1.1, 2.2]],
    reef: [["arch", 946, 23, 8.9, 0.65], ["greenery", 794, 12, 1.2, 2.7]],
    rail: [["pine", 654, 19, 11.6, 0.4], ["pine", 647, 26, 9.4, 1.2],
        ["arch", 837, 22, 8.5, 0.5], ["greenery", 813, 13, 1.15, 0.6], ["greenery", 824, 14.2, 1.4, 1.9]],
    stunt: [["greenery", 466, -13, 1.5, 0.6], ["pine", 593, 20, 10.8, 1.25]],
};

const geometry = new Map<Model, ReturnType<typeof unpackMeshes>[number]>();

export function floatingArch(scene: Scene): Mesh {
    return makeModel(scene, "arch");
}

export function drawCoralModels(scene: Scene, course: Course): void {
    const original = makeModel(scene, "coral");

    const sites = [[320, -15, 22, 0.5], [421, 15, 26, -0.72], [507, -17, 24, 0.85]] as const;
    for (const [index, [distance, lateral, height, turn]] of sites.entries()) {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const ground = course.ground.at(at.x, at.z) ?? -40;
        const mesh = index === 0 ? original : original.clone(original.name, null, true);
        mesh.position.set(at.x, ground - 0.52, at.z);
        mesh.scaling.set(height * 0.26, height, height * 0.29);
        mesh.rotation.y = Math.atan2(row.dx, row.dz) + turn;
    }
}

export function drawLandmarkModels(scene: Scene, course: Course): void {
    const placed = new Map<Model, Mesh>();
    for (const [id, distance, lateral, height, turn] of sites[course.track.id] ?? []) {
        const row = course.at(distance);
        const point = pointOnRoute(row, lateral);
        const ground = course.ground.at(point.x, point.z);
        if (ground === undefined || ground < -0.1) continue;
        const source = placed.get(id);
        const tint = id === "greenery" && course.track.id === "ruins" ? "#e3cea0" : undefined;
        const mesh = source ? source.clone(source.name, null, true) : makeModel(scene, id, tint);
        if (!source) placed.set(id, mesh);
        const foot = height * (id === "pine" ? 0.08 : id === "arch" ? 0.34 : 0.23);
        const base = Math.min(ground, ...[-1, 1].flatMap(x => [-1, 1].map(z =>
            course.ground.at(point.x + x * foot, point.z + z * foot) ?? ground)));
        mesh.position.set(point.x, base - height * 0.045, point.z);
        mesh.scaling.setAll(height);
        mesh.rotation.y = Math.atan2(row.dx, row.dz) + turn;
    }
}

function makeModel(scene: Scene, id: Model, tint = "#eee3d5"): Mesh {
    const asset = models[id];
    const shape = geometry.get(id) ?? unpackMeshes(asset.geometry)[0]!;
    geometry.set(id, shape);
    const mesh = fromPacked(scene, asset.name, shape);
    const finish = material(scene, asset.name, tint);
    finish.diffuseTexture = new Texture(asset.color, scene);
    finish.specularColor.set(0.06, 0.06, 0.06);
    if (id === "coral") finish.emissiveColor.set(0.08, 0.037, 0.028);
    mesh.material = finish;
    mesh.receiveShadows = true;
    return mesh;
}
