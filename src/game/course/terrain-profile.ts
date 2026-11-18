import type { Point } from "../point.ts";
import type { TrackSpec } from "./tracks.ts";
import { bridgeDrop } from "./passages.ts";
import { pirateCove } from "./reef-lagoon.ts";
import { reefSeabedRise } from "./reef-tunnel.ts";
import { roadHalfWidth } from "./road-width.ts";
import { skywheelTerraceStops } from "./stunt/grounds.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";

export const VERGE_EDGE = 22;

export function smoothBetween(low: number, high: number, value: number): number {
    const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
    return t * t * (3 - 2 * t);
}

export const aresRimStart = 821;
export const aresRimEnd = 1052;

export function aresRimReach(distance: number): number {
    return smoothBetween(aresRimStart, 863, distance) * (1 - smoothBetween(1009, aresRimEnd, distance));
}

export function landscapeNoise(x: number, z: number): number {
    return Math.sin(x * 0.019 + Math.sin(z * 0.014) * 1.7) * Math.cos(z * 0.017 - x * 0.006) * 0.55
        + Math.sin(x * 0.048 + z * 0.038) * 0.25 + Math.cos(z * 0.093 - x * 0.082) * 0.2;
}

export function circuitCenter(points: readonly Point[]): Point {
    let x = 0;
    let y = 0;
    let z = 0;
    for (const point of points) {
        x += point.x;
        y += point.y;
        z += point.z;
    }
    return { x: x / points.length, y: y / points.length, z: z / points.length };
}

