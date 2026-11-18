import type { Point } from "../point.ts";
import type { GroundHeight } from "./ground-height.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import type { Surface } from "./surface.ts";

export interface GateTower extends Point {
    readonly base: number;
    readonly height: number;
}

export interface TownGate {
    readonly row: RouteSample;
    readonly towers: readonly GateTower[];
    readonly yaw: number;
    readonly arch: Surface;
    readonly voussoirs: Surface;
}

export const GATE_WIDTH = 4.3;
export const GATE_DEPTH = 5.4;
export const GATE_WALKWAY = 8.05;

export function placeTownGate(row: RouteSample, ground: GroundHeight): TownGate {
    const towers = [-1, 1].map(side => {
        const at = pointOnRoute(row, side * 10.1);
        const base = (ground.at(at.x, at.z) ?? row.y) - 1.15;
        return { ...at, base, height: row.y + 10.6 - base };
    });
    const arch = gateShell(row);
    return { row, yaw: Math.atan2(row.dx, row.dz), towers, ...arch };
}

type ProfilePoint = readonly [x: number, y: number];
type GatePoint = readonly [x: number, y: number, z: number];

function gateShell(row: RouteSample): Pick<TownGate, "arch" | "voussoirs"> {
    const segments = 24;
    const span = 8.03;
    const spring = 2.85;
    const rise = 3.87;
    const soffit = (angle: number): ProfilePoint => [span * Math.cos(angle), spring + rise * Math.sin(angle)];
    const bow = (angle: number): ProfilePoint =>
        [(span + 1.08) * Math.cos(angle), spring + (rise + 0.86) * Math.sin(angle)];
    const build = (trim: boolean): Surface => {
        const positions: number[] = [];
        const indices: number[] = [];
        const uv: number[] = [];
        const face = (vertices: readonly GatePoint[], soffitFace = false): void => {
            const first = positions.length / 3;
            for (const [x, y, z] of vertices) {
                positions.push(row.x + row.dz * x + row.dx * z, row.y + y, row.z - row.dx * x + row.dz * z);
                uv.push(x / 3.65, soffitFace ? z / 3.4 : y / 2.85);
            }
            indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
        };
        for (let i = 0; i < segments; i++) {
            const step = Math.PI / segments;
            const start = i * step;
            const end = start + step;
            const [a, b] = [soffit(start), soffit(end)] as const;
            if (!trim) {
                for (const depth of [-2.08, 2.08]) {
                    const panel: GatePoint[] = [
                        [...a, depth], [...b, depth], [b[0], GATE_WALKWAY, depth], [a[0], GATE_WALKWAY, depth],
                    ];
                    face(depth < 0 ? panel.toReversed() : panel);
                }
                face([[...a, -2.08], [...b, -2.08], [...b, 2.08], [...a, 2.08]], true);
                continue;
            }
            const first = start + 0.009;
            const last = end - 0.009;
            const [ia, ib, oa, ob] = [soffit(first), soffit(last), bow(first), bow(last)] as const;
            const innerA = [ia[0], ia[1] + 0.015] as const;
            const innerB = [ib[0], ib[1] + 0.015] as const;
            for (const depth of [-2.21, 2.21]) {
                const panel: GatePoint[] = [[...innerA, depth], [...innerB, depth], [...ob, depth], [...oa, depth]];
                face(depth < 0 ? panel.toReversed() : panel);
            }
        }
        return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
    };
    return { arch: build(false), voussoirs: build(true) };
}
