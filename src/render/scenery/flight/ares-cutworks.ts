import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { AresCutworks } from "../../../game/course/ares-cutworks.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";

export function drawAresCutworks(scene: Scene, works: AresCutworks): Mesh[] {
    const ceramic = material(scene, "Ares pressure gallery ceramic", "#eed9bd");
    ceramic.diffuseTexture = surfaceTexture(scene, "ares ceramic", 1.17, 1.1);
    ceramic.backFaceCulling = false;
    const enamel = material(scene, "Ares ribbon armor", "#e69e75");
    enamel.diffuseTexture = surfaceTexture(scene, "ares enamel", 0.73, 0.85);
    enamel.specularColor.set(0.22, 0.16, 0.12);
    enamel.backFaceCulling = false;
    const strata = material(scene, "Ares cut sandstone", "#bd9d92");
    strata.diffuseTexture = surfaceTexture(scene, "ares strata", 1.3, 1.4);
    strata.backFaceCulling = false;
    const inspection = material(scene, "Ares slate service pavement", "#ab9d94");
    inspection.diffuseTexture = surfaceTexture(scene, "ares asphalt", 0.8, 1.2);
    const shutters = material(scene, "Ares gallery heat baffles", "#c0ad9d");
    shutters.diffuseTexture = surfaceTexture(scene, "ares ceramic", 1.9, 2.15);
    shutters.backFaceCulling = false;
    const rib = surface(scene, "Ares ceramic pressure gallery", works.frames, ceramic);
    surface(scene, "Ares gallery enamel strips", works.armor, enamel);
    const lids = works.baffles.map(baffle => surface(scene, "Ares slotted heat baffles", baffle, shutters));
    for (const terrace of works.retainingLedges) surface(scene, "Ares eastern rim terraces", terrace, strata);
    for (const path of works.overlook) surface(scene, "Ares apron overlook", path, inspection);
    for (const path of works.inspectionLane) surface(scene, "Ares gallery inspection lanes", path, inspection);

    const parts = new UrbanParts(scene);
    for (const footing of works.footings) {
        const { width, height, depth, yaw } = footing;
        parts.add("Ares gallery slate footing", { ...footing, sx: width, sy: height, sz: depth }, "#8c7272");
        parts.add("Ares gallery footing cap", { ...footing, y: footing.y + height / 2,
            sx: width + 0.17, sy: 0.32, sz: depth + 0.16, yaw }, "#c5ad9c");
        parts.add("Ares gallery footing cap", { ...footing, y: footing.y + height / 2 - 0.47,
            sx: width + 0.1, sy: 0.13, sz: depth + 0.12, yaw }, "#ae785d");
    }
    for (const signal of works.guidance) {
        parts.add("Ares gallery light mount", { ...signal, sx: 0.29, sy: 1.38, sz: 0.64 }, "#75696d");
        parts.add("Ares cyan guide strip", { ...signal, x: signal.x - Math.cos(signal.yaw) * signal.side * 0.16,
            z: signal.z + Math.sin(signal.yaw) * signal.side * 0.16, sx: 0.045, sy: 1.03, sz: 0.25 }, "#82dde1");
    }
    return [rib, ...lids, ...parts.draw().filter(mesh => mesh.name === "Ares gallery slate footing")];
}