export function groundHeight(track: TrackSpec, row: RouteSample, offset: number): number {
    const run = Math.max(0, Math.abs(offset) - roadHalfWidth(track.id, row.distance));
    const point = pointOnRoute(row, offset);
    const relief = landscapeNoise(point.x, point.z);
    const grade = nearGrade(track, offset);
    const verge = smoothBetween(0, 5, run) * (grade * run + relief * Math.min(2.4, run * 0.07))
        - bridgeDrop(track.id, row.distance) * smoothBetween(0, 8, run);
    if (track.id === "stunt") {
        const bank = skywheelTerraceStops.reduce((lift, [from, to, side]) => {
            if (offset * side <= 0) return lift;
            return lift + smoothBetween(from - 10, from + 11, row.distance)
                * (1 - smoothBetween(to - 11, to + 10, row.distance));
        }, 0);
        return verge + bank * ((1.12 + relief * 0.22) * smoothBetween(4, 8, run)
            + (1.4 + relief * 0.36) * smoothBetween(9, 15, run));
    }
    if (track.id === "old-town") {
        const up = offset > 0 ? smoothBetween(275, 310, row.distance) * (1 - smoothBetween(440, 489, row.distance))
            : 0.49 * smoothBetween(335, 373, row.distance) * (1 - smoothBetween(416, 455, row.distance))
                + 0.8 * smoothBetween(802, 833, row.distance) * (1 - smoothBetween(889, 925, row.distance));
        return verge + up * (2.28 * smoothBetween(4.3, 9.8, run) + 1.2 * smoothBetween(10.8, 15, run));
    }
    if (track.id === "future") {
        const hillside = smoothBetween(365, 406, row.distance) * (1 - smoothBetween(465, 498, row.distance))
            + smoothBetween(563, 600, row.distance) * (1 - smoothBetween(681, 730, row.distance));
        const rise = smoothBetween(6.5, 10.9, run) * 0.91 + smoothBetween(12.1, 16, run) * 1.23;
        return verge + hillside * rise * (offset < 0 ? 1 : 0.61);
    }
    if (track.id === "rail") return verge + juniperVerge(row.distance, offset, run);
    if (track.id === "reef") {
        const coast = smoothBetween(38, 81, row.distance) * (1 - smoothBetween(121, 150, row.distance));
        const cut = offset < 0 ? pirateCoveReach(row.distance) * smoothBetween(0, 15, run) * 13
            + coast * smoothBetween(1.1, 15, run) * 4.8 : 0;
        const bed = reefShelf(row, offset, relief) * smoothBetween(13.6, 23, Math.abs(offset));
        return verge + reefSeabedRise(row, relief) + bed - cut;
    }
    if (track.id === "coast" && offset < 0) {
        const window = smoothBetween(165, 230, row.distance) * (1 - smoothBetween(778, 940, row.distance));
        const inlet = smoothBetween(290, 326, row.distance) * (1 - smoothBetween(383, 427, row.distance));
        const cut = window * (2.15 + relief) + inlet * (9.1 + relief * 1.6);
        return verge - cut * smoothBetween(2.8, 15, run);
    }
    if (track.id === "ruins" && offset < 0) {
        const coast = smoothBetween(167, 225, row.distance) * (1 - smoothBetween(655, 758, row.distance));
        return verge - coast * (3.35 + relief) * smoothBetween(2.1, 13, run);
    }
    if (track.id === "forest") {
        const shore = offset > 0 ? 1 - smoothBetween(58, 117, Math.abs(row.distance - 151)) : 0;
        const ridge = offset < 0 ? 1 - smoothBetween(83, 190, Math.abs(row.distance - 526)) : 0;
        return verge - shore * smoothBetween(1, 12, run) * 2.2 + ridge * smoothBetween(3, 14, run) * (3.5 + relief);
    }
    if (track.id === "mars" && offset < 0) {
        const gallery = smoothBetween(390, 438, row.distance) * (1 - smoothBetween(514, 574, row.distance));
        const rim = aresRimReach(row.distance);
        const strata = gallery * ((7.9 + 1.65 * relief) * smoothBetween(6.9, 12.3, run)
            + (3.7 + relief) * smoothBetween(11.8, 15.9, run));
        const shelves = 4.75 * smoothBetween(2.55, 7.21, run) + 5.72 * smoothBetween(7.93, 14.77, run);
        return verge + strata - rim * shelves;
    }
    if (track.id === "canyon" && offset < 0) {
        const wash = cinderWashReach(row.distance);
        return verge - wash * smoothBetween(2.6, 15.2, run) * (5.9 + relief * 1.5);
    }
    if (track.id === "alpine") {
        const shore = offset > 0 ? 1 - smoothBetween(112, 155, Math.abs(row.distance - 594)) : 0;
        const cut = offset < 0 ? 1 - smoothBetween(60, 128, Math.abs(row.distance - 344)) : 0;
        return verge - shore * smoothBetween(2, 15, run) * 4.8 + cut * smoothBetween(4, 15, run) * (4 + relief);
    }
    if (track.id === "gorge" && offset < 0) {
        const overlook = copperOverlook(row.distance);
        return verge - overlook * smoothBetween(2.6, 13.2, run) * (12.5 + relief * 1.75);
    }
    if (track.id === "arctic" && offset < 0) {
        const rim = smoothBetween(222, 264, row.distance) * (1 - smoothBetween(434, 546, row.distance));
        return verge - rim * smoothBetween(2.9, 14.6, run) * (3.7 + relief);
    }
    if (track.id !== "caldera") return verge;
    if (offset >= 0) {
        const crossingView = smoothBetween(194, 217, row.distance) * (1 - smoothBetween(238, 267, row.distance));
        const notch = smoothBetween(1_389, 1_424, row.distance) * (1 - smoothBetween(1_505, 1_529, row.distance));
        const shelf = notch * ((4.2 + relief * 1.5) * smoothBetween(6.1, 11.2, run)
            + (4.8 + relief) * smoothBetween(11.6, 16.5, run));
        return verge - crossingView * smoothBetween(7.1, 14.8, offset) * 5.8 + shelf;
    }
    const galleryReach = smoothBetween(38, 86, row.distance) * (1 - smoothBetween(205, 230, row.distance));
    const rimDrop = calderaRimReach(row.distance) * (4.3 * smoothBetween(4.3, 7.4, run)
        + 4.7 * smoothBetween(9.3, 14.7, run));
    return verge - galleryReach * smoothBetween(8.2, 20.5, -offset) * 5.5 - rimDrop;
}

