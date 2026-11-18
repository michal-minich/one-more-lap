import RAPIER from "@dimforge/rapier3d-compat";
import type { Surface } from "../course/surface.ts";

export function surfaceCollider(surfaces: readonly Pick<Surface, "positions" | "indices">[]): RAPIER.ColliderDesc {
    const vertices = new Float32Array(surfaces.reduce((sum, surface) => sum + surface.positions.length, 0));
    const indices = new Uint32Array(surfaces.reduce((sum, surface) => sum + surface.indices.length, 0));
    let vertexOffset = 0;
    let triangleOffset = 0;
    for (const surface of surfaces) {
        vertices.set(surface.positions, vertexOffset * 3);
        for (let i = 0; i < surface.indices.length; i += 3) {
            // The rendering meshes use Babylon's left-handed winding.
            indices[triangleOffset++] = vertexOffset + surface.indices[i]!;
            indices[triangleOffset++] = vertexOffset + surface.indices[i + 2]!;
            indices[triangleOffset++] = vertexOffset + surface.indices[i + 1]!;
        }
        vertexOffset += surface.positions.length / 3;
    }
    return RAPIER.ColliderDesc.trimesh(vertices, indices, RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES);
}
