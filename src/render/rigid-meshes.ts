import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";

export function batchRigidMeshes(root: TransformNode, direct = true): void {
    const groups = new Map<string, Mesh[]>();
    for (const mesh of root.getChildMeshes(direct)) {
        if (!(mesh instanceof Mesh) || !mesh.material) continue;
        const signature = mesh.material.uniqueId + ":" + mesh.getVerticesDataKinds().sort().join(",");
        const group = groups.get(signature);
        if (group) group.push(mesh);
        else groups.set(signature, [mesh]);
    }
    for (const group of groups.values()) {
        if (group.length < 2) continue;
        const combined = Mesh.MergeMeshes(group, true, true);
        if (!combined) continue;
        combined.setParent(root);
        combined.isPickable = false;
    }
}