export const calderaRimStart = 1_055;
export const calderaRimEnd = 1_178;

export function calderaRimReach(distance: number): number {
    return smoothBetween(calderaRimStart - 20, calderaRimStart + 11, distance) *
        (1 - smoothBetween(calderaRimEnd - 14, calderaRimEnd + 21, distance));
}

function nearGrade(track: TrackSpec, offset: number): number {
    switch (track.id) {
        case "reef": return -0.12;
        case "coast": return offset < 0 ? -0.16 : 0.07;
        case "ruins": return offset < 0 ? -0.12 : 0.07;
        case "caldera": return offset < 0 ? -0.17 : 0.055;
        case "gorge": return offset < 0 ? -0.18 : 0.13;
        case "arctic": return offset < 0 ? -0.09 : 0.07;
        case "alpine": return 0.15;
        case "canyon":
        case "mars": return 0.12;
        case "metro":
        case "future":
        case "old-town": return 0.012;
        default: return 0.05;
    }
}

export function outsidePoint(track: TrackSpec, center: Point, row: RouteSample, reach: number): Point {
    const edge = pointOnRoute(row, -VERGE_EDGE, groundHeight(track, row, -VERGE_EDGE));
    if (reach === 0) return edge;
    const dx = edge.x - center.x;
    const dz = edge.z - center.z;
    const scale = reach / Math.hypot(dx, dz);
    const x = edge.x + dx * scale;
    const z = edge.z + dz * scale;
    if (track.id === "coast") return { x, y: coastalBluff(row.distance, edge.y, reach, x, z), z };
    if (track.id === "ruins") return { x, y: aegeanTerrace(row.distance, edge.y, reach, x, z), z };
    if (track.id === "gorge") return { x, y: copperTerraces(row.distance, edge.y, reach, x, z), z };
    if (track.id === "reef") return { x, y: coralCoast(row, edge.y, reach, x, z), z };
    const height = outerHeight(track, edge.y, reach, x, z);
    if (track.id === "arctic") {
        const harbor = smoothBetween(134, 183, row.distance) * (1 - smoothBetween(251, 282, row.distance));
        const bench = smoothBetween(0, 9, reach) * (1 - smoothBetween(33, 53, reach));
        const headland = smoothBetween(352, 408, row.distance) * (1 - smoothBetween(511, 572, row.distance));
        const cut = smoothBetween(1, 18, reach) * (1 - smoothBetween(53, 102, reach));
        return { x, y: height + bench * harbor * 2.25 - cut * headland * 8.8, z };
    }
    if (track.id === "mars") {
        const cut = aresRimReach(row.distance) * smoothBetween(0, 13.5, reach) * (1 - smoothBetween(36, 87, reach));
        return { x, y: height - cut * 4.4, z };
    }
    if (track.id === "rail") return { x, y: height - juniperTerraces(row.distance, reach, landscapeNoise(x, z)), z };
    if (track.id === "canyon") {
        const wash = cinderWashReach(row.distance);
        const bank = wash * smoothBetween(1, 42, reach) * (1 - smoothBetween(52, 115, reach));
        return { x, y: height - bank * (12.1 + landscapeNoise(x, z) * 2.2), z };
    }
    return { x, y: height, z };
}

function cinderWashReach(distance: number): number {
    return smoothBetween(285, 380, distance) * (1 - smoothBetween(540, 584, distance));
}

function pirateCoveReach(distance: number): number {
    return 1 - smoothBetween(72, 155, Math.abs(distance - pirateCove.distance));
}

