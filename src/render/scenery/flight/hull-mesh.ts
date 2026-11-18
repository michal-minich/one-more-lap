import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";

type Corner = readonly [number, number, number];
const rim = [[-0.39, -0.50], [0.39, -0.50], [0.50, -0.38], [0.50, 0.38],
    [0.39, 0.50], [-0.39, 0.50], [-0.50, 0.38], [-0.50, -0.38]] as const;

export function chamferedHull(scene: Scene, name: string): Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const levels = [[-0.5, 0.85], [-0.31, 1], [0.36, 1], [0.50, 0.88]] as const;
    const rings = levels.map(([y, scale]): Corner[] => rim.map(([x, z]) => [x * scale, y, z * scale]));
    const panel = (corners: readonly Corner[], mapping: readonly number[]): void => {
        const start = positions.length / 3;
        for (const corner of corners) positions.push(...corner);
        uv.push(...mapping);
        for (let i = 1; i + 1 < corners.length; i++) indices.push(start, start + i, start + i + 1);
    };
    for (let row = 1; row < rings.length; row++) {
        const low = rings[row - 1]!;
        const high = rings[row]!;
        for (let i = 0; i < rim.length; i++) {
            const j = (i + 1) % rim.length;
            panel([low[i]!, low[j]!, high[j]!, high[i]!], [0, 0, 1, 0, 1, 1, 0, 1]);
        }
    }
    const bottom = rings[0]!.toReversed();
    const top = rings.at(-1)!;
    for (const cap of [bottom, top]) {
        panel(cap, cap.flatMap(([x, , z]) => [x + 0.5, z + 0.5]));
    }
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.normals = normals;
    data.uvs = uv;
    const mesh = new Mesh(name, scene);
    data.applyToMesh(mesh);
    return mesh;
}
