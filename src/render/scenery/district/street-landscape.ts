import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import type { City } from "../../../game/course/district-plans.ts";
import { roadHalfWidth } from "../../../game/course/road-width.ts";
import { pointOnRoute, ROAD_HALF } from "../../../game/course/route.ts";
import { streetLandscape, WALK_EDGE, walkWidth } from "../../../game/course/street-landscape.ts";
import type { StreetLandscape } from "../../../game/course/street-landscape.ts";
import { strip } from "../../../game/course/surface.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import type { SurfacePattern } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

const finishes: Record<City, readonly [SurfacePattern, string, string]> = {
    "old-town": ["bellgate cobbles", "#efe2d1", "#dbc4a3"],
    metro: ["glasswater terrazzo", "#a8b4ba", "#b2b3a8"],
    future: ["aurora ivory", "#fff3df", "#7cbaaa"],
};

export function drawStreetLandscape(scene: Scene, course: Course): void {
    const id = course.track.id;
    if (id !== "old-town" && id !== "metro" && id !== "future") return;
    const [pattern, paving, trim] = finishes[id];
    const walk = material(scene, "promenade paving", paving);
    walk.diffuseTexture = surfaceTexture(scene, pattern, id === "old-town" ? 1.72 : 0.92, id === "old-town" ? 1.74 : 1.35);
    walk.specularColor.set(0.075, 0.078, 0.071);
    const edge = material(scene, "promenade edge inlay", trim);
    edge.diffuseTexture = surfaceTexture(scene, id === "old-town" ? "bellgate ashlar" : "limestone");
    const curb = id === "old-town" ? undefined : material(scene, "promenade curb stone", id === "future" ? "#bac5b3" : "#aea99b");
    if (curb) curb.diffuseTexture = edge.diffuseTexture;
    const furniture = new UrbanParts(scene);
    if (course.bellgateStreets) {
        const kerb = material(scene, "Bellgate kerb limestone", "#e2caa3");
        kerb.diffuseTexture = surfaceTexture(scene, "bellgate ashlar", 1.5, 1.4);
        const walls = material(scene, "Bellgate retaining ashlar", "#d0b18e");
        walls.diffuseTexture = surfaceTexture(scene, "bellgate ashlar");
        for (const shape of course.bellgateStreets.curbs) surface(scene, "Bellgate beveled curb", shape, kerb);
        for (const shape of course.bellgateStreets.terraces) surface(scene, "Bellgate terrace wall", shape, walls);
    }
    for (const section of streetLandscape(id)) {
        const length = section.end - section.start;
        const spans = Math.ceil(length / 1.7);
        const rows = Array.from({ length: spans + 1 }, (_, i) => course.at(section.start + length * i / spans));
        const lateral = (distance: number, fraction: number): number =>
            section.side * ((id === "old-town" ? roadHalfWidth(id, distance) + 0.51 : WALK_EDGE)
                + walkWidth(section, distance) * fraction);
        for (const [name, fractions, paint] of [
            ["contoured promenade", [0, 0.22, 0.45, 0.68, 0.91], walk],
            ["promenade edge stripe", [0.91, 1], edge],
        ] as const) {
            const ordered = section.side > 0 ? fractions : fractions.toReversed();
            const pavement = strip(rows, row => ordered.map(fraction => lateral(row.distance, fraction)), (row, across) => {
                const at = pointOnRoute(row, across);
                return (course.ground.at(at.x, at.z) ?? row.y) - row.y + 0.092;
            });
            surface(scene, name, pavement, paint);
        }
        if (id === "old-town" || !curb) continue;
        const curbRows = rows.slice(4, -4);
        const curbEdge = (distance: number): number => id === "future" ? roadHalfWidth(id, distance) : ROAD_HALF;
        const curbCrown = id === "future" ? 0.32 : 0.33;
        surface(scene, "promenade curb", strip(curbRows, row => {
            const inner = curbEdge(row.distance);
            const offsets = [inner + 0.04, inner + curbCrown, WALK_EDGE];
            return section.side > 0 ? offsets : offsets.map(across => -across).toReversed();
        }, (row, across) => {
            const at = pointOnRoute(row, across);
            const crown = Math.abs(across) === curbEdge(row.distance) + curbCrown ? 0.14 : 0.089;
            return (course.ground.at(at.x, at.z) ?? row.y) - row.y + crown;
        }), curb);
        furnishWalk(furniture.add, course, section, id);
    }
    furniture.draw();
    if (id === "old-town") drawFountainCourts(scene, course, walk);
}