function reefShelf(row: RouteSample, offset: number, relief: number): number {
    const submarine = smoothBetween(191, 248, row.distance) * (1 - smoothBetween(592, 627, row.distance));
    const seam = Math.sin(row.distance * 0.057 + (offset < 0 ? 1.97 : 0.44));
    const mass = smoothBetween(-0.61, 0.73, seam + relief * 0.48);
    return submarine * mass * (7.1 + relief * 2.0);
}

function coralCoast(row: RouteSample, edge: number, reach: number, x: number, z: number): number {
    const grain = landscapeNoise(x * 0.73 - 1, z * 0.66);
    const harbor = pirateCoveReach(row.distance);
    const beach = edge + (-28 - edge + grain * 8) * smoothBetween(4, 118, reach);
    const bluff = smoothBetween(12, 58, row.distance) * (1 - smoothBetween(121, 166, row.distance))
        + smoothBetween(937, 985, row.distance) * (1 - smoothBetween(1_268, 1_379, row.distance));
    const lip = smoothBetween(0, 12, reach) * (1 - smoothBetween(23, 46, reach));
    const terraceDrop = 8.2 * smoothBetween(17, 31, reach) + 5.2 * smoothBetween(45, 63, reach);
    const shelf = reefShelf(row, -22, grain) * smoothBetween(0, 15, reach) * (1 - smoothBetween(32, 76, reach));
    const rim = Math.max(
        massif(x, z, -211, 254, 105, 153) * 78,
        massif(x, z, -335, 393, 135, 135) * 100,
        massif(x, z, -102, 609, 138, 116) * 85,
        massif(x, z, 87, 720, 112, 115) * 73,
        massif(x, z, 573, 567, 117, 142) * 89,
        massif(x, z, 666, 394, 147, 107) * 104,
        massif(x, z, 715, 191, 133, 103) * 92,
        massif(x, z, 531, -204, 144, 112) * 75,
        massif(x, z, 111, -342, 176, 116) * 63,
        massif(x, z, -173, -226, 135, 109) * 69,
    ) * smoothBetween(105, 207, reach);
    const rockBeds = Math.sin((rim + x * 0.16 - z * 0.105) * 0.55 + grain * 2) * Math.min(3.2, rim * 0.11);
    return beach + bluff * (lip * (3.65 + grain) - terraceDrop * (1 - smoothBetween(63, 112, reach)))
        + shelf - harbor * smoothBetween(0, 25, reach) * 7 + rim + rockBeds;
}

function aegeanTerrace(distance: number, edge: number, reach: number, x: number, z: number): number {
    const noise = landscapeNoise(x * 0.72, z * 0.72);
    const bay = smoothBetween(135, 240, distance) * (1 - smoothBetween(698, 830, distance));
    const headland = 22 + noise * 10 + 9 * Math.sin(distance * 0.018);
    const lip = smoothBetween(4, headland + 1, reach) * (1 - smoothBetween(headland, headland + 23, reach));
    const drop = (edge + 8) * smoothBetween(headland, headland + 23, reach);
    const lower = 17 * smoothBetween(headland + 18, headland + 94, reach);
    const cliff = edge + lip * (1.6 + noise * 2.7) - drop - lower;
    const island = edge + (5 + noise * 17) * smoothBetween(0, 55, reach)
        + (-27 - edge - noise * 13) * smoothBetween(72, 213, reach);
    const farIslands = Math.max(
        massif(x, z, -465, 330, 152, 168) * 105,
        massif(x, z, -574, 430, 158, 139) * 131,
        massif(x, z, -357, 670, 174, 129) * 87,
        massif(x, z, -231, 779, 106, 103) * 69,
        massif(x, z, 159, 801, 148, 115) * 94,
        massif(x, z, 356, 862, 139, 116) * 83,
    );
    const seaCliffs = farIslands * smoothBetween(187, 321, reach);
    return island + (cliff - island) * bay + seaCliffs;
}

