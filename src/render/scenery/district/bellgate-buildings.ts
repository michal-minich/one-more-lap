import type { Course } from "../../../game/course/course.ts";
import type { Use } from "../../../game/course/district-plans.ts";
import type { Outpost } from "../../../game/course/outposts.ts";
import type { Point } from "../../../game/point.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { grounded } from "./rural-sites.ts";

const limewash = ["#d2a58b", "#d8c38e", "#c2a58e", "#e3ceb0", "#a4b29a"];
const shutters = ["#48736a", "#5f715b", "#686377"];
const tiles = ["#9b614d", "#a06d58", "#625a66"];
const stone = "#aa9c89";
const chalk = "#ddc8a5";
const timber = "#685142";

export function bellgateHouse(
    build: BuildPart, course: Course, at: Point, yaw: number, width: number, depth: number, use: Use, random: () => number,
    frontage?: { readonly height: number; readonly base: number },
): void {
    const style = Math.floor(random() * limewash.length);
    const floors = use === "civic" ? 2 + (style % 3) : 2 + (style === 1 ? 1 : 0);
    const height = frontage?.height ?? floors * 2.76 + 0.36;
    const wall = limewash[style]!;
    const roof = tiles[style % tiles.length]!;
    const shutter = shutters[(style + 1) % shutters.length]!;
    const place = (x: number, z: number, y: number, sx: number, sy: number, sz: number, name: string, color: string): void => {
        build(name, { ...offset(at, yaw, x, z), y: at.y + y, sx, sy, sz, yaw }, color);
    };
    let bottom = frontage?.base ?? at.y;
    for (const x of [-width / 2, width / 2]) {
        for (const z of [-depth / 2, depth / 2]) {
            bottom = Math.min(bottom, grounded(course, offset(at, yaw, x, z)).y);
        }
    }
    const foundation = at.y - bottom + 1.03;
    place(0, 0, 0.44 - foundation / 2, width * 1.02, foundation, depth * 1.02, "Bellgate masonry footing", stone);
    place(0, 0, (height + bottom - at.y) / 2, width, height + at.y - bottom, depth, "Bellgate limewashed house", wall);
    place(0, 0, height - 0.15, width * 1.075, 0.18, depth * 1.07, "painted trim", chalk);
    if (style % 3 === 1) {
        build("Bellgate hip roof", { ...at, y: at.y + height + 1.1, sx: width * 1.08, sy: 2.2,
            sz: depth * 1.10, yaw: yaw + Math.PI / 4 }, roof);
    } else {
        place(0, 0, height, width * 1.10, 1.85 + width * 0.09, depth * 1.13, "Bellgate tile roof", roof);
    }
    const chimneyX = style % 2 === 0 ? width * 0.22 : -width * 0.27;
    place(chimneyX, depth * 0.23, height + 1.84, 0.62, 2.85, 0.67, "brick chimney", wall);
    place(chimneyX, depth * 0.23, height + 3.23, 0.81, 0.2, 0.86, "painted trim", chalk);
    for (const side of [-1, 1]) {
        const face = side * (depth / 2 + 0.04);
        place(0, face, 1.33, 1.27, 2.58, 0.17, "carved door surround", chalk);
        place(0, face + side * 0.094, 1.19, 0.95, 2.25, 0.13, "painted door", shutter);
        for (let floor = 0; floor < Math.min(floors, Math.floor(height / 2.65)); floor++) {
            const windowY = 1.85 + 2.7 * floor;
            for (const lane of [-0.31, 0, 0.31]) {
                if (floor === 0 && lane === 0) continue;
                const x = width * lane;
                const pane = Math.min(0.98, width * 0.11);
                place(x, face, windowY, pane * 1.24, 1.43, 0.13, "painted trim", chalk);
                place(x, face + side * 0.09, windowY, pane, 1.18, 0.12, "lit windows", "#b7a885");
                place(x, face + side * 0.155, windowY, 0.06, 1.17, 0.05, "painted trim", chalk);
                place(x, face + side * 0.155, windowY + 0.13, pane, 0.06, 0.05, "painted trim", chalk);
                for (const wing of [-1, 1]) {
                    place(x + wing * pane * 0.83, face, windowY, pane * 0.48, 1.33, 0.16, "louvered shutter", shutter);
                }
                place(x, face, windowY - 0.77, pane * 1.42, 0.16, 0.32, "painted trim", chalk);
                if (style % 2 === 0 && floor === 1) {
                    place(x, face + side * 0.23, windowY - 0.73, pane * 0.93, 0.27, 0.36, "window box", "#a07156");
                    place(x, face + side * 0.27, windowY - 0.54, pane, 0.18, 0.28, "window leaves", "#789456");
                }
            }
        }
    }
}