function drawFountainCourts(scene: Scene, course: Course, paving: StandardMaterial): void {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const segments = 16;
    for (const fountain of course.biomeLandmarks) {
        if (fountain.kind !== "bellgate-fountain") continue;
        const { x, y, z, height } = fountain;
        const start = positions.length / 3;
        const radius = height * 0.87;
        const vertex = (atX: number, atZ: number): void => {
            positions.push(atX, (course.ground.at(atX, atZ) ?? y) + 0.035, atZ);
            uv.push((atX - x) / 3, (atZ - z) / 3);
        };
        vertex(x, z);
        for (let i = 0; i < segments; i++) {
            const angle = i * Math.PI * 2 / segments;
            vertex(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius);
            indices.push(start, start + 1 + i, start + 1 + (i + 1) % segments);
        }
    }
    if (indices.length !== 0) surface(scene, "Bellgate fountain courts", {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
    }, paving);
}

function furnishWalk(build: BuildPart, course: Course, section: StreetLandscape, city: Exclude<City, "old-town">): void {
    const solar = city === "future";
    const [stone, foliage, timber] = solar ? ["#dddcd0", "#87a659", "#9f856d"] : ["#aab0a6", "#73945e", "#7c6252"];
    for (let distance = section.start + 19; distance < section.end - 15; distance += solar ? 14 : 19) {
        if (city === "metro" && distance > 210 && distance < 230) continue;
        const row = course.at(distance);
        const yaw = Math.atan2(row.dx, row.dz);
        const at = pointOnRoute(row, section.side * (WALK_EDGE + walkWidth(section, distance) * 0.67));
        if (solar && course.biomeLandmarks.some(prop => prop.kind === "aurora-succulent" &&
            Math.hypot(at.x - prop.x, at.z - prop.z) < 1.7 + prop.radius)) continue;
        const y = course.ground.at(at.x, at.z) ?? row.y;
        const bottom = y - 0.62;
        const width = solar ? 2.72 : 1.86;
        const length = solar ? 5.2 : 2.92;
        build("promenade planter", { ...at, y: (y + bottom) / 2 + 0.26, sx: width, sy: 1.14, sz: length, yaw },
            stone, solar ? "oval" : "box");
        build("promenade planting", { ...at, y: y + 0.6, sx: width * 0.89, sy: 0.24, sz: length * 0.90, yaw }, foliage, "leaf");
        for (const step of [-0.32, 0.27]) {
            const plant = pointOnRoute(course.at(distance + length * step), section.side * (WALK_EDGE + walkWidth(section, distance) * 0.67));
            build("promenade shrubs", { ...plant, y: y + 0.88, sx: width * 0.54, sy: 0.77, sz: 0.95, yaw }, foliage, "leaf");
        }
        const seat = pointOnRoute(row, section.side * (WALK_EDGE + 1.7));
        const ground = course.ground.at(seat.x, seat.z) ?? row.y;
        build("bench feet", { ...seat, y: ground + 0.26, sx: 0.42, sy: 0.52, sz: 1.36, yaw }, stone);
        build("street bench seats", { ...seat, y: ground + 0.56, sx: 0.71, sy: 0.15, sz: 2.7, yaw }, timber);
    }
}
