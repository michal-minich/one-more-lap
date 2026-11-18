import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { icebreakerHull } from "../../../game/course/frosthaven/harbor.ts";
import type { FrosthavenHarbor } from "../../../game/course/frosthaven/harbor.ts";
import { material } from "../../materials.ts";
import { batchRigidMeshes } from "../../rigid-meshes.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawIcebreaker(scene: Scene, at: FrosthavenHarbor["icebreaker"]): void {
    const root = new TransformNode("Frosthaven icebreaker", scene);
    root.position.set(at.x, at.y, at.z);
    root.rotation.y = at.yaw;
    root.scaling.setAll(at.scale);
    const ship = new ActorMeshes(scene, root);
    const hull = material(scene, "icebreaker red hull", "#a44d49");
    hull.diffuseTexture = surfaceTexture(scene, "weathered steel", 2, 1);
    const white = material(scene, "icebreaker cream superstructure", "#e2dccc");
    white.diffuseTexture = surfaceTexture(scene, "dusty enamel");
    const slate = material(scene, "icebreaker deck plates", "#434f58");
    slate.diffuseTexture = surfaceTexture(scene, "weathered steel");
    const window = material(scene, "icebreaker bridge glazing", "#6f98a4");
    window.diffuseTexture = surfaceTexture(scene, "glazing");
    const light = material(scene, "icebreaker navigation lamps", "#e4a874");
    light.emissiveColor.set(0.51, 0.24, 0.11);
    ship.hull("icebreaker heavy hull", [icebreakerHull.width, icebreakerHull.height, icebreakerHull.length], [0, icebreakerHull.lift, 0], hull);
    ship.hull("icebreaker rubbing band", [12.5, 0.78, 40.3], [0, 4.79, 0], white);
    ship.hull("icebreaker main deck", [12.4, 0.37, 39.4], [0, 5.11, 0], slate);
    ship.hull("icebreaker deckhouse", [8.8, 3.8, 15.0], [0, 7, -0.47], white);
    ship.hull("icebreaker wheelhouse", [9.7, 2.12, 7.9], [0, 9.6, 3.1], white);
    ship.hull("icebreaker bridge window ribbon", [9.79, 1.05, 8.01], [0, 9.84, 3.12], window);
    ship.hull("icebreaker wheelhouse cap", [10.1, 0.38, 8.47], [0, 10.85, 3.1], white);
    for (const side of [-1, 1]) {
        for (const z of [-6.9, -4.45, -1.95, 0.48, 2.95, 5.38]) {
            ship.oval("icebreaker cabin porthole rim", [0.18, 0.86, 0.88], [side * 4.36, 7.28, z], slate);
            ship.oval("icebreaker cabin porthole glass", [0.13, 0.61, 0.64], [side * 4.46, 7.28, z], light);
        }
        for (const z of [0.7, 2.3, 4.2, 5.5]) {
            ship.box("bridge window mullion", [0.14, 1.2, 0.13], [side * 4.9, 9.8, z], white);
        }
        ship.box("icebreaker exhaust stack", [1.14, 3.9, 1.33], [side * 2.45, 10.47, -4.25], hull);
        ship.box("icebreaker stack collar", [1.24, 0.45, 1.45], [side * 2.45, 12.36, -4.25], slate);
        ship.box("aft working lamp", [0.51, 0.45, 0.47], [side * 3.67, 6.0, -10.9], light);
        ship.box("deck railing", [0.13, 0.19, 26.6], [side * 5.46, 6.01, 0.04], white);
        for (const z of [-13, -8.7, -4.35, 0, 4.35, 8.7, 13]) {
            ship.box("deck rail post", [0.16, 0.97, 0.16], [side * 5.46, 5.53, z], slate);
        }
    }
    ship.box("icebreaker mast", [0.44, 6.47, 0.42], [0, 13.98, 0.8], white);
    ship.box("icebreaker radar spreader", [5.1, 0.22, 0.48], [0, 15.7, 0.8], slate);
    ship.box("icebreaker masthead lamp", [0.37, 0.34, 0.41], [0, 17.26, 0.81], light);
    batchRigidMeshes(root);
}
