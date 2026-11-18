import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { importedModel } from "./imported-model.ts";
import { fleetTexture } from "../car/fleet/model-textures.ts";
import geometry from "./manta.bin?inline";
import finishes from "./manta.json" with { type: "json" };

interface MantaMaterials {
    readonly paint: StandardMaterial;
    readonly glass: StandardMaterial;
    readonly tails: StandardMaterial;
}

export function mantaModel(scene: Scene, root: TransformNode, materials?: MantaMaterials) {
    return importedModel(scene, root, geometry, finishes, materials && (name => {
        switch (name) {
            case "Manta ivory paint": return materials.paint;
            case "Canopy glazing": return materials.glass;
            case "Amber brake strip": return materials.tails;
            default: return undefined;
        }
    }), (paint, finish) => {
        if (finish.textured) paint.diffuseTexture = fleetTexture(scene, "ceramic");
    });
}