function coastalBluff(distance: number, edge: number, reach: number, x: number, z: number): number {
    const noise = landscapeNoise(x * 0.68, z * 0.68);
    const headland = 0.5 + Math.sin(distance * 0.027 + Math.sin(distance * 0.009)) * 0.5;
    const firstBluff = smoothBetween(143, 205, distance) * (1 - smoothBetween(390, 446, distance));
    const secondBluff = smoothBetween(464, 542, distance) * (1 - smoothBetween(771, 904, distance));
    const lighthouse = 1 - smoothBetween(24, 87, Math.abs(distance - 610));
    const folds = landscapeNoise(x * 1.5 - 29, z * 1.57 + 82);
    const inlet = smoothBetween(290, 325, distance) * (1 - smoothBetween(383, 427, distance));
    const breakAt = 8 + headland * 13 + noise * 4 + lighthouse * 17 - inlet * 6.3;
    const ledge = (2.0 + folds * 2.4) * smoothBetween(3, 11, reach) * (1 - smoothBetween(16, 33, reach));
    const drop = 0.81 * smoothBetween(breakAt, breakAt + 16, reach)
        + 0.19 * smoothBetween(breakAt + 19, breakAt + 36, reach);
    const shelf = smoothBetween(0, 14, reach) * (1 - drop) * (1.5 + noise * 3.4 + lighthouse * 11);
    const bluff = edge - (edge + 9) * drop - 22 * smoothBetween(51, 132, reach) + shelf + ledge;
    const beach = edge + (-29 - edge + noise * 10) * smoothBetween(3, 112, reach);
    const cliffs = Math.max(firstBluff, secondBluff);
    const farCoast = Math.max(
        massif(x, z, -431, 678, 209, 126) * 91,
        massif(x, z, -104, 815, 177, 140) * 97,
        massif(x, z, 351, 786, 150, 119) * 75,
        massif(x, z, 672, 667, 127, 101) * 65,
    ) * smoothBetween(174, 340, reach);
    return beach + (bluff - beach) * cliffs + farCoast;
}

function juniperVerge(distance: number, offset: number, run: number): number {
    const upper = smoothBetween(626, 742, distance) * (1 - smoothBetween(876, 959, distance));
    const cutting = smoothBetween(305, 365, distance) * (1 - smoothBetween(447, 551, distance));
    const shoulder = smoothBetween(3.3, 15.7, run);
    return offset < 0 ? -upper * shoulder * 5.1 : cutting * shoulder * 2.9;
}

function juniperTerraces(distance: number, reach: number, relief: number): number {
    const upper = smoothBetween(650, 767, distance) * (1 - smoothBetween(878, 982, distance));
    const bench = smoothBetween(0, 10, reach) * 1.8
        + smoothBetween(18, 28, reach) * 2.8 + smoothBetween(35, 50, reach) * 3.9;
    return upper * (bench * (0.85 + relief * 0.25) + 4 * smoothBetween(64, 143, reach));
}

function copperOverlook(distance: number): number {
    return smoothBetween(310, 398, distance) * (1 - smoothBetween(532, 642, distance));
}

