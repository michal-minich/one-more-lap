import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { material } from "../materials.ts";

export class BoostJets {
    readonly #root: TransformNode;

    constructor(scene: Scene, car: TransformNode, spec: CarSpec) {
        this.#root = new TransformNode("rocket boost jets", scene);
        this.#root.parent = car;
        this.#root.position.set(0, -0.21, -spec.length * 0.5);
        this.#root.setEnabled(false);
        const glow = material(scene, "rocket exhaust", "#ff9946");
        glow.disableLighting = true;
        glow.emissiveColor.set(0.88, 0.32, 0.075);
        const hot = material(scene, "rocket core", "#ffe9aa");
        hot.disableLighting = true;
        hot.emissiveColor.set(1, 0.78, 0.33);
        for (const side of [-1, 1]) {
            const flare = MeshBuilder.CreateCylinder("rocket flame", { diameterBottom: 0.27, diameterTop: 0.03,
                height: 0.75, tessellation: 8 }, scene);
            flare.rotation.x = -Math.PI / 2;
            flare.position.set(side * spec.width * 0.29, 0, -0.40);
            flare.parent = this.#root;
            flare.material = glow;
            flare.isPickable = false;
            const core = MeshBuilder.CreateCylinder("bright exhaust core", { diameterBottom: 0.19, diameterTop: 0.03,
                height: 0.40, tessellation: 8 }, scene);
            core.rotation.x = -Math.PI / 2;
            core.position.set(side * spec.width * 0.29, 0.002, -0.15);
            core.parent = this.#root;
            core.material = hot;
            core.isPickable = false;
        }
    }

    update(active: boolean, time: number): void {
        this.#root.setEnabled(active);
        if (active) this.#root.scaling.z = 1 + Math.sin(time * 39) * 0.16;
    }
}
