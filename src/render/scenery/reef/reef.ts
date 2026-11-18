import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { coralLookoutFoundations } from "../../../game/course/reef-lookout.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { Attraction } from "../course-attractions.ts";
import { drawDisplayLandmarks } from "../landmark-models/biome-models.ts";
import { drawCoralModels } from "../landmark-models/models.ts";
import { UrbanParts } from "../urban-parts.ts";
import { drawLagoon } from "./lagoon.ts";
import { drawCoralGardens } from "./coral-gardens.ts";
import { drawReefCaustics } from "./caustics.ts";
import { drawPirateShip } from "./pirate-ship.ts";
import { drawReefArches } from "./reef-arches.ts";
import { drawReefLife } from "./reef-life.ts";
import { drawReefTunnel } from "./tunnel.ts";

export function drawReef(scene: Scene, course: Course): Attraction {
    const portals = drawReefTunnel(scene, course);
    const stone = new UrbanParts(scene);
    for (const landmark of course.biomeLandmarks) {
        if (landmark.kind !== "coral-lookout") continue;
        for (const base of coralLookoutFoundations(landmark)) stone.add("coral lookout footing", base, "#dbbf97");
    }
    const foundations = stone.draw();
    drawCoralGardens(scene, course);
    drawCoralModels(scene, course);
    drawReefArches(scene, course);
    const fans = [[276, 23, 16, 1.2], [334, 34, 18, -0.2], [385, 24, 19, 0.7],
        [449, -26, 18, -0.8], [532, 24, 23, 1.7], [591, 28, 22, 1.4]] as const;
    drawDisplayLandmarks(scene, "coral-fan", fans.flatMap(([distance, side, height, twist]) => {
        const row = course.at(distance);
        const at = pointOnRoute(row, side);
        const ground = course.ground.at(at.x, at.z);
        if (ground === undefined) return [];
        return [{ ...at, y: ground - 0.6, sx: height * 0.57, sy: height, sz: height * 0.58,
            yaw: Math.atan2(row.dx, row.dz) + twist }];
    }));
    const fish = drawReefLife(scene, course);
    const ship = drawPirateShip(scene, course);
    const lagoon = drawLagoon(scene, course);
    const caustics = drawReefCaustics(scene, course);
    return {
        shadowCasters: [portals, ...foundations],
        animate: (time, weather) => {
            lagoon(time);
            caustics(time, weather.daylight * (1 - weather.rain * 0.78));
            fish(time);
            ship(time);
        },
    };
}
