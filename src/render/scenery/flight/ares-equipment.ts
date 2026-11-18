import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { coolantModuleSize } from "../../../game/course/halls.ts";
import type { HallEquipment } from "../../../game/course/halls.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import { unpackProp } from "../reconstructed-prop.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { offset, UrbanParts } from "../urban-parts.ts";
import coolant from "./ares-coolant-module.json" with { type: "json" };

const shape = unpackProp(coolant, value => Math.min(1, (value / 255) ** 0.78 * 1.15));

export function drawCoolantModules(scene: Scene, modules: readonly HallEquipment[]): Mesh[] {
    const paint = material(scene, "enameled spaceport machinery", "#ede7e1");
    paint.diffuseTexture = surfaceTexture(scene, "weathered steel");
    paint.specularColor.set(0.12, 0.1, 0.09);
    const mesh = surface(scene, "Ares coolant modules", shape, paint, () => shape.colors);
    const { width, height, depth } = coolantModuleSize;
    stamp(mesh, modules.map(site => ({
        ...site, y: site.y + 0.22, sx: width * 0.39, sy: height * 0.8, sz: depth * 0.45,
    })));
    const fittings = new UrbanParts(scene);
    for (const site of modules) addFittings(fittings, site);
    return [mesh, ...fittings.draw()];
}

function addFittings(fittings: UrbanParts, site: HallEquipment): void {
    const { width, height, depth } = coolantModuleSize;
    const { yaw, y } = site;
    const front = -width * 0.44;
    const metal = "#a4a2a5";
    const orange = "#d9833e";
    for (const side of [-1, 1]) {
        const foot = offset(site, yaw, 0, side * depth * 0.30);
        fittings.add("coolant skid", { ...foot, y: y + 0.11, sx: width, sy: 0.31, sz: 0.47, yaw }, "#535663");
        const corner = offset(site, yaw, front, side * depth * 0.40);
        fittings.add("coolant front frame", { ...corner, y: y + height * 0.52, sx: 0.16, sy: height * 0.83,
            sz: 0.20, yaw }, metal);
        const shroud = offset(site, yaw, 0.13, side * depth * 0.385);
        fittings.add("coolant access panel", { ...shroud, y: y + height * 0.59, sx: width * 0.76,
            sy: height * 0.28, sz: 0.19, yaw }, "#696674");
        for (const level of [0.25, 0.44, 0.63]) {
            const vent = offset(site, yaw, 0.13, side * depth * 0.46);
            fittings.add("coolant radiator slats", { ...vent, y: y + height * level, sx: width * 0.72, sy: 0.23,
                sz: 0.23, yaw }, orange);
        }
    }
    const center = offset(site, yaw, front, 0);
    for (const level of [0.13, 0.90]) {
        fittings.add("coolant front frame", { ...center, y: y + height * level, sx: 0.16, sy: 0.19,
            sz: depth * 0.81, yaw }, metal);
    }
    const panel = offset(site, yaw, front + 0.046, 0);
    fittings.add("coolant access panel", { ...panel, y: y + height * 0.53, sx: 0.17, sy: height * 0.62,
        sz: depth * 0.67, yaw }, "#595c64");
    const indicator = offset(site, yaw, front - 0.08, 0);
    fittings.add("hall lantern", { ...indicator, y: y + height * 0.71, sx: 0.06, sy: 0.07,
        sz: depth * 0.47, yaw }, "#6de4e6");
    fittings.add("coolant canopy", { ...site, y: y + height * 0.87, sx: width * 0.83, sy: 0.16,
        sz: depth * 0.86, yaw }, metal);
}
