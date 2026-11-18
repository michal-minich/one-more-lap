import type { Course } from "../../../game/course/course.ts";
import type { Outpost } from "../../../game/course/outposts.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { grounded } from "./rural-sites.ts";

const cream = "#d4c9ae";
const aged = "#aea38c";
const copper = "#a96a51";

export function theatre(build: BuildPart, course: Course, site: Outpost): void {
    const { position: at, yaw } = site;
    for (let tier = 0; tier < 5; tier++) {
        const radius = 10.5 + tier * 2.05;
        for (let i = 0; i < 11; i++) {
            if (i === 3 || i === 7) continue;
            const angle = (i - 5) * 0.235;
            const seat = offset(at, yaw, Math.sin(angle) * radius, Math.cos(angle) * radius - 6.7);
            const base = grounded(course, seat);
            const top = Math.max(at.y, base.y) + 0.6 + tier * 0.48;
            build("cut limestone", { ...base, y: (base.y + top) / 2 - 0.28, sx: radius * 0.24,
                sy: top - base.y + 0.56, sz: 1.92, yaw: yaw + angle }, tier % 2 ? cream : aged);
        }
    }
    const stage = grounded(course, offset(at, yaw, 0, -5.7));
    build("cut limestone", { ...stage, y: stage.y + 0.23, sx: 14.8, sy: 1.13, sz: 8.1, yaw }, cream, "oval");
    for (const x of [-7.5, -4.0, 4.0, 7.5]) {
        const pillar = grounded(course, offset(at, yaw, x, -10.8));
        const height = 2.8 + (Math.abs(x) > 5 ? 2.3 : 0);
        build("cut limestone", { ...pillar, y: pillar.y + height / 2, sx: 1.05, sy: height, sz: 1.05, yaw }, cream, "oval");
        build("pillar capital", { ...pillar, y: pillar.y + height, sx: 1.55, sy: 0.33, sz: 1.55, yaw }, aged);
    }
}

export function aqueduct(build: BuildPart, course: Course, site: Outpost): void {
    const { position: at, yaw } = site;
    const width = 6.1;
    const arches = 6;
    const rise = 3.4;
    const level = at.y + 4.2;
    for (let i = 0; i <= arches; i++) {
        const column = grounded(course, offset(at, yaw, (i - arches / 2) * width, 0));
        const height = Math.max(1.65, level - column.y);
        build("cut limestone", { ...column, y: level - height * 0.5 - 0.28, sx: 1.25, sy: height + 0.69, sz: 2.2, yaw }, aged);
    }
    for (let i = 0; i < arches; i++) {
        const center = (i + 0.5 - arches / 2) * width;
        for (let block = 0; block < 8; block++) {
            const angle = (block + 0.5) * Math.PI / 8;
            const atBlock = offset(at, yaw, center + Math.cos(angle) * width * 0.5, 0);
            build("cut limestone", { ...atBlock, y: level + Math.sin(angle) * rise,
                sx: 1.38, sy: 0.55, sz: 2.3, yaw, roll: Math.atan2(rise * Math.cos(angle), -width * 0.5 * Math.sin(angle)) },
                block % 2 === 0 ? cream : aged);
        }
    }
    const cap = { ...at, y: level + rise + 0.42, sx: width * arches + 1.28, sy: 0.81, sz: 2.2, yaw };
    build("cut limestone", cap, cream);
}

export function mission(build: BuildPart, site: Outpost): void {
    const { position: at, yaw } = site;
    const stone = "#bb8862";
    build("cut limestone", { ...at, y: at.y + 0.13, sx: 19, sy: 1.95, sz: 17.5, yaw }, stone);
    build("mission walls", { ...at, y: at.y + 2.35, sx: 13.6, sy: 4.9, sz: 12.1, yaw }, stone);
    build("hip roof", { ...at, y: at.y + 5.56, sx: 14.8, sy: 2.2, sz: 13.7, yaw: yaw + Math.PI / 4 }, copper);
    const tower = offset(at, yaw, -4.7, -5.2);
    build("mission walls", { ...tower, y: at.y + 5.3, sx: 3.8, sy: 7.4, sz: 3.8, yaw }, stone);
    build("bell cupola", { ...tower, y: at.y + 8.4, sx: 4.35, sy: 3.7, sz: 4.35, yaw }, copper, "dome");
    const door = offset(at, yaw, 1.3, -6.18);
    build("mission door", { ...door, y: at.y + 1.55, sx: 2.6, sy: 3.3, sz: 0.19, yaw }, "#624e3e");
}

export function clocktower(build: BuildPart, site: Outpost): void {
    const { position: at, yaw } = site;
    build("civic paving", { ...at, y: at.y + 0.25, sx: 20, sy: 1.0, sz: 19.6, yaw }, aged);
    build("cut limestone", { ...at, y: at.y + 8.4, sx: 5.8, sy: 18.0, sz: 5.8, yaw }, "#bfb29e");
    for (const height of [2.9, 9.2, 13.5, 17.3]) {
        build("tower cornice", { ...at, y: at.y + height, sx: 6.18, sy: 0.44, sz: 6.18, yaw }, cream);
    }
    build("hip roof", { ...at, y: at.y + 19.0, sx: 6.75, sy: 3.63, sz: 6.75, yaw: yaw + Math.PI / 4 }, "#5b7265");
    for (let side = 0; side < 4; side++) {
        const direction = yaw + side * Math.PI / 2;
        const face = offset(at, direction, 0, -2.93);
        build("clock dial", { ...face, y: at.y + 15.19, sx: 2.45, sy: 0.15, sz: 2.45,
            yaw: direction, pitch: Math.PI / 2 }, "#f2e6bb", "oval");
        const hands = offset(face, direction, 0, -0.13);
        build("clock hands", { ...hands, y: at.y + 15.48, sx: 0.12, sy: 0.69, sz: 0.1, yaw: direction }, "#464b48");
        build("clock hands", { ...hands, y: at.y + 15.2, sx: 0.62, sy: 0.11, sz: 0.1, yaw: direction, roll: -0.48 }, "#464b48");
    }
}
