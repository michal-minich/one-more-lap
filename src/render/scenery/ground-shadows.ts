import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { isLandmarkTree } from "../../game/course/biome-landmarks.ts";
import type { Course } from "../../game/course/course.ts";
import type { Point } from "../../game/point.ts";
import { contactShadowMaterial } from "./contact-shadow.ts";
import { surface } from "./surface-mesh.ts";

export function drawGroundShadows(scene: Scene, course: Course): StandardMaterial {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const stamp = (ground: Point, width: number, depth: number, yaw: number, shift = 0): void => {
        const base = positions.length / 3;
        const sin = Math.sin(yaw);
        const cos = Math.cos(yaw);
        for (const [side, end] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
            const x = ground.x + side * width * cos + (end * depth + shift) * sin;
            const z = ground.z - side * width * sin + (end * depth + shift) * cos;
            const y = course.ground.at(x, z, ground.y + 4.1) ?? ground.y;
            positions.push(x, y + 0.083, z);
            uv.push((side + 1) / 2, (end + 1) / 2);
        }
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    };
    for (const { ground, scale } of course.vegetation.trees) stamp(ground, 2.4 * scale, 3.55 * scale, -0.52, 1.3 * scale);
    for (const { ground, scale, yaw } of course.vegetation.boulders) {
        if (scale > 1.35) stamp(ground, 0.82 * scale, 0.79 * scale, yaw);
    }
    for (const landmark of course.biomeLandmarks) {
        const tree = isLandmarkTree(landmark.kind);
        const width = landmark.radius * (tree ? 0.89 : 0.84);
        stamp(landmark, width, width * (tree ? 1.14 : 0.86), tree ? -0.52 : landmark.yaw, tree ? width * 0.38 : 0);
    }
    for (const { position, radius, yaw } of course.outposts) stamp(position, radius * 0.81, radius * 0.79, yaw);
    if (course.shelter) {
        for (const column of course.shelter.columns) stamp(column, 2.4, 3.7, -0.40, 0.9);
    }
    const shade = contactShadowMaterial(scene, 105);
    if (indices.length > 0) {
        const shadows = surface(scene, "soft ground shadows", {
            positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
        }, shade);
        shadows.receiveShadows = false;
    }
    return shade;
}
