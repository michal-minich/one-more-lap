import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import { calderaVaultRise, GALLERY_EAVE, rockShelterSurfaces, WALL_EDGE } from "./rock-shelter-surfaces.ts";
import type { RockShape, RockShelterSurfaces } from "./rock-shelter-surfaces.ts";
import type { Biome } from "./tracks.ts";

type ShelterKind = "tunnel" | "gallery";
type Plan = readonly [kind: ShelterKind, distance: number, length: number];

const shelters: Partial<Record<Biome, Plan>> = {
    canyon: ["tunnel", 615, 92],
    gorge: ["gallery", 468, 108],
    alpine: ["gallery", 782, 68],
    caldera: ["gallery", 153, 108],
};

export interface RockColumn extends Point {
    readonly height: number;
    readonly radius: number;
}

export interface RockShelter {
    readonly kind: ShelterKind;
    readonly rows: readonly RouteSample[];
    readonly surfaces: RockShelterSurfaces;
    readonly columns: readonly RockColumn[];
}

export function underShelter(biome: Biome, distance: number): boolean {
    const plan = shelters[biome];
    return plan !== undefined && Math.abs(distance - plan[1]) <= plan[2] * 0.5 + 7;
}

export function placeRockShelter(course: Course): RockShelter | undefined {
    const plan = shelters[course.track.id];
    if (!plan) return undefined;
    const [kind, center, length] = plan;
    const intervals = Math.ceil(length / 4.4);
    const rows = Array.from({ length: intervals + 1 }, (_, index) => course.at(center + (index / intervals - 0.5) * length));
    const columns: RockColumn[] = [];
    const basalt = course.track.id === "caldera";
    const copper = course.track.id === "gorge";
    for (const [index, row] of rows.entries()) {
        if (kind === "gallery" && (index % (basalt ? 4 : copper ? 3 : 2) === 0 || index === intervals)) {
            const foot = rockFoot(course, row, -1);
            const lift = basalt ? calderaVaultRise(row.distance) : 0;
            columns.push({ ...foot, height: row.y + GALLERY_EAVE + lift - foot.y,
                radius: basalt ? 1.42 + (index % 3) * 0.21
                    : copper ? 1.10 + (index % 4) * 0.115 : 0.86 + (index % 3) * 0.11 });
        }
    }
    const shape: RockShape = basalt ? "basalt" : copper ? "copper" : kind === "tunnel" ? "sandstone" : "standard";
    return { kind, rows, surfaces: rockShelterSurfaces(course.ground, rows, shape), columns };
}

function rockFoot(course: Course, row: RouteSample, side: number): Point {
    const at = pointOnRoute(row, side * WALL_EDGE);
    return { ...at, y: (course.ground.at(at.x, at.z) ?? at.y) - 0.32 };
}
