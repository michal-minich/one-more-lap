import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { UrbanParts } from "../urban-parts.ts";
import { bellgateHouse } from "./bellgate-buildings.ts";

const fronts = [0.72, 0.18, 0.96, 0.47, 0.83, 0.36, 0.06, 0.51] as const;

export function drawBellgateStreet(scene: Scene, course: Course): Mesh[] {
    const parts = new UrbanParts(scene);
    for (const [index, building] of course.streetBuildings.entries()) {
        bellgateHouse(parts.add, course, building, building.yaw, building.width, building.depth,
            "civic", () => fronts[index % fronts.length]!, building);
    }
    return parts.draw();
}
