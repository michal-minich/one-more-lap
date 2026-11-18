import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Surface } from "../../game/course/surface.ts";

export function surface(
    scene: Scene, name: string, shape: Surface, mat: StandardMaterial,
    colors?: (normals: readonly number[]) => Float32Array,
): Mesh {
    const mesh = new Mesh(name, scene);
    const data = new VertexData();
    const normals: number[] = [];
    VertexData.ComputeNormals(shape.positions, shape.indices, normals);
    if (shape.seamColumns !== undefined) blendSeamNormals(normals, shape.seamColumns);
    data.positions = shape.positions;
    data.indices = shape.indices;
    data.uvs = shape.uv;
    data.normals = normals;
    if (colors) data.colors = colors(normals);
    data.applyToMesh(mesh);
    mesh.material = mat;
    mesh.receiveShadows = true;
    mesh.isPickable = false;
    return mesh;
}

function blendSeamNormals(normals: number[], columns: number): void {
    const end = (Math.floor(normals.length / (columns * 3)) - 1) * columns * 3;
    for (let start = 0; start < columns * 3; start += 3) {
        const x = normals[start]! + normals[end + start]!;
        const y = normals[start + 1]! + normals[end + start + 1]!;
        const z = normals[start + 2]! + normals[end + start + 2]!;
        const length = Math.hypot(x, y, z) || 1;
        normals[start] = normals[end + start] = x / length;
        normals[start + 1] = normals[end + start + 1] = y / length;
        normals[start + 2] = normals[end + start + 2] = z / length;
    }
}
