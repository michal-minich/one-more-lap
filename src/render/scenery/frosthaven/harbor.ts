import type { Course } from "../../../game/course/course.ts";
import { harborPierSize } from "../../../game/course/frosthaven/harbor.ts";
import type { FrosthavenHarbor, HarborBuilding } from "../../../game/course/frosthaven/harbor.ts";
import { beamBetween } from "../beam.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { drawHarborLookout } from "./lookout.ts";

const wood = "#6d6559";
const snow = "#e3ebee";

export function drawHarbor(build: BuildPart, course: Course, harbor: FrosthavenHarbor): void {
    for (const house of harbor.houses) foundation(build, house);
    foundation(build, harbor.beacon);
    drawHarborLookout(build, harbor.lookout);
    const { from, to } = harbor.pier;
    const yaw = Math.atan2(to.x - from.x, to.z - from.z);
    const deck = beamBetween(from, to, harborPierSize.width, harborPierSize.depth, harborPierSize.overlap);
    build("harbor pier timber", deck, wood);
    build("wind-packed quay snow", { ...deck, y: deck.y + 0.16, sx: 3.21, sy: 0.085 }, snow);
    for (let i = 0; i <= 8; i++) {
        const fraction = i / 8;
        const step = {
            x: from.x + (to.x - from.x) * fraction,
            y: from.y + (to.y - from.y) * fraction,
            z: from.z + (to.z - from.z) * fraction,
        };
        for (const side of [-1, 1]) {
            const pile = offset(step, yaw, side * 1.64, 0);
            const floor = course.ground.at(pile.x, pile.z) ?? -4;
            const bottom = Math.min(floor - 0.45, step.y - 0.36);
            const top = step.y + 0.69;
            build("harbor pier timber", { ...pile, y: (top + bottom) / 2,
                sx: 0.27, sy: top - bottom, sz: 0.29, yaw }, "#61554c");
            if (i % 2 === 0) {
                const cap = { ...pile, y: top + 0.16 };
                build("beacon glazing frame", { ...cap, sx: 0.31, sy: 0.31, sz: 0.32, yaw }, "#82959e");
            }
        }
    }
    const { quay } = harbor;
    foundation(build, quay);
    build("harbor pier timber", { ...quay, y: quay.y + 0.13, sx: quay.width + 0.12, sy: 0.17, sz: quay.depth + 0.13 }, "#746760");
    build("wind-packed quay snow", { ...quay, y: quay.y + 0.25, sx: quay.width - 0.68, sy: 0.06, sz: quay.depth - 0.52 }, snow);
}

function foundation(build: BuildPart, house: HarborBuilding): void {
    const { y, bottom, width, depth, yaw } = house;
    build("harbor stone base", { ...house, y: (y + bottom) / 2 + 0.12,
        sx: width, sy: y - bottom + 0.24, sz: depth, yaw }, "#849397");
}
