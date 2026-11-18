import type { Scene } from "@babylonjs/core/scene.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { upperAqueduct } from "../../../game/course/aqueduct.ts";
import type { Aqueduct } from "../../../game/course/aqueduct.ts";
import type { Course } from "../../../game/course/course.ts";
import type { Outpost } from "../../../game/course/outposts.ts";
import { scatterPatch } from "../../../game/course/vegetation/scatter.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { seededRandom } from "../../../game/random.ts";
import { offset, UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { aqueductArchBands, aqueductWall } from "./aqueduct-wall.ts";

const pale = "#f1e4c9";
const weathered = "#c4af8d";
const dark = "#807764";
const green = "#738c50";

export function greatAqueduct(scene: Scene, aqueduct: Aqueduct): Mesh[] {
    const group = new UrbanParts(scene);
    const build = group.add;
    const { row, yaw, span, count, springline, rise } = aqueduct;
    const random = seededRandom(1_489);
    for (const [index, { center, ground, width, height, depth }] of aqueduct.columns.entries()) {
        build("Aegean dressed limestone", { ...center, sx: width, sy: height, sz: depth, yaw }, weathered);
        build("Aegean dressed limestone", {
            ...center, y: ground + 0.29, sx: width + 0.51, sy: 0.98, sz: depth + 0.6, yaw,
        }, dark);
        build("Aegean dressed limestone", { ...center, y: springline - 0.12, sx: 3.1, sy: 0.61, sz: 4.88, yaw }, pale);
        if (index === 2 || index === 4 || index === 7) {
            const side = index % 2 === 0 ? -1 : 1;
            const z = side * (depth / 2 + 0.16);
            for (let sprig = 0; sprig < 9; sprig++) {
                const lift = sprig * 0.33;
                const u = (0.56 + Math.sin(sprig * 1.43) * 0.44) * side;
                const leaf = offset(center, yaw, u, z);
                build("aqueduct creepers", { ...leaf, y: ground + 0.3 + lift, sx: 0.86 + random() * 0.63,
                    sy: 0.62, sz: 0.6, yaw }, sprig % 2 === 0 ? green : "#586842", "leaf");
                if (sprig % 3 !== 1) {
                    const flower = offset(center, yaw, u + (random() - 0.5) * 0.7, z + side * 0.38);
                    build("aqueduct bougainvillea", { ...flower, y: ground + 0.33 + lift, sx: 0.56,
                        sy: 0.38 + random() * 0.20, sz: 0.41, yaw }, sprig % 3 === 0 ? "#bf477f" : "#e26a9f", "leaf");
                }
            }
        }
    }
    const top = { x: row.x, y: springline + rise + 0.82, z: row.z };
    build("Aegean dressed limestone", { ...top, sx: span * count + 1.3, sy: 1.16, sz: 4.9, yaw }, pale);
    const arcade = upperAqueduct(aqueduct);
    for (let index = 0; index <= arcade.count; index++) {
        const foot = pointOnRoute(row, (index - arcade.count / 2) * arcade.span);
        build("Aegean dressed limestone", { ...foot, y: top.y + 1.68, sx: 1.21, sy: 2.48, sz: 2.53, yaw }, weathered);
    }
    const crown = { ...top, y: arcade.springline + arcade.rise + 0.65 };
    build("aqueduct trough", { ...crown, sx: span * count + 0.88, sy: 0.61, sz: 3.19, yaw }, pale);
    return [aqueductWall(scene, aqueduct), aqueductArchBands(scene, aqueduct),
        aqueductWall(scene, arcade, 1.24), aqueductArchBands(scene, arcade, 1.35, 0.63),
        ...group.draw()];
}

export function aegeanTemple(build: BuildPart, course: Course, site: Outpost): void {
    const { position: at, yaw } = site;
    const apron = offset(at, yaw, 0, -11.6);
    build("Aegean dressed limestone", { ...apron, y: at.y - 1.18, sx: 37.6, sy: 3.23, sz: 33.2, yaw }, weathered);
    for (let terrace = 0; terrace < 4; terrace++) {
        build("Aegean dressed limestone", { ...at, y: at.y + terrace * 0.54, sx: 31.4 - terrace * 1.73,
            sy: terrace === 0 ? 3.6 : 1.56, sz: 45.2 - terrace * 1.57, yaw }, terrace % 2 === 0 ? pale : weathered);
    }
    for (let stair = 0; stair < 8; stair++) {
        const step = offset(at, yaw, 0, -29.6 + stair * 0.89);
        const top = at.y + stair * 0.325;
        const bottom = Math.min(top - 0.29, course.ground.at(step.x, step.z) ?? at.y) - 0.19;
        build("Aegean dressed limestone", { ...step, y: (top + bottom) / 2, sx: 8.75, sy: top - bottom,
            sz: 0.91, yaw }, stair % 2 === 0 ? pale : weathered);
    }
    const plinth = at.y + 2.4;
    build("temple cella", { ...at, y: plinth + 3.7, sx: 14.3, sy: 7.7, sz: 24.5, yaw }, weathered);
    for (const side of [-1, 1]) {
        for (let index = 0; index < 9; index++) {
            const post = offset(at, yaw, side * 11.05, (index - 4) * 4.12);
            templeColumn(build, { ...post, y: plinth }, yaw, index === 1 && side === 1 ? 3 : 8.27);
        }
        for (let index = 1; index < 5; index++) {
            const post = offset(at, yaw, (index - 2.5) * 4.38, side * 16.48);
            templeColumn(build, { ...post, y: plinth }, yaw, 8.27);
        }
    }
    build("Aegean dressed limestone", { ...at, y: plinth + 8.75, sx: 25.1, sy: 1.3, sz: 36.9, yaw }, pale);
    const roofBase = plinth + 9.41;
    const roofRise = 4.42;
    const roofWidth = 26.7;
    const roof = { ...at, y: roofBase, sx: roofWidth, sy: roofRise, sz: 38.4, yaw };
    build("Aegean temple roof", roof, "#f9dfc0");
    build("Aegean temple pediment", roof, pale);
    build("Aegean terracotta rim", { ...at, y: roofBase + roofRise, sx: 0.47, sy: 0.31, sz: roof.sz, yaw }, "#eed7bd");
    for (const side of [-1, 1]) {
        const eave = offset(at, yaw, side * roofWidth / 2, 0);
        build("Aegean terracotta rim", { ...eave, y: roofBase + 0.10, sx: 0.82, sy: 0.33, sz: roof.sz, yaw }, "#e6c7aa");
    }
    const angle = Math.atan2(roofRise, roofWidth / 2);
    const rafter = Math.hypot(roofWidth / 2, roofRise);
    for (const end of [-19.2, 19.2]) {
        for (const side of [-1, 1]) {
            const molding = offset(at, yaw, side * roofWidth / 4, end);
            build("Aegean dressed limestone", { ...molding, y: roofBase + roofRise / 2, sx: rafter,
                sy: 0.33, sz: 0.66, yaw, roll: -side * angle }, pale);
        }
    }
    const random = seededRandom(518);
    for (const [i, plant] of scatterPatch(at, 12, 17, yaw, 5, random).entries()) {
        const size = 0.42 + random() * 0.78;
        const roofAcross = (plant.x - at.x) * Math.cos(yaw) - (plant.z - at.z) * Math.sin(yaw);
        const roofY = roofBase + roofRise * (1 - Math.abs(roofAcross) * 2 / roofWidth);
        build("temple roof moss", { ...plant, y: roofY + random() * 0.14, sx: size * 2.2, sy: 0.21,
            sz: size * 1.7, yaw }, i % 2 === 0 ? green : "#85995a", "leaf");
    }
    for (const stump of scatterPatch(at, 19, 24, yaw, 18, random)) {
        const y = course.ground.at(stump.x, stump.z) ?? at.y;
        const size = 0.71 + random() * 1.68;
        build("fallen marble blocks", { ...stump, y: y + 0.29, sx: size, sy: 0.58, sz: size * 0.71,
            yaw: random() * Math.PI }, weathered);
    }
}

function templeColumn(build: BuildPart, at: Outpost["position"], yaw: number, height: number): void {
    build("Aegean dressed limestone", { ...at, y: at.y + 0.22, sx: 2, sy: 0.44, sz: 2, yaw }, pale);
    build("Aegean dressed limestone", {
        ...at, y: at.y + height / 2 + 0.34, sx: 1.32, sy: height, sz: 1.32, yaw,
    }, pale, "oval");
    for (let ring = 0; ring < 3; ring++) {
        build("pillar capital", { ...at, y: at.y + height + ring * 0.14, sx: 1.45 + ring * 0.21, sy: 0.16,
            sz: 1.45 + ring * 0.21, yaw }, weathered, ring === 2 ? "box" : "oval");
    }
}
