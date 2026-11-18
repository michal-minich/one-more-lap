import { winterCabinFootprint } from "../../../game/course/winter-cabins.ts";
import type { WinterCabin } from "../../../game/course/winter-cabins.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawWinterCabins(build: BuildPart, cabins: readonly WinterCabin[]): void {
    for (const cabin of cabins) {
        const { y, bottom, yaw, paint } = cabin;
        const base = y + 0.22;
        const { width, depth } = winterCabinFootprint;
        build("stone footing", { ...cabin, y: (bottom + base) / 2,
            sx: width, sy: base - bottom, sz: depth, yaw }, "#727c81");
        build("weathered timber", { ...cabin, y: y + 1.81, sx: 9.5, sy: 3.25, sz: 8.9, yaw }, paint);
        build("gable roof", { ...cabin, y: y + 3.40, sx: 10.7, sy: 2.52, sz: 10.4, yaw }, "#4a5259");
        build("snow on gable", { ...cabin, y: y + 3.54, sx: 10.52, sy: 2.49, sz: 10.18, yaw }, "#e6eef1");
        const chimney = offset(cabin, yaw, 2.28, 2.75);
        build("brick chimney", { ...chimney, y: y + 5.12, sx: 0.72, sy: 2.66, sz: 0.70, yaw }, "#646668");
        for (const side of [-1, 1]) {
            for (const along of [-2.25, 2.25]) {
                const at = offset(cabin, yaw, side * 4.78, along);
                build("window frame", { ...at, y: y + 2.03, sx: 0.15, sy: 1.17, sz: 1.42, yaw }, "#bbb09a");
                const pane = offset(at, yaw, side * 0.10, 0);
                build("lit windows", { ...pane, y: y + 2.03, sx: 0.06, sy: 0.9, sz: 1.13, yaw }, "#e6bf77");
            }
        }
    }
}
