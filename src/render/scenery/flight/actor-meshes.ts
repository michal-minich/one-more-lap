import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { chamferedHull } from "./hull-mesh.ts";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";

type Vector = readonly [number, number, number];

export class ActorMeshes {
    readonly #scene: Scene;
    readonly #root: TransformNode;

    constructor(scene: Scene, root: TransformNode) {
        this.#scene = scene;
        this.#root = root;
    }

    box(name: string, size: Vector, position: Vector, paint: StandardMaterial): Mesh {
        return this.#attach(MeshBuilder.CreateBox(name, { size: 1 }, this.#scene), size, position, paint);
    }

    hull(name: string, size: Vector, position: Vector, paint: StandardMaterial): Mesh {
        return this.#attach(chamferedHull(this.#scene, name), size, position, paint);
    }

    oval(name: string, size: Vector, position: Vector, paint: StandardMaterial): Mesh {
        return this.#attach(MeshBuilder.CreateSphere(name, { diameter: 1, segments: 18 }, this.#scene), size, position, paint);
    }

    #attach(mesh: Mesh, size: Vector, position: Vector, paint: StandardMaterial): Mesh {
        mesh.parent = this.#root;
        mesh.scaling.set(...size);
        mesh.position.set(...position);
        mesh.material = paint;
        mesh.isPickable = false;
        return mesh;
    }
}
