import type { Biome } from "./tracks.ts";
import type { RouteSample } from "./route.ts";

export type HallKind = "glass hall" | "transit hall" | "space hangar";
export type PassageKind = "bridge" | "stone arch" | "timber walk" | "flyover" | "aqueduct" | "town gate" | HallKind;

export interface Passage {
    readonly kind: PassageKind;
    readonly distance: number;
}

const crossings: Partial<Record<Biome, readonly Passage[]>> = {
    coast: [{ kind: "bridge", distance: 292 }],
    alpine: [{ kind: "bridge", distance: 398 }, { kind: "timber walk", distance: 1_120 }],
    canyon: [{ kind: "stone arch", distance: 930 }],
    ruins: [{ kind: "aqueduct", distance: 148 }],
    forest: [{ kind: "bridge", distance: 328 }],
    "old-town": [{ kind: "town gate", distance: 180 }],
    metro: [{ kind: "flyover", distance: 218 }, { kind: "bridge", distance: 945 }],
    future: [
        { kind: "glass hall", distance: 144 },
        { kind: "flyover", distance: 294 },
        { kind: "bridge", distance: 520 },
        { kind: "transit hall", distance: 828 },
        { kind: "flyover", distance: 1_121 },
    ],
    mars: [{ kind: "space hangar", distance: 214 }, { kind: "flyover", distance: 472 }],
    arctic: [{ kind: "bridge", distance: 314 }],
    caldera: [{ kind: "bridge", distance: 249 }],
    gorge: [{ kind: "bridge", distance: 248 }, { kind: "stone arch", distance: 915 }],
};

export function coursePassages(biome: Biome): readonly Passage[] {
    return crossings[biome] ?? [];
}

export function bridgeHalfLength(biome: Biome): number {
    return biome === "caldera" ? 42 : biome === "metro" ? 34 : biome === "forest" ? 30 : biome === "future" ? 29 : biome === "arctic" ? 28 : 24;
}

export function bridgeRows(route: readonly RouteSample[], distance: number, biome: Biome): RouteSample[] {
    const halfLength = bridgeHalfLength(biome);
    return route.filter(row => Math.abs(row.distance - distance) <= halfLength);
}

export function bridgeDrop(biome: Biome, distance: number): number {
    const bridge = coursePassages(biome).find(item => item.kind === "bridge");
    if (!bridge) return 0;
    const delta = Math.abs(distance - bridge.distance);
    const reach = bridgeHalfLength(biome) + 7;
    if (delta >= reach) return 0;
    const t = Math.max(0, Math.min(1, (reach - delta) / (biome === "caldera" ? 30 : 15)));
    return t * t * (3 - 2 * t) * (biome === "caldera" ? 14 : biome === "gorge" ? 10 : biome === "arctic" ? 8.6 : 6.5);
}
