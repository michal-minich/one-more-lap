import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { RaceCoin } from "../../game/race/coin-field.ts";
import { material } from "../materials.ts";

interface Token {
    readonly root: TransformNode;
    readonly height: number;
}

export class CoinModels {
    readonly #coins = new Map<number, Token>();

    constructor(scene: Scene, coins: readonly RaceCoin[]) {
        if (!coins.length) return;
        const rim = material(scene, "coin brass rim", "#ca8939");
        const face = material(scene, "gold coin", "#edbd48");
        face.emissiveColor.set(0.20, 0.095, 0.015);
        face.specularColor.set(0.72, 0.56, 0.26);
        face.specularPower = 58;
        for (const { index, position } of coins) {
            const root = new TransformNode("collectible coin", scene);
            root.position.set(position.x, position.y, position.z);
            const edge = MeshBuilder.CreateCylinder("coin edge", { diameter: 0.88, height: 0.115, tessellation: 18 }, scene);
            edge.rotation.x = Math.PI / 2;
            edge.material = rim;
            edge.parent = root;
            const inset = MeshBuilder.CreateCylinder("coin faces", { diameter: 0.74, height: 0.125, tessellation: 18 }, scene);
            inset.rotation.x = Math.PI / 2;
            inset.material = face;
            inset.parent = root;
            for (const side of [-1, 1]) {
                const mark = MeshBuilder.CreateBox("embossed coin mark", { width: 0.073, height: 0.37, depth: 0.025 }, scene);
                mark.position.z = side * 0.069;
                mark.rotation.z = -0.19;
                mark.material = rim;
                mark.parent = root;
                mark.isPickable = false;
            }
            edge.isPickable = false;
            inset.isPickable = false;
            this.#coins.set(index, { root, height: position.y });
        }
    }

    pick(indices: readonly number[]): void {
        for (const index of indices) this.#coins.get(index)?.root.setEnabled(false);
    }

    update(time: number): void {
        for (const [index, { root, height }] of this.#coins) {
            if (!root.isEnabled()) continue;
            root.rotation.y = time * 1.9 + index * 1.3;
            root.position.y = height + Math.sin(time * 2.35 + index) * 0.12;
        }
    }
}
