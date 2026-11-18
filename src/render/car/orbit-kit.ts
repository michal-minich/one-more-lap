import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { material } from "../materials.ts";
import { deckHeight } from "../../game/vehicle/body-shapes.ts";
import type { BodyShape } from "../../game/vehicle/body-shapes.ts";
import type { Trim, TrimBox } from "./trim.ts";

export function addOrbitKit(scene: Scene, root: TransformNode, car: CarSpec, shape: BodyShape, trim: Trim, box: TrimBox): void {
    const { width, length } = car;
    const { dark, paint, lights, tails, front, rear } = trim;
    const nose = length / 2;
    const brass = material(scene, "copper edge trim", "#d5a66e");
    brass.specularColor.set(0.51, 0.46, 0.39);
    const carbon = material(scene, "woven aero panels", "#25313a");
    carbon.specularColor.set(0.21, 0.25, 0.25);
    box("copper splitter edge", [width * 0.79, 0.039, 0.062], [0, -0.263, nose + 0.056], brass, front);
    box("tapered rear diffuser", [width * 0.81, 0.112, 0.26], [0, -0.226, -nose + 0.018], dark, rear);
    for (const side of [-1, 1]) {
        const x = width * side;
        const lamp = box("orbit outer light bar", [0.48, 0.036, 0.045], [x * 0.277, -0.010, nose - 0.023], lights, front);
        lamp.rotation.y = side * 0.48;
        lamp.rotation.z = side * 0.19;
        const pod = box("aero side intake", [0.137, 0.141, 0.78], [x * 0.443, -0.129, -0.12], carbon, root);
        pod.rotation.y = side * 0.11;
        const inlet = box("intake copper bevel", [0.045, 0.042, 0.73], [x * 0.476, -0.191, -0.12], brass, root);
        inlet.rotation.y = side * 0.11;
        const fender = box("swept rear fin", [0.097, 0.18, 0.59], [x * 0.331, deckHeight(car, shape, -0.40) + 0.066, -nose + 0.46],
            paint, rear);
        fender.rotation.y = -side * 0.12;
        const foil = box("front intake divider", [0.073, 0.085, 0.52], [x * 0.285, deckHeight(car, shape, 0.407) + 0.01, 0.405 * length],
            carbon, front);
        foil.rotation.y = side * 0.19;
        foil.rotation.x = 0.12;
        const diffuser = box("rear diffuser vane", [0.035, 0.088, 0.23], [x * 0.17, -0.239, -nose - 0.047], brass, rear);
        diffuser.rotation.x = -0.15;
        const ring = MeshBuilder.CreateTorus("orbit turbine taillight", { diameter: 0.23, thickness: 0.026, tessellation: 26 }, scene);
        ring.parent = rear;
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x * 0.245, -0.005, -nose - 0.038);
        ring.material = tails;
        ring.isPickable = false;
    }
    box("bridged rear aero foil", [width * 0.79, 0.050, 0.24], [0, 0.243, -nose + 0.25], carbon, rear);
    box("thin brake bar", [width * 0.68, 0.019, 0.032], [0, 0.247, -nose + 0.115], tails, rear);
}
