import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { pointOnRoute, ROAD_HALF } from "./route.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";

interface BridgeSupport extends Point {
    readonly yaw: number;
    readonly base: number;
    readonly cap: number;
}

export interface ForestBridge {
    readonly distance: number;
    readonly frames: readonly number[];
    readonly supports: readonly BridgeSupport[];
    readonly roof: Surface;
}

export const forestBridgeSize = {
    posts: ROAD_HALF + 1.65, roofEdge: ROAD_HALF + 2.85, clearance: 5.5, ridge: 8.2, plinthWidth: 2.1,
};

export function forestBridge(course: Course, distance: number): ForestBridge {
    const frames = [-24, -16, -8, 0, 8, 16, 24].map(offset => distance + offset);
    const offsets = [-forestBridgeSize.roofEdge, 0, forestBridgeSize.roofEdge];
    const rows = [course.at(distance - 27), ...frames.map(at => course.at(at)), course.at(distance + 27)];
    const roof = strip(rows, offsets, (_row, offset) =>
        offset === 0 ? forestBridgeSize.ridge : forestBridgeSize.clearance + 0.4);
    const supports: BridgeSupport[] = [];
    for (const at of frames) {
        const row = course.at(at);
        const yaw = Math.atan2(row.dx, row.dz);
        for (const side of [-1, 1]) {
            const post = pointOnRoute(row, side * forestBridgeSize.posts);
            const base = course.ground.at(post.x, post.z, row.y - 1) ?? row.y - 5;
            supports.push({ ...post, yaw, base: base - 0.48, cap: row.y + 0.4 });
        }
    }
    return { distance, frames, supports, roof };
}

export function inForestBridge(bridge: ForestBridge, distance: number, lateral: number): boolean {
    return Math.abs(distance - bridge.distance) < 34 && Math.abs(lateral) < forestBridgeSize.roofEdge + 2;
}
