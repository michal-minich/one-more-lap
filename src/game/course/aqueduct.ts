import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import type { Surface } from "./surface.ts";

interface AqueductColumn {
    readonly center: Point;
    readonly ground: number;
    readonly width: number;
    readonly height: number;
    readonly depth: number;
}

export interface AqueductTier {
    readonly row: RouteSample;
    readonly count: number;
    readonly span: number;
    readonly springline: number;
    readonly rise: number;
}

export interface Aqueduct extends AqueductTier {
    readonly yaw: number;
    readonly columns: readonly AqueductColumn[];
}

export function placeAqueduct(course: Course): Aqueduct | undefined {
    const passage = course.passages.find(item => item.kind === "aqueduct");
    if (!passage) return undefined;
    const row = course.at(passage.distance);
    const count = 9;
    const span = 18.1;
    const springline = row.y + 6.45;
    const columns = Array.from({ length: count + 1 }, (_, index): AqueductColumn => {
        const at = pointOnRoute(row, (index - count / 2) * span);
        const ground = course.ground.at(at.x, at.z) ?? row.y;
        const visible = Math.max(2.1, springline - ground);
        return {
            center: { ...at, y: springline - visible * 0.52 },
            ground, width: 2.27, depth: 4.4, height: visible + 0.95,
        };
    });
    return { row, yaw: Math.atan2(row.dx, row.dz), count, span, springline, rise: 7.2, columns };
}

const archBlocks = 17;

export function upperAqueduct(aqueduct: Aqueduct): AqueductTier {
    const { row, count, span, springline, rise } = aqueduct;
    return { row, count: count * 2, span: span / 2, springline: springline + rise + 3.65, rise: 2.82 };
}

export function aqueductWallSurface(tier: AqueductTier, depth = 2.12): Surface {
    const { row, count, span, springline, rise } = tier;
    const crown = springline + rise + 0.52;
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    for (const side of [-1, 1]) {
        for (let arch = 0; arch < count; arch++) {
            const center = (arch - (count - 1) / 2) * span;
            for (let station = 0; station <= archBlocks; station++) {
                const angle = Math.PI * (1 - station / archBlocks);
                const x = center + Math.cos(angle) * span / 2;
                const sill = springline + Math.sin(angle) * rise - 0.09;
                const at = pointOnRoute(row, x);
                for (const y of [sill, crown]) {
                    positions.push(at.x + row.dx * depth * side, y, at.z + row.dz * depth * side);
                    uv.push(x / 6.6, (y - springline) / 3.5);
                }
                if (station === 0) continue;
                const tip = positions.length / 3 - 1;
                if (side < 0) indices.push(tip - 3, tip - 2, tip, tip - 3, tip, tip - 1);
                else indices.push(tip - 3, tip, tip - 2, tip - 3, tip - 1, tip);
            }
        }
    }
    return { positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices) };
}

export function aqueductArchSurface(
    tier: AqueductTier, depth = 2.3, scale = 1,
): Surface & { readonly colors: Float32Array } {
    const { row, count, span, springline, rise } = tier;
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    for (let arch = 0; arch < count; arch++) {
        const center = (arch - (count - 1) / 2) * span;
        for (let block = 0; block < archBlocks; block++) {
            const base = positions.length / 3;
            for (const step of [block, block + 1]) {
                const angle = Math.PI * (1 - step / archBlocks);
                const inset = 0.72 + Math.sin(angle) * 0.19;
                for (const [radius, lift, side] of [
                    [span / 2, 0.31, -1], [span / 2 - inset * scale, -0.91, -1],
                    [span / 2 - inset * scale, -0.91, 1], [span / 2, 0.31, 1],
                ] as const) {
                    const at = pointOnRoute(row, center + Math.cos(angle) * radius);
                    const liftAt = lift * scale;
                    const y = springline + Math.sin(angle) * (rise + liftAt)
                        + Math.abs(Math.cos(angle)) * liftAt * 0.35;
                    positions.push(at.x + row.dx * depth * side, y, at.z + row.dz * depth * side);
                    uv.push(step / 3, (y - springline + depth * side * 0.24) / 4);
                    const shade = block % 4 === 0 ? 1 : 0.81 + (block % 3) * 0.043;
                    colors.push(shade, shade, shade * 0.97, 1);
                }
            }
            for (let side = 0; side < 4; side++) {
                const i = base + side;
                const next = base + (side + 1) % 4;
                indices.push(i, next, i + 4, next, next + 4, i + 4);
            }
        }
    }
    return { positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices),
        colors: new Float32Array(colors) };
}
