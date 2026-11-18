import type { Point } from "../point.ts";
import type { GroundHeight } from "./ground-height.ts";
import { waterPoint } from "./water.ts";
import type { WaterBody } from "./water.ts";

export const forestMillSize = { width: 8.6, depth: 6.8, height: 4.5, wheelRadius: 2.45 } as const;

export interface ForestMill {
    readonly position: Point;
    readonly wheel: Point;
    readonly yaw: number;
    readonly footing: number;
}

export function placeForestMill(lake: WaterBody, ground: GroundHeight): ForestMill {
    const bearing = 1.79;
    const bank = waterPoint(lake, bearing, 1.22);
    const shore = waterPoint(lake, bearing, 0.68);
    const yaw = Math.atan2(bank.z - shore.z, shore.x - bank.x);
    const position = { ...bank, y: Math.max(lake.center.y + 0.32, ground.at(bank.x, bank.z) ?? bank.y) };
    let footing = position.y;
    for (const x of [-forestMillSize.width / 2, forestMillSize.width / 2]) {
        for (const z of [-forestMillSize.depth / 2, forestMillSize.depth / 2]) {
            const y = ground.at(bank.x + x * Math.cos(yaw) + z * Math.sin(yaw),
                bank.z - x * Math.sin(yaw) + z * Math.cos(yaw));
            footing = Math.min(footing, y ?? footing);
        }
    }
    return { position, wheel: { ...shore, y: shore.y + 2.25 }, yaw, footing: footing - 0.32 };
}
