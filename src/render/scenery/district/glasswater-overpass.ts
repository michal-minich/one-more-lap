import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { GlasswaterFlyover } from "../../../game/course/glasswater-flyover.ts";
import { beamBetween } from "../beam.ts";
import { offset, UrbanParts } from "../urban-parts.ts";

const concrete = "#c3bdb0";
const steel = "#527479";
const enamel = "#658e96";

export function drawGlasswaterOverpass(scene: Scene, flyover: GlasswaterFlyover): Mesh[] {
    const parts = new UrbanParts(scene);
    const build = parts.add;
    const { yaw, deck: center } = flyover;
    const deck = center.y;
    for (const { from, to, width, height } of flyover.spans) {
        build("Glasswater flyover fascia", beamBetween(from, to, width, height, 0.24), concrete);
        for (const side of [-1, 1]) {
            const railFrom = offset({ ...from, y: from.y + 0.37 }, yaw, 0, side * 0.91);
            const railTo = offset({ ...to, y: to.y + 0.37 }, yaw, 0, side * 0.91);
            build("Glasswater suspender rods", beamBetween(railFrom, railTo, 0.12, 0.1, 0.02), "#686763");
        }
    }
    for (const { width, height, depth, ...at } of flyover.footings) {
        build("Glasswater flyover footing", { ...at, sx: width, sy: height, sz: depth, yaw }, concrete);
    }
    for (const { from, to, width, height } of flyover.braces) {
        build("Glasswater flyover girder", beamBetween(from, to, width, height, 0.24), steel);
        build("Glasswater flyover edge", { ...to, y: to.y - 0.22, sx: 0.94, sy: 0.29, sz: 0.78, yaw }, enamel);
    }
    for (const side of [-1, 1]) {
        const edge = offset(center, yaw, 0, side * 3.66);
        build("Glasswater flyover edge", { ...edge, y: deck + 0.86, sx: 37.95, sy: 0.12, sz: 0.18, yaw }, steel);
        for (let across = -18; across <= 18; across += 3) {
            const post = offset(edge, yaw, across, 0);
            build("Glasswater flyover edge", { ...post, y: deck + 0.41, sx: 0.115, sy: 0.91, sz: 0.17, yaw }, steel);
        }
        const lintel = offset(center, yaw, 0, side * 2.18);
        build("Glasswater flyover girder", { ...lintel, y: deck - 0.49, sx: 38, sy: 0.46, sz: 0.31, yaw }, steel);
        for (const x of [-6.6, -2.2, 2.2, 6.6]) {
            const lamp = offset(center, yaw, x, side * 1.67);
            build("hall lantern", { ...lamp, y: deck - 0.36, sx: 2.75, sy: 0.07, sz: 0.25, yaw }, "#abe0e7");
        }
    }
    return parts.draw().filter(mesh => mesh.name === "Glasswater flyover fascia" || mesh.name === "Glasswater flyover footing");
}
