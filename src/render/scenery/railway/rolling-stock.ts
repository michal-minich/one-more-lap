import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { batchRigidMeshes } from "../../rigid-meshes.ts";
import { material } from "../../materials.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { surfaceTexture } from "../surface-textures.ts";

function railwayPaint(scene: Scene) {
    const enamel = surfaceTexture(scene, "dusty enamel");
    const steel = surfaceTexture(scene, "weathered steel");
    const coat = (name: string, color: string, texture = enamel): StandardMaterial => {
        const mat = material(scene, name, color);
        mat.diffuseTexture = texture;
        mat.specularColor.set(0.26, 0.26, 0.24);
        return mat;
    };
    const lamp = coat("locomotive headlamp", "#fff0bf");
    lamp.emissiveColor.set(0.87, 0.73, 0.42);
    const glass = coat("carriage glazing", "#354e59");
    glass.emissiveColor.set(0.13, 0.17, 0.17);
    return {
        green: coat("jade locomotive enamel", "#316150"), black: coat("smokebox iron", "#363e40", steel),
        brass: coat("locomotive brass", "#d5a765", steel), wheels: coat("wheel steel", "#535958", steel),
        red: coat("vermilion buffer beam", "#a6372b"), coach: coat("claret carriages", "#894938"),
        cream: coat("coach trim", "#ebd4ac"), lamp, glass,
    };
}

type Paint = ReturnType<typeof railwayPaint>;

interface Wheel {
    readonly axle: TransformNode;
    readonly radius: number;
}

export interface RailCar {
    readonly root: TransformNode;
    readonly wheels: readonly Wheel[];
    readonly offset: number;
}

export function rollingStock(scene: Scene): readonly RailCar[] {
    const paint = railwayPaint(scene);
    const engine = new TransformNode("Juniper steam locomotive", scene);
    const mesh = new ActorMeshes(scene, engine);
    mesh.box("locomotive frame", [3.1, 0.62, 13.2], [0, 1.37, -0.1], paint.black);
    cylinder(scene, engine, "round green boiler", 2.62, 8.2, [0, 3.1, 0.8], Math.PI / 2, paint.green);
    cylinder(scene, engine, "round smoke box", 2.47, 1.75, [0, 3.14, 4.92], Math.PI / 2, paint.black);
    cylinder(scene, engine, "brass boiler ring", 2.63, 0.15, [0, 3.14, 4.25], Math.PI / 2, paint.brass);
    cylinder(scene, engine, "brass boiler ring", 2.63, 0.13, [0, 3.14, 1.6], Math.PI / 2, paint.brass);
    cylinder(scene, engine, "flared smokestack", 0.73, 1.42, [0, 4.84, 4.01], 0, paint.black);
    cylinder(scene, engine, "chimney lip", 1.0, 0.18, [0, 5.56, 4.01], 0, paint.brass);
    mesh.oval("steam dome", [1.04, 1.02, 1.14], [0, 4.38, 0.46], paint.brass);
    mesh.hull("locomotive cab", [3.14, 3.42, 3.32], [0, 3.43, -4.72], paint.green);
    mesh.hull("locomotive cab roof", [3.48, 0.39, 3.83], [0, 5.21, -4.71], paint.black);
    mesh.box("buffer beam", [3.28, 0.49, 0.46], [0, 1.29, 6.48], paint.red);
    mesh.oval("engine headlamp", [0.71, 0.71, 0.31], [0, 3.56, 5.83], paint.lamp);
    for (const side of [-1, 1]) {
        mesh.box("cab side glass", [0.08, 1.05, 1.36], [side * 1.56, 4.12, -4.5], paint.glass);
        mesh.box("running board", [0.39, 0.17, 9.75], [side * 1.39, 1.91, 0.45], paint.black);
        mesh.box("brass cab stripe", [0.052, 0.10, 3.04], [side * 1.58, 3.17, -4.72], paint.brass);
    }
    const drive = [-3.2, -0.95, 1.3].map(z => wheel(scene, engine, z, 0.99, paint, true));
    drive.push(wheel(scene, engine, 4.68, 0.59, paint));
    const tender = carriage(scene, paint, 10.8, true);
    const coaches = [23.65, 38.5, 53.35].map(offset => carriage(scene, paint, offset, false));
    const stock = [{ root: engine, wheels: drive, offset: 0 }, tender, ...coaches];
    for (const { root, wheels } of stock) {
        batchRigidMeshes(root);
        for (const { axle } of wheels) batchRigidMeshes(axle);
    }
    return stock;
}

