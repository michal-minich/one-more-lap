import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { RouteSample } from "../../../game/course/route.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { UrbanParts } from "../urban-parts.ts";

const pearl = "#f3e8cd";
const mint = "#86bbab";
const blue = "#4c8594";
const plant = "#789953";

export function drawSkyway(scene: Scene, course: Course, row: RouteSample): void {
    const parts = new UrbanParts(scene);
    const build = parts.add;
    const yaw = Math.atan2(row.dx, row.dz);
    const deck = pointOnRoute(row, 0, 8.75);
    build("skyway white keel", { ...deck, sx: 63, sy: 1.1, sz: 7.4, yaw }, pearl, "oval");
    build("skyway sill", { ...deck, y: deck.y + 0.56, sx: 60, sy: 0.48, sz: 6.3, yaw }, mint);
    build("skyway roof", { ...deck, y: deck.y + 4.10, sx: 62, sy: 0.60, sz: 7.3, yaw }, pearl, "oval");
    for (const side of [-1, 1]) {
        const end = pointOnRoute(row, side * 31.1);
        const floor = course.ground.at(end.x, end.z) ?? row.y;
        const height = deck.y - floor;
        build("skyway pavilion", { ...end, y: floor + height * 0.49, sx: 9.0, sy: height + 0.8, sz: 10.4, yaw }, pearl, "oval");
        build("skyway lift", { ...end, y: floor + height * 0.63, sx: 7.8, sy: height * 0.80, sz: 10.5, yaw }, blue, "oval");
        build("planted skyway landing", { ...end, y: deck.y + 1.13, sx: 10.8, sy: 0.43, sz: 11.0, yaw }, mint, "oval");
        for (const along of [-3.6, 0, 3.6]) {
            build("skyway landing tree", { x: end.x + row.dx * along, y: deck.y + 2.1, z: end.z + row.dz * along,
                sx: 2.2, sy: 2.5, sz: 2.2, yaw }, plant, "leaf");
        }
    }
    const windows: Stamp[] = [];
    for (let bay = -6; bay <= 6; bay++) {
        const p = pointOnRoute(row, bay * 4.5, 10.95);
        for (const side of [-1, 1]) {
            const face = { x: p.x + side * row.dx * 3.15, y: p.y, z: p.z + side * row.dz * 3.15 };
            windows.push({ ...face, sx: 4.31, sy: 2.91, sz: 0.16, yaw });
            const rib = pointOnRoute(row, bay * 4.5 - 2.15, 10.95);
            build("skyway white diagonal", { x: rib.x + side * row.dx * 3.23, y: rib.y, z: rib.z + side * row.dz * 3.23,
                sx: 0.30, sy: 3.73, sz: 0.23, yaw, roll: (bay % 2 === 0 ? 1 : -1) * 0.49 }, pearl);
        }
        const cell = pointOnRoute(row, bay * 4.3, 13.2);
        build("Aurora photovoltaic panels", { ...cell, sx: 4.12, sy: 0.11, sz: 4.95, yaw }, "#385775");
    }
    parts.draw();
    const pane = MeshBuilder.CreateBox("skyway glass", { size: 1 }, scene);
    const glass = material(scene, "tinted skyway glass", "#6cbaba");
    glass.alpha = 0.42;
    glass.emissiveColor = Color3.FromHexString("#729baa").scale(0.22);
    pane.material = glass;
    stamp(pane, windows);
}
