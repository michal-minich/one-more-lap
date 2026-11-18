import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { boulderSizes } from "../../../game/course/vegetation/layout.ts";
import type { BoulderPlacement } from "../../../game/course/vegetation/layout.ts";
import { material } from "../../materials.ts";
import { fromPacked, unpackMeshes } from "../../packed-mesh.ts";
import model from "./pixal-basalt.bin?inline";
import image from "./pixal-basalt.jpg?inline";

const sites = [[57, 18], [179, 12.6], [334, 19]] as const;
let rock: ReturnType<typeof unpackMeshes>[number] | undefined;

export function drawPixalBasalt(scene: Scene, course: Course): ReadonlySet<BoulderPlacement> {
    const replaced = new Set<BoulderPlacement>();
    for (const [distance, lateral] of sites) {
        const point = pointOnRoute(course.at(distance), lateral);
        const placed = course.vegetation.boulders.find(({ ground }) => {
            return Math.hypot(ground.x - point.x, ground.z - point.z) < 0.05;
        });
        if (placed) replaced.add(placed);
    }
    if (replaced.size === 0) return replaced;

    const stone = material(scene, "Pixal3D textured basalt", "#d2c4d0");
    stone.diffuseTexture = new Texture(image, scene);
    stone.specularColor.set(0.07, 0.052, 0.05);
    stone.specularPower = 20;
    rock ??= unpackMeshes(model)[0]!;
    const original = fromPacked(scene, "Pixal3D basalt outcrop", rock);
    original.material = stone;
    for (const [index, { ground, yaw, shape, scale }] of [...replaced].entries()) {
        const mesh = index === 0 ? original : original.clone("Pixal3D basalt outcrop", null, true);
        const size = boulderSizes[shape];
        mesh.position.set(ground.x, ground.y + (size.lift - size.height * 0.78) * scale, ground.z);
        mesh.rotation.y = yaw;
        mesh.scaling.set(size.width * scale, size.height * scale * 0.78, size.depth * scale);
        mesh.isPickable = false;
    }
    return replaced;
}
