import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import type { RockProfile } from "./rock-profiles.ts";
import { pointOnRoute } from "./route.ts";
import { insidePoint, outsidePoint } from "./terrain-profile.ts";

export interface RockFormation extends Point {
    readonly profile: RockProfile;
    readonly sx: number;
    readonly sy: number;
    readonly sz: number;
    readonly yaw: number;
}

export function placeRockFormations(course: Course): readonly RockFormation[] {
    const { route, track } = course;
    if (track.id === "forest") return woodlandCuts(course);
    if (track.id === "gorge") return copperBluffs(course);
    if (track.id === "coast") return [...seaStacks(course), ...pacificCliffs(course)];
    if (track.id === "ruins") return aegeanOutcrops(course);
    if (track.id === "alpine") return alpineScree(course);
    if (track.id === "arctic") return frosthavenOutcrops(course);
    if (track.id === "reef") return coralLedges(course);
    if (track.id !== "canyon" && track.id !== "mars") return [];
    const formations: RockFormation[] = [];
    for (let i = 10; i < route.length - 5; i += 34) {
        const row = route[i]!;
        const base = outsidePoint(track, course.center, row, 72 + i % 6 * 8);
        const ground = course.ground.at(base.x, base.z) ?? base.y;
        const profile = track.id === "canyon" ? "hoodoo" : "fin";
        formations.push({ ...base, profile, y: ground - 6, sx: 33 + i % 5 * 10, sy: 26 + i % 7 * 7,
            sz: track.id === "mars" ? 28 : 37, yaw: i * 0.31 });
        if (i % 3 !== 0) continue;
        const small = insidePoint(track, course.center, row, 0.32 + (i % 7) * 0.013);
        const height = course.ground.at(small.x, small.z) ?? small.y;
        formations.push({ ...small, profile: track.id === "mars" ? "fin" : "mesa",
            y: height - 2.1, sx: 15, sy: 13 + i % 4 * 2.9, sz: 17, yaw: i * 0.12 });
    }
    if (track.id === "canyon") {
        const sites = [[75, -25, 17, 17, "mesa"], [123, 21, 15, 21, "hoodoo"], [142, 28, 16, 15, "fin"],
            [285, -18, 16, 24, "hoodoo"], [441, 25, 23, 27, "fin"], [473, 34, 25, 17, "mesa"],
            [676, 17, 13, 16, "hoodoo"], [850, -24, 20, 19, "mesa"], [1_079, 18, 14, 23, "hoodoo"],
            [1_338, -20, 17, 18, "hoodoo"]] as const;
        for (const [distance, lateral, width, height, profile] of sites) {
            const row = course.at(distance);
            const at = pointOnRoute(row, lateral);
            const y = course.ground.at(at.x, at.z) ?? at.y;
            formations.push({ ...at, profile, y: y - 2.4, sx: width, sy: height, sz: width * 1.19,
                yaw: Math.atan2(row.dx, row.dz) + Math.sin(distance * 0.13) * 0.15 });
        }
    }
    return formations;
}

function frosthavenOutcrops(course: Course): RockFormation[] {
    const shoulders = [
        [145, 33, 15, 4.9, 22, 0.17], [251, 33, 19, 6.8, 31, -0.68],
        [273, 41, 23.5, 8.2, 27, 0.12], [362, 42, 20, 7.8, 27, -0.20],
        [432, -45, 15, 4.1, 26, 1.10], [455, -44, 22, 6.4, 28, 0.22],
        [541, 36, 21.6, 5.2, 26, 0.62], [758, 36, 14.8, 4.1, 24, -0.13],
        [877, 38, 23.7, 6.6, 32, 0.38], [1_099, 30, 19.2, 4.3, 18, -0.44],
    ] as const;
    const fit = (at: Point, sx: number, rise: number, sz: number, yaw: number, profile: RockProfile): RockFormation => {
        const ground = course.ground.at(at.x, at.z) ?? at.y;
        const bed = Math.min(...Array.from({ length: 8 }, (_, i) => {
            const angle = i * Math.PI / 4;
            const x = Math.cos(angle) * sx * 0.56;
            const z = Math.sin(angle) * sz * 0.56;
            return course.ground.at(at.x + x * Math.cos(yaw) + z * Math.sin(yaw),
                at.z - x * Math.sin(yaw) + z * Math.cos(yaw)) ?? ground;
        }));
        const y = Math.min(ground - 1.8, bed - 1.1);
        return { ...at, y, sx, sy: ground + rise - y, sz, yaw, profile };
    };
    return shoulders.map(([d, offset, sx, rise, sz, twist], i) => {
        const row = course.at(d);
        return fit(pointOnRoute(row, offset), sx, rise, sz,
            Math.atan2(row.dx, row.dz) + twist, i % 3 === 2 ? "mesa" : "fin");
    });
}

