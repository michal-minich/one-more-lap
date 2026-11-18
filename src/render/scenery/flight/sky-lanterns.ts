import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { Stamp } from "../instances.ts";
import { drawDisplayLandmarks } from "../landmark-models/biome-models.ts";
import { UrbanParts } from "../urban-parts.ts";

export function drawSkyLanterns(scene: Scene, course: Course): void {
    const parts = new UrbanParts(scene);
    const { gap, branch } = course;
    if (!gap || !branch) return;
    const amber: Stamp[] = [];
    const putLamps = (distance: number, offset: number, height: number): void => {
        const row = course.at(distance);
        const grade = course.at(distance + 0.8).y - course.at(distance - 0.8).y;
        for (const side of [-1, 1]) {
            const footing = 0.012 - Math.abs(grade / 1.6) * height * 0.28;
            const deck = pointOnRoute(row, side * offset, footing);
            amber.push({ ...deck, sx: height, sy: height, sz: height,
                yaw: Math.atan2(row.dx, row.dz) });
        }
    };
    for (const [edge, direction] of [[gap.from, -1], [gap.to, 1]] as const) {
        for (const [step, height] of [[3.3, 2.24], [11.5, 1.94], [24, 1.85]] as const) {
            putLamps(edge + step * direction, 6.96, height);
        }
    }
    putLamps(1_238, 7.18, 1.6);
    putLamps(1_263, 7.18, 1.6);
    drawDisplayLandmarks(scene, "cloudfold-lamp", amber);
    for (let i = 9; i < branch.route.length - 8; i += 5) {
        const row = branch.route[i]!;
        const yaw = Math.atan2(row.dx, row.dz);
        const outside = pointOnRoute(row, 4.10);
        parts.add("Cloudfold lamp ceramic", { ...outside, y: outside.y + 0.88, sx: 0.46, sy: 1.98, sz: 0.46, yaw }, "#507c82");
        parts.add("hall lantern", { ...outside, y: outside.y + 1.84, sx: 0.63, sy: 0.32, sz: 0.67, yaw }, "#8ae1d2", "oval");
        parts.add("Cloudfold lamp ceramic", { ...outside, y: outside.y + 2.04, sx: 0.56, sy: 0.16, sz: 0.56, yaw }, "#b2c4bd", "oval");
    }
    parts.draw();
}
