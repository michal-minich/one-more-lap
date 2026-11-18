import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { material } from "../materials.ts";
import { addModelDetails } from "./model-details.ts";
import type { BodyShape } from "../../game/vehicle/body-shapes.ts";

type Dimensions = readonly [number, number, number];
export type TrimBox = (
    name: string, size: Dimensions, at: Dimensions, surface: StandardMaterial, parent: TransformNode,
) => Mesh;

export interface Trim {
    readonly dark: StandardMaterial;
    readonly paint: StandardMaterial;
    readonly lights: StandardMaterial;
    readonly tails: StandardMaterial;
    readonly front: TransformNode;
    readonly rear: TransformNode;
}

export function shapeTrim(scene: Scene, root: TransformNode, car: CarSpec, shape: BodyShape, trim: Trim, detailed: boolean): void {
    const { dark, paint, lights, tails, front, rear } = trim;
    const w = car.width;
    const z = car.length * 0.5;
    const nose = car.nose - 0.56;
    const box: TrimBox = (name, size, at, surface, parent) => {
        const mesh = MeshBuilder.CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, scene);
        mesh.position.set(...at);
        mesh.material = surface;
        mesh.parent = parent;
        mesh.isPickable = false;
        return mesh;
    };
    const roundLamp = (x: number, y: number, diameter: number): void => {
        const bezel = MeshBuilder.CreateCylinder("round headlight bezel", { diameter: diameter + 0.033, height: 0.065,
            tessellation: detailed ? 20 : 10 }, scene);
        bezel.rotation.x = Math.PI / 2;
        bezel.position.set(x, y, z + 0.012);
        bezel.parent = front;
        bezel.material = dark;
        const lens = MeshBuilder.CreateCylinder("round headlight lens", { diameter, height: 0.023,
            tessellation: detailed ? 20 : 10 }, scene);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(x, y, z + 0.054);
        lens.parent = front;
        lens.material = lights;
    };
    box("front splitter", [w * 0.74, 0.075, 0.19], [0, shape.sill + 0.035, z - 0.02], dark, front);
    box("air intake", [w * 0.43, 0.077, 0.03], [0, nose - 0.15, z + 0.019], dark, front);
    box("rear bumper", [w * 0.76, 0.089, 0.18], [0, shape.sill + 0.06, -z + 0.016], dark, rear);
    const plate = material(scene, "plate", "#e6dec3");
    box("rear number plate", [0.27, 0.092, 0.022], [0, nose - 0.084, -z - 0.019], plate, rear);

    for (const side of [-1, 1]) {
        if (shape.light === "blade") {
            box("slim headlight bezel", [w * 0.28, 0.083, 0.046], [side * w * 0.25, nose - 0.03, z + 0.013], dark, front);
            box("slim headlight lens", [w * 0.24, 0.041, 0.026], [side * w * 0.25, nose - 0.026, z + 0.045], lights, front);
        } else if (shape.light === "round" || shape.light === "rally") {
            roundLamp(side * w * (shape.light === "round" ? 0.245 : 0.28), nose - 0.065, shape.light === "round" ? 0.23 : 0.176);
            if (shape.light === "rally" && detailed) roundLamp(side * 0.235, nose - 0.076, 0.128);
        } else if (shape.light === "armored") {
            box("protected square lamp", [0.255, 0.175, 0.085], [side * w * 0.265, nose - 0.005, z + 0.015], dark, front);
            box("armored headlamp lens", [0.194, 0.124, 0.046], [side * w * 0.265, nose - 0.005, z + 0.061], lights, front);
        } else if (shape.light === "aero") {
            const blade = box("split LED blade", [w * 0.29, 0.037, 0.04], [side * w * 0.196, nose - 0.014, z + 0.034], lights, front);
            blade.rotation.z = side * 0.15;
        }
        const tailSize: Dimensions = shape.light === "round" || shape.light === "armored"
            ? [0.15, 0.145, 0.035] : [w * 0.24, 0.058, 0.034];
        if (shape.light !== "aero" && shape.light !== "orbit" && car.id !== "buggy") {
            box("taillights", tailSize, [side * w * 0.265, nose + 0.037, -z - 0.014], tails, rear);
        }
        if (!detailed || shape.light === "orbit" || car.id === "buggy") continue;
        box("side skirt", [0.071, 0.075, car.wheelbase - 0.90], [side * w * 0.466, shape.sill + 0.07, 0], dark, root);
        box("door handle", [0.026, 0.029, 0.128], [side * w * 0.462, nose + 0.088, -0.26], dark, root);
        box("mirror stalk", [0.12, 0.028, 0.045], [side * w * 0.43, nose + 0.16, 0.50], dark, root);
        const mirror = box("mirror shell", [0.118, 0.073, 0.154], [side * w * 0.49, nose + 0.17, 0.49], paint, root);
        mirror.rotation.y = side * 0.27;
    }
    addModelDetails(scene, root, car, shape, trim, box, detailed);
}
