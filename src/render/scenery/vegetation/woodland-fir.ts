import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";

// Irregular branch fans keep the second row of trees from reading as stacks of cones.
export function woodlandFir(scene: Scene, wide: boolean): Mesh {
    const positions: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const sides = 15;
    const tiers = 6;
    for (let tier = 0; tier < tiers; tier++) {
        const fraction = tier / (tiers - 1);
        const branches = 5 - Math.floor(tier / 3);
        const base = 1.42 + tier * (wide ? 0.83 : 0.91);
        const height = (wide ? 1.79 : 2.11) - fraction * 0.76;
        const width = (wide ? 1.54 : 1.09) * (1 - fraction * 0.83);
        const first = positions.length / 3;
        const phase = tier * 0.91 + (wide ? 0.35 : 0.73);
        for (let layer = 0; layer < 3; layer++) {
            for (let side = 0; side <= sides; side++) {
                const angle = side % sides / sides * Math.PI * 2;
                const edge = Math.cos(angle * branches + phase);
                const irregularity = Math.sin(angle * 3 - phase) * 0.12 + Math.cos(angle * 2 + phase) * 0.12;
                const radius = width * (layer === 0 ? 0.62 : layer === 1 ? 0.88 + edge * 0.21 + irregularity : 0.046);
                const droop = layer === 1 ? -0.22 * edge : 0;
                const y = base + (layer === 0 ? 0.10 : layer === 1 ? 0.30 + droop : height);
                positions.push(Math.cos(angle) * radius + Math.sin(phase) * 0.105, y, Math.sin(angle) * radius);
                uv.push(side / sides, layer * 0.43 + tier * 0.17);
                const shade = (layer === 0 ? 0.49 : layer === 1 ? 0.71 + edge * 0.085 : 0.85) + fraction * 0.11;
                colors.push(shade * 1.04, shade, shade * 0.91, 1);
                if (side === 0 || layer === 0) continue;
                const i = first + layer * (sides + 1) + side;
                const below = i - sides - 1;
                indices.push(below - 1, i, i - 1, below - 1, below, i);
            }
        }
    }
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.normals = normals;
    data.uvs = uv;
    data.colors = colors;
    const mesh = new Mesh("Blackwood irregular fir crown", scene);
    data.applyToMesh(mesh);
    return mesh.convertToFlatShadedMesh();
}
