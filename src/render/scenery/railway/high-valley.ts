import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { BuildPart } from "../urban-parts.ts";
import { offset } from "../urban-parts.ts";

export function drawHighValley(build: BuildPart, course: Course): void {
    for (const [distance, lateral, scale] of [[552, -18, 0.90], [612, -26, 1], [719, 26, 1.3],
        [859, 23, 0.86], [976, -23, 1.12], [1050, 19, 0.86]] as const) {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const yaw = Math.atan2(row.dx, row.dz) + Math.PI / 2;
        cabin(build, course, at.x, at.z, yaw, scale);
    }
}

function cabin(build: BuildPart, course: Course, x: number, z: number, yaw: number, scale: number): void {
    const y = course.ground.at(x, z);
    if (y === undefined) return;
    const at = { x, y, z };
    const slab = Math.min(y, ...[-1, 1].flatMap(side => [-1, 1].map(end => {
        const foot = offset(at, yaw, side * 4.45 * scale, end * 3.5 * scale);
        return course.ground.at(foot.x, foot.z) ?? y;
    }))) - 0.5;
    build("station brickwork", { ...at, y: (y + slab + 0.48) / 2, sx: 9.2 * scale, sy: y - slab + 0.48,
        sz: 7.45 * scale, yaw }, "#a68f7d");
    build("weathered timber", { ...at, y: y + 2.08 * scale, sx: 8.9 * scale, sy: 3.6 * scale,
        sz: 7.1 * scale, yaw }, "#957155");
    build("gable roof", { ...at, y: y + 4.11 * scale, sx: 10.05 * scale, sy: 2.1 * scale,
        sz: 8.07 * scale, yaw }, "#685849");
    for (const side of [-1, 1]) {
        for (const window of [-2.66, 1.78]) {
            const face = offset(at, yaw, window * scale, side * 3.59 * scale);
            build("window frame", { ...face, y: y + 2.25 * scale, sx: 1.52 * scale, sy: 1.73 * scale,
                sz: 0.17, yaw }, "#dbcda7");
            const glass = offset(face, yaw, 0, side * 0.11);
            build("lit windows", { ...glass, y: y + 2.25 * scale, sx: 1.24 * scale, sy: 1.46 * scale,
                sz: 0.07, yaw }, "#7f9796");
        }
    }
}
