import type { Course } from "../../../game/course/course.ts";
import { railwayOffset, railwayStation } from "../../../game/course/railway/line.ts";
import { juniperSignalBase } from "../../../game/course/railway/signals.ts";
import { juniperStationPlatform, juniperStationPlinth } from "../../../game/course/railway/station.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawStation(build: BuildPart, course: Course): void {
    mainStation(build, course);
    signalCabin(build, course);
    for (const landmark of course.biomeLandmarks) {
        if (landmark.kind !== "juniper-semaphore") continue;
        const { x, y, z, height, width, yaw } = juniperSignalBase(landmark);
        build("Juniper signal footing", { x, y, z, yaw, sx: width, sy: height, sz: width }, "#8d8578");
    }
}

function mainStation(build: BuildPart, course: Course): void {
    const landmark = course.biomeLandmarks.find(site => site.kind === "juniper-station");
    if (!landmark) return;
    const plinth = juniperStationPlinth(landmark);
    for (const { x, y, z, yaw, width, height, depth } of plinth) {
        build("Juniper station plinth", { x, y, z, yaw, sx: width, sy: height, sz: depth }, "#a79a81");
    }
    const { yaw } = plinth[0]!;
    const { x, y, z, width, height, depth } = juniperStationPlatform(landmark);
    build("Juniper station plinth", { x, y, z, yaw, sx: width, sy: height, sz: depth }, "#988a75");
    build("station paving", { x, y: y + height / 2 + 0.024, z, sx: width, sy: 0.06, sz: depth, yaw }, "#c5ac8f");
    const shelter = railwayOffset(railwayStation - 12, -5.74);
    build("Juniper platform canopy", { ...shelter, y: shelter.y + 2.41, sx: 2.6, sy: 0.24, sz: 5.65, yaw }, "#c29385");
    for (const distance of [-14.1, -9.9]) {
        const pillar = railwayOffset(railwayStation + distance, -6.63);
        build("station canopy post", { ...pillar, y: pillar.y + 1.19, sx: 0.19, sy: 2.43, sz: 0.19, yaw }, "#87654b");
    }
}

function signalCabin(build: BuildPart, course: Course): void {
    const site = railwayOffset(-38, -13.5);
    const ground = course.ground.at(site.x, site.z) ?? 9;
    const base = ground + 0.3;
    const yaw = 0.23;
    build("railway embankment wall", { ...site, y: base - 0.14, sx: 7.8, sy: 1.44, sz: 6.85, yaw }, "#a99780");
    build("station brickwork", { ...site, y: base + 1.82, sx: 6.1, sy: 3.75, sz: 5.8, yaw }, "#97735a");
    build("weathered timber", { ...site, y: base + 4.05, sx: 6.6, sy: 1.57, sz: 6.25, yaw }, "#5e6e62");
    build("gable roof", { ...site, y: base + 4.84, sx: 7.4, sy: 1.8, sz: 7.13, yaw }, "#454c4d");
    for (const side of [-1, 1]) {
        const x = site.x + side * 1.7;
        for (const end of [-1, 1]) {
            build("window frame", { ...site, x, z: site.z + end * 3.16, y: base + 4.13,
                sx: 1.55, sy: 1.01, sz: 0.12, yaw: 0 }, "#e9cc9c");
            build("lit windows", { ...site, x, z: site.z + end * 3.25, y: base + 4.13,
                sx: 1.29, sy: 0.78, sz: 0.10, yaw: 0 }, "#efd093");
        }
    }
}
