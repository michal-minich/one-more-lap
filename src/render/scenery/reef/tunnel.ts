import type { Scene } from "@babylonjs/core/scene.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Course } from "../../../game/course/course.ts";
import { reefDeckHalfWidth, reefTunnelEnd, reefTunnelProfile, reefTunnelStart, sweepTunnel } from "../../../game/course/reef-tunnel.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { material } from "../../materials.ts";
import { beamBetween } from "../beam.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";

export function drawReefTunnel(scene: Scene, course: Course): Mesh {
    const glass = material(scene, "reef tunnel glass", "#74bfc9");
    glass.alpha = 0.50;
    glass.diffuseTexture = glassFinish(scene);
    glass.useAlphaFromDiffuseTexture = true;
    glass.backFaceCulling = false;
    glass.specularColor.set(0.34, 0.52, 0.60);
    glass.specularPower = 84;
    glass.emissiveColor.set(0.037, 0.105, 0.13);
    const pane = surface(scene, "closed glass tube", course.reefTunnel!, glass);
    pane.receiveShadows = false;
    pane.alphaIndex = 20;
    const deck = material(scene, "suspended deck steel", "#84958f");
    deck.diffuseTexture = surfaceTexture(scene, "weathered steel", 1, 4);
    deck.backFaceCulling = false;
    const lip = reefDeckHalfWidth;
    surface(scene, "suspended road deck", sweepTunnel(course, [[-lip, -0.08], [-lip, -0.61],
        [lip, -0.61], [lip, -0.08]]), deck);
    const portal = material(scene, "Coral Passage limestone portal", "#dec9ad");
    portal.diffuseTexture = surfaceTexture(scene, "coral limestone");
    portal.specularColor.set(0.037, 0.029, 0.023);
    portal.backFaceCulling = false;
    const stonework = surface(scene, "collidable limestone portal collars", course.reefPortalStonework!, portal);
    stonework.convertToFlatShadedMesh();
    const parts = new UrbanParts(scene);
    const build = parts.add;
    for (const [distance, facing] of [[reefTunnelStart, -1], [reefTunnelEnd, 1]] as const) {
        const front = course.at(distance + facing * 2.28);
        const yaw = Math.atan2(front.dx, front.dz);
        for (let section = 0; section < reefTunnelProfile.length - 1; section += 2) {
            const [x, y] = reefTunnelProfile[section]!;
            if (y < 0.6) continue;
            const inner = pointOnRoute(front, x * 1.035, 1.15 + (y - 1.15) * 1.035);
            const outer = pointOnRoute(front, x * 1.258, 1.15 + (y - 1.15) * 1.258);
            build("reef portal mortar", beamBetween(inner, outer, 0.084, 0.082), "#aa8f6f");
        }
        build("reef portal keystone", { ...pointOnRoute(front, 0, 9.15), sx: 0.95, sy: 1.74, sz: 0.41, yaw }, "#e6c9a1");
    }
    const bays = Math.ceil((reefTunnelEnd - reefTunnelStart) / 13);
    for (let bay = 0; bay <= bays; bay++) {
        const distance = reefTunnelStart + (reefTunnelEnd - reefTunnelStart) * bay / bays;
        const row = course.at(distance);
        const end = bay === 0 || bay === bays;
        const metal = end ? "#e6c9a1" : bay % 4 === 0 ? "#b4d0c6" : "#6b9aa2";
        let last = pointOnRoute(row, ...reefTunnelProfile[0]!);
        for (let i = 2; i < reefTunnelProfile.length; i += 2) {
            const [x, y] = reefTunnelProfile[i]!;
            const here = pointOnRoute(row, x, y);
            const size = end ? 0.58 : 0.22;
            build("reef tunnel ribs", beamBetween(last, here, size, size, 0.16), metal);
            last = here;
        }
        if (bay % 3 === 0 || end) {
            const lampRow = end ? course.at(distance + (bay === 0 ? -2.55 : 2.55)) : row;
            for (const side of [-1, 1]) {
                const at = pointOnRoute(lampRow, side * (end ? 9.10 : 6.00), end ? 4.05 : 5.67);
                const yaw = Math.atan2(lampRow.dx, lampRow.dz);
                build("reef tunnel ribs", { ...at, y: at.y + 0.09, sx: 0.29, sy: 0.63, sz: 0.27, yaw }, "#586664");
                build("hall lantern", { ...at, y: at.y - 0.16, sx: 0.31, sy: 0.37, sz: 0.32, yaw }, "#e9b374", "oval");
            }
        }
        if (bay === 0) continue;
        const previous = course.at(reefTunnelStart + (reefTunnelEnd - reefTunnelStart) * (bay - 1) / bays);
        for (const side of [-1, 1]) {
            const from = pointOnRoute(previous, side * 8.11, 0.43);
            const to = pointOnRoute(row, side * 8.11, 0.43);
            build("reef tunnel ribs", beamBetween(from, to, 0.20, 0.28, 0.08), "#6d9394");
            build("reef tunnel ribs", beamBetween(pointOnRoute(row, side * lip, -0.53),
                pointOnRoute(row, side * 8.03, -0.53), 0.24, 0.35), metal);
            build("hall lantern", beamBetween(pointOnRoute(previous, side * 7.98, 0.69),
                pointOnRoute(row, side * 7.98, 0.69), 0.087, 0.095), "#91ebd1");
        }
    }
    parts.draw();
    return stonework;
}

function glassFinish(scene: Scene): Texture {
    const texture = new DynamicTexture("blue reflections and glass panel seams", { width: 256, height: 256 }, scene, true);
    texture.hasAlpha = true;
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    const context = texture.getContext();
    context.fillStyle = "rgba(103, 179, 201, .18)";
    context.fillRect(0, 0, 256, 256);
    context.save();
    context.setTransform(1, 0.35, 0, 1, 0, 0);
    for (const y of [-230, 26, 282]) {
        const stripe = context.createLinearGradient(0, y, 0, y + 61);
        stripe.addColorStop(0, "rgba(184, 233, 251, 0)");
        stripe.addColorStop(0.38, "rgba(200, 241, 255, .82)");
        stripe.addColorStop(0.57, "rgba(137, 214, 240, .49)");
        stripe.addColorStop(1, "rgba(137, 214, 240, 0)");
        context.fillStyle = stripe;
        context.fillRect(0, y, 256, 61);
    }
    context.restore();
    context.fillStyle = "rgba(177, 228, 242, .58)";
    context.fillRect(0, 0, 256, 3);
    texture.update(true);
    return texture;
}
