import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import type { CircuitLine } from "../../game/course/circuit-line.ts";
import { drawCourseAttraction } from "./course-attractions.ts";
import type { AnimateScenery } from "./course-attractions.ts";
import { drawRockFormations } from "./canyon.ts";
import { drawGlasswaterStreet } from "./district/glasswater-street.ts";
import { drawBellgateStreet } from "./district/bellgate-street.ts";
import { drawStreetLandscape } from "./district/street-landscape.ts";
import { drawOutposts } from "./district/outposts.ts";
import { drawRockShelter } from "./district/rock-shelters.ts";
import { drawGroundShadows } from "./ground-shadows.ts";
import { drawBiomeModels } from "./landmark-models/biome-models.ts";
import { drawLandmarkModels } from "./landmark-models/models.ts";
import { createLandmarks } from "./landmarks.ts";
import { material } from "../materials.ts";
import { buildPassages } from "./passages.ts";
import { decorateRoad } from "./road.ts";
import { drawRoadWear } from "./road-wear.ts";

import { surface } from "./surface-mesh.ts";
import type { SurfacePattern } from "./surface-textures.ts";
import type { Biome } from "../../game/course/tracks.ts";
import { surfaceTexture } from "./surface-textures.ts";
import { drawLand } from "./terrain.ts";
import { drawGrove } from "./vegetation/grove.ts";
import { drawUnderstory } from "./vegetation/understory.ts";

export interface Scenery {
    readonly road: StandardMaterial;
    readonly terrain: StandardMaterial;
    readonly groundShade: StandardMaterial;
    readonly shadowCasters: readonly Mesh[];
    readonly facadeMeshes: readonly Mesh[];
    readonly animate?: AnimateScenery;
    readonly raceClock?: boolean;
}

const pavement: Partial<Record<Biome, SurfacePattern>> = {
    "old-town": "bellgate setts", arctic: "frosthaven blue ice", caldera: "caldera asphalt", rail: "juniper asphalt",
    forest: "forest asphalt", coast: "pacific asphalt", alpine: "alpine asphalt", ruins: "aegean asphalt", reef: "coral asphalt",
    metro: "glasswater asphalt", future: "aurora asphalt", mars: "ares asphalt", sky: "cloudfold asphalt",
    canyon: "cinder asphalt", gorge: "copper asphalt", stunt: "skywheel asphalt",
};

export function createScenery(scene: Scene, course: Course, line: CircuitLine, reflection: Texture): Scenery {
    const { track, surfaces } = course;
    const roadTint = track.id === "arctic" ? "#9daab5" : (track.id === "caldera" ? "#797686" : "#a1a4a8");
    const road = material(scene, "road surface", roadTint);
    road.diffuseTexture = surfaceTexture(scene, pavement[track.id] ?? "asphalt",
        track.id === "old-town" ? 2 : track.id === "alpine" || track.id === "canyon" || track.id === "gorge" || track.id === "rail" || track.id === "reef" ? 2.5 : undefined);
    road.specularColor.set(0.09, 0.10, 0.11);
    road.specularPower = 47;
    surface(scene, "pavement", surfaces.road, road);
    if (surfaces.branch) surface(scene, "garden bridge pavement", surfaces.branch, road);
    const terrain = drawLand(scene, course);
    decorateRoad(scene, course, line);
    drawRoadWear(scene, course);

    drawGrove(scene, course);
    drawUnderstory(scene, course);
    const shadowCasters = buildPassages(scene, course);
    const street = track.id === "metro" ? drawGlasswaterStreet(scene, course)
        : (track.id === "old-town" ? drawBellgateStreet(scene, course) : []);
    drawStreetLandscape(scene, course);
    shadowCasters.push(...street.filter(mesh => mesh.name === "brick frontage" ||
        mesh.name === "office frontage" || mesh.name === "Bellgate limewashed house"));
    if (course.shelter) shadowCasters.push(...drawRockShelter(scene, course, course.shelter));
    const outposts = drawOutposts(scene, course);
    if (course.rockFormations.length) drawRockFormations(scene, course);
    const landmarks = createLandmarks(scene, course);
    drawLandmarkModels(scene, course);
    shadowCasters.push(...drawBiomeModels(scene, course));
    const attraction = drawCourseAttraction(scene, course, reflection);
    if (attraction?.shadowCasters) shadowCasters.push(...attraction.shadowCasters);
    return {
        road, terrain, shadowCasters, facadeMeshes: [...street, ...outposts, ...landmarks],
        groundShade: drawGroundShadows(scene, course), ...(attraction && { animate: attraction.animate }), ...(attraction?.raceClock && { raceClock: true }),
    };
}