function copperTerraces(distance: number, edge: number, reach: number, x: number, z: number): number {
    const opening = copperOverlook(distance);
    const drift = landscapeNoise(x * 0.68, z * 0.68);
    const fracture = landscapeNoise(x * 1.34 + 25, z * 1.46 - 11);
    const fault = 8 + Math.sin(x * 0.042 + z * 0.020) * 9 + drift * 7;
    const bank = 16 + drift * 6;
    const cut = 34 * opening;
    const terraces = 0.30 * smoothBetween(3 + fault * 0.28, 29 + fault - cut * 0.41, reach)
        + 0.30 * smoothBetween(31 + fault - cut * 0.56, 51 + fault - cut * 0.71, reach)
        + 0.40 * smoothBetween(54 + fault - cut, 77 + fault - cut, reach);
    const farBank = smoothBetween(153 - fault, 177 - fault, reach) * 0.46
        + smoothBetween(173 - fault, 200 - fault, reach) * 0.54;
    const gullies = 8 * Math.sin(x * 0.058 + z * 0.016 + drift * 1.3);
    const ironRim = smoothBetween(185 + gullies, 230 + gullies, reach) * (29 + drift * 18)
        + smoothBetween(238 + gullies, 267 + gullies, reach) * (31 + drift * 24)
        + smoothBetween(282 - gullies, 358 - gullies, reach) * (18 + fracture * 22);
    return edge + (bank - edge) * terraces + farBank * (54 + fracture * 16) + ironRim;
}

