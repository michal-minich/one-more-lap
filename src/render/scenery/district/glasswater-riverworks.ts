import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { GroundHeight } from "../../../game/course/ground-height.ts";
import { glasswaterCrossing } from "../../../game/course/glasswater-riverworks.ts";
import { roadHalfWidth } from "../../../game/course/road-width.ts";
import { channelPoint } from "../../../game/course/water.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { material } from "../../materials.ts";
import { beamBetween } from "../beam.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";

export function drawGlasswaterRiverworks(scene: Scene, course: Course): Mesh[] {
    const river = course.glasswaterRiverworks!;
    const stone = material(scene, "Glasswater cut riverside limestone", "#d7c0aa");
    stone.diffuseTexture = surfaceTexture(scene, "glasswater ashlar");
    stone.backFaceCulling = false;
    const granite = material(scene, "Glasswater bridge sidewalk stone", "#c5b6a4");
    granite.diffuseTexture = surfaceTexture(scene, "glasswater terrazzo", 1.28, 1.4);
    const steel = material(scene, "Glasswater painted steel", "#72a5ad");
    steel.diffuseTexture = surfaceTexture(scene, "glasswater enamel", 0.9, 1.38);
    steel.specularColor.set(0.21, 0.31, 0.36);
    steel.backFaceCulling = false;
    const deck = surface(scene, "Glasswater river bridge fascia", river.deck, stone);
    const arches = surface(scene, "Glasswater tied steel arches", river.arches, steel);
    for (const quay of river.quays) surface(scene, "Glasswater terraced quays", quay, stone);
    for (const parapet of river.parapets) surface(scene, "Glasswater limestone parapets", parapet, stone);
    for (const walk of river.walks) surface(scene, "Glasswater bridge sidewalks", walk, granite);

    const parts = new UrbanParts(scene);
    const build = parts.add;
    for (const { width, height, depth, ...at } of river.columns) {
        build("Glasswater ashlar column", { ...at, sx: width, sy: height, sz: depth }, "#c5b19c");
        build("Glasswater ashlar column", { ...at, y: at.y + height * 0.46, sx: width + 0.21, sy: 0.32,
            sz: depth + 0.23 }, "#e0ceb0");
    }
    for (const { from, to } of river.ties) {
        build("Glasswater blue-green plates", beamBetween(from, to, 0.60, 0.58, 0.32), "#5a828a");
    }
    for (const { from, to } of river.hangers) {
        build("Glasswater suspender rods", beamBetween(from, to, 0.129, 0.129, 0.06), "#d6bd8e");
        build("Glasswater blue-green plates", { ...to, sx: 0.39, sy: 0.46, sz: 0.41, yaw: 0 }, "#5b8990");
    }
    for (const distance of [glasswaterCrossing - 34, glasswaterCrossing + 34]) {
        const row = course.at(distance);
        const yaw = Math.atan2(row.dx, row.dz);
        for (const side of [-1, 1]) {
            const at = pointOnRoute(row, side * (roadHalfWidth("metro", distance) + 1.7), 0.27);
            build("Glasswater ashlar column", { ...at, sx: 1.64, sy: 1.57, sz: 2.05, yaw }, "#d9c2a7");
            build("Glasswater blue-green plates", { ...at, y: at.y + 0.78, sx: 1.43, sy: 0.25, sz: 1.51, yaw }, "#60878c");
        }
    }
    const channel = course.water.find(body => body.kind === "creek");
    if (channel) {
        const ledges = new GroundHeight(river.quays);
        for (const [downriver, bank] of [[-1, -1], [1, 1], [-1, 1], [1, -1]] as const) {
            for (const distance of [0.37, 0.48, 0.58, 0.69, 0.80]) {
                const edge = channelPoint(channel, downriver * distance, bank * 0.929);
                const base = ledges.at(edge.x, edge.z);
                if (base === undefined) continue;
                build("Glasswater quay bollards", { ...edge, y: base + 0.31, sx: 0.22, sy: 0.62, sz: 0.22, yaw: 0 },
                    "#46554f", "oval");
                build("Glasswater quay bollard caps", { ...edge, y: base + 0.59, sx: 0.35, sy: 0.12, sz: 0.35, yaw: 0 },
                    "#a48352", "oval");
            }
        }
    }
    const lampGlow = "#ffc368";
    for (const foot of river.lamps) {
        build("Glasswater ashlar column", { ...foot, y: foot.y + 0.46, sx: 0.92, sy: 1.11, sz: 0.88, yaw: 0 }, "#ded1b8");
        build("Glasswater blue-green plates", { ...foot, y: foot.y + 1.02, sx: 0.60, sy: 0.13, sz: 0.62, yaw: 0 }, "#92764b", "oval");
        build("Glasswater bridge globe", { ...foot, y: foot.y + 1.34, sx: 0.49, sy: 0.54, sz: 0.49, yaw: 0 }, lampGlow);
        build("Glasswater suspender rods", { ...foot, y: foot.y + 1.35, sx: 0.51, sy: 0.048, sz: 0.51, yaw: 0 },
            "#bb8d48", "oval");
    }
    return [deck, arches, ...parts.draw().filter(mesh => mesh.name === "Glasswater ashlar column")];
}
