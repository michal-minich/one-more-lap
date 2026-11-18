import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import { drawWinterCabins } from "./district/winter-cabins.ts";
import { drawIceShelves } from "./frosthaven/ice-shelves.ts";
import { drawIcebreaker } from "./frosthaven/icebreaker.ts";
import { drawHarbor } from "./frosthaven/harbor.ts";
import { drawAresGardens } from "./flight/ares-gardens.ts";
import { UrbanParts } from "./urban-parts.ts";
import { drawUrbanDistricts } from "./urban.ts";

export function createLandmarks(scene: Scene, course: Course): Mesh[] {
    const id = course.track.id;
    if (id === "old-town" || id === "metro" || id === "future") return drawUrbanDistricts(scene, course, id);
    if (id !== "mars" && id !== "arctic") return [];
    const parts = new UrbanParts(scene);
    if (id === "mars") drawAresGardens(parts.add, course);
    else {
        drawWinterCabins(parts.add, course.winterCabins);
        if (course.frosthavenHarbor) drawHarbor(parts.add, course, course.frosthavenHarbor);
    }
    const meshes = parts.draw();
    if (id === "arctic") {
        meshes.push(...drawIceShelves(scene, course));
        if (course.frosthavenHarbor) drawIcebreaker(scene, course.frosthavenHarbor.icebreaker);
    }
    return meshes;
}
