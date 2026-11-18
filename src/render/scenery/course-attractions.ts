import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import type { Conditions } from "../../game/race/conditions.ts";
import { drawCaldera } from "./caldera/caldera.ts";
import { drawAlpineCable } from "./district/alpine-cable.ts";
import { drawGlasswaterStreetcar } from "./district/glasswater-streetcar.ts";
import { drawBellgateFountains } from "./district/bellgate-fountains.ts";
import { drawCopperCascade } from "./district/copper-cascade.ts";
import { drawCopperMine } from "./district/copper-mine.ts";
import { lightForestBridge } from "./district/forest-bridge.ts";
import { drawForestMill } from "./district/forest-mill.ts";
import { drawForestSpillway } from "./district/forest-spillway.ts";
import { drawSkygarden } from "./district/skygarden.ts";
import { lightFrosthavenBeacon, lightPacificBeacon } from "./district/beacons.ts";
import { drawMonorail } from "./district/monorail.ts";
import { drawCloudfold } from "./flight/cloudfold.ts";
import { drawSpaceport } from "./flight/spaceport.ts";
import { drawRailway } from "./railway/railway.ts";
import { drawReef } from "./reef/reef.ts";
import { drawStuntPark } from "./stunt/park.ts";

export type AnimateScenery = (time: number, conditions: Conditions) => void;

export interface Attraction {
    readonly animate: AnimateScenery;
    readonly shadowCasters?: readonly Mesh[];
    readonly raceClock?: boolean;
}

export function drawCourseAttraction(scene: Scene, course: Course, reflection: Texture): Attraction | undefined {
    switch (course.track.id) {
        case "metro": return course.glasswaterFlyover && { animate: drawGlasswaterStreetcar(scene, course.glasswaterFlyover) };
        case "old-town": return { animate: drawBellgateFountains(scene, course) };
        case "sky": return drawCloudfold(scene, course, reflection);
        case "caldera": return drawCaldera(scene, course);
        case "reef": return drawReef(scene, course);
        case "gorge": {
            drawCopperMine(scene, course);
            const cascade = drawCopperCascade(scene, course);
            return { animate: (time, weather) => cascade(time, weather.daylight) };
        }
        case "rail": return drawRailway(scene, course);
        case "stunt": return { ...drawStuntPark(scene, course), raceClock: true };
        case "mars": return { animate: drawSpaceport(scene, course) };
        case "future": {
            const monorail = drawMonorail(scene, course);
            const garden = drawSkygarden(scene, course);
            return { shadowCasters: garden.shadowCasters,
                animate: time => { monorail(time); garden.animate(time); } };
        }
        case "alpine": return course.lift && { animate: drawAlpineCable(scene, course.lift, course) };
        case "arctic": return course.frosthavenHarbor && { animate: lightFrosthavenBeacon(scene, course.frosthavenHarbor.beacon) };
        case "coast": {
            const beacon = course.biomeLandmarks.find(site => site.kind === "pacific-lighthouse");
            if (!beacon) return undefined;
            return { animate: lightPacificBeacon(scene, beacon) };
        }
        case "forest": {
            if (!course.forestMill || !course.forestSpillway) return undefined;
            const mill = drawForestMill(scene, course.forestMill);
            const spillway = drawForestSpillway(scene, course.forestSpillway);
            const bridge = course.forestBridge && lightForestBridge(scene, course, course.forestBridge);
            return { animate: (time, weather) => {
                mill(time);
                spillway(time, weather.daylight);
                bridge?.(weather.daylight * (1 - weather.rain * 0.65));
            } };
        }
        default: return undefined;
    }
}
