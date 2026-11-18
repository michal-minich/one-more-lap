import "@babylonjs/core/Meshes/instancedMesh.js";

import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { gondolaHeight, liftLanes, liftPoint } from "../../../game/course/alpine-lift.ts";
import type { AlpineLift } from "../../../game/course/alpine-lift.ts";
import type { Point } from "../../../game/point.ts";
import { beamBetween } from "../beam.ts";
import { drawAnimatedLandmark } from "../landmark-models/biome-models.ts";
import { offset, UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

const iron = "#4b5d62";
const timber = "#876650";
const mortar = "#a5a091";

export function drawAlpineCable(scene: Scene, lift: AlpineLift, course: Course): (time: number) => void {
    const { lower, upper, a, b, yaw, masts } = lift;
    const parts = new UrbanParts(scene);
    const building = course.biomeLandmarks.find(site => site.kind === "alpine-station");
    if (building) {
        const { y, height, yaw } = building;
        parts.add("Alpine lift foundation", { ...building, y: y - 0.21,
            sx: height * 1.13, sy: 0.49, sz: height * 0.9, yaw }, "#a99c87");
    }
    station(parts.add, lower, a.y, yaw, building === undefined);
    station(parts.add, upper, b.y, yaw, false);
    for (const { foot, head, width } of masts) crossbeam(parts.add, "alpine cable mast", foot, head, width, iron);
    for (const lane of liftLanes) {
        let previous = liftPoint(lift, lane, 0);
        for (let i = 1; i <= 12; i++) {
            const point = liftPoint(lift, lane, i / 12);
            crossbeam(parts.add, "alpine wire", previous, point, 0.095, iron);
            previous = point;
        }
    }
    parts.draw();
    const height = gondolaHeight;
    const gondola = drawAnimatedLandmark(scene, "alpine-gondola");
    const cabins = liftLanes.map(lane => {
        const root = new TransformNode("alpine cable cabin", scene);
        const body = lane < 0 ? gondola : gondola.createInstance("alpine gondola");
        body.parent = root;
        body.scaling.setAll(height);
        // Center the trolley between its wheels so sway pivots around the wire.
        body.position.set(height * 0.046, -height * 0.954, -height * 0.068);
        root.rotation.y = yaw + Math.PI / 2;
        return { lane, root };
    });
    return time => {
        const trip = 0.5 - 0.46 * Math.cos(time * 0.075 + 1.16);
        for (const { lane, root } of cabins) {
            const p = liftPoint(lift, lane, lane < 0 ? trip : 1 - trip);
            root.position.set(p.x, p.y, p.z);
            root.rotation.x = Math.sin(time * 1.16 + lane) * 0.045;
        }
    };
}

function station(build: BuildPart, at: Point, head: number, yaw: number, lower: boolean): void {
    if (lower) {
        const base = offset(at, yaw, -2.8, -7.2);
        build("stone footing", { ...base, y: at.y - 0.49, sx: 13.4, sy: 2.5, sz: 10.1, yaw }, mortar);
        build("weathered timber", { ...base, y: at.y + 1.95, sx: 12.5, sy: 4.2, sz: 9.1, yaw }, timber);
        build("alpine station roof", { ...base, y: at.y + 3.97, sx: 13.6, sy: 2.08, sz: 10.0, yaw }, "#6d7166");
        const glass = offset(base, yaw, 0, -4.62);
        build("office glazing", { ...glass, y: at.y + 2.08, sx: 8.2, sy: 1.26, sz: 0.16, yaw }, "#90a6ad");
    }
    for (let i = 1; i < 4; i++) {
        const y = at.y + (head - at.y) * i / 4;
        const span = 4.3 + (1.7 - 4.3) * i / 4;
        const low = offset(at, yaw, -span, 0);
        const high = offset(at, yaw, span, 0);
        crossbeam(build, "mountain mast ties", { ...low, y }, { ...high, y }, 0.18, mortar);
    }
    build("alpine cable gantry", { ...at, y: head + 0.08, sx: 5.7, sy: 0.47, sz: 0.81, yaw }, iron);
}

function crossbeam(build: BuildPart, name: string, a: Point, b: Point, width: number, tint: string): void {
    build(name, beamBetween(a, b, width, width, 0.042), tint);
}
