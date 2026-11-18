import type { Course } from "../../../game/course/course.ts";
import type { Outpost } from "../../../game/course/outposts.ts";
import type { Point } from "../../../game/point.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { grounded } from "./rural-sites.ts";

const ivory = "#d6c8a6";
const shade = "#aa9c82";
const bronze = "#818c71";
const edge = "#ae9470";

export function guardian(build: BuildPart, { position: at, yaw }: Outpost): void {
    const stone = (x: number, z: number, y: number, sx: number, sy: number, sz: number, tint = ivory): void => {
        build("Aegean dressed limestone", { ...offset(at, yaw, x, z), y: at.y + y, sx, sy, sz, yaw }, tint);
    };
    stone(0, 0, -0.5, 12.8, 2.4, 11.1, shade);
    stone(0, 0, 0.94, 10.9, 0.52, 9.4);
    stone(0, 0, 1.47, 8.9, 0.54, 7.7, shade);
    stone(0, 0, 2.48, 5.4, 1.7, 4.75);
    stone(0, 0, 3.34, 6.08, 0.48, 5.35, shade);

    const figure = (x: number, z: number, y: number, sx: number, sy: number, sz: number,
        tint = bronze, roll = 0): void => {
        build("cast bronze", { ...offset(at, yaw, x, z), y: at.y + y, sx, sy, sz, yaw, roll }, tint, "leaf");
    };
    figure(0, 0.13, 6.2, 3.52, 5.3, 2.35);
    for (const fold of [-1, 0, 1]) {
        figure(fold * 0.65, -0.91, 5.89, 0.64, 3.88, 0.32, edge, -fold * 0.12);
    }
    figure(0.07, -0.11, 9.24, 3.45, 2.75, 1.92);
    figure(-0.13, -0.17, 11.25, 1.58, 1.98, 1.56, "#859783");
    figure(-0.14, -0.08, 12.41, 0.75, 1.03, 2.04, edge, 0.07);
    figure(2.0, -0.19, 9.18, 0.94, 3.33, 0.95, bronze, -0.86);
    figure(3.15, -0.30, 10.11, 0.67, 2.06, 0.70, bronze, -0.32);
    figure(3.49, -0.31, 11.16, 0.69, 0.78, 0.61);
    figure(-1.77, 0, 8.3, 0.87, 2.93, 0.89, bronze, -0.22);
    const shield = offset(at, yaw, -1.8, -1.17);
    for (const [diameter, thickness, depth, color] of [[3.72, 0.31, 0, edge], [3.32, 0.24, -0.21, bronze],
        [0.85, 0.35, -0.38, edge]] as const) {
        build("cast bronze sun shield", { ...offset(shield, yaw, 0, depth), y: at.y + 7.12,
            sx: diameter, sy: thickness, sz: diameter, yaw, pitch: Math.PI / 2 }, color, "oval");
    }
    const staff = offset(at, yaw, 3.54, -0.28);
    build("bronze standard", { ...staff, y: at.y + 11.1, sx: 0.16, sy: 6.1, sz: 0.16, yaw, roll: -0.09 }, edge, "oval");
    figure(3.84, -0.28, 14.2, 0.78, 1.45, 0.39, "#a4a87c", -0.33);
}

export function ruinedForum(build: BuildPart, course: Course, { position: at, yaw }: Outpost): void {
    const platform = at.y + 0.33;
    build("Aegean dressed limestone", { ...at, y: platform - 0.54, sx: 31.5, sy: 1.24, sz: 23.6, yaw }, shade);
    build("mosaic paving", { ...at, y: platform + 0.09, sx: 25.6, sy: 0.19, sz: 18.6, yaw }, "#c1ac88");
    for (const [x, z, sx, sz] of [[0, -8.6, 23.8, 0.37], [0, 8.6, 23.8, 0.37], [-12, 0, 0.37, 17.6],
        [12, 0, 0.37, 17.6], [0, 0, 9.1, 0.8], [0, 0, 0.8, 9.1]] as const) {
        build("inlaid mosaic", { ...offset(at, yaw, x, z), y: platform + 0.20, sx, sy: 0.08, sz, yaw }, "#97705c");
    }
    for (const [i, height] of [5.9, 6.05, 5.78, 3.05, 1.7, 0.45, 3.7].entries()) {
        const foot = offset(at, yaw, (i - 3) * 4.2, 9.6);
        build("pillar footing", { ...foot, y: platform + 0.25, sx: 1.84, sy: 0.43, sz: 1.84, yaw }, shade);
        build("Aegean dressed limestone", { ...foot, y: platform + 0.42 + height / 2, sx: 1.29, sy: height, sz: 1.29,
            yaw, roll: i === 4 ? -0.11 : 0 }, ivory, "oval");
        if (i < 3) build("pillar capital", { ...foot, y: platform + 6.5, sx: 1.66, sy: 0.38, sz: 1.67, yaw }, ivory);
    }
    const architrave = offset(at, yaw, -8.3, 9.6);
    build("broken entablature", { ...architrave, y: platform + 6.92, sx: 9.8, sy: 0.7, sz: 1.72, yaw }, shade);
    for (const [i, [x, z]] of ([[-15, -9], [-14, -5], [-8, -12], [10, -12], [16, 3], [14, 10]] as const).entries()) {
        const stone = grounded(course, offset(at, yaw, x, z));
        tumbledStone(build, stone, yaw + i * 0.71, i % 2 ? ivory : shade);
    }
}

function tumbledStone(build: BuildPart, at: Point, yaw: number, tint: string): void {
    build("Aegean dressed limestone", { ...at, y: at.y + 0.56, sx: 1.28, sy: 2.35, sz: 1.28, yaw,
        pitch: Math.PI * 0.46, roll: 0.09 }, tint, "oval");
}
