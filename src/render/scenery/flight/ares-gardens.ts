import type { Course } from "../../../game/course/course.ts";
import { aresCanopySize, aresHabitatSize } from "../../../game/course/ares-gardens.ts";
import type { AresCanopy, AresHabitat } from "../../../game/course/ares-gardens.ts";
import type { Point } from "../../../game/point.ts";
import { beamBetween } from "../beam.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawAresGardens(build: BuildPart, course: Course): void {
    const plans = course.aresGardens;
    if (!plans) return;
    for (const habitat of plans.habitats) drawHabitat(build, course, habitat);
    for (const canopy of plans.canopies) drawSolarCanopy(build, canopy);
}

function drawHabitat(build: BuildPart, course: Course, habitat: AresHabitat): void {
    const { at, yaw, side, scale, bottom, base, lock, lockHeight } = habitat;
    const { foundation, dome, rise, lockWidth, lockDepth } = aresHabitatSize;
    build("Ares habitat foundation", { ...at, y: (base + bottom) / 2,
        sx: foundation * scale, sy: base - bottom, sz: foundation * scale, yaw }, "#999387", "oval");
    build("Ares habitat skirt", { ...at, y: base - 0.27, sx: 16.7 * scale, sy: 0.61, sz: 16.7 * scale, yaw },
        "#ddd2bc", "oval");
    build("Ares habitat glazing", { ...at, y: base, sx: dome * scale, sy: rise * 2 * scale, sz: dome * scale, yaw },
        "#79aebc", "dome");
    for (const across of [-4.5, 0, 4.5]) {
        const bed = offset(at, yaw, across * scale, 0.15);
        build("Ares gallery footing cap", { ...bed, y: base + 0.22, sx: 2.7 * scale, sy: 0.47, sz: 8 * scale, yaw },
            "#dbc5a2", "oval");
        for (const along of [-2.3, 0, 2.3]) {
            const plant = offset(bed, yaw, 0, along * scale);
            const height = (0.8 + 0.14 * Math.abs(along)) * scale;
            build("indoor foliage", { ...plant, y: base + 0.52 + height * 0.5, sx: 1.45 * scale,
                sy: height, sz: 1.95 * scale, yaw }, across === 0 ? "#bdac5d" : "#80a15d", "leaf");
        }
    }
    for (let rib = 0; rib < 6; rib++) {
        const bearing = rib * Math.PI / 3;
        let from = ribPoint(habitat, bearing, 0);
        for (let step = 1; step <= 6; step++) {
            const to = ribPoint(habitat, bearing, step * Math.PI / 12);
            build("habitat glazing rib", beamBetween(from, to, 0.15, 0.13, 0.075), "#acb9ac");
            from = to;
        }
    }
    build("habitat crown", { ...at, y: base + rise * scale + 0.12, sx: 1.28, sy: 0.26, sz: 1.28, yaw },
        "#ddd2bc", "oval");
    build("Ares habitat service lock", { ...lock, sx: lockWidth * scale, sy: lockHeight, sz: lockDepth * scale, yaw },
        "#bcb4a6");
    const window = offset(lock, yaw, 0, -lockDepth * scale / 2 - 0.02);
    build("lit windows", { ...window, y: lock.y + lockHeight / 2 - 0.58,
        sx: 5.55 * scale, sy: 0.43, sz: 0.08, yaw }, "#e6d69e");
    gardenBeds(build, course, offset(at, yaw, -side * 4, 11 * scale), yaw);
}

function drawSolarCanopy(build: BuildPart, { roof, yaw, feet }: AresCanopy): void {
    const { width, depth, thickness, post } = aresCanopySize;
    for (const foot of feet) {
        const height = roof.y - foot.y;
        build("solar trestle", { ...foot, y: foot.y + height / 2, sx: post, sy: height, sz: post, yaw }, "#6b6b70");
    }
    build("solar cells", { ...roof, sx: width, sy: thickness, sz: depth, yaw }, "#364c79");
    build("solar panel frame", { ...offset(roof, yaw, 0, depth / 2 + 0.02),
        sx: width, sy: thickness - 0.02, sz: 0.1, yaw }, "#a4abb1");
}

function ribPoint({ at, yaw, base, scale }: AresHabitat, bearing: number, angle: number): Point {
    const radius = Math.cos(angle) * (aresHabitatSize.dome / 2 + 0.2) * scale;
    return offset({ ...at, y: base + (aresHabitatSize.rise + 0.17) * scale * Math.sin(angle) }, yaw,
        radius * Math.cos(bearing), radius * Math.sin(bearing));
}

function gardenBeds(build: BuildPart, course: Course, at: Point, yaw: number): void {
    for (const z of [-2.7, 0, 2.7]) {
        const bed = offset(at, yaw, 0, z);
        const ground = course.ground.at(bed.x, bed.z) ?? at.y;
        build("Ares habitat foundation", { ...bed, y: ground + 0.09, sx: 6.6, sy: 0.65, sz: 1.64, yaw },
            "#9c9681", "oval");
        build("indoor garden bed", { ...bed, y: ground + 0.39, sx: 6.02, sy: 0.19, sz: 1.43, yaw }, "#6e8751", "oval");
        for (const x of [-2, -0.7, 0.7, 2]) {
            const plant = offset(bed, yaw, x, 0);
            build("indoor foliage", { ...plant, y: ground + 0.54, sx: 0.95, sy: 0.51, sz: 0.75, yaw },
                "#738f58", "leaf");
        }
    }
}
