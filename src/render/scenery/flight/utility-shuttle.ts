import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { material } from "../../materials.ts";
import type { Stamp } from "../instances.ts";
import { stamp } from "../instances.ts";
import { unpackSurface } from "../packed-surface.ts";
import { surface } from "../surface-mesh.ts";
import oxideImage from "./oxide-panel.jpg?inline";
import slateImage from "./slate-panel.jpg?inline";
import packed from "./utility-shuttle.json" with { type: "json" };

const parts = packed.map(unpackSurface);

export function drawUtilityShuttles(scene: Scene, berths: readonly Stamp[]): void {
    const glass = material(scene, "utility shuttle canopy", "#284962");
    glass.specularColor.set(0.48, 0.52, 0.64);
    const oxide = material(scene, "utility shuttle orange panels", "#fff4e9");
    const slate = material(scene, "utility shuttle slate panels", "#f2eff4");
    oxide.diffuseTexture = new Texture(oxideImage, scene);
    slate.diffuseTexture = new Texture(slateImage, scene);
    const lamps = material(scene, "utility shuttle thruster strips", "#37ccdf");
    lamps.emissiveColor.set(0.11, 0.66, 0.76);
    const trim = material(scene, "utility shuttle graphite trim", "#27313b");
    const finishes = [glass, oxide, slate, lamps, trim];
    for (const [index, shape] of parts.entries()) {
        const finish = finishes[index]!;
        stamp(surface(scene, finish.name, shape, finish), berths);
    }
}
