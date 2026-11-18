import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { GLASSWATER_PAVEMENT } from "../../../game/course/city-frontage.ts";
import type { StreetBuilding } from "../../../game/course/city-frontage.ts";
import type { Course } from "../../../game/course/course.ts";
import { roadHalfWidth } from "../../../game/course/road-width.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { strip } from "../../../game/course/surface.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { offset, UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawGlasswaterStreet(scene: Scene, course: Course): Mesh[] {
    const pavers = material(scene, "concrete sidewalk", "#b1aca3");
    pavers.diffuseTexture = surfaceTexture(scene, "glasswater terrazzo");
    const apron = material(scene, "weathered street-side paving", "#858984");
    apron.diffuseTexture = surfaceTexture(scene, "glasswater ashlar", 1.35, 1.5);
    const curb = material(scene, "pale curb bands", "#b8b5a9");
    curb.diffuseTexture = pavers.diffuseTexture;
    const { start, end, setback } = GLASSWATER_PAVEMENT;
    const stations = Math.ceil((end - start) / 3);
    const route = Array.from({ length: stations + 1 }, (_, index) => course.at(start + index * (end - start) / stations));
    const followGround = (row: typeof route[number], lateral: number): number => {
        const p = pointOnRoute(row, lateral);
        return (course.ground.at(p.x, p.z) ?? row.y) - row.y + 0.053;
    };
    const parts = new UrbanParts(scene);
    for (const side of [-1, 1]) {
        const offsets = (low: number, high: number): readonly [number, number] => side > 0 ? [low, high] : [-high, -low];
        surface(scene, "Glasswater curb", strip(route, row => {
            const edge = roadHalfWidth("metro", row.distance);
            return offsets(edge + 0.12, edge + 0.45);
        }, (row, lateral) => followGround(row, lateral) + 0.075), curb);
        surface(scene, "Glasswater sidewalk", strip(route, row => offsets(roadHalfWidth("metro", row.distance) + 0.45, 11.2), followGround), pavers);
        surface(scene, "Glasswater shop frontage", strip(route, offsets(11.2, setback), followGround), apron);
        for (const distance of [58, 112, 166]) {
            const row = course.at(distance);
            const at = pointOnRoute(row, side * 9.6);
            const y = course.ground.at(at.x, at.z) ?? row.y;
            const yaw = Math.atan2(row.dx, row.dz);
            parts.add("street bench seats", { ...at, y: y + 0.48, sx: 0.66, sy: 0.14, sz: 2.25, yaw }, "#735f53");
            for (const along of [-0.71, 0.71]) {
                const foot = offset(at, yaw, 0, along);
                parts.add("bench feet", { ...foot, y: y + 0.24, sx: 0.44, sy: 0.49, sz: 0.13, yaw }, "#454b4b");
            }
        }
    }
    for (const building of course.streetBuildings) storefront(parts.add, building);
    return parts.draw();
}

function storefront(build: BuildPart, block: StreetBuilding): void {
    const { y, base, width, depth, height, style, yaw } = block;
    const brick = style === "brick";
    const glass = style === "glass";
    const tint = brick ? "#e1ad93" : glass ? "#627c85" : "#a69f91";
    const trim = brick ? "#e2c3a5" : "#b1b6b0";
    const top = y + height;
    build(brick ? "brick frontage" : "office frontage",
        { ...block, y: (top + base) / 2, sx: width, sy: top - base, sz: depth, yaw }, tint);
    build("metal parapet", { ...block, y: top + 0.07, sx: width + 0.18, sy: 0.32, sz: depth + 0.18, yaw }, trim);
    const face = offset(block, yaw, 0, -depth / 2);
    const glazing = glass ? "#8bb1bb" : "#8fa5a6";
    const banner = brick ? "#757454" : glass ? "#487683" : "#7a6460";
    build("shop glazing", { ...face, y: y + 1.74, sx: width * 0.92, sy: 2.73, sz: 0.19, yaw }, "#57767e");
    build("shop cornice", { ...face, y: y + 3.39, sx: width * 0.96, sy: 0.52, sz: 0.57, yaw }, banner);
    const awning = offset(face, yaw, 0, -0.55);
    build("sheet metal warehouse", { ...awning, y: y + 3.11, sx: width * 0.94, sy: 0.18, sz: 1.44,
        yaw, pitch: -0.13 }, banner);
    const columns = glass ? 6 : 4;
    for (let i = 0; i < columns; i++) {
        const pane = offset(face, yaw, ((i + 0.5) / columns - 0.5) * width * 0.93, -0.12);
        const lit = (i + Math.floor(block.x * 0.36)) % 3 === 0;
        const light = brick ? "#d9a86d" : "#83b7c3";
        build(lit ? "lit windows" : "office glazing", { ...pane, y: y + 1.82, sx: width * 0.77 / columns,
            sy: lit ? 1.47 : 1.79, sz: 0.06, yaw }, lit ? light : glazing);
    }
    for (let i = 0; i <= columns; i++) {
        const post = offset(face, yaw, (i / columns - 0.5) * width * 0.93, -0.1);
        build("frontage mullion", { ...post, y: y + 1.61, sx: 0.16, sy: 3.22, sz: 0.27, yaw }, trim);
    }
    for (let level = 4.9; level < height - 1.0; level += 2.65) {
        if (glass) {
            build("office glazing", { ...face, y: y + level, sx: width * 0.95, sy: 1.69, sz: 0.17, yaw }, glazing);
        } else for (let i = 0; i < columns; i++) {
            const pane = offset(face, yaw, ((i + 0.5) / columns - 0.5) * width, -0.06);
            build("office glazing", { ...pane, y: y + level, sx: width * 0.14, sy: 1.56, sz: 0.19, yaw }, glazing);
            build("stone sill", { ...pane, y: y + level - 0.83, sx: width * 0.16, sy: 0.14, sz: 0.36, yaw }, trim);
        }
    }
    for (const side of [-1, 1]) {
        for (let level = 4.9; level < height - 1; level += 2.65) {
            for (const along of [-0.27, 0, 0.27]) {
                const pane = offset(block, yaw, side * (width / 2 + 0.025), depth * along);
                build("office glazing", { ...pane, y: y + level, sx: depth * 0.17, sy: 1.51, sz: 0.13,
                    yaw: yaw + Math.PI / 2 }, glazing);
            }
        }
    }
    if (glass) for (let i = 0; i < columns; i++) {
        const mullion = offset(face, yaw, ((i + 0.5) / columns - 0.5) * width, -0.12);
        build("frontage mullion", { ...mullion, y: y + (height + 3.72) / 2, sx: 0.105, sy: height - 3.72, sz: 0.20, yaw }, trim);
    }
}
