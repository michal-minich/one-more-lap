import type { Point } from "../point.ts";
import type { CircuitLine } from "./circuit-line.ts";
import { bridgeHalfLength } from "./passages.ts";
import type { Passage } from "./passages.ts";
import { juniperOverlook } from "./railway/valley.ts";
import { reefDeckHalfWidth, reefTunnelEnd, reefTunnelStart } from "./reef-tunnel.ts";
import { crossesGap, pointOnRoute, ROAD_HALF } from "./route.ts";
import type { SkyBranch } from "./sky-branch.ts";
import { SKY_EDGE } from "./sky-ribbon.ts";
import { roadHalfWidth } from "./road-width.ts";
import { aresRimEnd, aresRimStart, calderaRimEnd, calderaRimStart, groundHeight } from "./terrain-profile.ts";
import type { TrackSpec } from "./tracks.ts";

export interface Barrier {
    readonly a: Point;
    readonly b: Point;
}

const protectedEdges: Partial<Record<TrackSpec["id"], readonly (readonly [number, number])[]>> = {
    coast: [[0.119, 0.273], [0.32, 0.562]],
    alpine: [[0.187, 0.257], [0.466, 0.51]],
    canyon: [[0.203, 0.320], [0.457, 0.511]],
    forest: [[0.39, 0.55]],
    ruins: [[0.122, 0.52]],
    arctic: [[0.183, 0.291], [0.319, 0.446]],
    reef: [[0.033, 0.094], [0.45, 0.615], [0.676, 0.792]],
    gorge: [[0.034, 0.10], [0.196, 0.320], [0.64, 0.72]],
    caldera: [[0.075, 0.172]],
    sky: [[0, 0.184], [0.201, 0.414], [0.43, 0.568], [0.60, 0.71], [0.78, 1]],
};

export function placeBarriers(
    track: TrackSpec, line: CircuitLine, passages: readonly Passage[], branch?: SkyBranch,
): Barrier[] {
    const { route, length, gap } = line;
    const ribbon = track.id === "sky";
    const ranges = protectedEdges[track.id];
    const bridges = passages.filter(passage => passage.kind === "bridge");
    const bridgeReach = bridgeHalfLength(track.id);
    const result: Barrier[] = [];
    for (let i = 0; i + 2 < route.length; i += 2) {
        const a = route[i]!;
        const b = route[i + 2]!;
        if (crossesGap(gap, a.distance, b.distance)) continue;
        const bridge = bridges.some(item =>
            a.distance >= item.distance - bridgeReach && b.distance <= item.distance + bridgeReach);
        const tube = track.id === "reef" && a.distance >= reefTunnelStart && b.distance <= reefTunnelEnd;
        const cliff = ranges?.some(([from, to]) => a.distance >= from * length && b.distance <= to * length);
        const shore = track.id === "forest" && a.distance >= 117 && b.distance <= 195 ||
            track.id === "alpine" && a.distance >= 460 && b.distance <= 685;
        const valley = track.id === "rail" && juniperOverlook(a.distance) && juniperOverlook(b.distance);
        const aresRim = track.id === "mars" && a.distance >= aresRimStart && b.distance <= aresRimEnd;
        const calderaRim = track.id === "caldera" && a.distance >= calderaRimStart && b.distance <= calderaRimEnd;
        if (!bridge && !cliff && !tube && !shore && !valley && !aresRim && !calderaRim) continue;
        const sides = bridge || ribbon || tube ? [-1, 1] : shore ? [1] : [-1];
        for (const side of sides) {
            if (side === 1 && branch?.interruptsRail(a.distance, b.distance)) continue;
            const halfWidth = tube ? reefDeckHalfWidth : ribbon ? SKY_EDGE - 0.21 : ROAD_HALF + (bridge ? 0.62 : 3.5);
            const verge = bridge && track.id === "metro" ? 0.78 : bridge && track.id === "future" ? 1.12
                : aresRim ? 2.26 : calderaRim ? 1.95 : valley ? 1.37 : shore ? 1.56
                : track.id === "ruins" ? 1.48 : track.id === "coast" ? 1.55
                : (track.id === "arctic" && !bridge || track.id === "reef" && !tube) ? 1.72
                : (track.id === "canyon" || (track.id === "alpine" || track.id === "gorge") && !bridge) ? 1.68 : undefined;
            const offsetA = (verge === undefined ? halfWidth : roadHalfWidth(track.id, a.distance) + verge) * side;
            const offsetB = (verge === undefined ? halfWidth : roadHalfWidth(track.id, b.distance) + verge) * side;
            result.push({
                a: pointOnRoute(a, offsetA, bridge || ribbon || tube ? 0 : groundHeight(track, a, offsetA)),
                b: pointOnRoute(b, offsetB, bridge || ribbon || tube ? 0 : groundHeight(track, b, offsetB)),
            });
        }
    }
    return result;
}
