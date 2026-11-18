import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { material } from "../../materials.ts";
import { fromPacked, unpackMeshes } from "../../packed-mesh.ts";
import type { CabinGlass, Quad } from "../cabin.ts";
import bodyModel from "./studio-body.bin?inline";
import enamel from "./studio-enamel.jpg?inline";
import wheelModel from "./studio-wheels.bin?inline";

interface StudioMaterials {
    readonly paint: StandardMaterial;
    readonly glass: StandardMaterial;
    readonly lights: StandardMaterial;
    readonly tails: StandardMaterial;
}

let bodyParts: ReturnType<typeof unpackMeshes> | undefined;
let wheelParts: ReturnType<typeof unpackMeshes> | undefined;

export function studioBody(
    scene: Scene, root: TransformNode, front: TransformNode, rear: TransformNode, finishes: StudioMaterials,
) {
    bodyParts ??= unpackMeshes(bodyModel);
    const { paint, glass, lights, tails } = finishes;
    paint.diffuseTexture = new Texture(enamel, scene);
    const pinstripe = material(scene, "Kestrel ivory pinstripe", "#e8c988");
    const cladding = material(scene, "Kestrel blue cladding", "#28314b");
    const housings = material(scene, "Kestrel graphite housings", "#242831");
    const materials = [pinstripe, glass, paint, cladding, lights, housings, tails];
    const meshes = bodyParts.map((data, index) => {
        const finish = materials[index]!;
        finish.backFaceCulling = false;
        const mesh = fromPacked(scene, finish.name, data, finish === paint);
        mesh.material = finish;
        mesh.parent = finish === lights ? front : finish === tails ? rear : root;
        return mesh;
    });
    return { shell: meshes[2]!, cabin: studioWindows() };
}

function studioWindows(): CabinGlass {
    const corner = (x: number, y: number, z: number): Vector3 =>
        new Vector3(x * 1.98 / 2.12, (y - 0.419) * 0.348 / 0.418 - 0.375, (z + 0.04) * 2.53 / 2.52);
    const face = (bottom: readonly [number, number, number], top: readonly [number, number, number]): Quad => [
        corner(-bottom[0], bottom[1], bottom[2]), corner(...bottom), corner(...top), corner(-top[0], top[1], top[2]),
    ];
    return {
        windshield: face([0.707, 0.976, 0.83], [0.58, 1.48, 0.075]),
        rearWindow: face([0.64, 1.223, -1.05], [0.56, 1.51, -0.57]),
    };
}

export function studioWheel(
    scene: Scene, hub: TransformNode, side: number, materials: readonly StandardMaterial[],
): void {
    wheelParts ??= unpackMeshes(wheelModel);
    const start = side < 0 ? 0 : 3;
    for (const [index, finish] of materials.entries()) {
        const mesh = fromPacked(scene, "Kestrel " + finish.name, wheelParts[start + index]!);
        mesh.material = finish;
        mesh.parent = hub;
    }
}
