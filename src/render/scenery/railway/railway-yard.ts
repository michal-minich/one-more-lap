import type { Course } from "../../../game/course/course.ts";
import { juniperShedBase, juniperShedLoadingDeck } from "../../../game/course/railway/shed.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawRailwayYard(build: BuildPart, course: Course): void {
    const shed = course.biomeLandmarks.find(site => site.kind === "juniper-shed");
    if (!shed) return;
    const { x, y, z, width, height, depth, yaw } = juniperShedBase(shed);
    build("Juniper goods shed platform", { x, y, z, sx: width, sy: height, sz: depth, yaw }, "#a2907c");
    const deck = juniperShedLoadingDeck(shed);
    build("Juniper goods shed platform", { ...deck, sx: deck.width, sy: deck.height, sz: deck.depth }, "#9f8d78");
    build("station paving", { ...deck, y: deck.y + deck.height / 2, sx: deck.width, sy: 0.06, sz: deck.depth, yaw }, "#bbab95");
}
