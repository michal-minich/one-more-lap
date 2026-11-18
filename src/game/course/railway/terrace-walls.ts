import type { Course } from "../course.ts";
import { pointOnRoute } from "../route.ts";
import type { Surface } from "../surface.ts";

const rows = [[743, 892, -25], [768, 869, -38.5], [792, 849, -51.5]] as const;
const wallProfile = [[0.45, -0.55], [0.32, 1], [-0.34, 1], [-0.48, -0.65]] as const;

export function juniperTerraceWalls(course: Course): Surface {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    for (const [start, end, offset] of rows) {
        const sections = Math.ceil((end - start) / 3.8);
        for (let i = 0; i <= sections; i++) {
            const step = i / sections;
            const distance = start + (end - start) * step;
            const row = course.at(distance);
            const lateral = offset + Math.sin(step * Math.PI) * 1.7;
            const height = 0.36 + Math.sin(step * Math.PI) * 1.5;
            const base = positions.length / 3;
            const center = pointOnRoute(row, lateral);
            const ground = course.ground.at(center.x, center.z) ?? center.y;
            for (const [side, rise] of wallProfile) {
                const point = pointOnRoute(row, lateral + side);
                positions.push(point.x, ground + rise * height, point.z);
                uv.push((distance + side) / 4.3, (ground + rise * height) / 2.8);
            }
            if (i === 0) continue;
            for (let edge = 0; edge < 3; edge++) {
                const corner = base + edge;
                indices.push(corner - 4, corner, corner - 3, corner - 3, corner, corner + 1);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
