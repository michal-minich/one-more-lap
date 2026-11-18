import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import { pointOnRoute } from "../../game/course/route.ts";
import { roadHalfWidth } from "../../game/course/road-width.ts";
import { seededRandom } from "../../game/random.ts";
import { material } from "../materials.ts";
import { surface } from "./surface-mesh.ts";
import { surfaceTexture } from "./surface-textures.ts";

export function drawRoadWear(scene: Scene, course: Course): void {
    const id = course.track.id;
    if (id !== "caldera" && id !== "rail" && id !== "forest" && id !== "canyon" && id !== "stunt") return;
    const random = seededRandom(72_379);
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    for (let distance = 33; distance < course.length - 9; distance += 24 + random() * 49) {
        if (course.isGap(distance, 3)) continue;
        const edge = roadHalfWidth(id, distance);
        const offset = (random() < 0.5 ? -1 : 1) * (edge * (0.31 + random() * 0.42));
        const length = 0.45 + random() * 2.7;
        const halfWidth = 0.10 + random() * 0.68;
        const base = positions.length / 3;
        const middle = pointOnRoute(course.at(distance), offset, 0.014);
        positions.push(middle.x, middle.y, middle.z);
        uv.push(middle.x / 3, middle.z / 3);
        for (let side = 0; side < 7; side++) {
            const angle = side * Math.PI * 2 / 7;
            const extent = 0.55 + random() * 0.55;
            const row = course.at(distance + Math.sin(angle) * length * extent);
            const corner = pointOnRoute(row, offset + Math.cos(angle) * halfWidth * extent, 0.014);
            positions.push(corner.x, corner.y, corner.z);
            uv.push(corner.x / 3, corner.z / 3);
            indices.push(base, base + side + 1, base + (side + 1) % 7 + 1);
        }
    }
    const mix = material(scene, "irregular pavement repairs", id === "caldera" ? "#79716c" : id === "forest" ? "#ababb3" : "#90908b");
    mix.diffuseTexture = surfaceTexture(scene, id === "forest" ? "forest asphalt" : id === "canyon" ? "cinder asphalt" : "weathered asphalt");
    if (id === "forest" || id === "canyon") mix.alpha = 0.58;
    mix.specularColor.set(0.07, 0.08, 0.08);
    mix.backFaceCulling = false;
    surface(scene, "flat patched asphalt", {
        positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices),
    }, mix);
}
