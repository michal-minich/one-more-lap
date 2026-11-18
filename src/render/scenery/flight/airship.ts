import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { material } from "../../materials.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { ActorMeshes } from "./actor-meshes.ts";

export function drawAirship(scene: Scene): (time: number) => void {
    const airship = new TransformNode("Cloudfold airship", scene);
    const parts = new ActorMeshes(scene, airship);
    const envelope = material(scene, "pearl airship envelope", "#fff1da");
    envelope.diffuseTexture = surfaceTexture(scene, "airship fabric");
    envelope.specularColor.set(0.55, 0.45, 0.36);
    const red = material(scene, "coral airship trim", "#c25a62");
    red.diffuseTexture = envelope.diffuseTexture;
    const brass = material(scene, "airship gold", "#cc9d58");
    const glass = material(scene, "airship windows", "#5986a5");
    glass.emissiveColor.set(0.072, 0.129, 0.17);
    const frame = material(scene, "airship frame", "#4f526a");
    frame.diffuseTexture = surfaceTexture(scene, "weathered steel");
    parts.oval("airship envelope", [15, 14, 49], [0, 0, 0], envelope);
    parts.oval("airship racing stripe", [15.05, 5.6, 48.5], [0, 0, 0], red);
    parts.oval("gold nose cap", [5.8, 5.0, 6.1], [0, 0, 22.7], brass);
    parts.oval("airship gondola", [5.4, 4.0, 14], [0, -7.4, 3], frame);
    parts.oval("gondola windscreen", [5.25, 2.4, 13.3], [0, -6.75, 3.25], glass);
    parts.box("upper tail fin", [0.58, 7.7, 9.2], [0, 4.05, -19.2], red).rotation.x = 0.37;
    parts.box("lower tail fin", [0.58, 5.5, 7.8], [0, -3.3, -20], red).rotation.x = -0.38;
    parts.box("horizontal tailplane", [13.6, 0.6, 7.0], [0, 0, -20], red);
    for (const side of [-1, 1]) {
        parts.box("engine strut", [5.0, 0.53, 0.5], [side * 3.7, -7.35, 0], frame);
        parts.oval("gold engine pod", [2.25, 2.25, 5.7], [side * 6.2, -7.32, 0.55], brass);
        for (let index = 0; index < 5; index++) {
            parts.oval("cabin porthole", [0.36, 0.64, 0.94], [side * 2.47, -7.14, index * 1.60 - 0.75], glass);
        }
    }
    return time => {
        const angle = 1.18 + time * 0.018;
        airship.position.set(Math.sin(angle) * 181 + 15, 132 + Math.sin(angle * 1.7) * 6,
            Math.cos(angle) * 136 - 9);
        airship.rotation.set(Math.cos(angle * 1.7) * 0.016,
            Math.atan2(Math.cos(angle) * 181, -Math.sin(angle) * 136), Math.sin(angle * 2) * 0.05);
    };
}
