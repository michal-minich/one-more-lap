import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import type { RouteSample } from "./route.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";
import { waterPoint } from "./water.ts";
import type { WaterBody } from "./water.ts";

export interface ForestSpillway {
    readonly banks: readonly Surface[];
    readonly water: Surface;
    readonly pools: readonly Point[];
}

export function forestSpillway(course: Course, lake: WaterBody): ForestSpillway {
    // Use the far shore so the sequence is visible along the lakeside road in both directions.
    const bearing = 0.98;
    // Each step is a shore radius and a height above the lake.
    const profile = [
        [2.26, 16.0], [2.05, 15.7], [1.83, 15.3], [1.69, 15.2], [1.65, 11.5],
        [1.58, 9.2], [1.45, 9], [1.33, 8.7], [1.28, 8.5], [1.23, 3.9],
        [1.11, 1.6], [0.99, 0.22], [0.83, -0.04],
    ] as const;
    const points = profile.map(([radius]) => waterPoint(lake, bearing, radius));
    let distance = 0;
    const rows: RouteSample[] = points.map((point, i) => {
        const before = points[Math.max(0, i - 1)]!;
        const after = points[Math.min(i + 1, points.length - 1)]!;
        const tangent = Math.hypot(after.x - before.x, after.z - before.z);
        const y = lake.center.y + profile[i]![1];
        const previousY = lake.center.y + profile[Math.max(0, i - 1)]![1];
        distance += Math.hypot(point.x - before.x, point.z - before.z, y - previousY);
        return { ...point, y, distance, dx: (after.x - before.x) / tangent, dz: (after.z - before.z) / tangent };
    });
    const offsets = [-22, -13, -7.5, -4.65, 4.65, 7.5, 13, 22];
    const bankHeight = (row: RouteSample, offset: number): number => {
        const across = Math.abs(offset);
        if (across < 5) return 0.24 + Math.sin(row.distance * 0.1) * 0.22;
        const x = row.x + row.dz * offset;
        const z = row.z - row.dx * offset;
        const base = (course.ground.at(x, z) ?? row.y) - row.y;
        if (across === 22) return base - 0.12;
        const edge = across < 8 ? 1.6 : 0.82;
        const shoulder = Math.max(0.09, 1 - row.distance / 65);
        return Math.max(base * (across < 8 ? 0.34 : 0.76),
            (edge + Math.sin(row.distance * 0.27 + offset) * 0.61) * shoulder);
    };
    const banks = [-1, 1].map(sign => strip(rows, offsets.filter(offset => Math.sign(offset) === sign), bankHeight));
    const water = strip(rows, [-4.65, -2.65, 0, 2.65, 4.65], (row, offset) => {
        const width = offset / 4.65;
        return (1 - width ** 2) * (0.21 + Math.sin(row.distance * 0.41 + width * 8.8) * 0.11);
    });
    return { banks, water, pools: [rows[5]!, rows[11]!] };
}
