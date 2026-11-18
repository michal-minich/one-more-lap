import type { Scene } from "@babylonjs/core/scene.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { material } from "../../materials.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { ActorMeshes } from "./actor-meshes.ts";

export class Spacecraft {
    readonly #scene: Scene;
    readonly #cream;
    readonly #oxide;
    readonly #dark;
    readonly #glass;
    readonly #plasma;
    readonly #marker;
    readonly #alloy;

    constructor(scene: Scene) {
        this.#scene = scene;
        this.#cream = material(scene, "spacecraft ceramic shell", "#d5cbaf");
        this.#cream.diffuseTexture = surfaceTexture(scene, "ares ceramic");
        this.#cream.specularColor.set(0.31, 0.29, 0.24);
        this.#oxide = material(scene, "spacecraft orange thermal panels", "#bf7651");
        this.#oxide.diffuseTexture = surfaceTexture(scene, "ares enamel");
        this.#alloy = material(scene, "brushed spacecraft ribs", "#a0a7a8");
        this.#alloy.diffuseTexture = surfaceTexture(scene, "weathered steel");
        this.#alloy.specularColor.set(0.29, 0.32, 0.35);
        this.#marker = material(scene, "survey vehicle livery", "#e9b679");
        this.#dark = material(scene, "spacecraft shaded service structure", "#424752");
        this.#dark.diffuseTexture = surfaceTexture(scene, "thermal cladding");
        this.#glass = material(scene, "smoked cabin windows", "#426675");
        this.#glass.specularColor.set(0.46, 0.63, 0.65);
        this.#plasma = material(scene, "soft thrust illumination", "#7ee0d9");
        this.#plasma.emissiveColor.set(0.28, 0.63, 0.57);
    }

    carrier(): TransformNode {
        const root = new TransformNode("hovering Ares survey carrier", this.#scene);
        const part = new ActorMeshes(this.#scene, root);
        part.hull("armored carrier hull", [28, 7, 77], [0, 0, -3], this.#dark);
        part.hull("carrier keel", [20.2, 4.2, 65], [0, -4.1, -5], this.#dark);
        part.hull("stepped bow", [21.3, 5.6, 12.8], [0, -0.7, 40], this.#oxide);
        part.box("bow docking bulkhead", [14.2, 2.8, 0.8], [0, -0.9, 46.5], this.#dark);
        part.box("upper freight deck", [19, 2.5, 62], [0, 4.45, -2], this.#oxide);
        part.box("bridge base", [15.4, 3.4, 18], [0, 6.2, 21.8], this.#cream);
        part.box("bridge visor", [13.6, 1.18, 18.3], [0, 7.05, 21.8], this.#glass);
        part.box("bridge top armor", [16.4, 0.65, 18.7], [0, 7.91, 21.8], this.#cream);
        part.box("drive section", [16.5, 3.8, 15.8], [0, 6.0, -27.5], this.#dark);
        part.box("antenna tower", [1.2, 6.4, 1.4], [-4.3, 8.3, -26.5], this.#oxide);
        part.box("antenna signal bar", [7.3, 0.42, 1.7], [-4.3, 11.1, -26.5], this.#glass);
        for (const side of [-1, 1]) {
            const shoulder = part.box("angled bow shoulder", [6.6, 4.9, 19.4], [side * 12.3, -0.25, 35], this.#oxide);
            shoulder.rotation.y = -side * 0.24;
            part.box("side hangar belt", [1.15, 2.52, 48.5], [side * 14.03, 0.55, 7.6], this.#dark);
            part.box("belt armoring above ports", [0.65, 0.48, 51], [side * 14.72, 1.93, 7.6], this.#alloy);
            part.box("lower deck sill", [0.59, 0.53, 55], [side * 14.23, -1.12, 6.0], this.#alloy);
            for (let stripe = 0; stripe < 3; stripe++) {
                const mark = part.box("bow livery marks", [0.19, 2.03, 0.66],
                    [side * 13.9, 0.22, 33.4 + stripe * 1.49], this.#marker);
                mark.rotation.x = 0.44;
            }
            part.box("painted flight stripe", [0.32, 0.58, 62], [side * 14.2, 2.33, 3.7], this.#oxide);
            part.box("engine pylon", [10, 3, 22], [side * 16.1, -0.65, -22], this.#cream);
            part.hull("lift engine nacelle", [8.6, 7.9, 34.2], [side * 21.2, -1.25, -23.5], this.#oxide);
            part.box("lift engine upper armor", [7.4, 1.6, 33], [side * 21.2, 3.0, -23.5], this.#dark);
            part.box("lift engine exhaust opening", [6.5, 5.2, 0.82], [side * 21.2, -1.48, -40.75], this.#dark);
            part.box("rear exhaust glow", [3.8, 1.9, 0.29], [side * 21.2, -1.48, -41.23], this.#plasma);
            for (const z of [-26.1, -23.8, -21.5]) {
                part.box("cyan carrier flight strip", [0.13, 0.27, 1.36],
                    [side * 25.54, -0.75, z], this.#plasma);
            }
            for (const z of [-32.5, -29.4, -26.3, -23.2, -20.1, -17]) {
                part.box("engine radiator inset", [0.18, 1.25, 1.25], [side * 25.42, 0.51, z], this.#dark);
            }
            for (const z of [-31, -21, -11]) {
                part.box("recessed lift outlet", [5.8, 0.50, 6.8], [side * 21.2, -5.38, z], this.#dark);
                part.box("lift outlet light", [3.8, 0.19, 4.85], [side * 21.2, -5.72, z], this.#plasma);
            }
            for (let bay = 0; bay < 6; bay++) {
                const z = -11.4 + bay * 7;
                part.box("hangar viewing port", [0.18, 0.96, 3.64], [side * 14.7, 0.75, z], this.#glass);
                part.box("hangar mullion", [0.25, 1.1, 0.20], [side * 14.73, 0.75, z], this.#alloy);
            }
        }
        return root;
    }
}
