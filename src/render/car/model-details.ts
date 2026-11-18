import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { material } from "../materials.ts";
import { deckHeight } from "../../game/vehicle/body-shapes.ts";
import type { BodyShape } from "../../game/vehicle/body-shapes.ts";
import type { Trim, TrimBox } from "./trim.ts";
import { addBuggyKit } from "./buggy-kit.ts";
import { addKestrelKit } from "./kestrel-kit.ts";
import { addOrbitKit } from "./orbit-kit.ts";

export function addModelDetails(
    scene: Scene, root: TransformNode, car: CarSpec, shape: BodyShape, trim: Trim, box: TrimBox, detailed: boolean,
): void {
    const { front, rear, dark, tails } = trim;
    const w = car.width;
    const z = car.length / 2;
    const nose = car.nose - 0.56;
    const deck = (along: number): number => deckHeight(car, shape, along);
    switch (car.id) {
        case "veloce": {
            const aluminum = material(scene, "brushed aluminum", "#b9b9a9");
            box("aluminum lower grille fin", [w * 0.41, 0.024, 0.045], [0, nose - 0.162, z + 0.032], aluminum, front);
            for (const side of [-1, 1]) {
                box("rear diffuser", [w * 0.23, 0.066, 0.15], [side * w * 0.23, -0.267, -z + 0.012], dark, rear);
                const scoop = box("side cooling duct", [0.033, 0.106, 0.37], [side * w * 0.452, -0.112, -0.69], dark, root);
                scoop.rotation.x = -0.11;
                const lip = box("low hood strake", [0.024, 0.023, 0.48], [side * w * 0.22, deck(0.34), 0.34 * car.length], trim.paint, root);
                lip.rotation.x = 0.11;
                box("polished rear exhaust", [0.105, 0.073, 0.14], [side * w * 0.235, -0.245, -z - 0.04], aluminum, rear);
            }
            for (let slat = 0; slat < (detailed ? 5 : 2); slat++) {
                const along = -0.46 + slat * 0.021;
                box("rear deck louvers", [0.91, 0.018, 0.056], [0, deck(along) + 0.008, along * car.length], dark, rear);
            }
            break;
        }
        case "summit": {
            const stripe = material(scene, "rally cream", "#eee2c7");
            box("roof-level wing", [w * 0.90, 0.067, 0.27], [0, nose + 0.46, -z + 0.26], stripe, rear);
            box("hood scoop", [0.58, 0.073, 0.29], [0, deck(0.263) + 0.041, car.length * 0.263], dark, root);
            box("hood scoop lip", [0.54, 0.025, 0.042], [0, deck(0.263) + 0.064, car.length * 0.263 + 0.14], stripe, root);
            box("rally skid plate", [w * 0.49, 0.068, 0.19], [0, -0.291, z + 0.021], stripe, front);
            for (const side of [-1, 1]) {
                box("wing strut", [0.082, 0.25, 0.07], [side * w * 0.29, nose + 0.34, -z + 0.25], dark, rear);
                box("rally side stripe", [0.032, 0.102, car.wheelbase - 1.05], [side * w * 0.474, -0.17, -0.03], stripe, root);
                if (detailed) box("rear mud flap", [0.26, 0.20, 0.04], [side * w * 0.42, -0.38, -car.wheelbase / 2 - 0.34], dark, rear);
            }
            break;
        }
        case "mistral": {
            const cream = material(scene, "hatch trim", "#e8dcc1");
            box("cream hatch strip", [w * 0.67, 0.048, 0.047], [0, nose + 0.145, -z - 0.012], cream, rear);
            box("small bright grille", [w * 0.29, 0.092, 0.044], [0, nose - 0.077, z + 0.04], cream, front);
            box("black grille inset", [w * 0.248, 0.052, 0.052], [0, nose - 0.074, z + 0.046], dark, front);
            box("bright hatch bumper", [w * 0.73, 0.041, 0.122], [0, -0.217, -z - 0.039], cream, rear);
            for (const side of [-1, 1]) {
                box("hatch rub rail", [0.046, 0.055, 1.25], [side * w * 0.49, -0.127, 0], dark, root);
                box("amber side marker", [0.027, 0.034, 0.083], [side * w * 0.461, nose + 0.075, z - 0.41], cream, front);
            }
            break;
        }
        case "bastion": {
            const steel = material(scene, "armored gray cladding", "#444e4b");
            const reflector = material(scene, "rescue yellow", "#dca959");
            box("front brush bar", [w * 0.76, 0.125, 0.123], [0, nose - 0.18, z + 0.14], steel, front);
            box("reinforced rear bumper", [w * 0.76, 0.155, 0.21], [0, nose - 0.27, -z - 0.025], steel, rear);
            for (let grille = -3; grille <= 3; grille++) {
                box("armored grille bar", [0.045, 0.113, 0.053], [grille * 0.093, nose - 0.111, z + 0.035], steel, front);
            }
            for (const side of [-1, 1]) {
                box("front brush uprights", [0.125, 0.35, 0.108], [side * w * 0.29, nose - 0.059, z + 0.14], steel, front);
                box("armor side plate", [0.089, 0.26, 1.37], [side * w * 0.481, -0.09, 0], steel, root);
                box("reflective rescue stripe", [0.033, 0.072, 1.11], [side * w * 0.504, 0.025, 0.015], reflector, root);
                box("roof rack side", [0.058, 0.084, 1.55], [side * w * 0.253, car.roof - 0.49, -0.44], steel, root);
                box("recovery eye", [0.096, 0.090, 0.087], [side * w * 0.265, nose - 0.25, -z - 0.14], reflector, rear);
                if (!detailed) continue;
                for (const offset of [-0.49, -0.26, 0.26, 0.49]) {
                    box("armor bolt", [0.038, 0.036, 0.044], [side * w * 0.512, -0.132, offset], reflector, root);
                }
            }
            for (const offset of [-0.94, -0.34, 0.24]) {
                box("roof rack crossbar", [w * 0.55, 0.051, 0.078], [0, car.roof - 0.45, offset], steel, root);
            }
            break;
        }
        case "aero": {
            const ice = material(scene, "cool cyan trim", "#92dce6");
            ice.emissiveColor.set(0.055, 0.24, 0.32);
            box("continuous rear light strip", [w * 0.64, 0.048, 0.048], [0, nose + 0.062, -z - 0.035], tails, rear);
            box("black rear diffuser", [w * 0.63, 0.119, 0.15], [0, -0.18, -z - 0.010], dark, rear);
            box("aero nose blade", [w * 0.45, 0.021, 0.054], [0, -0.228, z + 0.048], ice, front);
            for (const side of [-1, 1]) {
                box("floating side pod", [0.19, 0.13, 0.99], [side * w * 0.426, -0.164, 0], dark, root);
                box("cyan sill guide", [0.042, 0.030, 0.88], [side * w * 0.479, -0.13, 0], ice, root);
                const fin = box("rear deck aero blade", [0.06, 0.14, 0.64], [side * w * 0.27, deck(-0.36) + 0.05, -z + 0.58], dark, rear);
                fin.rotation.y = side * 0.09;
            }
            break;
        }
        case "buggy":
            addBuggyKit(scene, root, car, trim, box, detailed);
            break;
        case "kestrel":
            addKestrelKit(scene, root, car, shape, trim, box);
            break;
        case "orbit":
            addOrbitKit(scene, root, car, shape, trim, box);
            break;
        default:
            throw new Error("Missing trim for " + car.id);
    }
}
