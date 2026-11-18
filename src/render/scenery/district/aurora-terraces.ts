import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { Point } from "../../../game/point.ts";
import { beamBetween } from "../beam.ts";
import { offset, UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

const ceramic = "#e4e9df";
const green = "#688d50";
const copper = "#ab876d";
const glass = "#6b9ca9";

export function drawAuroraTerraces(scene: Scene, course: Course): Mesh[] {
    const parts = new UrbanParts(scene);
    const stations = [[336, -30, 0.9, -0.29], [589, -24, 1, 0.34], [901, 35, 0.87, 0.55]] as const;
    for (const [distance, lateral, scale, twist] of stations) {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const y = course.ground.at(at.x, at.z) ?? row.y;
        const yaw = Math.atan2(row.dx, row.dz) + twist;
        terrace(parts.add, course, { ...at, y }, yaw, scale);
    }
    return parts.draw();
}

function terrace(build: BuildPart, course: Course, at: Point, yaw: number, scale: number): void {
    const lower = offset(at, yaw, -2 * scale, 0);
    const upper = offset(at, yaw, 2.4 * scale, -1.4 * scale);
    let plinthBottom = at.y - 0.45;
    for (const side of [-1, 1]) {
        for (const tip of [-1, 1]) {
            const edge = offset(at, yaw, side * 7.4 * scale, tip * 9.6 * scale);
            plinthBottom = Math.min(plinthBottom, (course.ground.at(edge.x, edge.z) ?? at.y) - 0.5);
        }
    }
    build("Aurora retaining stone", { ...at, y: (plinthBottom + at.y + 1) / 2, sx: 18 * scale,
        sy: at.y + 1 - plinthBottom, sz: 24 * scale, yaw }, ceramic, "oval");
    for (const [pad, height, width, length] of [[lower, 2.5, 14.6, 22], [upper, 5.35, 10.8, 17]] as const) {
        const level = at.y + height * scale;
        build("Aurora terrace shell", { ...pad, y: (at.y + level) / 2, sx: width * scale, sy: level - at.y,
            sz: length * scale, yaw }, ceramic, "oval");
        build("Aurora terrace rim", { ...pad, y: level - 0.19, sx: (width + 0.63) * scale, sy: 0.41,
            sz: (length + 0.72) * scale, yaw }, copper, "oval");
        build("planted terrace", { ...pad, y: level + 0.04, sx: (width - 0.35) * scale, sy: 0.21,
            sz: (length - 0.4) * scale, yaw }, green, "oval");
        for (const [x, z] of [[0.3, -0.55], [-0.46, -0.22], [-0.62, 0.24], [0.1, 0.62], [0.67, 0.11]] as const) {
            const shrub = offset(pad, yaw, x * width * 0.5 * scale, z * length * 0.5 * scale);
            build("promenade shrubs", { ...shrub, y: level + 0.49, sx: 1.89 * scale, sy: 1.04,
                sz: 1.57 * scale, yaw }, green, "leaf");
        }
    }
    const top = at.y + 5.35 * scale;
    build("garden glass", { ...upper, y: top + 1.57 * scale, sx: 6.2 * scale, sy: 3.18 * scale,
        sz: 10.5 * scale, yaw }, glass, "oval");
    drawCanopy(build, { ...upper, y: top }, yaw, scale);
    drawStair(build, course, lower, yaw, at.y + 2.55 * scale, scale);
}

function drawCanopy(build: BuildPart, at: Point, yaw: number, scale: number): void {
    const ridge = at.y + 6.85 * scale;
    for (const z of [-4.7, 0, 4.7]) {
        const crown = offset({ ...at, y: ridge }, yaw, -0.7 * scale, z * scale);
        for (const side of [-1, 1]) {
            const foot = offset(at, yaw, side * 3.75 * scale, z * scale);
            const eave = offset({ ...foot, y: at.y + 4.48 * scale }, yaw, side * 0.92 * scale, 0);
            build("Aurora terrace shell", beamBetween(foot, eave, 0.34, 0.37, 0.25), ceramic);
            build("Aurora terrace shell", beamBetween(eave, crown, 0.53, 0.43, 0.22), ceramic);
        }
    }
    for (const side of [-1, 1]) {
        for (let bay = -2; bay <= 2; bay++) {
            const skin = offset(at, yaw, side * 2.25 * scale - 0.48, bay * 1.97 * scale);
            build("Aurora photovoltaic panels", { ...skin, y: at.y + 5.69 * scale, sx: 4.90 * scale, sy: 0.13,
                sz: 1.86 * scale, yaw, roll: -side * 0.49 }, "#4b7181");
        }
    }
}

function drawStair(build: BuildPart, course: Course, at: Point, yaw: number, top: number, scale: number): void {
    for (let step = 0; step < 7; step++) {
        const stair = offset(at, yaw, 0, (10.0 + step * 0.56) * scale);
        const ground = (course.ground.at(stair.x, stair.z) ?? at.y) - 0.31;
        const tread = top - step * 0.34 * scale;
        const height = tread - ground;
        if (height <= 0) continue;
        build("Aurora retaining stone", { ...stair, y: (tread + ground) / 2, sx: 3.63 * scale, sy: height,
            sz: 0.59 * scale, yaw }, ceramic);
    }
}
