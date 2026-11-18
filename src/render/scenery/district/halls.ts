import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Course } from "../../../game/course/course.ts";
import type { Hall } from "../../../game/course/halls.ts";
import { roadHalfWidth } from "../../../game/course/road-width.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { strip } from "../../../game/course/surface.ts";
import type { Point } from "../../../game/point.ts";
import { material } from "../../materials.ts";
import { drawCoolantModules } from "../flight/ares-equipment.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { surface } from "../surface-mesh.ts";
import { UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { drawHallWallPanels } from "./hall-wall-panels.ts";

const stone = "#e4eae2";
const metal = "#b3c9c5";
const soil = "#69875a";
const leaves = ["#82a34c", "#698f4f", "#a3b45a"] as const;
const lamp = "#c2edd1";
const FACETS = 12;

export function drawHalls(scene: Scene, course: Course): Mesh[] {
    const parts = new UrbanParts(scene);
    const casters: Mesh[] = [];
    for (const hall of course.halls) {
        buildHall(parts.add, course, hall);
        casters.push(glazeRoof(scene, hall));
        drawServiceApron(scene, course, hall);
        drawHallWallPanels(scene, hall);
        if (hall.coolantModules.length) casters.push(...drawCoolantModules(scene, hall.coolantModules));
    }
    parts.draw();
    return casters;
}

function drawServiceApron(scene: Scene, course: Course, hall: Hall): void {
    const hangar = hall.kind === "space hangar";
    const pavement = material(scene, "textured hall service apron", hangar ? "#858084" : "#c0b8a7");
    pavement.diffuseTexture = surfaceTexture(scene, hangar ? "ares ceramic" : "limestone");
    pavement.specularColor.set(0.045, 0.039, 0.04);
    const first = hall.frames[0]!.row.distance;
    const last = hall.frames.at(-1)!.row.distance;
    const rows = [hall.frames[0]!.row, ...course.route.filter(row => row.distance > first && row.distance < last),
        hall.frames.at(-1)!.row];
    const edge = hall.halfWidth - 0.68;
    for (const sign of [-1, 1]) {
        const apron = strip(rows, row => {
            const offsets = [roadHalfWidth(course.track.id, row.distance) + 0.07, 7.9, 10.5, 13.3, edge];
            return sign < 0 ? offsets.map(offset => -offset).reverse() : offsets;
        }, (row, offset) => {
            const point = pointOnRoute(row, offset);
            return (course.ground.at(point.x, point.z) ?? row.y) - row.y + 0.059;
        });
        surface(scene, "paneled hall shoulder", apron, pavement);
    }
}

function section(hall: Hall, index: number): readonly [number, number] {
    const angle = Math.PI * index / FACETS;
    const x = -Math.cos(angle);
    const crown = hall.kind === "space hangar" ? Math.min(1, (1 - Math.abs(x)) * 2.45)
        : hall.kind === "glass hall" ? Math.sin(angle) : Math.pow(1 - Math.abs(x), 0.63);
    return [x * hall.halfWidth, hall.eaveHeight + crown * hall.roofRise];
}

function buildHall(build: BuildPart, course: Course, hall: Hall): void {
    const { frames, halfWidth, eaveHeight } = hall;
    const hangar = hall.kind === "space hangar";
    const frameColor = hangar ? "#d3af8e" : stone;
    const trimColor = hangar ? "#857474" : metal;
    for (const [index, { row, posts }] of frames.entries()) {
        const yaw = Math.atan2(row.dx, row.dz);
        const entry = index === 0 || index === frames.length - 1;
        for (const post of posts) {
            build("white hall supports", { ...post, y: post.y + post.height / 2,
                sx: post.radius * 2, sy: post.height, sz: post.radius * 2, yaw }, frameColor, "oval");
            build("hall column collar", { ...post, y: post.y + post.height - 0.85,
                sx: 1.03, sy: 0.34, sz: 1.03, yaw }, trimColor, "oval");
        }
        for (let i = 0; i < FACETS; i++) {
            const [ax, ay] = section(hall, i);
            const [bx, by] = section(hall, i + 1);
            const at = pointOnRoute(row, (ax + bx) / 2, (ay + by) / 2);
            const width = Math.hypot(bx - ax, by - ay) + 0.23;
            build("white roof ribs", { ...at, sx: width, sy: entry ? 0.82 : 0.40, sz: entry ? 1.18 : 0.48,
                yaw, roll: Math.atan2(by - ay, bx - ax) }, frameColor);
            if (entry && i >= 3 && i <= 8) {
                build("tinted roof accent", { ...at, y: at.y - 0.38, sx: width, sy: 0.23, sz: 1.31,
                    yaw, roll: Math.atan2(by - ay, bx - ax) }, hangar ? "#bc8850" : "#448e86");
            }
        }
        if (index === 0) continue;
        const previous = frames[index - 1]!.row;
        for (const division of [0, 2, 4, 6, 8, 10, 12]) {
            const [x, y] = section(hall, division);
            link(build, "longitudinal roof mullions", pointOnRoute(previous, x, y + 0.14),
                pointOnRoute(row, x, y + 0.14), 0.17, trimColor);
        }
        for (const side of [-1, 1]) {
            const lateral = side * (halfWidth - 3.1);
            const bed = pointOnRoute(row, lateral, 0.25);
            if (hangar) {
                const beam = pointOnRoute(row, side * 6.4, eaveHeight + 2.7);
                build("hall lantern", { ...beam, sx: 0.23, sy: 0.12, sz: 4.6, yaw }, "#f4d9a6");
                const bay = pointOnRoute(row, side * 10.7);
                const floor = course.ground.at(bay.x, bay.z) ?? bay.y;
                build("hangar floor markers", { ...bay, y: floor + 0.13, sx: 0.36, sy: 0.12, sz: 2.7, yaw }, "#ba8c56");
                continue;
            }
            build("indoor limestone planters", { ...bed, sx: 3.8, sy: 0.64, sz: 4.85, yaw }, stone, "oval");
            build("indoor garden bed", { ...bed, y: bed.y + 0.34, sx: 3.5, sy: 0.22, sz: 4.51, yaw }, soil, "oval");
            for (let plant = 0; plant < 3; plant++) {
                const height = 1.1 + (plant + index) % 3 * 0.55;
                build("indoor foliage", { ...bed, x: bed.x + (plant - 1) * row.dx * 1.45,
                    z: bed.z + (plant - 1) * row.dz * 1.45, y: bed.y + 0.53 + height * 0.39,
                    sx: height * 1.19, sy: height, sz: height * 0.96, yaw }, leaves[plant]!, "leaf");
            }
            const a = pointOnRoute(previous, side * (halfWidth - 0.35), eaveHeight - 0.54);
            const b = pointOnRoute(row, side * (halfWidth - 0.35), eaveHeight - 0.54);
            link(build, "hall lantern", a, b, 0.18, lamp);
            if (index % 3 === 1) {
                build("conservatory sapling stem", { ...bed, y: bed.y + 1.5, sx: 0.27, sy: 2.2, sz: 0.27, yaw },
                    "#816447", "oval");
                build("conservatory sapling crown", { ...bed, y: bed.y + 3.0, sx: 2.8, sy: 2.5, sz: 2.55, yaw },
                    "#669756", "leaf");
            }
        }
    }
}

function link(build: BuildPart, name: string, a: Point, b: Point, size: number, color: string): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    build(name, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2,
        sx: size, sy: size, sz: Math.hypot(dx, dy, dz) + 0.08, yaw: Math.atan2(dx, dz),
        pitch: -Math.atan2(dy, Math.hypot(dx, dz)) }, color);
}

