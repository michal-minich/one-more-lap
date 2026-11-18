import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { material } from "../../materials.ts";
import { addBasaltRelief } from "../basalt-relief.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { channelLightSources, tintLavaFaces } from "./lava-light.ts";

export function drawEscarpment(scene: Scene, course: Course): void {
    const shape = course.lavaEscarpment;
    if (!shape) return;
    const stone = material(scene, "layered basalt across the lava", "#a5a2ac");
    stone.diffuseTexture = surfaceTexture(scene, "basalt");
    addBasaltRelief(scene, stone, 0.4);
    stone.specularColor.set(0.032, 0.029, 0.026);
    stone.emissiveColor.set(0.085, 0.072, 0.08);
    stone.backFaceCulling = false;
    const mesh = surface(scene, "fractured basalt escarpment", shape, stone);
    mesh.convertToFlatShadedMesh();
    tintLavaFaces(mesh, channelLightSources(course), 1.1);
}
