import type { Point } from "../../game/point.ts";
import { offset } from "./urban-parts.ts";
import type { BuildPart } from "./urban-parts.ts";

const limestone = "#e2e8e0";
const porcelain = "#f1ede2";
const shaded = "#c4d3c9";
const glass = "#709a9e";
const soil = "#527949";
const foliage = "#70a150";
const youngLeaves = "#91b75e";
const solar = "#385775";

export function gardenTower(
    build: BuildPart, site: Point, yaw: number, width: number, depth: number, high: boolean, random: () => number,
): void {
    const floors = high ? 5 + Math.floor(random() * 5) : 2 + Math.floor(random() * 3);
    const rounded = random() > 0.36;
    const form = rounded ? "oval" : "box";
    const step = rounded ? 4.85 : 5.6;
    build("garden podium", { ...site, y: site.y + 0.52, sx: width * 1.36, sy: 4.7, sz: depth * 1.29, yaw }, shaded, form);
    for (let level = 0; level < floors; level++) {
        const base = site.y + level * step + 1.35;
        const taper = 1 - (level / floors) * (rounded ? 0.48 : 0.33);
        const center = offset(site, yaw, Math.sin(level * 0.84) * width * 0.092, level * depth * 0.026);
        const w = width * taper;
        const d = depth * taper;
        build("white upper stories", { ...center, y: base + step * 0.44, sx: w * 0.80, sy: step * 0.88, sz: d * 0.78, yaw },
            limestone, form);
        build("garden glass", { ...center, y: base + step * 0.52, sx: w * 0.813, sy: step * 0.48, sz: d * 0.794, yaw }, glass, form);
        build("white terrace", { ...center, y: base + step - 0.45, sx: w, sy: 0.71, sz: d, yaw }, porcelain, form);
        build("planted terrace", { ...center, y: base + step - 0.015, sx: w * 0.91, sy: 0.22, sz: d * 0.91, yaw }, soil, form);
        for (let slot = 0; slot < 6; slot++) {
            const angle = slot * Math.PI / 3 + level * 0.13;
            const p = offset(center, yaw, Math.cos(angle) * w * 0.426, Math.sin(angle) * d * 0.423);
            const leaf = 0.72 + random() * 0.78;
            build("terrace planting", { ...p, y: base + step + leaf * 0.29, sx: leaf * 1.7, sy: leaf, sz: leaf * 1.55, yaw },
                slot % 3 === 0 ? youngLeaves : foliage, "leaf");
            if (slot % 3 === 1 && level % 2 === 0) {
                const trailing = offset(center, yaw, Math.cos(angle) * w * 0.477, Math.sin(angle) * d * 0.474);
                build("trailing terrace garden", { ...trailing, y: base + step - 0.26, sx: 1.5, sy: 1.75, sz: 1.32, yaw },
                    foliage, "leaf");
            }
            if (slot % 2 === 0) {
                const rib = offset(center, yaw, Math.cos(angle) * w * 0.394, Math.sin(angle) * d * 0.367);
                build("white facade fins", { ...rib, y: base + step * 0.41, sx: 0.41, sy: step * 0.85, sz: 0.43, yaw: yaw + angle },
                    limestone);
            }
        }
        if (level === floors - 1) {
            const top = { ...center, y: base + step + 0.07 };
            solarRoof(build, top, yaw, w * 0.72, d * 0.57, 1.55);
        }
    }
}

export function conservatory(build: BuildPart, site: Point, yaw: number, width: number, depth: number): void {
    build("conservatory foundation", { ...site, y: site.y + 0.39, sx: width * 1.39, sy: 3.2, sz: depth * 1.3, yaw }, shaded, "oval");
    build("conservatory windows", { ...site, y: site.y + 2.4, sx: width * 1.10, sy: 3.2, sz: depth * 1.05, yaw }, glass, "oval");
    build("white rim", { ...site, y: site.y + 4.1, sx: width * 1.31, sy: 0.78, sz: depth * 1.22, yaw }, porcelain, "oval");
    build("garden glass", { ...site, y: site.y + 4.4, sx: width * 1.14, sy: 9.8, sz: depth * 1.04, yaw }, "#9bc8c6", "dome");
    for (let i = 0; i < 9; i++) {
        const angle = i / 9 * Math.PI * 2;
        const p = offset(site, yaw, Math.cos(angle) * width * 0.61, Math.sin(angle) * depth * 0.56);
        build("veranda post", { ...p, y: site.y + 2.55, sx: 0.52, sy: 3.64, sz: 0.51, yaw: yaw + angle }, porcelain, "oval");
    }
}

export function gardenPlaza(build: BuildPart, site: Point, yaw: number): void {
    build("plaza white pavers", { ...site, y: site.y + 0.05, sx: 25, sy: 0.74, sz: 25, yaw }, porcelain, "oval");
    build("rain garden", { ...site, y: site.y + 0.53, sx: 18.8, sy: 0.47, sz: 14.9, yaw }, soil, "oval");
    const pond = offset(site, yaw, -2.4, -2.3);
    build("plaza reflecting pool", { ...pond, y: site.y + 0.82, sx: 6.8, sy: 0.13, sz: 8.9, yaw }, "#68acae", "oval");
    for (let index = 0; index < 9; index++) {
        const a = index * 2.4;
        const point = offset(site, yaw, Math.cos(a) * (6.3 + index % 3), Math.sin(a) * (4.2 + index % 2));
        const crown = 2.2 + index % 3 * 0.57;
        build("plaza tree stem", { ...point, y: site.y + 1.64, sx: 0.29, sy: 1.75, sz: 0.28, yaw }, "#795d45", "oval");
        build("plaza tree canopy", { ...point, y: site.y + 2.95, sx: crown, sy: crown * 0.78, sz: crown, yaw },
            index % 2 ? foliage : youngLeaves, "leaf");
    }
    solarRoof(build, offset(site, yaw, 6.3, 3.75), yaw, 8.1, 5.2, 4.1);
}

function solarRoof(build: BuildPart, at: Point, yaw: number, width: number, depth: number, rise: number): void {
    for (const side of [-1, 1]) {
        const leg = offset(at, yaw, side * width * 0.34, 0);
        build("solar canopy supports", { ...leg, y: at.y + rise * 0.51, sx: 0.30, sy: rise, sz: 0.31, yaw }, limestone, "oval");
    }
    build("white solar canopy", { ...at, y: at.y + rise, sx: width, sy: 0.24, sz: depth, yaw, pitch: -0.135 }, porcelain);
    for (let cell = 0; cell < 4; cell++) {
        const panel = offset(at, yaw, (cell - 1.5) * width * 0.229, 0);
        build("solar cells", { ...panel, y: at.y + rise + 0.145, sx: width * 0.214, sy: 0.054, sz: depth * 0.89, yaw, pitch: -0.135 }, solar);
    }
}
