import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { cabinCorner } from "../../game/vehicle/body-shapes.ts";
import type { BodyShape } from "../../game/vehicle/body-shapes.ts";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { material } from "../materials.ts";
import { surfaceTexture } from "../scenery/surface-textures.ts";
import { panel } from "./cabin.ts";
import type { CabinGlass, CabinMaterials, Quad } from "./cabin.ts";
import type { Trim, TrimBox } from "./trim.ts";

export function buildBuggyCage(
    scene: Scene, root: TransformNode, car: CarSpec, shape: BodyShape, materials: CabinMaterials,
): CabinGlass {
    const corner = (point: BodyShape["rearSill"], side: number, top: boolean): Vector3 => {
        const { x, y, z } = cabinCorner(car, shape, point, side, top);
        return new Vector3(x, y, z);
    };
    const leftRear = corner(shape.rearRoof, -1, true);
    const rightRear = corner(shape.rearRoof, 1, true);
    const leftFront = corner(shape.frontRoof, -1, true);
    const rightFront = corner(shape.frontRoof, 1, true);
    const leftBase = corner(shape.frontSill, -1, false);
    const rightBase = corner(shape.frontSill, 1, false);
    const braces = material(scene, "powder-coated cage braces", "#505257");
    braces.diffuseTexture = surfaceTexture(scene, "weathered steel");
    const sides = [[-1, leftRear, leftFront, leftBase], [1, rightRear, rightFront, rightBase]] as const;
    for (const [side, rear, front, base] of sides) {
        const back = corner(shape.rearSill, side, false);
        tube(scene, root, "painted roll cage", [back, rear, front, base], 0.056, materials.frame);
        tube(scene, root, "lower cage rail", [back, base], 0.043, braces);
        tube(scene, root, "rear cage brace", [back, side < 0 ? rightRear : leftRear], 0.032, braces);
    }
    tube(scene, root, "front roll bar", [leftFront, rightFront], 0.052, materials.frame);
    tube(scene, root, "rear roll bar", [leftRear, rightRear], 0.053, materials.frame);
    const windshield: Quad = [
        Vector3.Lerp(leftBase, rightBase, 0.045), Vector3.Lerp(rightBase, leftBase, 0.045),
        Vector3.Lerp(rightFront, leftFront, 0.055), Vector3.Lerp(leftFront, rightFront, 0.055),
    ];
    panel(scene, root, "buggy windshield", windshield, Vector3.Forward(), materials.glass);
    return { windshield };
}

