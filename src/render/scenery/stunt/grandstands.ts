import type { Course } from "../../../game/course/course.ts";
import { beamBetween } from "../beam.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawGrandstands(build: BuildPart, course: Course): void {
    for (const [x, z, yaw, tint] of [[-43, 205, Math.PI / 2, "#587c91"], [43, 302, -Math.PI / 2, "#a75d53"]] as const) {
        const y = course.ground.at(x, z) ?? 8;
        const at = { x, y, z };
        const cream = "#e9ce9d";
        const steel = "#53636b";
        const bottom = Math.min(y, ...[-13.8, 13.8].flatMap(x => [-4.5, 4.5].map(z => {
            const foot = offset(at, yaw, x, z);
            return course.ground.at(foot.x, foot.z) ?? y;
        }))) - 0.56;
        build("grandstand foundation", { ...at, y: (bottom + y + 0.62) / 2, sx: 28.4, sy: y + 0.62 - bottom,
            sz: 9.25, yaw }, "#a79a85");
        for (let row = 0; row < 6; row++) {
            const local = -3.28 + row * 1.41;
            const level = y + 0.63 + row * 0.65;
            const stair = offset(at, yaw, 0, local);
            build("grandstand foundation", { ...stair, y: (y + level) / 2, sx: 27.9, sy: level - y, sz: 1.43, yaw }, "#ac9f88");
            for (const side of [-1, 1]) {
                const bench = offset(stair, yaw, side * 6.65, 0.17);
                build("grandstand bench", { ...bench, y: level + 0.31, sx: 11.3, sy: 0.19, sz: 0.49, yaw }, row % 3 ? tint : cream);
                const back = offset(bench, yaw, 0, 0.19);
                build("grandstand bench", { ...back, y: level + 0.52, sx: 11.3, sy: 0.42, sz: 0.16, yaw }, row % 3 ? tint : cream);
            }
        }
        const roof = offset(at, yaw, 0, 0.92);
        const height = y + 7.5;
        build("grandstand roof", { ...roof, y: height, sx: 29.2, sy: 0.28, sz: 10.5, yaw, pitch: 0.15 }, tint);
        for (const local of [-12.8, -6.4, 0, 6.4, 12.8]) {
            const foot = offset(at, yaw, local, 4.72);
            const ground = (course.ground.at(foot.x, foot.z) ?? y) - 0.3;
            build("stunt girder", { ...foot, y: (height + ground) / 2, sx: 0.27, sy: height - ground, sz: 0.34, yaw }, steel);
            const eave = offset({ ...foot, y: height + 0.42 }, yaw, 0, -8.62);
            build("stunt girder", beamBetween({ ...foot, y: height - 0.68 }, eave, 0.22, 0.29), steel);
        }
        for (let i = -5; i <= 5; i++) {
            const edge = offset(roof, yaw, i * 2.57, -5.18);
            build("grandstand fascia", { ...edge, y: height + 0.76, sx: 2.6, sy: 0.49, sz: 0.24, yaw }, i % 2 ? tint : cream);
        }
    }
}
