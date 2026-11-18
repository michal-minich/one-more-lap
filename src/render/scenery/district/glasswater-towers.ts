import type { Use } from "../../../game/course/district-plans.ts";
import type { Point } from "../../../game/point.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

export function glasswaterBuilding(
    build: BuildPart, at: Point, yaw: number, width: number, depth: number, use: Use, random: () => number,
): void {
    const tall = use === "tower";
    const brick = use === "brick";
    const height = tall ? 20 + random() * 54 : 7 + random() * 17;
    const tint = brick ? "#ab7e68" : "#6d8794";
    const trim = brick ? "#c4aa91" : "#a2b0ad";
    const podiumHeight = tall ? 4.3 : 2.8;
    const podium = tall ? 1.14 : 1;
    build("tower podium", { ...at, y: at.y + podiumHeight / 2 - 1.35,
        sx: width * podium, sy: podiumHeight + 2.7, sz: depth * podium, yaw }, trim);

    const shaft = { ...at, y: at.y + podiumHeight };
    const crownHeight = tall ? 2.4 + random() * 4.7 : 0;
    const setback = tall ? 0.57 + random() * 0.24 : 1;
    const shaftHeight = height - podiumHeight - crownHeight;
    build(brick ? "tower masonry" : "office curtain wall",
        { ...shaft, y: shaft.y + shaftHeight / 2, sx: width, sy: shaftHeight, sz: depth, yaw }, tint);
    bayWindows(build, shaft, yaw, width, depth, shaftHeight, brick, trim);
    const top = { ...shaft, y: shaft.y + shaftHeight };
    build("parapet", { ...top, sx: width * 1.04, sy: 0.38, sz: depth * 1.04, yaw }, trim);
    if (tall) {
        build("penthouse", { ...top, y: top.y + crownHeight / 2, sx: width * setback,
            sy: crownHeight, sz: depth * setback, yaw }, tint);
        build("tower roof equipment", { ...top, y: top.y + crownHeight + 0.68, sx: width * 0.29,
            sy: 1.35, sz: depth * 0.35, yaw }, "#696f70");
        if (height > 59) {
            const antenna = offset(top, yaw, width * 0.15, -depth * 0.1);
            build("tower antenna", { ...antenna, y: top.y + crownHeight + 2.7,
                sx: 0.17, sy: 5.4, sz: 0.17, yaw }, "#6d7b7d");
            build("hall lantern", { ...antenna, y: top.y + crownHeight + 5.44, sx: 0.26, sy: 0.24,
                sz: 0.26, yaw }, "#d87360", "oval");
        }
    }
}

function bayWindows(build: BuildPart, base: Point, yaw: number, width: number, depth: number, height: number,
    brick: boolean, trim: string): void {
    const floor = brick ? 3.05 : 3.7;
    const tint = brick ? "#75878a" : "#83acbd";
    for (let face = 0; face < 4; face++) {
        const angle = yaw + face * Math.PI / 2;
        const front = face % 2 === 0;
        const span = front ? width : depth;
        const reach = (front ? depth : width) / 2;
        const count = Math.max(2, Math.round(span / 3.1));
        const pitch = span * 0.87 / count;
        const windowWidth = pitch * (brick ? 0.68 : 0.91);
        for (let column = 0; column < count; column++) {
            const local = (column - (count - 1) / 2) * pitch;
            const at = offset(base, angle, local, reach + 0.092);
            for (let row = 0; row * floor + 2.8 < height; row++) {
                const lit = (row + column * 3 + face + Math.round(base.x)) % 9 === 0;
                const y = at.y + 1.55 + row * floor;
                build(lit ? "lit windows" : "office glazing", { ...at, y, sx: windowWidth,
                    sy: floor * (brick ? 0.57 : 0.73), sz: 0.115, yaw: angle }, lit ? "#c7b084" : tint);
                if (brick) build("stone sill", { ...at, y: y - 0.91, sx: windowWidth + 0.21,
                    sy: 0.13, sz: 0.29, yaw: angle }, trim);
            }
        }
        if (!brick) {
            for (let i = 0; i <= count; i++) {
                const at = offset(base, angle, (i - count / 2) * pitch, reach + 0.17);
                build("tower facade fin", { ...at, y: base.y + height / 2,
                    sx: 0.15, sy: height, sz: 0.29, yaw: angle }, trim);
            }
        }
    }
}
