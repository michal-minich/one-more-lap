import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { material } from "../../materials.ts";
import { batchRigidMeshes } from "../../rigid-meshes.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawParkRides(scene: Scene, course: Course): (time: number) => void {
    const at = course.skywheelGrounds!.carousel;
    const base = new TransformNode("Skywheel carousel pavilion", scene);
    base.position.set(at.x, at.y, at.z);
    const roof = material(scene, "carousel porcelain", "#af5451");
    roof.diffuseTexture = surfaceTexture(scene, "skywheel enamel");
    const edge = material(scene, "carousel painted iron", "#327885");
    edge.diffuseTexture = surfaceTexture(scene, "skywheel enamel");
    const brass = material(scene, "carousel brass fittings", "#d8a568");
    brass.diffuseTexture = surfaceTexture(scene, "skywheel enamel");
    const stage = new ActorMeshes(scene, base);
    stage.hull("carousel base", [14, 0.96, 14], [0, 0.48, 0], edge);
    stage.box("carousel axle", [0.54, 6.2, 0.54], [0, 3.8, 0], edge);
    for (const [y, width, height] of [[5.5, 14.6, 0.68], [6.0, 13.3, 1.7], [7.55, 6.2, 0.84]] as const) {
        const tier = MeshBuilder.CreateCylinder("stepped carousel canopy", {
            diameterBottom: width, diameterTop: width * 0.49, height, tessellation: 18,
        }, scene);
        tier.parent = base;
        tier.position.y = y;
        tier.material = y === 5.5 ? edge : roof;
    }
    for (let index = 0; index < 16; index++) {
        const angle = index * Math.PI / 8;
        const x = Math.sin(angle) * 7.1;
        const z = Math.cos(angle) * 7.1;
        const scallop = stage.hull("carousel fascia scallop", [2.6, 0.41, 0.24], [x, 5.17, z],
            index % 2 ? brass : roof);
        scallop.rotation.y = angle;
    }
    stage.oval("carousel brass finial", [0.59, 0.68, 0.59], [0, 8.25, 0], brass);
    const platform = new TransformNode("slow turning carousel", scene);
    platform.parent = base;
    platform.position.y = 0.99;
    const ride = new ActorMeshes(scene, platform);
    const reds = material(scene, "carousel red seat", "#b94f52");
    const cream = material(scene, "carousel cream seat", "#e7cd9d");
    for (let i = 0; i < 9; i++) {
        const angle = i * Math.PI * 2 / 9;
        const x = Math.sin(angle) * 4.95;
        const z = Math.cos(angle) * 4.95;
        ride.box("carousel brass pole", [0.09, 4.35, 0.09], [x, 2.2, z], roof);
        const cab = ride.hull("carousel toy carriage", [2.1, 0.73, 1.2], [x, 1.0 + (i % 2) * 0.38, z], i % 2 ? reds : cream);
        cab.rotation.y = angle + Math.PI / 2;
        const bow = ride.oval("carousel carriage bonnet", [0.80, 0.66, 0.69], [x, 1.44 + (i % 2) * 0.38, z], edge);
        bow.rotation.y = angle;
    }
    batchRigidMeshes(base);
    batchRigidMeshes(platform);
    return time => { platform.rotation.y = time * 0.37; };
}
