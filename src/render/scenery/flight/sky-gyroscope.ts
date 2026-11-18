import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { cloudfoldPortalStation } from "../../../game/course/sky-masonry.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawSkyGyroscope(scene: Scene, course: Course): (time: number) => void {
    const road = course.at(cloudfoldPortalStation);
    const at = pointOnRoute(road, -1.24, 23.6);
    const ceramic = material(scene, "gyroscope porcelain", "#d9bc94");
    ceramic.diffuseTexture = surfaceTexture(scene, "cloudfold ceramic");
    const copper = material(scene, "brushed copper gyroscope", "#dfaf85");
    copper.diffuseTexture = surfaceTexture(scene, "cloudfold copper", 2, 1);
    copper.specularColor.set(0.31, 0.16, 0.10);
    copper.emissiveColor.set(0.07, 0.035, 0.019);
    const lamp = material(scene, "suspended gyroscope lantern", "#f8d688");
    lamp.emissiveColor.set(0.46, 0.22, 0.085);
    const rings = [20, 16, 12].map((diameter, index) => {
        const ring = MeshBuilder.CreateTorus("kinetic gyroscope ring " + index,
            { diameter, thickness: 0.7 - 0.13 * index, tessellation: 48 }, scene);
        ring.position.set(at.x, at.y, at.z);
        ring.material = index === 1 ? ceramic : copper;
        ring.isPickable = false;
        return ring;
    });
    const core = MeshBuilder.CreateIcoSphere("gyroscope heart", { radius: 2.55, subdivisions: 1, flat: true }, scene);
    core.position.set(at.x, at.y, at.z);
    core.material = lamp;
    core.isPickable = false;
    const weights = MeshBuilder.CreateIcoSphere("suspended prism weights", { radius: 0.5, subdivisions: 1, flat: true }, scene);
    weights.material = ceramic;
    const pieces: Stamp[] = [];
    for (const [index, [distance, lateral, height, size]] of ([[1_204, 28, 16, 12], [1_290, -26, 9, 14], [535, -25, 18, 13],
        [578, 31, 26, 10], [1_333, 32, 6, 9]] as const).entries()) {
        const place = pointOnRoute(course.at(distance), lateral, height);
        pieces.push({ ...place, sx: size * 0.7, sy: size, sz: size * 0.7, yaw: index * 0.74, roll: index * 0.21 + 0.24 });
    }
    stamp(weights, pieces);
    return time => {
        for (const [index, ring] of rings.entries()) {
            ring.rotation.set(0.69 + index * 0.79 + Math.sin(time * 0.42 + index) * 0.38,
                index * 0.65 + time * (0.31 - index * 0.24), -0.35 + index * 0.26);
        }
        core.rotation.set(time * 0.16, time * 0.54, time * 0.21);
    };
}
