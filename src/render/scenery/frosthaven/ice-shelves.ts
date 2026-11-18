import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { Surface } from "../../../game/course/surface.ts";
import { seededRandom } from "../../../game/random.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

const pieces = [
    [102, -147, 14, 8], [156, -158, 16, 9], [208, -160, 21, 13],
    [271, -150, 18, 10], [301, -157, 22, 10], [370, -139, 17, 10],
    [427, -145, 23, 13], [501, -151, 22, 11], [595, -153, 20, 12],
    [644, -146, 15, 9], [734, -155, 21, 12],
] as const;

export function drawIceShelves(scene: Scene, course: Course): Mesh[] {
    const iceLevel = course.water.find(body => body.kind === "ice" && body.depth === 0)?.center.y ?? 0;
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    const random = seededRandom(916);
    const face = Color3.FromHexString("#4d8eab");
    const edge = Color3.FromHexString("#a6d1dd");
    const powder = Color3.FromHexString("#e4eef2");
    for (const [distance, lateral, width, depth] of pieces) {
        const at = pointOnRoute(course.at(distance), lateral);
        if ((course.ground.at(at.x, at.z) ?? iceLevel) > iceLevel + 0.25) continue;
        const rotate = random() * Math.PI;
        const amplitude = random() * 0.72;
        const count = 9;
        const base = positions.length / 3;
        const rim = Array.from({ length: count }, (_, index) => {
            const angle = index * Math.PI * 2 / count + rotate;
            const scale = 0.7 + random() * 0.3;
            return { x: at.x + Math.cos(angle) * width * scale, z: at.z + Math.sin(angle) * depth * scale };
        });
        for (const [layer, height, scale, tint] of [[0, -0.11, 1, face], [1, 0.31 + amplitude, 0.92, edge],
            [2, 0.76 + amplitude, 0.67, powder]] as const) {
            for (const [i, point] of rim.entries()) {
                const x = at.x + (point.x - at.x) * scale;
                const y = iceLevel + height + Math.sin(i * 3.19) * 0.07;
                const z = at.z + (point.z - at.z) * scale;
                positions.push(x, y, z);
                uv.push(x / 11, (z + y * 1.9) / 11);
                colors.push(tint.r, tint.g, tint.b, 1);
                if (layer === 0) continue;
                const a = base + layer * count + i;
                const b = base + layer * count + (i + 1) % count;
                indices.push(a - count, b - count, a, b - count, b, a);
            }
        }
        const top = base + count * 2;
        for (let i = 1; i < count - 1; i++) indices.push(top, top + i, top + i + 1);
    }
    const paint = material(scene, "blue fractures and windblown shelf snow", "#ffffff");
    paint.diffuseTexture = surfaceTexture(scene, "frosthaven drift snow");
    paint.backFaceCulling = false;
    paint.specularColor.set(0.16, 0.22, 0.28);
    const shape: Surface = { positions: new Float32Array(positions), indices: new Uint32Array(indices),
        uv: new Float32Array(uv) };
    return [surface(scene, "fractured pack ice shelves", shape, paint, () => new Float32Array(colors))];
}
