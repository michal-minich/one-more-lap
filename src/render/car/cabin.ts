import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import type { BodyShape } from "../../game/vehicle/body-shapes.ts";
import { cabinCorner } from "../../game/vehicle/body-shapes.ts";

export type Quad = readonly [Vector3, Vector3, Vector3, Vector3];

export interface CabinMaterials {
    readonly frame: StandardMaterial;
    readonly roof: StandardMaterial;
    readonly glass: StandardMaterial;
}

export interface CabinGlass {
    readonly windshield: Quad;
    readonly rearWindow?: Quad;
}

export function createCabin(
    scene: Scene, root: TransformNode, car: CarSpec, shape: BodyShape, materials: CabinMaterials,
): CabinGlass {
    const corner = (point: BodyShape["rearSill"], side: number, top: boolean): Vector3 => {
        const { x, y, z } = cabinCorner(car, shape, point, side, top);
        return new Vector3(x, y, z);
    };
    const rearBaseL = corner(shape.rearSill, -1, false);
    const rearBaseR = corner(shape.rearSill, 1, false);
    const rearRoofL = corner(shape.rearRoof, -1, true);
    const rearRoofR = corner(shape.rearRoof, 1, true);
    const frontBaseL = corner(shape.frontSill, -1, false);
    const frontBaseR = corner(shape.frontSill, 1, false);
    const frontRoofL = corner(shape.frontRoof, -1, true);
    const frontRoofR = corner(shape.frontRoof, 1, true);
    const build = (name: string, facing: Vector3, face: Quad, columns: readonly number[]): Quad[] =>
        windowPanel(scene, root, name, facing, face, materials, columns, shape.glassBand);
    build("left cabin pillars", new Vector3(-1, 0, 0), [rearBaseL, frontBaseL, frontRoofL, rearRoofL],
        shape.sidePillars);
    build("right cabin pillars", new Vector3(1, 0, 0), [rearBaseR, frontBaseR, frontRoofR, rearRoofR],
        shape.sidePillars);
    const windshield = build("windshield frame", new Vector3(0, 0, 1),
        [frontBaseL, frontBaseR, frontRoofR, frontRoofL], [shape.pillar * 0.69, 1 - shape.pillar * 0.69])[0]!;
    const rearWindow = build("rear hatch pillars", new Vector3(0, 0, -1),
        [rearBaseL, rearBaseR, rearRoofR, rearRoofL], [0.09, 0.91])[0]!;
    const roof: Quad = [rearRoofL, rearRoofR, frontRoofR, frontRoofL];
    if (car.id === "mistral") {
        const crown = (x: number, z: number): Vector3 => onQuad(roof, x, z).addInPlaceFromFloats(0, 0.035, 0);
        const raised: Quad = [crown(0.13, 0.09), crown(0.87, 0.09), crown(0.87, 0.91), crown(0.13, 0.91)];
        for (let edge = 0; edge < roof.length; edge++) {
            const next = (edge + 1) % roof.length;
            panel(scene, root, "roof shoulder", [roof[edge]!, roof[next]!, raised[next]!, raised[edge]!],
                Vector3.Up(), materials.roof);
        }
        panel(scene, root, "raised roof", raised, Vector3.Up(), materials.roof);
    } else {
        panel(scene, root, "solid roof", roof, Vector3.Up(), materials.roof);
    }
    return { windshield, rearWindow };
}

function windowPanel(
    scene: Scene, root: TransformNode, name: string, facing: Vector3, face: Quad,
    materials: CabinMaterials, columns: readonly number[], band: readonly [number, number],
): Quad[] {
    const section = (left: number, right: number, bottom: number, top: number): Quad =>
        [onQuad(face, left, bottom), onQuad(face, right, bottom), onQuad(face, right, top), onQuad(face, left, top)];
    const windows: Quad[] = [];
    const [lower, upper] = band;
    panel(scene, root, name + " lower sill", section(0, 1, 0, lower), facing, materials.frame);
    panel(scene, root, name + " header", section(0, 1, upper, 1), facing, materials.frame);
    const boundaries = [0, ...columns, 1];
    for (let i = 1; i < boundaries.length; i++) {
        const piece = section(boundaries[i - 1]!, boundaries[i]!, lower, upper);
        const isGlass = i % 2 === 0;
        panel(scene, root, isGlass ? name + " glass" : name, piece, facing, isGlass ? materials.glass : materials.frame);
        if (isGlass) windows.push(piece);
    }
    return windows;
}

export function onQuad(face: Quad, across: number, up: number): Vector3 {
    return Vector3.Lerp(Vector3.Lerp(face[0], face[1], across), Vector3.Lerp(face[3], face[2], across), up);
}

export function panel(
    scene: Scene, root: TransformNode, name: string, corners: Quad, facing: Vector3, material: StandardMaterial,
): void {
    const [a, b, c] = corners;
    const normal = Vector3.Cross(b.subtract(a), c.subtract(a));
    const indices = Vector3.Dot(normal, facing) > 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
    const positions = corners.flatMap(point => [point.x, point.y, point.z]);
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.normals = normals;
    data.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
    const mesh = new Mesh(name, scene);
    data.applyToMesh(mesh);
    mesh.material = material;
    mesh.parent = root;
    mesh.isPickable = false;
}
