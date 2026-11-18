import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

const bands = [
    [68, -7], [55, 6], [44, 13], [39, 21], [30, 33], [22, 45], [18, 52], [16, 55],
    [12.5, 52.5], [10.4, 45.8], [5.7, 42.5],
] as const;
const sections = 24;

export function drawVolcano(scene: Scene, course: Course): void {
    const at = pointOnRoute(course.at(510), 138);
    const floor = course.ground.at(at.x, at.z) ?? at.y;
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    for (const [band, [radius, height]] of bands.entries()) {
        for (let side = 0; side <= sections; side++) {
            const angle = Math.PI * 2 * (side % sections) / sections;
            const ridge = 1 + 0.13 * Math.sin(angle * 3) + 0.08 * Math.sin(angle * 7 + 1.4);
            const x = at.x + radius * ridge * Math.cos(angle) + height * 0.18;
            const z = at.z + radius * ridge * Math.sin(angle) - height * 0.15;
            const y = floor + height + Math.sin(angle * 5) * (band > 6 ? 1.6 : 2.35);
            positions.push(x, y, z);
            uv.push(side * 0.15, height * 0.15);
            const top = band >= 6 ? 0.74 : 1;
            const shade = top - 0.1 * Math.cos(angle * 7 + band * 0.4);
            colors.push(shade, shade * 0.94, shade * 0.95, 1);
            if (band && side) {
                const i = band * (sections + 1) + side;
                indices.push(i - sections - 2, i - sections - 1, i, i - sections - 2, i, i - 1);
            }
        }
    }
    const rock = material(scene, "volcanic rock bands", "#98735d");
    rock.diffuseTexture = surfaceTexture(scene, "sandstone");
    rock.backFaceCulling = false;
    surface(scene, "Cinder Valley crater", {
        positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices),
    }, rock, () => new Float32Array(colors));
}