function coralLedges(course: Course): RockFormation[] {
    const sites = [
        [54, -25, 13.2, 5.1, 22.3, 0.60], [83, 24, 13.4, 9.1, 18.6, -0.23],
        [117, 22.5, 17.0, 11.4, 21.3, 0.48], [144, 25, 19.6, 13.4, 23.9, -0.31],
        [220, 38, 24, 15.2, 26, 0.74], [263, -44, 31, 23.4, 45, -0.19], [309, 46, 28, 22.2, 29, 1.42],
        [363, 49, 32, 17.0, 34, -0.54], [401, -55, 36, 20.4, 32, 0.71], [454, 54, 33, 22.2, 39, 0.43],
        [511, -42, 27, 17.1, 39, 0.75], [557, 48, 29, 30.0, 39, 1.27],
        [599, -58, 36, 23.1, 41, 0.61], [662, 25, 20.8, 14.0, 28.8, -0.18], [695, 24, 18.1, 10.3, 24.5, 0.32],
        [746, 34, 25, 12.2, 32.1, 0.90], [818, 41, 21.7, 8.2, 28.0, 0.57],
        [701, -122, 37, 61, 43, -0.64, "stack"], [723, -103, 33, 49, 29, 0.86, "fin"], [751, -114, 38, 43, 36, -0.32, "stack"],
        [942, -27, 19.1, 7.1, 23.0, 0.42], [1_006, 36, 21.4, 12.8, 31.5, -0.41],
        [1_097, -26, 18.8, 6.3, 26.3, 0.77], [1_315, 28, 18.2, 12.9, 25.5, -0.32],
    ] as const;
    return sites.map(([distance, offset, sx, sy, sz, twist, profile], i) => {
        const row = course.at(distance);
        const at = pointOnRoute(row, offset);
        const ground = course.ground.at(at.x, at.z) ?? at.y;
        const yaw = Math.atan2(row.dx, row.dz) + twist;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        const bed = Math.min(ground, ...[-1, 1].flatMap(across => [-1, 1].map(along => {
            const x = across * sx * 0.46;
            const z = along * sz * 0.46;
            return course.ground.at(at.x + x * cos + z * sin, at.z - x * sin + z * cos) ?? ground;
        })));
        const y = bed - 0.9;
        return { ...at, y, sx, sy: ground + sy - y, sz, yaw, profile: profile ?? (i % 3 === 0 ? "fin" : "mesa") };
    });
}

function copperBluffs(course: Course): RockFormation[] {
    const sites = [
        [40, 171, 38, 40, 38, 0.80, "mesa"], [171, 165, 47, 32, 34, -0.33, "mesa"],
        [306, 181, 36, 45, 38, 1.03, "fin"], [432, 294, 65, 57, 47, 0.54, "mesa"],
        [482, 277, 53, 41, 36, -0.24, "fin"], [500, 172, 40, 26, 21, 0.23, "mesa"],
        [578, 345, 75, 59, 56, 0.89, "mesa"], [609, 303, 49, 54, 47, -0.73, "fin"],
        [741, 169, 44, 49, 36, 0.07, "mesa"], [905, 167, 54, 38, 41, 0.32, "mesa"],
        [1_029, 164, 35, 60, 34, 0.58, "fin"], [1_178, 181, 47, 50, 36, 1.11, "mesa"],
        [1_333, 158, 55, 29, 38, 0.47, "mesa"], [1_494, 171, 47, 37, 42, 1.33, "fin"],
        [1_669, 164, 53, 46, 40, 0.72, "mesa"],
    ] as const;
    return sites.map(([distance, reach, sx, sy, sz, yaw, profile]) => {
        const at = outsidePoint(course.track, course.center, course.at(distance), reach);
        const ground = course.ground.at(at.x, at.z) ?? at.y;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        // Sink the downhill rim under the bank and keep the authored crown elevation.
        const bed = Math.min(...Array.from({ length: 12 }, (_, i) => {
            const angle = i * Math.PI / 6;
            const x = Math.cos(angle) * sx * 0.62;
            const z = Math.sin(angle) * sz * 0.62;
            return course.ground.at(at.x + x * cos + z * sin, at.z - x * sin + z * cos) ?? ground;
        }));
        const y = Math.min(ground - sy * 0.35, bed - 2.8);
        return { ...at, y, sx, sy: ground + sy * 0.65 - y, sz, yaw, profile };
    });
}

function seaStacks(course: Course): RockFormation[] {
    const headlands = [[162, -90, 27, 10, 16], [213, -102, 34, 13, 22], [272, -91, 23, 9, 13],
        [493, -105, 37, 17, 24], [537, -109, 25, 12, 16], [711, -97, 34, 18, 28], [747, -107, 20, 11, 17],
        [844, -90, 29, 16, 23], [874, -110, 35, 21, 30], [1_105, -99, 29, 15, 18], [1_141, -108, 21, 11, 11]] as const;
    return headlands.map(([distance, lateral, sx, sz, crown]) => {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const ground = course.ground.at(at.x, at.z) ?? -29;
        const y = Math.min(-6, ground) - 2.5;
        return {
            ...at, profile: "stack", y, sx, sy: crown - y, sz, yaw: Math.atan2(row.dx, row.dz) + distance * 0.014,
        };
    });
}

