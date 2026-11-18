import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { material } from "../materials.ts";
import { fromPacked, unpackMeshes } from "../packed-mesh.ts";

interface Finish {
    readonly name: string;
    readonly color: string;
    readonly alpha: number;
    readonly glow: readonly number[] | null;
    readonly textured: boolean;
}

type MaterialFor = (name: string) => StandardMaterial | undefined;
const decoded = new Map<string, ReturnType<typeof unpackMeshes>>();

export function importedModel(scene: Scene, root: TransformNode, source: string, finishes: readonly Finish[],
    override?: MaterialFor, applyTexture?: (paint: StandardMaterial, finish: Finish) => void): Mesh[] {
    const geometry = decoded.get(source) ?? unpackMeshes(source);
    decoded.set(source, geometry);
    return finishes.map((finish, index) => {
        const custom = override?.(finish.name);
        const paint = custom ?? material(scene, finish.name, finish.color);
        if (finish.alpha < 1 && !custom) {
            paint.alpha = finish.alpha;
            paint.backFaceCulling = false;
        }
        if (finish.glow && !custom) {
            const [r, g, b] = finish.glow;
            paint.emissiveColor.set(r ?? 0, g ?? 0, b ?? 0);
        }
        if (!custom) applyTexture?.(paint, finish);
        const mesh = fromPacked(scene, finish.name, geometry[index]!, custom !== undefined);
        mesh.material = paint;
        mesh.parent = root;
        mesh.receiveShadows = true;
        return mesh;
    });
}