function glazeRoof(scene: Scene, hall: Hall): Mesh {
    const positions: number[] = [];
    const uv: number[] = [];
    const clear: number[] = [];
    const panels: number[] = [];
    const columns = FACETS + 3;
    for (const [rowIndex, { row }] of hall.frames.entries()) {
        for (let column = 0; column < columns; column++) {
            const edge = column === 0 || column === columns - 1;
            const [x, y] = edge
                ? [(column === 0 ? -1 : 1) * hall.halfWidth, 1.15]
                : section(hall, column - 1);
            const point = pointOnRoute(row, x, y + 0.18);
            positions.push(point.x, point.y, point.z);
            uv.push(column / (columns - 1), rowIndex * 0.5);
            if (rowIndex === 0 || column === 0) continue;
            const i = rowIndex * columns + column;
            const solar = hall.kind === "space hangar" ? column < 6 || column > 9 || rowIndex % 3 === 0
                : hall.kind === "glass hall" ? rowIndex % 2 === 0 && (column === 3 || column === 12)
                    : column === 7 || column === 8;
            const indices = solar ? panels : clear;
            indices.push(i - columns - 1, i - 1, i - columns, i - columns, i - 1, i);
        }
    }
    const tint = hall.kind === "space hangar" ? "#dcb79b" : hall.kind === "glass hall" ? "#469e97" : "#6399bf";
    const glass = material(scene, "clear laminated glass", tint);
    glass.backFaceCulling = false;
    glass.alpha = 0.44;
    glass.emissiveColor = Color3.FromHexString(tint).scale(0.16);
    glass.specularColor.set(0.35, 0.54, 0.55);
    const roof = surface(scene, hall.kind + " glazing", {
        positions: new Float32Array(positions), indices: new Uint32Array(clear), uv: new Float32Array(uv),
    }, glass);
    roof.receiveShadows = false;
    const panelColor = hall.kind === "space hangar" ? "#9c7c65" : hall.kind === "glass hall" ? "#355c70" : "#b2c9bf";
    const solar = material(scene, "hall roof cladding", panelColor);
    solar.backFaceCulling = false;
    solar.diffuseTexture = surfaceTexture(scene, hall.kind === "space hangar" ? "thermal cladding" : "ceramic plating", 2, 1);
    return surface(scene, hall.kind + " roof panels", {
        positions: new Float32Array(positions), indices: new Uint32Array(panels), uv: new Float32Array(uv),
    }, solar);
}
