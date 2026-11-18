import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";

export function unpackMeshes(source: string): readonly VertexData[] {
    const bytes = Uint8Array.from(atob(source.slice(source.indexOf(",") + 1)), char => char.charCodeAt(0));
    const header = new DataView(bytes.buffer);
    const meshes: VertexData[] = [];
    let offset = 0;
    while (offset < bytes.byteLength) {
        const vertices = header.getUint32(offset, true);
        const indices = header.getUint32(offset + 4, true);
        offset += 8;
        const data = new VertexData();
        data.positions = new Float32Array(bytes.buffer, offset, vertices * 3);
        offset += vertices * 12;
        data.normals = new Float32Array(bytes.buffer, offset, vertices * 3);
        offset += vertices * 12;
        data.uvs = new Float32Array(bytes.buffer, offset, vertices * 2);
        offset += vertices * 8;
        data.indices = new Uint16Array(bytes.buffer, offset, indices);
        offset += (indices * 2 + 3) & ~3;
        meshes.push(data);
    }
    return meshes;
}

export function fromPacked(scene: Scene, name: string, data: VertexData, updatable = false): Mesh {
    const mesh = new Mesh(name, scene);
    data.applyToMesh(mesh, updatable);
    mesh.isPickable = false;
    return mesh;
}