function carriage(scene: Scene, paint: Paint, offset: number, tender: boolean): RailCar {
    const length = tender ? 7.3 : 14.15;
    const root = new TransformNode(tender ? "Juniper coal tender" : "Juniper passenger coach", scene);
    const mesh = new ActorMeshes(scene, root);
    mesh.box("carriage underframe", [3.1, 0.56, length], [0, 1.07, 0], paint.black);
    mesh.hull("carriage coachwork", [3.25, tender ? 1.7 : 2.87, length], [0, tender ? 2.28 : 2.81, 0],
        tender ? paint.green : paint.coach);
    mesh.hull(tender ? "coal bunker" : "arched carriage roof", [3.39, 0.48, length + 0.13],
        [0, tender ? 3.19 : 4.32, 0], paint.black);
    for (const side of [-1, 1]) {
        mesh.box("gold coach lining", [0.06, 0.12, length - 0.62], [side * 1.64, 2.24, 0], paint.brass);
        if (tender) continue;
        for (const z of [-5.56, -3.75, -1.87, 0, 1.87, 3.75, 5.56]) {
            mesh.box("carriage window frame", [0.07, 1.19, 1.39], [side * 1.62, 3.18, z], paint.cream);
            mesh.box("carriage window glass", [0.08, 0.97, 1.16], [side * 1.655, 3.18, z], paint.glass);
        }
    }
    for (const z of [-length / 2, length / 2]) {
        mesh.box("carriage coupler", [0.57, 0.38, 0.74], [0, 1.12, z], paint.black);
    }
    const axles = tender ? [-2.42, 0, 2.42] : [-5.14, -3.65, 3.65, 5.14];
    return { root, offset, wheels: axles.map(z => wheel(scene, root, z, 0.57, paint)) };
}

function wheel(scene: Scene, parent: TransformNode, z: number, radius: number, paint: Paint, spokes = false): Wheel {
    const axle = new TransformNode("rolling axle", scene);
    axle.parent = parent;
    axle.position.set(0, radius + 0.13, z);
    const mesh = new ActorMeshes(scene, axle);
    for (const side of [-1, 1]) {
        const x = side * 1.02;
        const rim = cylinder(scene, axle, "steel wheel tyre", radius * 2, 0.24, [x, 0, 0], 0, paint.wheels);
        rim.rotation.z = Math.PI / 2;
        if (!spokes) continue;
        for (let i = 0; i < 4; i++) {
            const bar = mesh.box("red driving spokes", [0.09, radius * 1.57, 0.11], [x + side * 0.135, 0, 0], paint.red);
            bar.rotation.x = i * Math.PI / 4;
        }
        mesh.oval("wheel hub", [0.26, 0.29, 0.29], [x + side * 0.16, 0, 0], paint.brass);
    }
    return { axle, radius };
}

function cylinder(scene: Scene, parent: TransformNode, name: string, diameter: number, height: number,
    position: readonly [number, number, number], pitch: number, paint: StandardMaterial) {
    const mesh = MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: 24 }, scene);
    mesh.parent = parent;
    mesh.position.set(...position);
    mesh.rotation.x = pitch;
    mesh.material = paint;
    mesh.isPickable = false;
    return mesh;
}