function outerHeight(track: TrackSpec, edge: number, reach: number, x: number, z: number): number {
    const noise = landscapeNoise(x * 0.68, z * 0.68);
    const foothills = smoothBetween(3, 70, reach);
    const mountains = smoothBetween(40, 290, reach);
    switch (track.id) {
        case "stunt": {
            const bluffs = Math.max(
                massif(x, z, -141, 392, 184, 164) * 49,
                massif(x, z, -57, 636, 191, 184) * 61,
                massif(x, z, 219, 695, 185, 145) * 52,
                massif(x, z, 458, 426, 144, 191) * 46,
                massif(x, z, 433, 19, 182, 186) * 37,
            );
            const bed = bluffs / 8.6 + x * 0.031 - z * 0.016 + noise * 0.49;
            const fraction = bed - Math.floor(bed);
            const ledges = (smoothBetween(0.27, 0.65, fraction) - fraction) * 8.6;
            const face = smoothBetween(10, 32, bluffs) * ledges;
            return edge + foothills * (2.1 + noise * 7) + smoothBetween(32, 122, reach) * (bluffs + face);
        }
        case "arctic": {
            const wall = Math.max(
                massif(x, z, -270, 304, 128, 187) * 128,
                massif(x, z, -417, 381, 142, 198) * 182,
                massif(x, z, -259, 512, 142, 158) * 139,
                massif(x, z, -159, 597, 104, 134) * 116,
                massif(x, z, 27, 660, 173, 161) * 107,
                massif(x, z, 134, 769, 137, 133) * 143,
                massif(x, z, 539, 382, 155, 195) * 138,
                massif(x, z, 564, 257, 106, 131) * 101,
                massif(x, z, -206, -137, 127, 132) * 101,
                massif(x, z, -48, -293, 174, 142) * 124,
                massif(x, z, 132, -378, 158, 121) * 91,
            );
            const flutes = Math.abs(landscapeNoise(x * 1.86 + 42, z * 1.59 - 24));
            const glacier = mountains * wall * (1.02 + noise * 0.23 - flutes * 0.22);
            const bed = glacier / 16 + x * 0.018 - z * 0.013;
            const layer = bed - Math.floor(bed);
            const shelves = (smoothBetween(0.24, 0.69, layer) - layer) * 13
                * smoothBetween(17, 43, glacier) * smoothBetween(150, 230, reach);
            return edge + (-18 - edge + noise * 4) * smoothBetween(5, 117, reach)
                + glacier + shelves;
        }
        case "caldera":
            return edge + foothills * (4 + noise * 16) +
                mountains * (9 + 66 * smoothBetween(-0.35, 0.78, noise));
        case "rail": {
            const near = Math.max(
                massif(x, z, -278, 372, 224, 238) * 119,
                massif(x, z, 154, 755, 266, 228) * 137,
                massif(x, z, 589, 415, 226, 257) * 127,
            );
            const far = Math.max(
                massif(x, z, -398, 548, 250, 167) * 183,
                massif(x, z, -38, 958, 308, 190) * 207,
                massif(x, z, 399, 914, 260, 167) * 179,
                massif(x, z, 737, 599, 235, 200) * 169,
            );
            const ribs = Math.sin((x * 0.23 + z * 0.71) * 0.063 + noise * 2.3) * Math.min(10, near * 0.12);
            const folds = (near + ribs) * smoothBetween(55, 140, reach);
            const bedding = Math.sin((edge + folds + x * 0.046 - z * 0.079) * 0.365) * Math.min(8, folds * 0.19);
            return edge + foothills * (4 + noise * 11) + mountains * (Math.max(near + ribs, far) + noise * 14) + bedding;
        }
        case "alpine":
            return edge + foothills * (3 + noise * 15) +
                smoothBetween(24, 175, reach) * (19 + alpineRelief(x, z));
        case "canyon": {
            const cliffs = Math.max(
                massif(x, z, -248, 553, 142, 220) * 118,
                massif(x, z, 62, 728, 203, 140) * 126,
                massif(x, z, 381, 708, 226, 162) * 98,
                massif(x, z, 570, 382, 161, 208) * 132,
                massif(x, z, -172, 123, 166, 172) * 74,
            );
            const mesa = smoothBetween(0.00, 0.26, cliffs / 120) * Math.min(52 + noise * 6, cliffs);
            const ledges = Math.sin((edge + mesa) * 0.62 + noise * 2.4) * 6;
            return edge + foothills * (3 + noise * 8) + smoothBetween(42, 185, reach) * (mesa + cliffs * 0.31 + ledges);
        }
        case "old-town": {
            const ridge = Math.max(massif(x, z, -138, 304, 177, 204) * 43,
                massif(x, z, -92, 521, 190, 177) * 59, massif(x, z, 294, 526, 201, 155) * 39,
                massif(x, z, 497, 174, 137, 208) * 36, massif(x, z, 91, -203, 188, 180) * 28);
            return edge + foothills * (2.5 + noise * 6) + smoothBetween(9, 106, reach) * ridge;
        }
        case "mars": {
            const rim = Math.max(
                massif(x, z, -137, 515, 126, 155) * 77,
                massif(x, z, 117, 684, 167, 134) * 94,
                massif(x, z, 338, 655, 155, 146) * 81,
                massif(x, z, 565, 394, 131, 145) * 57,
                massif(x, z, 457, 51, 159, 162) * 64,
            );
            const band = Math.sin((rim + edge) * 0.52 + x * 0.045 + z * 0.04) * 3.6;
            return edge + foothills * (2 + noise * 12) + smoothBetween(36, 149, reach) *
                (rim + band + smoothBetween(0.07, 0.68, noise) * (12 + mountains * 17));
        }
        case "forest": {
            const ridge = Math.max(
                massif(x, z, -195, 385, 176, 248) * 98,
                massif(x, z, -92, 620, 205, 159) * 116,
                massif(x, z, 192, 704, 218, 212) * 136,
                massif(x, z, 548, 436, 181, 185) * 93,
            );
            const crown = smoothBetween(34, 185, reach);
            const flutes = Math.abs(landscapeNoise(x * 1.7 + 58, z * 1.62));
            return edge + foothills * (5 + noise * 13) + crown * (ridge + noise * 17 - flutes * ridge * 0.12);
        }
        case "future": {
            const gardens = Math.max(
                massif(x, z, 33, 575, 143, 119) * 48,
                massif(x, z, 201, 628, 157, 126) * 57,
                massif(x, z, 436, 458, 126, 109) * 35,
            );
            return edge + (6.9 - edge + noise * 4) * smoothBetween(8, 123, reach)
                + gardens * smoothBetween(12, 88, reach);
        }
        case "metro":
            return edge + (3.4 - edge + noise * 3.5) * smoothBetween(8, 116, reach);
        default:
            return edge + foothills * noise * 4;
    }
}

