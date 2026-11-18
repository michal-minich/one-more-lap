import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { BOOST_STRIP_HALF_LENGTH, BOOST_STRIP_HALF_WIDTH } from "../../../game/course/boost-strips.ts";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { strip } from "../../../game/course/surface.ts";
import { material } from "../../materials.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surface } from "../surface-mesh.ts";

export function drawSkyAccelerators(scene: Scene, course: Course): void {
    const inset = material(scene, "boost strip panels", "#244e57");
    inset.diffuseTexture = surfaceTexture(scene, "weathered steel");
    inset.emissiveColor.set(0.015, 0.055, 0.07);
    const glow = material(scene, "boost strip chevrons", "#83f4e3");
    glow.emissiveColor.set(0.23, 0.74, 0.62);
    const chevrons: Stamp[] = [];
    for (const { row, offset } of course.boostStrips) {
        const stations = Array.from({ length: 7 }, (_, index) =>
            course.at(row.distance + (index / 3 - 1) * BOOST_STRIP_HALF_LENGTH));
        const width = BOOST_STRIP_HALF_WIDTH;
        surface(scene, "inlaid road accelerator", strip(stations, [offset - width, offset + width], () => 0.021), inset);
        for (const end of [-1, 1]) {
            for (const step of [1, 2, 3]) {
                const mark = course.at(row.distance + end * (step * 0.91 + 0.39));
                const yaw = Math.atan2(mark.dx, mark.dz);
                for (const side of [-1, 1]) {
                    const at = pointOnRoute(mark, offset + side * 0.52, 0.05);
                    chevrons.push({ ...at, sx: 1.18, sy: 0.026, sz: 0.16, yaw: yaw + end * side * 0.46 });
                }
            }
        }
    }
    const arrow = MeshBuilder.CreateBox("twin-direction boost chevrons", { size: 1 }, scene);
    arrow.material = glow;
    stamp(arrow, chevrons);
}
