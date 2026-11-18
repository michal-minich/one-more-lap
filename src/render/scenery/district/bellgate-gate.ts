import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { GATE_DEPTH, GATE_WALKWAY, GATE_WIDTH } from "../../../game/course/town-gate.ts";
import type { TownGate } from "../../../game/course/town-gate.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { offset, UrbanParts } from "../urban-parts.ts";

const masonry = "#e7c7a0";
const molding = "#ebd8b5";
const timber = "#795843";
const opening = "#594b42";

export function drawBellgateGate(scene: Scene, { row, towers, yaw, arch, voussoirs }: TownGate): Mesh[] {
    const limestone = material(scene, "Bellgate arch limestone", masonry);
    limestone.diffuseTexture = surfaceTexture(scene, "bellgate ashlar");
    const carved = material(scene, "Bellgate dressed voussoirs", "#fae0b5");
    carved.diffuseTexture = surfaceTexture(scene, "bellgate ashlar", 0.94, 0.86);
    const archMesh = surface(scene, "Bellgate vaulted arch", arch, limestone);
    const stones = surface(scene, "Bellgate voussoirs", voussoirs, carved);
    limestone.backFaceCulling = false;
    carved.backFaceCulling = false;

    const parts = new UrbanParts(scene);
    const build = parts.add;
    for (const tower of towers) {
        build("Bellgate tower", { ...tower, y: tower.base + tower.height / 2, sx: GATE_WIDTH, sy: tower.height,
            sz: GATE_DEPTH, yaw }, masonry);
        build("Bellgate tower", { ...tower, y: row.y + 0.4, sx: GATE_WIDTH + 0.38, sy: 1.1,
            sz: GATE_DEPTH + 0.39, yaw }, "#c9aa86");
        for (const y of [1.02, 2.79, 8.97, 10.52]) {
            build("Bellgate coping", { ...tower, y: row.y + y, sx: GATE_WIDTH + 0.28, sy: 0.22,
                sz: GATE_DEPTH + 0.29, yaw }, molding);
        }
        build("Bellgate hip roof", { ...tower, y: row.y + 11.82, sx: GATE_WIDTH + 0.88, sy: 2.78,
            sz: GATE_DEPTH + 0.91, yaw: yaw + Math.PI / 4 }, "#ba795c");
        build("Bellgate coping", { ...tower, y: row.y + 13.31, sx: 0.46, sy: 0.55, sz: 0.46, yaw }, molding, "oval");
        for (const side of [-1, 1]) {
            const face = offset(tower, yaw, 0, side * (GATE_DEPTH / 2 + 0.06));
            for (const y of [3.6, 7.9, 9.56]) {
                build("slit windows", { ...face, y: row.y + y, sx: 0.43, sy: 1.04, sz: 0.12, yaw }, opening);
                build("Bellgate coping", { ...face, y: row.y + y - 0.62, sx: 0.7, sy: 0.18, sz: 0.28, yaw }, molding);
            }
            const sign = Math.sign((tower.x - row.x) * row.dz - (tower.z - row.z) * row.dx);
            const lantern = offset(face, yaw, sign * -1.34, side * 0.17);
            build("weathered timber", { ...lantern, y: row.y + 5.11, sx: 0.11, sy: 0.17, sz: 0.79, yaw }, opening);
            const glass = offset(lantern, yaw, 0, side * 0.18);
            build("entry lantern", { ...glass, y: row.y + 4.64, sx: 0.45, sy: 0.64, sz: 0.43, yaw }, "#ffb857");
            for (const y of [4.25, 5.02]) {
                build("weathered timber", { ...glass, y: row.y + y, sx: 0.56, sy: 0.16, sz: 0.54, yaw }, opening);
            }
            const banner = offset(face, yaw, sign * 0.34, side * 0.05);
            build("Bellgate standard", { ...banner, y: row.y + 5.81, sx: 1.08, sy: 2.42, sz: 0.07, yaw }, "#a8483a");
            const stripe = offset(banner, yaw, 0, side * 0.049);
            build("Bellgate standard", { ...stripe, y: row.y + 5.22, sx: 1.07, sy: 0.29, sz: 0.035, yaw }, "#ecd1a4");
            build("weathered timber", { ...banner, y: row.y + 7.05, sx: 1.37, sy: 0.09, sz: 0.15, yaw }, timber);
        }
    }
    build("Bellgate coping", { ...row, y: row.y + GATE_WALKWAY, sx: 19.5, sy: 0.36, sz: 4.57, yaw }, molding);
    for (const side of [-1, 1]) {
        const railing = offset(row, yaw, 0, side * 2.02);
        build("Bellgate tower", { ...railing, y: row.y + 8.56, sx: 16.3, sy: 0.68, sz: 0.54, yaw }, masonry);
        build("Bellgate coping", { ...railing, y: row.y + 8.95, sx: 16.4, sy: 0.14, sz: 0.64, yaw }, molding);
        build("weathered timber", { ...railing, y: row.y + 10.47, sx: 16.4, sy: 0.2, sz: 0.28, yaw }, timber);
        for (const x of [-6.8, -4.1, -1.4, 1.4, 4.1, 6.8]) {
            const post = offset(railing, yaw, x, 0);
            build("weathered timber", { ...post, y: row.y + 9.71, sx: 0.24, sy: 1.56, sz: 0.27, yaw }, timber);
            for (const slope of [-1, 1]) {
                const brace = offset(post, yaw, slope * 0.23, 0);
                build("weathered timber", { ...brace, y: row.y + 10.19, sx: 0.18, sy: 0.67, sz: 0.17,
                    yaw, roll: slope * -0.62 }, timber);
            }
        }
    }
    build("Bellgate tile roof", { ...row, y: row.y + 10.45, sx: 5.45, sy: 1.71, sz: 16.99,
        yaw: yaw + Math.PI / 2 }, "#bf7a58");
    const casters = new Set(["Bellgate tower", "Bellgate hip roof", "Bellgate tile roof"]);
    return [archMesh, stones, ...parts.draw().filter(mesh => casters.has(mesh.name))];
}
