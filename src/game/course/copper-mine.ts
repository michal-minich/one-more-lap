import type { Point } from "../point.ts";
import type { BiomeLandmark } from "./biome-landmarks.ts";
import { circuitLandmarkFootprints } from "./circuit-landmarks.ts";
import type { Course } from "./course.ts";
import { pointOnRoute } from "./route.ts";

type TramwayPoint = readonly [distance: number, lateral: number];

export interface Tramway {
    readonly route: readonly [from: TramwayPoint, center: TramwayPoint, to: TramwayPoint];
    readonly trolleys: readonly number[];
}

export const copperTramways: readonly Tramway[] = [
    { route: [[279, 18], [300, 20], [325, 17]], trolleys: [291, 311] },
    { route: [[744, 29], [766, 26], [794, 30]], trolleys: [757, 779] },
];

export const tramwayRailHeight = 0.23;
export const tramwayHalfGauge = 0.49;
export const tramwayRailDepth = 0.13;
export const tramwayTieSpacing = 1.5;

type TramwayGround = Pick<Course, "at" | "ground">;

export function tramwayPoint(course: TramwayGround, tramway: Tramway, distance: number, side = 0, rise = 0): Point {
    const [from, center, to] = tramway.route;
    const t = (distance - from[0]) / (to[0] - from[0]);
    const row = course.at(distance);
    const offset = from[1] * (1 - t) ** 2 + 2 * center[1] * t * (1 - t) + to[1] * t ** 2;
    // Keep both rails level across the ties on sloped ground.
    const point = pointOnRoute(row, offset);
    return { ...pointOnRoute(row, offset + side), y: (course.ground.at(point.x, point.z) ?? point.y) + rise };
}

export function tramwayClearing(course: TramwayGround): Point[] {
    return copperTramways.flatMap(tramway => {
        const [from, , to] = tramway.route;
        const samples = [tramwayPoint(course, tramway, to[0])];
        for (let distance = from[0]; distance < to[0]; distance += tramwayTieSpacing) {
            samples.push(tramwayPoint(course, tramway, distance));
        }
        return samples;
    });
}

export function placeCopperTrolleys(course: TramwayGround): BiomeLandmark[] {
    const kind = "copper-ore-trolley";
    // The measured tread centers are 0.58 model heights apart in both axes.
    const height = 2 * tramwayHalfGauge / 0.58;
    const radius = height * circuitLandmarkFootprints[kind];
    const railTop = tramwayRailHeight + tramwayRailDepth / 2 - 0.01;
    return copperTramways.flatMap(tramway => tramway.trolleys.map(distance => {
        const at = tramwayPoint(course, tramway, distance, 0, railTop);
        const before = tramwayPoint(course, tramway, distance - 0.7, 0, railTop);
        const after = tramwayPoint(course, tramway, distance + 0.7, 0, railTop);
        const dx = after.x - before.x;
        const dz = after.z - before.z;
        const yaw = Math.atan2(dx, dz);
        const pitch = -Math.atan2(after.y - before.y, Math.hypot(dx, dz));
        // Center the wheel footprint under the bounding-box origin of the packed mesh.
        const across = 0.033 * height;
        const behind = 0.062 * height;
        return { kind, height, radius, yaw, pitch,
            x: at.x + across * Math.cos(yaw) - behind * Math.sin(yaw),
            y: at.y + behind * Math.sin(pitch),
            z: at.z - across * Math.sin(yaw) - behind * Math.cos(yaw) };
    }));
}
