import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { material } from "../../materials.ts";
import { fromPacked, unpackMeshes } from "../../packed-mesh.ts";
import arch from "../landmark-models/reef-arch.bin?inline";
import atlas from "../landmark-models/reef-arch.jpg?inline";

let geometry: ReturnType<typeof unpackMeshes> | undefined;

export function drawReefArches(scene: Scene, course: Course): void {
    geometry ??= unpackMeshes(arch);
    const finish = material(scene, "textured reef limestone and coral", "#f3eee3");
    finish.diffuseTexture = new Texture(atlas, scene);
    finish.emissiveColor.set(0.07, 0.046, 0.038);
    finish.specularColor.set(0.035, 0.041, 0.055);
    for (const [distance, side, height] of [[357, -1, 26], [483, 1, 22], [557, -1, 29]] as const) {
        const row = course.at(distance);
        const at = pointOnRoute(row, side * 21.5);
        const ground = course.ground.at(at.x, at.z) ?? -40;
        const mesh = fromPacked(scene, "Coral Passage Reef Arch", geometry[0]!);
        mesh.material = finish;
        mesh.position.set(at.x, ground - 0.6, at.z);
        mesh.scaling.set(height * 0.64, height, height * 0.33);
        mesh.rotation.y = Math.atan2(row.dx, row.dz) + side * 0.82;
    }
}
