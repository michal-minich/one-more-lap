import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarId } from "../../../game/vehicle/cars.ts";
import { material } from "../../materials.ts";
import { fromPacked, unpackMeshes } from "../../packed-mesh.ts";
import { fleetTexture } from "./model-textures.ts";
import type { CabinGlass, Quad } from "../cabin.ts";
import aero from "./aero.bin?inline";
import bastion from "./bastion.bin?inline";
import buggy from "./buggy.bin?inline";
import mistral from "./mistral.bin?inline";
import orbit from "./orbit.bin?inline";
import summit from "./summit.bin?inline";
import veloce from "./veloce.bin?inline";
import kestrel from "./kestrel.bin?inline";
import windows from "./windows.json" with { type: "json" };

type FleetCar = Exclude<CarId, "manta">;

const models: Record<FleetCar, string> = { aero, bastion, buggy, kestrel, mistral, orbit, summit, veloce };
const finishes: Record<FleetCar, readonly [trim: string, cladding: string]> = {
    veloce: ["#e6c395", "#3a253f"], summit: ["#e9d9bb", "#253965"],
    mistral: ["#e9d8b9", "#3d4148"], bastion: ["#d6b480", "#697149"],
    aero: ["#c2c7df", "#343960"], orbit: ["#e2c396", "#463a68"],
    buggy: ["#c0a982", "#536542"], kestrel: ["#e7c398", "#383052"],
};
const geometry = new Map<FleetCar, ReturnType<typeof unpackMeshes>>();

interface CarMaterials {
    readonly paint: StandardMaterial;
    readonly glass: StandardMaterial;
    readonly lights: StandardMaterial;
    readonly tails: StandardMaterial;
}

export function blenderChassis(
    scene: Scene, car: FleetCar, root: TransformNode, front: TransformNode, rear: TransformNode,
    { paint, glass, lights, tails }: CarMaterials,
): { shell: Mesh; cabin: CabinGlass } {
    const model = geometry.get(car) ?? unpackMeshes(models[car]);
    geometry.set(car, model);
    const [trimColor, lowerColor] = finishes[car];
    const trim = material(scene, "alloy trim", trimColor);
    const cladding = material(scene, "lower cladding", lowerColor);
    const hardware = material(scene, "wheel wells and underbody", "#262a2c");
    trim.diffuseColor.scaleInPlace(0.84);
    cladding.diffuseColor.scaleInPlace(0.88);
    trim.specularColor.set(0.20, 0.18, 0.14);
    trim.specularPower = 64;
    cladding.specularColor.set(0.12, 0.11, 0.14);
    hardware.specularColor.set(0.08, 0.08, 0.08);
    paint.diffuseTexture = fleetTexture(scene, "enamel");
    cladding.diffuseTexture = fleetTexture(scene, "ceramic");
    hardware.diffuseTexture = fleetTexture(scene, "alloy");
    trim.diffuseTexture = fleetTexture(scene, car === "veloce" || car === "aero" ? "alloy" : "ceramic");
    const materials = [trim, glass, paint, cladding, lights, hardware, tails];
    if (car === "summit") materials.push(material(scene, "orange rally mud flaps", "#ce7a31"));
    if (car === "buggy") {
        const springs = material(scene, "copper suspension springs", "#b97539");
        springs.diffuseTexture = fleetTexture(scene, "alloy");
        materials.push(springs);
    }
    const meshes = model.map((data, i) => {
        const finish = materials[i]!;
        finish.backFaceCulling = false;
        const mesh = fromPacked(scene, finish.name, data, finish === paint);
        mesh.material = finish;
        mesh.parent = finish === lights ? front : (finish === tails ? rear : root);
        return mesh;
    });
    const window = windows[car];
    const rearWindow = "rearWindow" in window ? window.rearWindow : undefined;
    return { shell: meshes[2]!, cabin: { windshield: glassQuad(window.windshield),
        ...(rearWindow && { rearWindow: glassQuad(rearWindow) }) } };
}

function glassQuad(corners: readonly (readonly number[])[]): Quad {
    const [a, b, c, d] = corners.map(([x, y, z]) => new Vector3(x, y, z));
    return [a!, b!, c!, d!];
}
