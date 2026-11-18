import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { SkywheelGrounds } from "../../../game/course/stunt/grounds.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawSkywheelGrounds(scene: Scene, build: BuildPart, grounds: SkywheelGrounds): Mesh[] {
    const timber = material(scene, "Skywheel gallery ribs", "#c58b51");
    timber.diffuseTexture = surfaceTexture(scene, "sawn cedar", 1.65, 0.68);
    timber.backFaceCulling = false;
    const canopy = material(scene, "Skywheel gallery canopy", "#547e78");
    canopy.diffuseTexture = surfaceTexture(scene, "skywheel enamel", 1.29, 0.38);
    canopy.specularColor.set(0.19, 0.22, 0.2);
    canopy.backFaceCulling = false;
    const pavement = material(scene, "Skywheel pedestrian limestone", "#ebddba");
    pavement.diffuseTexture = surfaceTexture(scene, "skywheel limestone", 1.35);
    const limestone = material(scene, "Skywheel terrace limestone", "#e7cfb3");
    limestone.diffuseTexture = surfaceTexture(scene, "skywheel limestone", 1.53, 1.62);
    limestone.backFaceCulling = false;

    for (const path of grounds.paving) surface(scene, "Skywheel gallery paving", path, pavement);
    for (const terrace of grounds.terraces) surface(scene, "Skywheel stepped terraces", terrace, limestone);
    const span = surface(scene, "Skywheel chamfered gallery ribs", grounds.ribs, timber);
    const roofing = grounds.roof.map(panels => surface(scene, "Skywheel segmented gallery roof", panels, canopy));

    for (const footing of grounds.footings) {
        const { width, depth, height, yaw } = footing;
        const top = footing.y + height / 2;
        build("Skywheel stone pier", { ...footing, sx: width, sy: height, sz: depth }, "#c76053");
        build("Skywheel pier plinth", { ...footing, y: footing.y - height / 2 + 0.77,
            sx: width + 0.36, sy: 1.54, sz: depth + 0.36, yaw }, "#d9c698");
        build("Skywheel pier plinth", { ...footing, y: top - 0.19,
            sx: width + 0.26, sy: 0.34, sz: depth + 0.19, yaw }, "#e3c885");
        for (const side of [-1, 1]) {
            const inset = offset(footing, yaw, 0, side * depth / 2);
            build("Skywheel pier enamel inset", { ...inset, y: top - 0.95, sx: 0.61, sy: 1.11, sz: 0.07, yaw },
                "#5d8b83");
            build("hall lantern", { ...inset, y: top - 0.33, sx: 0.36, sy: 0.28, sz: 0.2, yaw }, "#f0cb86", "oval");
        }
    }
    drawCatwalk(build, grounds.catwalk);
    return [span, ...roofing];
}

function drawCatwalk(build: BuildPart, deck: SkywheelGrounds["catwalk"]): void {
    const { width, depth, height, yaw } = deck;
    build("Skywheel catwalk structure", { ...deck, sx: width, sy: height, sz: depth }, "#a96d41");
    for (const side of [-1, 1]) {
        const face = offset(deck, yaw, 0, side * (depth / 2 + 0.048));
        build("Skywheel catwalk fascia", { ...face, sx: width + 0.12, sy: 0.21, sz: 0.17, yaw }, "#ca9d51");
        const rail = offset(deck, yaw, 0, side * (depth / 2 - 0.12));
        build("Skywheel catwalk rail", { ...rail, y: deck.y + 1.46, sx: width, sy: 0.15, sz: 0.14, yaw },
            "#e2cf99");
        build("Skywheel catwalk rail", { ...rail, y: deck.y + 0.56, sx: width, sy: 0.14, sz: 0.16, yaw },
            "#dcb97d");
        for (let at = -9.35; at <= 9.4; at += 0.55) {
            const baluster = offset(rail, yaw, at, 0);
            build("Skywheel catwalk baluster", { ...baluster, y: deck.y + 1, sx: 0.14, sy: 0.94, sz: 0.13, yaw },
                "#ece0b9", "oval");
        }
    }
}