export function bellgateMarket(build: BuildPart, course: Course, { position: at, yaw }: Outpost): void {
    const skirt = offset(at, yaw, -5.35, 0);
    build("Bellgate market plinth", { ...skirt, y: at.y - 0.54, sx: 20.7, sy: 1.8, sz: 26, yaw }, stone);
    build("Bellgate market paving", { ...skirt, y: at.y + 0.37, sx: 19.2, sy: 0.12, sz: 24.5, yaw }, "#c8b59b");
    const terraceY = at.y + 0.46;
    const well = offset(at, yaw, -7, 0);
    build("cut limestone", { ...well, y: terraceY + 0.18, sx: 4.95, sy: 0.36, sz: 4.95, yaw }, chalk, "oval");
    build("cut limestone", { ...well, y: terraceY + 0.72, sx: 3.46, sy: 1.08, sz: 3.46, yaw }, stone, "oval");
    build("well water", { ...well, y: terraceY + 1.28, sx: 2.97, sy: 0.09, sz: 2.97, yaw }, "#668480", "oval");
    for (const side of [-1, 1]) {
        const foot = offset(well, yaw, side * 1.38, 0);
        build("weathered timber", { ...foot, y: terraceY + 2.14, sx: 0.19, sy: 3.52, sz: 0.22, yaw }, timber);
    }
    build("weathered timber", { ...well, y: terraceY + 3.83, sx: 3.2, sy: 0.21, sz: 0.24, yaw }, timber);
    build("gable roof", { ...well, y: terraceY + 3.87, sx: 3.8, sy: 0.77, sz: 2.68, yaw }, "#7b6351");

    for (const [i, z] of [-8.1, -3.9, 4.1, 8.3].entries()) {
        const stall = offset(at, yaw, -0.2, z);
        marketStall(build, { ...stall, y: terraceY }, yaw + Math.PI / 2, i);
    }
    const houses = [[5.7, -7.6, 8.1, 7.5, 0.28], [5.7, 2.7, 8.2, 8.1, 0.51], [2.9, 13.0, 7.3, 6.4, 0.82]] as const;
    for (const [x, z, width, depth, style] of houses) {
        bellgateHouse(build, course, grounded(course, offset(at, yaw, x, z)), yaw - 0.45, width, depth,
            "house", () => style);
    }
}

function marketStall(build: BuildPart, at: Point, yaw: number, index: number): void {
    const canvas = ["#b05e58", "#58887d", "#ba874f", "#886779"][index]!;
    build("weathered timber", { ...at, y: at.y + 0.61, sx: 2.7, sy: 1.21, sz: 1.26, yaw }, timber);
    for (const x of [-1.18, 1.18]) {
        for (const z of [-0.52, 0.52]) {
            const post = offset(at, yaw, x, z);
            build("weathered timber", { ...post, y: at.y + 1.49, sx: 0.10, sy: 2.95, sz: 0.10, yaw }, timber);
        }
    }
    for (let i = -3; i <= 3; i++) {
        const top = offset(at, yaw, i * 0.43, -0.14);
        build("striped awning canvas", { ...top, y: at.y + 2.98, sx: 0.438, sy: 0.065, sz: 2.09, yaw, pitch: -0.19 },
            i % 2 ? "#e6d9ba" : canvas);
        const edge = offset(top, yaw, 0, -1.01);
        build("striped awning canvas", { ...edge, y: at.y + 2.70, sx: 0.438, sy: 0.23, sz: 0.07, yaw },
            i % 2 ? "#e6d9ba" : canvas);
    }
    for (const [i, color] of ["#b9994a", "#ad6949", "#7c8954"].entries()) {
        const produce = offset(at, yaw, (i - 1) * 0.73, -0.18);
        build("market produce", { ...produce, y: at.y + 1.31, sx: 0.55, sy: 0.18, sz: 0.48, yaw }, color, "leaf");
    }
}
