import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import {
    copperTramways, tramwayHalfGauge, tramwayPoint, tramwayRailDepth, tramwayRailHeight, tramwayTieSpacing,
} from "../../../game/course/copper-mine.ts";
import type { Point } from "../../../game/point.ts";
import { beamBetween } from "../beam.ts";
import { UrbanParts } from "../urban-parts.ts";

export function drawCopperMine(scene: Scene, course: Course): void {
    const parts = new UrbanParts(scene);
    for (const tramway of copperTramways) {
        const [from, , to] = tramway.route;
        const at = (distance: number, side = 0, rise = 0): Point => tramwayPoint(course, tramway, distance, side, rise);
        for (let i = from[0]; i < to[0]; i += tramwayTieSpacing) {
            const end = Math.min(to[0], i + tramwayTieSpacing);
            const color = Math.floor(i * 0.7) % 3 === 0 ? "#817970" : "#776f65";
            const ballast = beamBetween(at(i, 0, -0.03), at(end, 0, -0.03), 1.85, 0.22, 0.12);
            parts.add("Copper tramway ballast", ballast, color);
            const sleeper = beamBetween(at(i, -0.76, 0.1), at(i, 0.76, 0.1), 0.27, 0.17);
            parts.add("Copper tramway sleepers", sleeper, "#745a46");
            for (const side of [-tramwayHalfGauge, tramwayHalfGauge]) {
                const rail = beamBetween(at(i, side, tramwayRailHeight), at(end, side, tramwayRailHeight), 0.09, tramwayRailDepth, 0.06);
                parts.add("Copper tramway rails", rail, "#8b6959");
            }
        }
        for (const step of [from[0], to[0]]) {
            const buffer = beamBetween(at(step, -0.77, 0.44), at(step, 0.77, 0.44), 0.34, 0.42);
            parts.add("Copper tramway buffers", buffer, "#69533d");
        }
    }
    parts.draw();
}
