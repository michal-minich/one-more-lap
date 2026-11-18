import type { Course } from "./course.ts";
import { pointOnRoute, sampleAt } from "./route.ts";
import { SKY_BRANCH_HALF } from "./sky-branch.ts";
import type { SkyBranch } from "./sky-branch.ts";
import { SKY_EDGE } from "./sky-ribbon.ts";
import { strip } from "./surface.ts";
import type { Surface } from "./surface.ts";

export const cloudfoldPortalStation = 1_250;

export interface CloudfoldScenery {
    readonly portal: Surface;
    readonly viaduct: Surface;
    readonly ledges: readonly CloudfoldLedge[];
}

interface CloudfoldLedge extends Surface {
    readonly meadow: Float32Array;
}

export function cloudfoldScenery(course: Course, branch: SkyBranch): CloudfoldScenery {
    return {
        portal: porcelainPortal(course),
        viaduct: gardenViaduct(branch),
        ledges: hangingLedges(course),
    };
}

function gardenViaduct(branch: SkyBranch): Surface {
    const spans = [253, 271, 291, 311, 327];
    const first = spans[0]!;
    const last = spans.at(-1)!;
    const rows = Array.from({ length: Math.round((last - first) * 2) + 1 },
        (_, index) => sampleAt(branch.route, first + index * 0.5));
    return strip(rows, [-SKY_BRANCH_HALF, -SKY_BRANCH_HALF + 0.18, SKY_BRANCH_HALF - 0.18, SKY_BRANCH_HALF],
        (row, offset) => {
            if (Math.abs(offset) === SKY_BRANCH_HALF) return -0.78;
            const span = spans.findIndex(edge => edge > row.distance);
            const begin = spans[span === -1 ? spans.length - 2 : span - 1]!;
            const end = spans[span === -1 ? spans.length - 1 : span]!;
            const fraction = Math.max(0, Math.min(1, (row.distance - begin - 0.84) / (end - begin - 1.68)));
            return -14 + 11.6 * Math.sin(Math.PI * fraction) ** 0.72;
        });
}

function porcelainPortal(course: Course): Surface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const segments = 26;
    const faces = [[cloudfoldPortalStation - 1.4, 0], [cloudfoldPortalStation + 1.4, 0.28]] as const;
    for (let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const spring = i === 0 || i === segments ? -3.15 : -0.18;
        const ring = [[8.2 * cos, spring + 9.35 * sin], [10.85 * cos, spring + 11.9 * sin]] as const;
        for (const [station, inset] of faces) {
            for (const [x, height] of ring) {
                const at = pointOnRoute(course.at(station), x, height - inset);
                positions.push(at.x, at.y, at.z);
                uv.push((i * 1.4 + inset * 4) / 7, height / 3.6);
            }
        }
        if (i === 0) continue;
        const base = i * 4;
        for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0]] as const) {
            indices.push(base - 4 + a, base - 4 + b, base + a, base + a, base - 4 + b, base + b);
        }
    }
    indices.push(0, 2, 1, 1, 2, 3);
    const end = segments * 4;
    indices.push(end, end + 1, end + 2, end + 1, end + 3, end + 2);
    for (const side of [-1, 1]) {
        const base = positions.length / 3;
        const tiers = [[7.05, 11.35, -8.9, 1.72], [7.28, 12, -2.78, 2.08], [8.03, 11.74, -0.25, 1.82]] as const;
        for (const [inner, outer, height, length] of tiers) {
            for (const [x, sign] of [[inner, -1], [outer, -1], [outer, 1], [inner, 1]] as const) {
                const row = course.at(cloudfoldPortalStation + sign * length);
                const at = pointOnRoute(row, x * side, height);
                positions.push(at.x, at.y, at.z);
                uv.push((x + sign * length) / 5, height / 3.6);
            }
        }
        for (let tier = 0; tier < 2; tier++) {
            for (let corner = 0; corner < 4; corner++) {
                const a = base + tier * 4 + corner;
                const b = base + tier * 4 + (corner + 1) % 4;
                indices.push(a, b, a + 4, a + 4, b, b + 4);
            }
        }
        indices.push(base + 8, base + 9, base + 10, base + 8, base + 10, base + 11);
    }
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) };
}

function hangingLedges(course: Course): CloudfoldLedge[] {
    const sites = [
        [77, 153, -1, 24, 5.4], [172, 237, -1, 30, 9.8], [296, 362, -1, 26, 6.7],
        [462, 573, 1, 29, 10], [1_178, 1_307, -1, 28, 10.6],
        [1_201, 1_291, 1, 17, 3.8], [1_312, 1_384, 1, 21, 5.2],
    ] as const;
    const across = [0, 0.17, 0.33, 0.53, 0.74, 0.91, 1, 0.963, 0.692, 0.086];
    const profile = [-1.2, -0.61, 0.09, 0.51, 0.18, -0.74, -2.35, -3.19, -3.86, -2.8];
    return sites.map(([from, to, side, width, rise]) => {
        const rows = course.route.filter(row => row.distance >= from && row.distance <= to);
        const position = (distance: number, u: number): number => {
            const edge = Math.sin(Math.PI * (distance - from) / (to - from)) ** 0.65;
            const variation = 1 + 0.18 * Math.sin(distance * 0.17) + 0.09 * Math.sin(distance * 0.43 + u * 2);
            return SKY_EDGE + 0.28 + (0.55 + edge * width) * u * variation;
        };
        const mesh = strip(rows, row => across.map(u => side * position(row.distance, u)), (row, offset) => {
            const index = across.findIndex(u => Math.abs(position(row.distance, u) - Math.abs(offset)) < 0.001);
            const wave = Math.sin(Math.PI * (row.distance - from) / (to - from));
            const peak = rise * wave * (0.69 + 0.3 * Math.cos(row.distance * 0.26 + index * 0.86));
            if (index === 0) return -0.86;
            return profile[index]! * peak - 0.63 - (index >= 6 ? (index === 8 ? 26 : 13) * wave : 0);
        });
        const uv = new Float32Array(mesh.uv);
        for (let i = 0, j = 0; i < mesh.positions.length; i += 3, j += 2) {
            uv[j] = (mesh.positions[i]! * 0.36 + mesh.positions[i + 2]! * 0.62) / 6;
            uv[j + 1] = (mesh.positions[i + 1]! + mesh.positions[i + 2]! * 0.19) / 6;
        }
        const meadow = Float32Array.from({ length: mesh.positions.length / 3 }, (_, vertex) => {
            const column = vertex % across.length;
            return column > 0 && column < 5 ? 0.7 : 0;
        });
        return { ...mesh, uv, meadow };
    });
}
