import type { Point } from "../point.ts";
import { GroundHeight } from "./ground-height.ts";
import type { WaterBody } from "./water.ts";
import { channelPoint, reachesLava } from "./water.ts";
import type { Surface } from "./surface.ts";
import type { CalderaCrater } from "./caldera-crater.ts";

// Elevations are relative to the river below the gallery.
const upperRunoff = [
    [416, 385, 43, 7.8], [375, 404, 36, 9.6], [323, 410, 32, 9.2],
    [257, 441, 29, 9.8], [200, 428, 26, 11.6], [142, 406, 22, 10.4],
    [97, 393, 17, 9.3], [48, 387, 11.4, 8.4], [39, 370, 11, 9.1], [32, 358, 10.7, 10.2], [23, 344, 10.3, 12.5],
    [12, 328, 9.9, 11.1], [8, 321, 9.7, 9.6], [-8, 306, 9.4, 12.3], [-25, 291, 9.1, 11.5],
    [-37, 286, 8.8, 10.1], [-51, 273, 8.5, 11.6], [-56, 240, 8.1, 9.5], [-53, 214, 7.7, 7],
    [-43, 194, 10, 6.2], [-38, 177, 8, 5.3],
] as const;

interface RunoffStep extends Point {
    readonly width: number;
}

export class CalderaRunoff {
    readonly rocks: Surface;
    readonly flow: Surface;
    readonly cascade: Point;
    readonly #lava: WaterBody;
    readonly #flowHeight: GroundHeight;

    constructor(ground: GroundHeight, lava: WaterBody, crater: CalderaCrater) {
        this.#lava = lava;
        const route = runoffRoute(ground, lava, crater);
        this.cascade = route.at(-3)!;
        const { rocks, flow } = runoffSurfaces(route, ground);
        this.rocks = rocks;
        this.flow = flow;
        this.#flowHeight = new GroundHeight([flow]);
    }

    reaches(at: Point, clearance: number): boolean {
        if (reachesLava(this.#lava, at, clearance)) return true;
        const height = this.#flowHeight.at(at.x, at.z, at.y + 1.8);
        return height !== undefined && at.y - clearance <= height + 0.15;
    }
}

function runoffRoute(ground: GroundHeight, lava: WaterBody, crater: CalderaCrater): readonly RunoffStep[] {
    const route = [
        ...crater.spillway.map((point, index) => ({ ...point, width: 3.1 + index * 0.67 })),
        ...upperRunoff.map(([x, z, y, width]) => ({ x, y: lava.center.y + y, z, width })),
        { ...channelPoint(lava, -0.66, 2.4), y: lava.center.y + 5.2, width: 5.6 },
        { ...channelPoint(lava, -0.67, 1.82), y: lava.center.y + 4.8, width: 5.2 },
        { ...channelPoint(lava, -0.68, 1.28), y: lava.center.y + 0.31, width: 5.1 },
        { ...channelPoint(lava, -0.69, 0.56), y: lava.center.y + 0.05, width: 4.8 },
    ];
    // Keep the melt above the hillside, then smooth out any uphill steps.
    let nextHeight = -Infinity;
    for (let i = route.length - 1; i >= 0; i--) {
        const point = route[i]!;
        const bed = ground.at(point.x, point.z) ?? point.y;
        const y = i < crater.spillway.length ? point.y
            : Math.max(point.y, nextHeight + 0.18, i >= route.length - 2 ? point.y : bed + 0.42);
        route[i] = { ...point, y };
        nextHeight = y;
    }
    return route;
}

const banks = [-2.05, -0.72, -0.5, 0.5, 0.72, 2.05];

function runoffSurfaces(route: readonly RunoffStep[], ground: GroundHeight): { rocks: Surface; flow: Surface } {
    const positions: number[] = [];
    const uv: number[] = [];
    const rockUV: number[] = [];
    const flow: number[] = [];
    const rocks: number[] = [];
    let length = 0;
    for (const [row, point] of route.entries()) {
        const previous = route[Math.max(0, row - 1)]!;
        const next = route[Math.min(route.length - 1, row + 1)]!;
        const dx = next.x - previous.x;
        const dz = next.z - previous.z;
        const tangent = Math.hypot(dx, dz);
        length += Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z);
        for (const [column, bank] of banks.entries()) {
            const width = bank * point.width;
            const x = point.x + width * dz / tangent;
            const z = point.z - width * dx / tangent;
            const outside = Math.abs(bank) > 1;
            const bankHeight = Math.abs(bank) > 0.5 ? 0.72 + Math.sin(row * 2.14 + column) * 0.39 : 0;
            const y = outside ? (ground.at(x, z) ?? point.y) - 0.8 : point.y + bankHeight;
            positions.push(x, y, z);
            uv.push(length / 23, bank * 0.61);
            rockUV.push((x * 0.7 + z * 0.4) / 11, (y + z * 0.16) / 9);
            if (row === 0 || column === 0) continue;
            const faces = column === 3 ? flow : rocks;
            const i = row * banks.length + column;
            faces.push(i - banks.length - 1, i - 1, i - banks.length, i - banks.length, i - 1, i);
        }
    }
    const vertices = new Float32Array(positions);
    return {
        rocks: { positions: vertices, indices: new Uint32Array(rocks), uv: new Float32Array(rockUV) },
        flow: { positions: vertices, indices: new Uint32Array(flow), uv: new Float32Array(uv) },
    };
}
