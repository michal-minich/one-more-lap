import type { Point } from "../point.ts";
import type { TrackSpec } from "./tracks.ts";
import type { RouteSample } from "./route.ts";
import type { Surface } from "./surface.ts";
import { insidePoint, outsidePoint } from "./terrain-profile.ts";
import { bankElevation } from "./water-banks.ts";
import type { WaterBody } from "./water.ts";

const outerRings = [720, 550, 425, 330, 252, 191, 146, 115, 92, 72, 55, 40, 27, 18, 11, 5, 0] as const;
const alpineRings = [720, 605, 510, 440, 380, 330, 290, 250, 214, 183, 153, 126, 104, 85, 68, 54, 41, 29, 18, 10, 5, 0] as const;
const coastalRings = [720, 550, 425, 330, 252, 191, 146, 115, 92, 72, 60, 50, 42, 35, 29, 24, 19, 14, 10, 6, 3, 0] as const;
const fjordRings = [...new Set([...coastalRings, ...Array.from({ length: 25 }, (_, i) => 112 + i * 13)])]
    .toSorted((a, b) => b - a);
const cinderRings = [...coastalRings, ...Array.from({ length: 55 }, (_, i) => (i + 1) * 1.55)]
    .toSorted((a, b) => b - a);
const copperRings = [...outerRings, ...[8, 15, 23, 32, 46, 63, 81, 100, 126, 153, 161, 172, 180, 203, 218, 233, 244, 264, 275, 285, 309]]
    .toSorted((a, b) => b - a);
const juniperRings = [...outerRings, ...[8, 14, 23, 32, 46, 63, 83, 103, 125, 133, 153, 163, 178, 206, 223, 237, 266, 282, 310]]
    .toSorted((a, b) => b - a);
const innerRings = [0, 0.032, 0.067, 0.11, 0.16, 0.22, 0.29, 0.38, 0.48, 0.59, 0.70, 0.82, 0.92] as const;

const lavaOuterRings = [...outerRings, ...Array.from({ length: 68 }, (_, i) => (i + 1) * 1.5)]
    .toSorted((a, b) => b - a).filter((value, index, values) => value !== values[index - 1]);
const lavaInnerRings = Array.from({ length: 71 }, (_, i) => i / 71);

export function landscape(
    track: TrackSpec, center: Point, route: readonly RouteSample[], inside: boolean, water: readonly WaterBody[],
): Surface {
    // Keep the hub inside the sightlines of both verges where Juniper bends back into the valley.
    const radialCenter = track.id === "rail" ? { x: 107, y: center.y, z: 330 } : center;
    const rings = track.id === "caldera"
        ? (inside ? lavaInnerRings : lavaOuterRings)
        : inside ? innerRings : track.id === "alpine" ? alpineRings : track.id === "canyon" ? cinderRings
            : track.id === "arctic" || track.id === "reef" ? fjordRings : (track.id === "coast" || track.id === "ruins") ? coastalRings
                : track.id === "gorge" ? copperRings : track.id === "rail" ? juniperRings : outerRings;
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    for (const [rowIndex, row] of route.entries()) {
        for (const [ring, reach] of rings.entries()) {
            const point = inside ? insidePoint(track, radialCenter, row, reach) : outsidePoint(track, radialCenter, row, reach);
            positions.push(point.x, bankElevation(point, water), point.z);
            uv.push(point.x / 6, point.z / 6);
            if (rowIndex > 0 && ring > 0) {
                const i = rowIndex * rings.length + ring;
                const previous = i - rings.length;
                indices.push(previous - 1, previous, i - 1, previous, i, i - 1);
            }
        }
    }
    if (inside) {
        const origin = insidePoint(track, radialCenter, route[0]!, 1);
        const hub = positions.length / 3;
        positions.push(origin.x, bankElevation(origin, water), origin.z);
        uv.push(origin.x / 6, origin.z / 6);
        for (let i = 1; i < route.length; i++) {
            const outer = i * rings.length - 1;
            indices.push(outer, hub, outer + rings.length);
        }
    }
    return {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
        seamColumns: rings.length,
    };
}
