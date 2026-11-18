import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";

import { bodyOutline } from "../../game/vehicle/body-shapes.ts";
import type { BodyProfile, BodyShape } from "../../game/vehicle/body-shapes.ts";

export function loft(
    scene: Scene, name: string, profiles: readonly BodyProfile[], shape: BodyShape, mat: StandardMaterial,
): Mesh {
    const mesh = new Mesh(name, scene);
    const vertices = bodyOutline(profiles, shape);
    const faces: number[] = [];
    const half = shape.section.length;
    const sides = half * 2;
    for (let row = 1; row < profiles.length; row++) {
        for (let i = 0; i < sides; i++) {
            const a = (row - 1) * sides + i;
            const b = (row - 1) * sides + (i + 1) % sides;
            faces.push(a, b, a + sides, b, b + sides, a + sides);
        }
    }
    const rear = vertices.length / 3;
    vertices.push(...vertices.slice(0, sides * 3));
    const front = vertices.length / 3;
    const frontStart = (profiles.length - 1) * sides * 3;
    vertices.push(...vertices.slice(frontStart, frontStart + sides * 3));
    for (let i = 0; i < half - 1; i++) {
        const far = sides - 1 - i;
        faces.push(rear + i, rear + far - 1, rear + i + 1, rear + i, rear + far, rear + far - 1);
        faces.push(front + i, front + i + 1, front + far - 1, front + i, front + far - 1, front + far);
    }
    const normals: number[] = [];
    VertexData.ComputeNormals(vertices, faces, normals);
    const data = new VertexData();
    data.positions = vertices;
    data.indices = faces;
    data.normals = normals;
    data.colors = panelColors(profiles, sides, half);
    if (mat.diffuseTexture) {
        const uv = [];
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i]!;
            const y = vertices[i + 1]!;
            const z = vertices[i + 2]!;
            const cap = i >= rear * 3;
            uv.push((cap ? x : z) * 1.6, cap ? y * 1.6 : x * 1.15 + y * 2.1);
        }
        data.uvs = uv;
    }
    data.applyToMesh(mesh, true);
    mesh.material = mat;
    return mesh;
}

function panelColors(profiles: readonly BodyProfile[], sides: number, half: number): number[] {
    const colors: number[] = [];
    const finish = [0.52, 0.66, 0.78, 0.91, 1.0, 0.96, 0.91];
    for (let row = 0; row < profiles.length + 2; row++) {
        const cap = row >= profiles.length;
        for (let i = 0; i < sides; i++) {
            const step = i < half ? i : sides - 1 - i;
            const shade = finish[step]! * (cap ? 0.84 : 1);
            colors.push(shade * 1.01, shade, shade * 0.98, 1);
        }
    }
    return colors;
}
