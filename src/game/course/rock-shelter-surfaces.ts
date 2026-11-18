import type { Point } from "../point.ts";
import type { GroundHeight } from "./ground-height.ts";
import { pointOnRoute } from "./route.ts";
import type { RouteSample } from "./route.ts";
import type { Surface } from "./surface.ts";
import { smoothBetween } from "./terrain-profile.ts";

export const WALL_EDGE = 10.5;
export const GALLERY_EAVE = 6.65;

export function calderaVaultRise(distance: number): number {
    return 8.9 * smoothBetween(160, 189, distance);
}

export interface RockShelterSurfaces {
    readonly outside: Surface;
    readonly vault: Surface;
    readonly portals: Surface;
    readonly lip?: Surface;
    readonly fixtureAnchors: readonly Point[];
}

type ProfilePoint = readonly [offset: number, height: number];
export type RockShape = "standard" | "basalt" | "sandstone" | "copper";

const inner: readonly ProfilePoint[] = [
    [-WALL_EDGE, -1.5], [-WALL_EDGE, 5.2], [-8.2, 6.7], [-5.3, 8.12], [-1.3, 8.8],
    [3.7, 8.44], [7.1, 7.17], [WALL_EDGE, 5.1], [WALL_EDGE, -1.5],
];
const fullRock: readonly ProfilePoint[] = [
    [-28.7, -1.9], [-23.6, 4.9], [-18.2, 9.4], [-12.5, 15.3], [-3.8, 20.8],
    [6.9, 20.5], [13.5, 16.7], [22.4, 9.2], [29.3, -1.7],
];
const cliffRock: readonly ProfilePoint[] = [
    [-WALL_EDGE - 0.8, GALLERY_EAVE + 0.85], [-WALL_EDGE - 1.9, 8.5], [-10, 9.7], [-6.5, 11.3], [-1.1, 13],
    [8.7, 17.6], [16.5, 20.4], [23.9, 14.0], [31.6, -1.5],
];

export function rockShelterSurfaces(
    ground: GroundHeight, rows: readonly RouteSample[], shape: RockShape,
): RockShelterSurfaces {
    const tunnel = shape === "sandstone";
    const outside = profileSurface(ground, rows, tunnel ? fullRock : cliffRock, true, shape);
    const ceiling = tunnel ? inner : [[-WALL_EDGE - 0.45, GALLERY_EAVE - 0.21],
        [-WALL_EDGE, GALLERY_EAVE - 0.27], ...inner.slice(2)] as const;
    const vault = profileSurface(ground, rows, ceiling, false, shape);
    const portals = sealPortals(outside, vault, rows.length);
    const fixtureAnchors = rows.map((row, index) => {
        if (shape !== "basalt" && shape !== "copper") return pointOnRoute(row, 5.4, 6.76);
        const i = (index * ceiling.length + 6) * 3;
        return { x: vault.positions[i]!, y: vault.positions[i + 1]! - 0.14, z: vault.positions[i + 2]! };
    });
    const surfaces = { outside, vault, portals, fixtureAnchors };
    return tunnel ? surfaces : { ...surfaces, lip: sealGalleryLip(outside, vault, rows.length) };
}

function profileSurface(
    ground: GroundHeight, rows: readonly RouteSample[], profile: readonly ProfilePoint[], exterior: boolean, shape: RockShape,
): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const columns = profile.length;
    const last = rows.at(-1)!.distance;
    const basalt = shape === "basalt";
    const sandstone = shape === "sandstone";
    const copper = shape === "copper";
    for (const [index, row] of rows.entries()) {
        const flare = basalt ? smoothBetween(last - 39, last - 11, row.distance) : 0;
        const rise = basalt ? calderaVaultRise(row.distance) : 0;
        for (const [column, [offset, height]] of profile.entries()) {
            const rough = exterior ? Math.sin(row.distance * 0.18 + column * 2.7) * 1.62
                + Math.cos(row.distance * 0.41 - column) * 0.68 : 0;
            const facet = basalt && column > 1 ? Math.sin(index * 1.77 + column * 4.29) : 0;
            const fracture = sandstone ? Math.sin(index * 2.11 + column * 5.12) : 0;
            const seam = Math.sin(index * 0.64 + column * 2.87) * 0.73 + Math.sin(index * 2.07 - column * 0.89) * 0.38;
            const crown = copper && exterior && column >= 2 && column <= 7
                ? (height - 7) * (0.27 + Math.sin(row.distance * 0.056 + column * 0.55) * 0.17) : 0;
            const facetRise = copper ? seam * (exterior ? 1.42 : column > 1 && column < 7 ? 0.5 : 0) : 0;
            const facetSide = copper && column > 1 ? seam * (exterior ? 1.9 : 0.27) : 0;
            const ridge = sandstone && exterior && height > 6
                ? (height - 6) * (0.27 + 0.18 * Math.sin(row.distance * 0.08 + column * 0.52)) : 0;
            // Open the inside of the final curve while retaining the roof over the road.
            const sweep = flare * smoothBetween(-0.5, 11, offset);
            const cut = exterior ? fracture * 1.55 : fracture * 0.22;
            const lateral = offset + facet * 0.44 + 10.4 * sweep + cut + facetSide;
            const lift = rise * smoothBetween(-0.1, 5.1, height) + ridge + crown + facetRise;
            const point = pointOnRoute(row, lateral, height + rough + facet * 0.63 + 0.9 * sweep + lift + cut * 0.55);
            const projection = exterior ? sandstone ? fracture * 1.75 : copper && column > 1 ? seam * 1.45 : 0 : 0;
            const x = point.x + row.dx * projection;
            const z = point.z + row.dz * projection;
            const y = height < 0 ? (ground.at(x, z) ?? row.y) + height : point.y;
            positions.push(x, y, z);
            uv.push(offset * 0.071 + y * 0.034, row.distance * 0.11 + y * 0.021);
            if (index === 0 || column === 0) continue;
            const i = index * columns + column;
            if ((basalt || sandstone || copper) && (index + column) % 2 === 0) {
                indices.push(i - columns - 1, i - columns, i, i - columns - 1, i, i - 1);
            } else {
                indices.push(i - columns - 1, i - columns, i - 1, i - columns, i, i - 1);
            }
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

function sealGalleryLip(outside: Surface, inside: Surface, rows: number): Surface {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    for (let row = 0; row < rows; row++) {
        const i = row * inner.length;
        for (const skin of [outside, inside]) {
            positions.push(...skin.positions.subarray(i * 3, i * 3 + 3));
            uv.push(...skin.uv.subarray(i * 2, i * 2 + 2));
        }
        const vertex = row * 2;
        if (row > 0) indices.push(vertex - 2, vertex - 1, vertex, vertex - 1, vertex + 1, vertex);
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

function sealPortals(outside: Surface, inside: Surface, rows: number): Surface {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const columns = inner.length;
    for (const end of [0, rows - 1]) {
        for (let i = 0; i < columns; i++) {
            const vertex = end * columns + i;
            const offset = positions.length / 3;
            for (const skin of [inside, outside]) {
                positions.push(...skin.positions.subarray(vertex * 3, vertex * 3 + 3));
                uv.push(...skin.uv.subarray(vertex * 2, vertex * 2 + 2));
            }
            if (i > 0) indices.push(offset - 2, offset - 1, offset, offset - 1, offset + 1, offset);
        }
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}
