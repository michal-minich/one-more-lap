import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { RouteSample } from "../../../game/course/route.ts";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute, sampleAt } from "../../../game/course/route.ts";
import { SKY_BRANCH_HALF } from "../../../game/course/sky-branch.ts";
import { SKY_EDGE } from "../../../game/course/sky-ribbon.ts";
import { strip } from "../../../game/course/surface.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

const DECK_DEPTH = 2.25;

export function drawSkyDeck(scene: Scene, course: Course): Mesh[] {
    const { route, gap } = course;
    const cladding = material(scene, "slate bridge cladding", "#8c899d");
    cladding.diffuseTexture = surfaceTexture(scene, "cloudfold shale", 1, 0.55);
    cladding.backFaceCulling = false;
    const gleam = material(scene, "mint bridge edges", "#9dded7");
    gleam.diffuseTexture = surfaceTexture(scene, "dusty enamel");
    gleam.emissiveColor.set(0.23, 0.37, 0.38);
    gleam.backFaceCulling = false;
    const underside = surface(scene, "Cloudfold deck underside", strip(route,
        [-SKY_EDGE, SKY_EDGE], () => -DECK_DEPTH, gap), cladding);
    const sides = [-1, 1].map(side => {
        const rim = route.map(row => ({ ...row, ...pointOnRoute(row, side * SKY_EDGE) }));
        surface(scene, "luminous bridge seam", strip(rim, [-0.012 * side, 0.015 * side],
            (_, offset) => offset === -0.012 * side ? -0.20 : -0.34, gap), gleam);
        return surface(scene, "Cloudfold deck edge", strip(rim, [0, -side * 0.56],
            (_, offset) => offset === 0 ? 0 : -DECK_DEPTH, gap), cladding);
    });
    if (course.branch) {
        const path = course.branch.route;
        gardenArrows(scene, path);
        const stone = material(scene, "chamfered garden deck", "#caccb8");
        stone.diffuseTexture = surfaceTexture(scene, "cloudfold ceramic", 1.5);
        stone.backFaceCulling = false;
        sides.push(surface(scene, "garden bridge underside", strip(path,
            [-SKY_BRANCH_HALF, SKY_BRANCH_HALF], () => -1.05), stone));
        for (const side of [-1, 1]) {
            const edge = side * SKY_BRANCH_HALF;
            sides.push(surface(scene, "garden bridge fascia", strip(path, [edge, edge - side * 0.6],
                (_, offset) => offset === edge ? 0 : -1.05), stone));
            surface(scene, "garden bridge guide", strip(path.slice(5, -5),
                [edge - side * 0.55, edge - side * 0.42], () => 0.038), gleam);
        }
    }
    if (!gap) return [underside, ...sides];

    const warning = material(scene, "amber jump markers", "#ffc674");
    warning.emissiveColor.set(0.51, 0.24, 0.062);
    const marks: Stamp[] = [];
    for (const [distance, direction] of [[gap.from, -1], [gap.to, 1]] as const) {
        const row = course.at(distance);
        const cap = MeshBuilder.CreateBox("jump deck face", {
            width: SKY_EDGE * 2 - 0.20, height: DECK_DEPTH, depth: 0.20,
        }, scene);
        cap.position.set(row.x, row.y - DECK_DEPTH / 2, row.z);
        cap.rotation.y = Math.atan2(row.dx, row.dz);
        cap.material = cladding;
        cap.isPickable = false;
        for (let i = 0; i < 11; i++) {
            const p = pointOnRoute(row, (i - 5) * 1.33, -0.20);
            marks.push({ ...p, sx: 0.97, sy: 0.14, sz: 0.28, yaw: cap.rotation.y });
        }
        for (const step of [5, 9, 15, 24]) {
            const target = course.at(distance + step * direction);
            const before = course.at(target.distance - 0.75);
            const after = course.at(target.distance + 0.75);
            for (const side of [-1, 1]) {
                const p = pointOnRoute(target, side * 4.7, 0.06);
                marks.push({ ...p, sx: 1.32, sy: 0.02, sz: 0.17, yaw: Math.atan2(target.dx, target.dz) + side * direction * 0.35,
                    pitch: -Math.atan2(after.y - before.y, 1.5) });
            }
        }
    }
    const markers = MeshBuilder.CreateBox("jump approach markings", { size: 1 }, scene);
    markers.material = warning;
    stamp(markers, marks);
    return [underside, ...sides];
}


function gardenArrows(scene: Scene, route: readonly RouteSample[]): void {
    const paint = material(scene, "jade bypass markings", "#79bda8");
    paint.backFaceCulling = false;
    paint.emissiveColor.set(0.10, 0.21, 0.15);
    const arrow = surface(scene, "garden bridge route chevrons", {
        positions: new Float32Array([-1.09, 0, -0.55, 0, 0, 0.39, 1.09, 0, -0.55,
            1.09, 0, -0.22, 0, 0, 0.73, -1.09, 0, -0.22]),
        indices: new Uint32Array([0, 1, 5, 1, 4, 5, 1, 2, 3, 1, 3, 4]),
        uv: new Float32Array([0, 0, 0.5, 0.7, 1, 0, 1, 0.3, 0.5, 1, 0, 0.3]),
    }, paint);
    const placements = [[250, 1], [253.6, 1], [322.8, -1], [326.4, -1]] as const;
    stamp(arrow, placements.map(([distance, direction]) => {
        const row = sampleAt(route, distance);
        const rise = sampleAt(route, distance + 0.6).y - sampleAt(route, distance - 0.6).y;
        return { ...row, y: row.y + 0.034, sx: 1, sy: 1, sz: 1,
            yaw: Math.atan2(row.dx, row.dz) + (direction === 1 ? 0 : Math.PI),
            pitch: -direction * Math.atan2(rise, 1.2) };
    }));
}
