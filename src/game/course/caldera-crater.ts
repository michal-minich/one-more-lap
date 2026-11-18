import type { Point } from "../point.ts";
import type { GroundHeight } from "./ground-height.ts";
import type { Surface } from "./surface.ts";

const center = { x: 548, z: 410 };
const slices = 36;
const breachAngle = 1.26;
const strata = [
    [125, 93, -13], [104, 76, 6], [88, 64, 18], [77, 55, 21],
    [63, 46, 34], [48, 37, 38], [37, 29, 52], [27, 22, 61],
    [17, 15, 56], [9, 9, 42], [0, 0, 39],
] as const;
const chute = [0, 4, 13, 22, 25, 28, 30, 33, 36, 40, 39] as const;

export interface CalderaCrater {
    readonly rock: Surface;
    readonly colors: Float32Array;
    readonly vent: Point;
    readonly spillway: readonly Point[];
}

export function calderaCrater(ground: GroundHeight): CalderaCrater {
    const base = (ground.at(center.x, center.z) ?? 58) + 7;
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    for (const [layer, [width, depth, rise]] of strata.entries()) {
        for (let slice = 0; slice < slices; slice++) {
            const phase = slice * Math.PI * 2 / slices;
            const angle = phase - breachAngle;
            const lateral = Math.sin(angle);
            const forward = Math.cos(angle);
            const ribs = 1 + 0.08 * Math.sin(angle * 7 + 0.7) + 0.065 * Math.cos(angle * 11);
            const x = center.x + width * lateral * ribs + forward * depth * 0.075;
            const z = center.z - depth * forward * ribs;
            const split = Math.max(0, Math.cos(phase)) ** 13;
            const peaks = Math.sin(phase) ** 2 * (18 + 31 * Math.max(0, Math.cos(phase)));
            const crest = Math.max(0, 1 - Math.abs(layer - 7) / 3.5);
            const ledge = (Math.sin(angle * 5 + layer * 0.44) * 2.8 + Math.sin(angle * 11 + layer) * 1.5)
                * Math.min(1, width / 35);
            const profile = rise * 1.17 + peaks * crest + ledge;
            const nominal = base + profile + (chute[layer]! * 1.16 - profile) * split;
            const bed = layer === 0 ? ground.at(x, z) : undefined;
            const y = bed === undefined ? nominal : bed - 4 + split * 7.2;
            positions.push(x, y, z);
            uv.push((x + z * 0.37) / 15, (y + z * 0.34) / 14);
            const mineral = 0.83 + (layer % 3) * 0.057 + Math.cos(angle * 7 + layer * 0.6) * 0.08;
            const warm = split * (0.16 + crest * 0.66);
            colors.push(mineral + warm * 0.64, mineral * 0.94 + warm * 0.10, mineral - warm * 0.33, 1);
            if (layer === 0) continue;
            const row = layer * slices;
            const next = (slice + 1) % slices;
            indices.push(row - slices + slice, row + slice, row - slices + next,
                row - slices + next, row + slice, row + next);
        }
    }
    const spillway = [8, 7, 6, 5, 4, 3, 2, 1, 0].map(layer => spillwayPoint(positions, layer));
    return {
        rock: { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) },
        colors: new Float32Array(colors), vent: spillway[0]!, spillway,
    };
}

function spillwayPoint(positions: readonly number[], layer: number): Point {
    const index = layer * slices * 3;
    return { x: positions[index]!, y: positions[index + 1]! + 0.6, z: positions[index + 2]! };
}
