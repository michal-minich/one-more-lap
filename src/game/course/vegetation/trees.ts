import type { Point } from "../../point.ts";

export type TreeKind = "spruce" | "fir" | "birch" | "oak" | "coastal-pine" | "olive" | "cypress" | "snow-pine" | "ancient-oak";

export interface TreeTrunk {
    readonly radius: number;
    readonly height: number;
}

export interface TreePlacement {
    readonly kind: TreeKind;
    readonly ground: Point;
    readonly scale: number;
    readonly yaw: number;
}

export const treeTrunks: Record<TreeKind, TreeTrunk> = {
    spruce: { radius: 0.19, height: 2.25 },
    fir: { radius: 0.23, height: 2.05 },
    birch: { radius: 0.14, height: 2.8 },
    "ancient-oak": { radius: 1.36, height: 6.95 },
    oak: { radius: 0.32, height: 2.35 },
    "coastal-pine": { radius: 0.23, height: 2.85 },
    olive: { radius: 0.26, height: 1.6 },
    cypress: { radius: 0.16, height: 2.35 },
    "snow-pine": { radius: 0.21, height: 2.15 },
};