export function insidePoint(track: TrackSpec, center: Point, row: RouteSample, inward: number): Point {
    const edge = pointOnRoute(row, VERGE_EDGE, groundHeight(track, row, VERGE_EDGE));
    const x = edge.x + (center.x - edge.x) * inward;
    const z = edge.z + (center.z - edge.z) * inward;
    if (track.id === "reef") {
        const grain = landscapeNoise(x * 0.83 + 1.3, z * 0.87);
        const reef = smoothBetween(158, 211, row.distance) * (1 - smoothBetween(606, 653, row.distance));
        const depths = -19 + grain * 8 + 6 * Math.cos(x * 0.085 + grain * 3 + z * 0.047);
        const coast = 9 + grain * 7 + Math.max(
            massif(x, z, 260, 346, 116, 113) * 46,
            massif(x, z, 170, 174, 129, 155) * 41,
            massif(x, z, 99, 155, 73, 97) * 28,
            massif(x, z, 231, 19, 83, 92) * 26,
        );
        const nearShelf = reefShelf(row, VERGE_EDGE, grain) * smoothBetween(0, 0.12, inward)
            * (1 - smoothBetween(0.15, 0.41, inward));
        const bank = edge.y + (coast + (depths - coast) * reef - edge.y) * smoothBetween(0, 0.64, inward);
        const hub = center.y + grain * 8 + 26;
        return { x, z, y: bank + (hub - bank) * smoothBetween(0.67, 1, inward) + nearShelf };
    }
    const amplitude = track.id === "alpine" ? 22 : track.id === "gorge" ? 28
        : track.id === "forest" || track.id === "mars" || track.id === "canyon" ? 23 : 8;
    const ravine = track.id === "gorge" ? 52 * smoothBetween(-0.53, 0.65, Math.sin((z - center.z) * 0.011)) : 0;
    const highland = track.id === "coast" ? Math.max(
        massif(x, z, 117, 324, 81, 111) * 31,
        massif(x, z, 207, 237, 123, 151) * 41,
    ) : track.id === "alpine" ? massif(x, z, 231, 276, 124, 144) * 76
        : track.id === "ruins" ? Math.max(
            massif(x, z, 75, 294, 122, 124) * 29,
            massif(x, z, 167, 194, 147, 126) * 44,
        ) : 0;
    const height = center.y + landscapeNoise(x, z) * amplitude + highland - ravine;
    const templeHill = track.id === "ruins" ? massif(x, z, 38, 273, 43, 50) * 7.2 * smoothBetween(0, 0.17, inward) : 0;
    const bellgateHills = track.id === "old-town" ? Math.max(massif(x, z, 77, 269, 91, 103) * 14.4,
        massif(x, z, 158, 342, 104, 116) * 20.5) * smoothBetween(0, 0.28, inward) : 0;
    return { x, y: edge.y + (height - edge.y) * smoothBetween(0, 1, inward) + templeHill + bellgateHills, z };
}

function alpineRelief(x: number, z: number): number {
    const ridges = Math.max(
        massif(x, z, -220, 391, 205, 247) * 146,
        massif(x, z, 174, 690, 252, 184) * 145,
        massif(x, z, 573, 417, 179, 214) * 173,
        massif(x, z, 335, -255, 257, 187) * 138,
        massif(x, z, -156, -150, 168, 182) * 114,
    );
    const scree = 1 - Math.abs(landscapeNoise(x * 1.61 + 18, z * 1.54 - 9));
    return ridges + (scree - 0.55) * (11 + ridges * 0.17);
}

function massif(x: number, z: number, px: number, pz: number, width: number, length: number): number {
    const dx = (x - px) / width;
    const dz = (z - pz) / length;
    const radius = Math.hypot(dx, dz);
    const ribs = 1 + Math.sin(Math.atan2(dz, dx) * 5 + 0.7) * 0.17;
    return Math.max(0, 1 - radius * ribs) ** 1.19;
}
