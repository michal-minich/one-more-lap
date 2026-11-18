import type { Scene } from "@babylonjs/core/scene.js";
import type { Hall } from "../../../game/course/halls.ts";
import { HALL_WALL_BANDS, hallWalls } from "../../../game/course/hall-walls.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawHallWallPanels(scene: Scene, hall: Hall): void {
    const hangar = hall.kind === "space hangar";
    const label = hangar ? "Ares lower bulkhead" : "conservatory glazed-wall base";
    const panel = material(scene, label, hangar ? "#987e68" : "#dce4d8");
    panel.diffuseTexture = surfaceTexture(scene, hangar ? "thermal cladding" : "ceramic plating");
    panel.specularColor.set(0.105, 0.097, 0.088);
    panel.backFaceCulling = false;
    if (hangar) panel.emissiveColor.set(0.17, 0.12, 0.08);
    const shape = hallWalls(hall);
    const shades = [0.58, 0.78, 1, hangar ? 0.66 : 0.79, 0.93];
    const colors = new Float32Array(shape.positions.length / 3 * 4);
    for (let vertex = 0; vertex < colors.length / 4; vertex++) {
        const tint = shades[vertex % HALL_WALL_BANDS]!;
        colors.set([tint, tint * 0.98, tint * 0.96, 1], vertex * 4);
    }
    surface(scene, label, shape, panel, () => colors);
}
