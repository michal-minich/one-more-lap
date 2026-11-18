import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import { bridgeRows } from "../../game/course/passages.ts";
import { roadHalfWidth } from "../../game/course/road-width.ts";
import { pointOnRoute, ROAD_HALF } from "../../game/course/route.ts";
import { surface } from "./surface-mesh.ts";

export function drawBridgeDeck(scene: Scene, course: Course, distance: number, stone: StandardMaterial): void {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const [rowIndex, row] of bridgeRows(course.route, distance, course.track.id).entries()) {
        const edge = course.track.id === "future" ? roadHalfWidth("future", row.distance) + 1.42 : ROAD_HALF + 0.88;
        const deck = [[-edge, -0.032], [-edge, -1.06], [edge, -1.06], [edge, -0.032], [-edge, -0.032]] as const;
        const columns = deck.length;
        for (const [column, [offset, height]] of deck.entries()) {
            const point = pointOnRoute(row, offset, height);
            positions.push(point.x, point.y, point.z);
            uv.push(column * 0.67, row.distance * 0.21);
            if (rowIndex && column) {
                const i = rowIndex * columns + column;
                indices.push(i - columns - 1, i - 1, i - columns, i - columns, i - 1, i);
            }
        }
    }
    stone.backFaceCulling = false;
    surface(scene, "curved bridge fascia and deck underside", {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
    }, stone);
}
