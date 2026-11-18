import type { Point } from "../../../game/point.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

const pearl = "#e4ebe3";
const glass = "#70a2ac";
const slate = "#46728b";
const mint = "#abc9b4";
const leaf = "#6d9c55";
const lightLeaf = "#96b268";

export function sailTower(build: BuildPart, site: Point, yaw: number, width: number, depth: number, tall: number): void {
    build("sail base", { ...site, y: site.y - 0.22, sx: width * 1.42, sy: 5.2, sz: depth * 1.36, yaw }, mint, "oval");
    for (let level = 0; level < 9; level++) {
        const t = level / 9;
        const at = offset(site, yaw, width * t * t * 0.34, 0);
        const y = site.y + t * tall + tall / 18 + 0.54;
        const w = width * (1 - 0.55 * t);
        const d = depth * (0.84 - 0.23 * t);
        build("garden glass", { ...at, y, sx: w, sy: tall / 9 + 0.05, sz: d, yaw: yaw + t * 0.37 }, glass, "oval");
        build("sail deck band", { ...at, y: y - tall / 18 + 0.07, sx: w * 1.20, sy: 0.47, sz: d * 1.14, yaw: yaw + t * 0.37 },
            pearl, "oval");
        for (const side of [-1, 1]) {
            const edge = offset(at, yaw, side * w * 0.45, 0);
            build("sail vertical fins", { ...edge, y, sx: w * 0.095, sy: tall / 9 + 0.11, sz: d * 0.77, yaw: yaw + t * 0.25 },
                pearl, "oval");
        }
        if (level % 3 === 0) {
            const balcony = offset(at, yaw, 0, d * 0.4);
            build("sail pocket garden", { ...balcony, y: y - tall / 18 + 0.55, sx: w * 0.57, sy: 1.2, sz: d * 0.39, yaw },
                lightLeaf, "leaf");
        }
    }
    const cap = offset(site, yaw, width * 0.28, 0);
    build("sail crown", { ...cap, y: site.y + tall + 1.45, sx: width * 0.63, sy: 3.35, sz: depth * 0.78, yaw, roll: -0.17 },
        pearl, "dome");
}

export function cloudAtrium(build: BuildPart, site: Point, yaw: number, width: number, depth: number): void {
    build("atrium podium", { ...site, y: site.y + 0.35, sx: width * 1.46, sy: 3.7, sz: depth * 1.42, yaw }, mint, "oval");
    build("atrium stem", { ...site, y: site.y + 4.8, sx: width * 0.57, sy: 8.85, sz: depth * 0.55, yaw }, pearl, "oval");
    build("atrium observation bowl", { ...site, y: site.y + 8.4, sx: width * 1.22, sy: 5.2, sz: depth * 1.28, yaw }, pearl, "leaf");
    build("garden glass", { ...site, y: site.y + 10.35, sx: width * 1.19, sy: 3.1, sz: depth * 1.17, yaw }, slate, "oval");
    build("atrium solar lid", { ...site, y: site.y + 12.1, sx: width * 1.33, sy: 2.8, sz: depth * 1.32, yaw }, pearl, "dome");
    for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const post = offset(site, yaw, Math.cos(angle) * width * 0.34, Math.sin(angle) * depth * 0.34);
        build("inclined atrium leg", { ...post, y: site.y + 4.75, sx: 0.65, sy: 8.2, sz: 0.66, yaw: yaw - angle,
            roll: -0.31 }, pearl, "oval");
        const flower = offset(site, yaw, Math.cos(angle) * width * 0.55, Math.sin(angle) * depth * 0.55);
        build("atrium entry garden", { ...flower, y: site.y + 2.19, sx: 2.55, sy: 1.88, sz: 2.72, yaw }, leaf, "leaf");
    }
}

export function energyGarden(build: BuildPart, site: Point, yaw: number, scale: number): void {
    const blade = 8.5 * scale;
    const rotorY = site.y + 19 * scale;
    build("wind turbine tower", { ...site, y: site.y + 9.15 * scale, sx: 1.72 * scale, sy: 19.9 * scale,
        sz: 1.72 * scale, yaw }, pearl, "oval");
    const hub = offset(site, yaw, 0, -1.16 * scale);
    build("wind turbine hub", { ...hub, y: rotorY, sx: 2.1 * scale, sy: 2.08 * scale, sz: 2.25 * scale, yaw }, mint, "leaf");
    for (let i = 0; i < 3; i++) {
        const angle = i * Math.PI * 2 / 3 + 0.45;
        const arm = offset(hub, yaw, Math.cos(angle) * (blade * 0.5 + 0.49), -0.4 * scale);
        build("turbine blade", { ...arm, y: rotorY + Math.sin(angle) * (blade * 0.5 + 0.49), sx: blade, sy: 1.3 * scale,
            sz: 0.42 * scale, yaw, roll: angle }, pearl, "leaf");
    }
    for (let row = 0; row < 3; row++) {
        for (let column = -1; column <= 1; column++) {
            const cell = offset(site, yaw, column * 6.2 * scale, (5.2 + row * 4.2) * scale);
            build("solar rack feet", { ...cell, y: cell.y + 0.68 * scale, sx: 3.1 * scale, sy: 1.64 * scale, sz: 1.04 * scale,
                yaw }, mint);
            build("Aurora photovoltaic panels", { ...cell, y: cell.y + 1.7 * scale, sx: 5.48 * scale, sy: 0.2 * scale, sz: 3.3 * scale,
                yaw, pitch: -0.22 }, "#385775");
        }
    }
}
