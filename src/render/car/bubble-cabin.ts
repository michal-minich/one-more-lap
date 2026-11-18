import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import type { CabinGlass, CabinMaterials, Quad } from "./cabin.ts";
import { deckHeight } from "../../game/vehicle/body-shapes.ts";
import type { BodyShape } from "../../game/vehicle/body-shapes.ts";

const bubbles = [
    [-0.320, 0.28, 0.04], [-0.275, 0.47, 0.32], [-0.180, 0.56, 0.84],
    [-0.092, 0.56, 1], [0.020, 0.55, 0.99], [0.103, 0.50, 0.81], [0.185, 0.41, 0.37], [0.221, 0.27, 0.04],
] as const;

const rim = [0, 0.10, 0.29, 0.48, 0.66, 0.75, 0.81, 0.91, 1.09, 1.28, 1.47, 1.57] as const;

export function createBubbleCabin(
    scene: Scene, root: TransformNode, car: CarSpec, shape: BodyShape, materials: CabinMaterials,
): CabinGlass {
    const vertices: number[] = [];
    const uv: number[] = [];
    const frame: number[] = [];
    const windows: number[] = [];
    const indices: number[] = [];
    const columns = rim.length;
    const roof = car.roof - 0.56;
    for (const [row, [z, width, crown]] of bubbles.entries()) {
        const deck = deckHeight(car, shape, z) - 0.011;
        for (const [column, angle] of rim.entries()) {
            const a = angle * 2;
            vertices.push(-Math.cos(a) * width * car.width * 0.5, deck + Math.sin(a) * (roof - deck) * crown, z * car.length);
            uv.push(column / (columns - 1), row / (bubbles.length - 1));
            if (row === 0 || column === 0) continue;
            const i = row * columns + column;
            const faces = [i - columns - 1, i - columns, i - 1, i - columns, i, i - 1];
            indices.push(...faces);
            const edge = row === 1 || row === bubbles.length - 1 || column === 1 || column === columns - 1;
            const target = edge || column === 6 ? frame : windows;
            target.push(...faces);
        }
    }
    const normals: number[] = [];
    VertexData.ComputeNormals(vertices, indices, normals);
    const draw = (name: string, faces: number[], paint: StandardMaterial): void => {
        const mesh = new Mesh(name, scene);
        const data = new VertexData();
        data.positions = vertices;
        data.normals = normals;
        data.indices = faces;
        data.uvs = uv;
        data.applyToMesh(mesh);
        mesh.parent = root;
        mesh.material = paint;
        mesh.isPickable = false;
    };
    draw("curved single-seat glass canopy", windows, materials.glass);
    draw("canopy frame and roof spine", frame, materials.roof);
    const at = (row: number, column: number): Vector3 => Vector3.FromArray(vertices, (row * columns + column) * 3);
    const window = (row: number, column: number): Quad =>
        [at(row, column), at(row, column + 1), at(row + 1, column + 1), at(row + 1, column)];
    return { windshield: window(5, 6), rearWindow: window(1, 4) };
}
