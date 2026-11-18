import type { Course } from "./course.ts";
import { pointOnRoute, ROAD_HALF } from "./route.ts";
import type { Surface } from "./surface.ts";

const copperSpans = [-22, -10, 7, 22] as const;
const frosthavenSpans = [-26, -9, 9, 26] as const;
const outerEdge = ROAD_HALF + 0.87;

export function masonryBridge(course: Course, crossing: number): Surface {
    const frozen = course.track.id === "arctic";
    const spanEdges = frozen ? frosthavenSpans : copperSpans;
    const spring = frozen ? -8.9 : -7.6;
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const spanStarts = spanEdges.slice(0, -1);
    for (const [index, start] of spanStarts.entries()) {
        const span = spanEdges[index + 1]! - start;
        for (let section = 0; section <= 20; section++) {
            const t = section / 20;
            const inset = 0.88;
            const fraction = (1 - Math.cos(Math.PI * t)) / 2;
            const row = course.at(crossing + start + inset + (span - 2 * inset) * fraction);
            const rise = (index === 1 ? 5.5 : 4.7) + (frozen ? 1.25 : 0);
            const arch = spring + Math.sin(Math.PI * t) * rise;
            const base = positions.length / 3;
            const sectionProfile = [[-outerEdge, -0.89], [-outerEdge, arch], [outerEdge, arch], [outerEdge, -0.89]] as const;
            for (const [offset, rise] of sectionProfile) {
                const { x, y, z } = pointOnRoute(row, offset, rise);
                positions.push(x, y, z);
                uv.push((row.distance + offset * 0.8) / 5.12, y / 3.4);
            }
            if (section > 0) {
                for (let j = base; j < base + 3; j++) indices.push(j - 4, j, j - 3, j - 3, j, j + 1);
            }
        }
    }
    for (const position of spanEdges) {
        const base = positions.length / 3;
        const pierTiers = [[1.27, outerEdge + 0.18], [0.96, outerEdge], [0.9, outerEdge]] as const;
        for (const [tier, [longitudinal, width]] of pierTiers.entries()) {
            for (const [side, end] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
                const row = course.at(crossing + position + end * longitudinal);
                const { x, z } = pointOnRoute(row, side * width);
                const bed = course.ground.at(x, z, row.y - 0.12) ?? row.y - 8.5;
                const y = tier === 0 ? Math.min(bed - 0.65, row.y + spring - 1.5)
                    : row.y + (tier === 1 ? spring + 0.18 : -0.89);
                positions.push(x, y, z);
                uv.push((row.distance + side * width) / 5.12, y / 3.4);
            }
        }
        for (let tier = 0; tier < 2; tier++) {
            for (let corner = 0; corner < 4; corner++) {
                const a = base + tier * 4 + corner;
                const b = base + tier * 4 + (corner + 1) % 4;
                indices.push(a, b, a + 4, b, b + 4, a + 4);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