export function addBuggyKit(
    scene: Scene, root: TransformNode, car: CarSpec, trim: Trim, box: TrimBox, detailed: boolean,
): void {
    const back = -car.length / 2;
    const lampHeight = car.nose - 0.523;
    const cream = material(scene, "sand-colored composite buggy panels", "#f1ddba");
    cream.diffuseTexture = surfaceTexture(scene, "ceramic plating");
    const steel = material(scene, "buggy skid plate and suspension rods", "#887967");
    steel.diffuseTexture = surfaceTexture(scene, "weathered steel");
    const composite = material(scene, "buggy graphite chassis and cooling fins", "#45434b");
    composite.diffuseTexture = surfaceTexture(scene, "thermal cladding");
    const rubber = detailed ? material(scene, "dusty spare tire", "#454046") : trim.dark;
    if (detailed) rubber.diffuseTexture = surfaceTexture(scene, "molded rubber");
    const cylinder = (
        name: string, diameter: number, depth: number, position: Vector3,
        paint: StandardMaterial, parent: TransformNode,
    ): Mesh => {
        const tessellation = detailed ? 24 : 12;
        const mesh = MeshBuilder.CreateCylinder(name, { height: depth, diameter, tessellation }, scene);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.copyFrom(position);
        mesh.material = paint;
        mesh.parent = parent;
        mesh.isPickable = false;
        return mesh;
    };
    const wheel = cylinder("rear-mounted spare", 0.73, 0.25, new Vector3(0, 0.44, back + 0.11), rubber, trim.rear);
    wheel.rotation.x = Math.PI * 0.45;
    const rim = cylinder("spare alloy rim", 0.4, 0.062, new Vector3(0, 0.422, back - 0.024), steel, trim.rear);
    rim.rotation.x = wheel.rotation.x;
    const skid = box("rear skid plate", [1.1, 0.2, 0.12], [0, -0.25, back - 0.049], steel, trim.rear);
    skid.rotation.x = -0.26;
    if (detailed) {
        for (const x of [-0.27, 0, 0.27]) {
            const recess = cylinder("skid plate recess", 0.083, 0.017,
                new Vector3(x, -0.267, back - 0.115), trim.dark, trim.rear);
            recess.rotation.x += skid.rotation.x;
        }
    }
    box("dark seat backs", [0.78, 0.43, 0.18], [0, 0.27, -0.43], trim.dark, root);
    const deck = box("separate buggy engine cover", [1.03, 0.085, 0.59], [0, 0.27, back + 0.57], composite, root);
    deck.rotation.x = -0.09;
    for (const side of [-1, 1]) {
        const strap = box("spare wheel retaining strap", [0.041, 0.66, 0.039],
            [0, 0.42, back - 0.08], cream, trim.rear);
        strap.rotation.z = side * 0.62;
        strap.rotation.x = Math.PI * 0.05;
        box("sand-colored side panels", [0.081, 0.29, 0.94], [side * 0.7, -0.037, 0.02], cream, root);
        box("long-travel dampers", [0.088, 0.52, 0.09], [side * 0.73, -0.15, back + 0.61], steel, root)
            .rotation.z = side * 0.45;
        box("exposed rear frame rail", [0.087, 0.12, 0.66], [side * 0.37, -0.28, back + 0.22], composite, trim.rear);
        const bumper = box("replaceable rear bumper ends", [0.31, 0.15, 0.16],
            [side * 0.68, -0.21, back - 0.04], composite, trim.rear);
        bumper.rotation.y = side * 0.27;
        if (detailed) {
            const exhaust = new Vector3(side * 0.44, -0.095, back - 0.085);
            cylinder("brushed exhaust collar", 0.134, 0.075, exhaust, steel, trim.rear);
            exhaust.z -= 0.038;
            cylinder("recessed exhaust outlet", 0.089, 0.012, exhaust, composite, trim.rear);
            for (const z of [0.37, 0.49, 0.61, 0.73]) {
                box("raised engine-cover cooling fins", [0.35, 0.027, 0.043], [side * 0.24, 0.32, back + z],
                    steel, root);
            }
        }
        const tail = new Vector3(side * car.width * 0.29, lampHeight, back - 0.024);
        rearQuarter(scene, trim.rear, cream, side, tail);
        cylinder("buggy tail lamp housing", 0.25, 0.079, tail, cream, trim.rear);
        tail.z -= 0.05;
        cylinder("round buggy taillight", 0.173, 0.028, tail, trim.tails, trim.rear);
        const roof = new Vector3(side * 0.44, car.roof - 0.43, 0.31);
        cylinder("cage lamp pod", 0.193, 0.16, roof, trim.paint, root);
        roof.z += 0.084;
        cylinder("cage lamp lens", 0.147, 0.028, roof, trim.lights, root);
    }
}

function rearQuarter(scene: Scene, parent: TransformNode, paint: StandardMaterial, side: number, lamp: Vector3): void {
    const profile = [
        [-0.24, 0.255, 0.12], [0.08, 0.265, 0.21], [0.25, 0.12, 0.28],
        [0.23, -0.07, 0.22], [0.08, -0.15, 0.035], [-0.21, -0.13, -0.012],
    ] as const;
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const [x, y, z] of profile) {
        positions.push(lamp.x + x * side, lamp.y + y, lamp.z + z);
        uv.push(x * 2 + 0.5, y * 2 + 0.42);
    }
    positions.push(lamp.x, lamp.y + 0.044, lamp.z - 0.022);
    uv.push(0.5, 0.51);
    for (let i = 0; i < profile.length; i++) {
        const next = (i + 1) % profile.length;
        indices.push(profile.length, side < 0 ? i : next, side < 0 ? next : i);
    }
    const data = new VertexData();
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    data.positions = positions;
    data.indices = indices;
    data.normals = normals;
    data.uvs = uv;
    const quarter = new Mesh("shaped cream rear quarter", scene);
    data.applyToMesh(quarter);
    quarter.material = paint;
    quarter.parent = parent;
    quarter.isPickable = false;
}

function tube(
    scene: Scene, parent: TransformNode, name: string, path: Vector3[], radius: number, paint: StandardMaterial,
): void {
    const mesh = MeshBuilder.CreateTube(name, { path, radius, tessellation: 8, cap: 3 }, scene);
    mesh.material = paint;
    mesh.parent = parent;
    mesh.isPickable = false;
}
