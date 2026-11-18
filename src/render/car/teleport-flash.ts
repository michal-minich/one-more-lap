import { Constants } from "@babylonjs/core/Engines/constants.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { material } from "../materials.ts";

const DURATION = 0.68;

export class TeleportFlash {
    readonly #rings: readonly [Mesh, Mesh];
    readonly #glow: StandardMaterial;
    #started: number | undefined;

    constructor(car: TransformNode) {
        const scene = car.getScene();
        this.#glow = material(scene, "teleport glow", "#d9faff");
        this.#glow.disableLighting = true;
        this.#glow.disableDepthWrite = true;
        this.#glow.alphaMode = Constants.ALPHA_ADD;
        this.#glow.emissiveColor.set(0.48, 0.87, 1);
        const makeRing = (index: number): Mesh => {
            const ring = MeshBuilder.CreateTorus("teleport ring " + index, {
                diameter: 4.4, thickness: 0.055, tessellation: 40,
            }, scene);
            ring.parent = car;
            ring.material = this.#glow;
            ring.isPickable = false;
            ring.setEnabled(false);
            return ring;
        };
        this.#rings = [makeRing(0), makeRing(1)];
    }

    trigger(time: number): void {
        this.#started = time;
        for (const ring of this.#rings) ring.setEnabled(true);
    }

    update(time: number): void {
        if (this.#started === undefined) return;
        const progress = (time - this.#started) / DURATION;
        if (progress >= 1) {
            this.#started = undefined;
            for (const ring of this.#rings) ring.setEnabled(false);
            return;
        }
        const [level, upright] = this.#rings;
        const spread = 0.69 + progress * 0.7;
        level.position.y = 0.15 + progress * 1.07;
        level.scaling.set(spread, spread, spread);
        upright.rotation.set(Math.PI * 0.5, progress * 1.6, 0.18);
        upright.position.y = 0.45;
        upright.scaling.set(spread, spread, spread);
        this.#glow.alpha = 0.76 * Math.sin(Math.PI * Math.min(1, progress + 0.16)) ** 1.3;
    }
}
