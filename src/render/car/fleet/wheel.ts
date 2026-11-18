import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarId } from "../../../game/vehicle/cars.ts";
import { fromPacked, unpackMeshes } from "../../packed-mesh.ts";
import aero from "./aero-wheels.bin?inline";
import bastion from "./bastion-wheels.bin?inline";
import buggy from "./buggy-wheels.bin?inline";
import mistral from "./mistral-wheels.bin?inline";
import orbit from "./orbit-wheels.bin?inline";
import summit from "./summit-wheels.bin?inline";
import veloce from "./veloce-wheels.bin?inline";
import kestrel from "./kestrel-wheels.bin?inline";

type FleetCar = Exclude<CarId, "manta">;
const models: Record<FleetCar, string> = { aero, bastion, buggy, kestrel, mistral, orbit, summit, veloce };
const geometry = new Map<FleetCar, ReturnType<typeof unpackMeshes>>();

export function blenderWheel(
    scene: Scene, car: FleetCar, hub: TransformNode, side: number, materials: readonly StandardMaterial[],
): void {
    const wheels = geometry.get(car) ?? unpackMeshes(models[car]);
    geometry.set(car, wheels);
    const start = side < 0 ? 0 : 3;
    for (const [index, finish] of materials.entries()) {
        const mesh = fromPacked(scene, "Blender " + finish.name, wheels[start + index]!);
        mesh.material = finish;
        mesh.parent = hub;
    }
}
