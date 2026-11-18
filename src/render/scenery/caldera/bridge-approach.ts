import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { bridgeHalfLength } from "../../../game/course/passages.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { beamBetween } from "../beam.ts";
import { UrbanParts } from "../urban-parts.ts";

export function drawCalderaBridgeApproach(scene: Scene, course: Course, crossing: number): Mesh[] {
    const parts = new UrbanParts(scene);
    const reach = bridgeHalfLength("caldera");
    const crest = "#8b6154";
    const stone = "#5f5963";
    for (const side of [-1, 1]) {
        const edge = (distance: number, height: number) => pointOnRoute(course.at(distance), side * 7.02, height);
        for (let along = -reach; along < reach - 1; along += 3.25) {
            const from = crossing + along;
            const to = Math.min(crossing + reach, from + 3.25);
            parts.add("Caldera bridge stonework", beamBetween(edge(from, -0.07), edge(to, -0.07), 0.48, 0.67, 0.12), stone);
            parts.add("Caldera weathered coping", beamBetween(edge(from, 0.29), edge(to, 0.29), 0.53, 0.16, 0.14), crest);
        }
        for (const along of [-39, -21, 2, 22, 40]) {
            const row = course.at(crossing + along);
            const at = edge(row.distance, 0);
            const yaw = Math.atan2(row.dx, row.dz);
            parts.add("Caldera bridge stonework", { ...at, y: at.y + 0.2, sx: 0.64, sy: 0.91, sz: 0.70, yaw }, stone);
            parts.add("hall lantern", { ...at, y: at.y + 0.77, sx: 0.33, sy: 0.2, sz: 0.37, yaw }, "#f0ad6c");
            parts.add("Caldera lantern cap", { ...at, y: at.y + 0.92, sx: 0.46, sy: 0.12, sz: 0.47, yaw }, "#6c8a7a");
        }
    }
    return parts.draw().filter(mesh => mesh.name === "Caldera bridge stonework");
}
