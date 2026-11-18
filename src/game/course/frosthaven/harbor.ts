import type { Point } from "../../point.ts";
import type { BiomeLandmark } from "../biome-landmarks.ts";
import { circuitLandmarkFootprints } from "../circuit-landmarks.ts";
import type { Course } from "../course.ts";
import { pointOnRoute } from "../route.ts";
import type { RouteSample } from "../route.ts";

export interface HarborBuilding extends Point {
    readonly bottom: number;
    readonly yaw: number;
    readonly width: number;
    readonly depth: number;
    readonly height: number;
}

export interface FrosthavenHarbor {
    readonly beacon: HarborBuilding;
    readonly houses: readonly HarborBuilding[];
    readonly quay: HarborBuilding;
    readonly pier: { readonly from: Point; readonly to: Point };
    readonly icebreaker: Point & { readonly yaw: number; readonly scale: number };
    readonly lookout: HarborLookout;
}

export const harborPierSize = { width: 3.95, depth: 0.27, overlap: 0.15 } as const;
export const icebreakerHull = { width: 12.9, height: 6.2, length: 41.5, lift: 1.82 } as const;

export interface HarborLookout {
    readonly deck: Point;
    readonly yaw: number;
    readonly width: number;
    readonly depth: number;
    readonly row: RouteSample;
    readonly columns: readonly { readonly x: number; readonly z: number; readonly top: number; readonly bottom: number }[];
}

const boathouses = [
    [170, -24, 7.8, 0.92],
    [186, -36, 7.2, -1.70],
    [205, -24, 7.0, 1.10],
    [226, -30, 6.4, 1.32],
] as const;

export function frosthavenHarbor(course: Course): FrosthavenHarbor | undefined {
    if (course.track.id !== "arctic") return undefined;
    const place = (distance: number, lateral: number, width: number, depth: number, height: number,
        twist = 0): HarborBuilding => {
        const row = course.at(distance);
        const at = pointOnRoute(row, lateral);
        const yaw = Math.atan2(row.dx, row.dz) + twist;
        const heights = [-1, 1].flatMap(side => [-1, 1].map(end => {
            const x = side * width / 2;
            const z = end * depth / 2;
            return course.ground.at(at.x + x * Math.cos(yaw) + z * Math.sin(yaw),
                at.z - x * Math.sin(yaw) + z * Math.cos(yaw)) ?? row.y;
        }));
        return { ...at, yaw, y: Math.max(...heights) + 0.08, bottom: Math.min(...heights) - 0.42, width, depth, height };
    };
    const beacon = place(267, -21.5, 8.15, 8.05, 12.6, -0.34);
    const houses = boathouses.map(([distance, lateral, height, yaw]) =>
        place(distance, lateral, height * 1.08, height * 1.02, height, yaw));
    const quay = { x: -38.8, y: 6.25, z: 193.0, bottom: 1.2, height: 0.19, width: 9.2, depth: 16.6, yaw: 0 };
    const from = { x: quay.x - quay.width / 2 + 0.12, y: quay.y + 0.03, z: quay.z };
    const to = { x: -75.7, y: -0.35, z: 193.5 };
    const berth = course.at(248);
    const icebreaker = { ...pointOnRoute(berth, -94), y: course.water[0]!.center.y,
        yaw: Math.atan2(berth.dx, berth.dz) - 0.70, scale: 1.17 };
    const row = course.at(241);
    const columns = [-4.9, 4.9].flatMap(along => [-16.3, -10.3].map(across => {
        const at = pointOnRoute(row, across);
        const x = at.x + row.dx * along;
        const z = at.z + row.dz * along;
        return { x, z, top: row.y + 0.4, bottom: (course.ground.at(x, z) ?? row.y) - 0.45 };
    }));
    const lookout = { row, deck: pointOnRoute(row, -13.28, 0.46), yaw: Math.atan2(row.dx, row.dz),
        width: 8.35, depth: 11.65, columns };
    return { beacon, houses, quay, pier: { from, to }, icebreaker, lookout };
}

export function inHarborClearing(harbor: FrosthavenHarbor, point: Point): boolean {
    const { beacon, houses, quay, lookout } = harbor;
    const { deck } = lookout;
    return Math.hypot(point.x - quay.x, point.z - quay.z) < 22 ||
        Math.hypot(point.x - deck.x, point.z - deck.z) < 8.3 ||
        Math.hypot(point.x - beacon.x, point.z - beacon.z) < 10 ||
        houses.some(house => Math.hypot(point.x - house.x, point.z - house.z) < 9);
}

export function placeHarborModels(harbor: FrosthavenHarbor, course: Course): BiomeLandmark[] {
    const building = (site: HarborBuilding, kind: "frosthaven-boathouse" | "frosthaven-beacon"): BiomeLandmark =>
        ({ ...site, kind, radius: site.height * circuitLandmarkFootprints[kind] });
    const { quay } = harbor;
    const height = 6.25;
    const derrick = { kind: "frosthaven-derrick" as const, x: quay.x - 1.65, y: quay.y + 0.24, z: quay.z + 4.18,
        yaw: 0.81, height, radius: height * circuitLandmarkFootprints["frosthaven-derrick"] };
    const crates = (point: Point, height: number, yaw: number): BiomeLandmark => ({
        ...point, kind: "frosthaven-crates", height, yaw, radius: height * circuitLandmarkFootprints["frosthaven-crates"],
    });
    const quayCreels = [[-2.52, -5.30, 1.31, 0.54], [0.48, -4.22, 1.15, 1.42],
        [2.62, -0.90, 1.10, -0.34], [1.96, 5.8, 1.28, 1.45]] as const;
    const shoreCreels = [[175, -18, 1.26, -0.11], [199, -18, 1.31, 0.75], [219, -21, 1.45, 1.14],
        [231, -22, 1.08, -0.28]] as const;
    return [
        building(harbor.beacon, "frosthaven-beacon"),
        ...harbor.houses.map(house => building(house, "frosthaven-boathouse")),
        derrick,
        ...quayCreels.map(([x, z, height, yaw]) => crates({ x: quay.x + x, y: quay.y + 0.229, z: quay.z + z }, height, yaw)),
        ...shoreCreels.map(([distance, lateral, height, twist]) => {
            const row = course.at(distance);
            const at = pointOnRoute(row, lateral);
            const y = course.ground.at(at.x, at.z) ?? row.y;
            return crates({ ...at, y: y - 0.08 }, height, Math.atan2(row.dx, row.dz) + twist);
        }),
    ];
}