function pacificCliffs(course: Course): RockFormation[] {
    const headlands = [
        [238, 28, 20, 8.1, 17, 0.22], [260, 31, 24, 12.4, 19, 0.38], [291, 39, 30, 11, 24, 0.8],
        [354, 35, 24, 8.9, 27, 1.18], [390, 42, 26, 10.4, 22, 0.65],
        [562, -34, 26, 10.6, 31, 0.88], [585, -26, 21, 9.3, 16, 1.3],
        [633, -41, 29, 10.3, 27, -0.71], [688, -44, 30, 10.8, 24, 0.44],
        [761, -42, 27, 7.8, 19, 1.9], [815, 32, 19, 7.7, 25, 1.2],
        [1_007, 30, 25, 6.3, 21, 0.38], [1_084, 35, 23, 7.8, 21, 0.47],
    ] as const;
    return headlands.flatMap(([distance, lateral, sx, sy, sz, twist], index): RockFormation[] => {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const ground = course.ground.at(at.x, at.z);
        if (ground === undefined || ground < 1) return [];
        if (course.outposts.some(site => Math.hypot(at.x - site.position.x, at.z - site.position.z)
            < site.radius + Math.max(sx, sz) * 0.45)) return [];
        return [{ ...at, profile: index % 3 === 1 ? "mesa" : "fin", y: ground - sy * 0.43,
            sx, sy, sz, yaw: Math.atan2(row.dx, row.dz) + twist }];
    });
}

function aegeanOutcrops(course: Course): RockFormation[] {
    const cliffs = [
        [184, -19, 12, 4.1, 9], [268, -30, 22, 6.4, 17], [298, -38, 24, 8.3, 18],
        [383, 31, 19, 5.5, 27], [464, -33, 33, 7.6, 19], [546, 30, 23, 7.2, 29],
        [605, -38, 24, 6.5, 21], [685, -32, 16, 4.4, 15], [923, 28, 21, 6.9, 17], [1_224, 29, 17, 5.1, 16],
    ] as const;
    const islets = [[211, -132, 31, 7.8, 20], [293, -119, 19, 5.2, 13], [328, -158, 28, 8.3, 15],
        [411, -170, 45, 13.2, 33], [458, -151, 26, 6.7, 18], [637, -116, 36, 11.3, 17]] as const;
    return [...cliffs, ...islets].map(([distance, lateral, sx, crown, sz]) => {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const ground = course.ground.at(at.x, at.z) ?? -12;
        const island = lateral < -100;
        const y = island ? Math.min(-2.8, ground) : ground - 1.2;
        return { ...at, profile: island ? "stack" : "fin", y, sx, sz, sy: island ? crown - y : crown + 1.2,
            yaw: Math.atan2(row.dx, row.dz) + Math.sin(distance * 0.09) * 0.54 };
    });
}

function alpineScree(course: Course): RockFormation[] {
    const slides = [[247, -33, 16], [330, -29, 18], [379, -35, 21], [521, -37, 23],
        [733, -30, 20], [849, -34, 26], [1_030, 31, 19], [1_213, -33, 22]] as const;
    const pieces = [[0, 0, 1], [-10.1, 5.1, 0.46], [7.6, -4.7, 0.38], [16.2, 4.8, 0.62]] as const;
    return slides.flatMap(([distance, lateral, size]) => {
        return pieces.map(([along, across, scale], index) => {
            const row = course.at(distance + along);
            const at = pointOnRoute(row, lateral + across * Math.sign(lateral));
            const ground = course.ground.at(at.x, at.z) ?? at.y;
            const width = size * scale;
            return { ...at, profile: index < 2 ? "fin" : "mesa", y: ground - width * 0.2,
                sx: width, sy: width * 0.91, sz: width * 0.62, yaw: Math.atan2(row.dx, row.dz) + index * 0.53 + 0.68 };
        });
    });
}


function woodlandCuts(course: Course): RockFormation[] {
    const sites = [
        [290, -25, 20, 13, 20, 0.20], [293, 25, 20, 11, 21, 1.95],
        [360, -26, 22, 14, 22, 1.54], [362, 28, 19, 11, 23, 0.48],
        [425, -27, 23, 13, 24, 0.70], [475, -27, 25, 14, 28, 1.54],
        [531, -30, 27, 16, 34, 0.12], [580, -30, 29, 13, 32, 2.06],
        [682, -27, 24, 13, 24, 0.32], [713, -27, 24, 11, 28, 1.70],
        [978, 30, 21, 9.8, 29, 1.13], [1109, 31, 21, 15, 26, 0.26],
    ] as const;
    return sites.map(([distance, lateral, sx, sy, sz, twist]) => {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const y = course.ground.at(at.x, at.z) ?? row.y;
        return { ...at, profile: "fin", y: y - 1.7, sx, sy, sz,
            yaw: Math.atan2(row.dx, row.dz) + twist };
    });
}
