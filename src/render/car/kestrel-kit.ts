import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { bodyProfiles, deckHeight, sideOfBody } from "../../game/vehicle/body-shapes.ts";
import type { BodyShape } from "../../game/vehicle/body-shapes.ts";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { material } from "../materials.ts";
import { panel } from "./cabin.ts";
import type { Quad } from "./cabin.ts";
import type { Trim, TrimBox } from "./trim.ts";

export function addKestrelKit(
    scene: Scene, root: TransformNode, car: CarSpec, shape: BodyShape, trim: Trim, box: TrimBox,
): void {
    const cladding = material(scene, "Kestrel navy cladding", "#26304a");
    const ivory = material(scene, "Kestrel ivory pinstripe", "#e7c893");
    const profiles = bodyProfiles(car, shape);
    const z = car.length * 0.5;
    const nose = car.nose - 0.56;
    const along = -0.358;
    const y = deckHeight(car, shape, along);
    const deck = box("raised cooling deck", [car.width * 0.59, 0.09, 0.43], [0, y + 0.02, along * car.length],
        trim.paint, trim.rear);
    deck.rotation.x = -0.17;
    for (const x of [-0.32, 0, 0.32]) {
        const fin = box("cooling fin", [0.14, 0.081, 0.46], [x, y + 0.083, along * car.length], cladding, trim.rear);
        fin.rotation.x = -0.17;
    }
    box("rear navy bumper", [car.width * 0.80, 0.108, 0.18], [0, -0.208, -z - 0.018], cladding, trim.rear);
    box("rear ivory pinstripe", [car.width * 0.78, 0.025, 0.033], [0, -0.144, -z - 0.029], ivory, trim.rear);
    box("front navy bumper", [car.width * 0.78, 0.092, 0.16], [0, -0.232, z + 0.001], cladding, trim.front);
    for (const side of [-1, 1]) {
        box("rear lamp recess", [car.width * 0.27, 0.11, 0.034], [side * car.width * 0.265, nose + 0.037, -z - 0.009],
            trim.dark, trim.rear);
        const face = new Vector3(side, 0, 0);
        const point = (distance: number, height: number): Vector3 => {
            const at = sideOfBody(profiles, shape, distance * car.length, height);
            return new Vector3(side * (at.x + 0.023), at.y, at.z);
        };
        const strips = [-0.185, -0.055, 0.055, 0.183];
        for (let index = 1; index < strips.length; index++) {
            const back = strips[index - 1]!;
            const front = strips[index]!;
            const band = (bottom: number, top: number): Quad =>
                [point(back, bottom), point(front, bottom), point(front, top), point(back, top)];
            panel(scene, root, "navy rocker cladding", band(0.08, 0.43), face, cladding);
            panel(scene, root, "ivory rocker pinstripe", band(0.43, 0.48), face, ivory);
        }
    }
}
