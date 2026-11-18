import type { HarborLookout } from "../../../game/course/frosthaven/harbor.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { beamBetween } from "../beam.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawHarborLookout(build: BuildPart, { row, deck, yaw, width, depth, columns }: HarborLookout): void {
    const position = (lateral: number, along: number, height: number) => {
        const at = pointOnRoute(row, lateral, height);
        return { ...at, x: at.x + along * row.dx, z: at.z + along * row.dz };
    };
    build("harbor lookout decking", { ...deck, sx: width, sy: 0.4, sz: depth, yaw }, "#817269");
    build("wind-packed quay snow", { ...deck, y: deck.y + 0.22, sx: width - 0.8, sy: 0.055, sz: depth - 0.66, yaw }, "#d7e5ec");
    for (const column of columns) {
        build("harbor stone base", { ...column, y: (column.top + column.bottom) / 2,
            sx: 0.76, sy: column.top - column.bottom, sz: 0.74, yaw }, "#80919a");
    }
    for (const x of [-16.3, -10.3]) {
        const a = position(x, -4.9, -0.85);
        const b = position(x, 4.9, 0.30);
        build("harbor lookout decking", beamBetween(a, b, 0.32, 0.34, 0.12), "#6e6864");
    }
    for (const side of [-1, 1]) {
        const a = position(-17.33, side * 5.45, 1.48);
        const b = position(-9.45, side * 5.45, 1.48);
        build("harbor lookout rail", beamBetween(a, b, 0.15, 0.18), "#925349");
    }
    const left = position(-17.33, -5.45, 1.48);
    const right = position(-17.33, 5.45, 1.48);
    build("harbor lookout rail", beamBetween(left, right, 0.17, 0.18), "#925349");
    for (const along of [-5.45, -2.7, 0, 2.7, 5.45]) {
        build("harbor lookout rail", { ...position(-17.33, along, 1.10), sx: 0.19, sy: 0.99, sz: 0.19, yaw }, "#77554b");
    }
    for (const along of [-5.45, 5.45]) {
        for (const x of [-13.45, -9.45]) {
            build("harbor lookout rail", { ...position(x, along, 1.10), sx: 0.19, sy: 0.99, sz: 0.19, yaw }, "#77554b");
        }
    }
}
