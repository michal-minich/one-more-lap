import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { bridgeHalfLength } from "../../../game/course/passages.ts";
import { roadHalfWidth } from "../../../game/course/road-width.ts";
import type { RouteSample } from "../../../game/course/route.ts";
import { strip } from "../../../game/course/surface.ts";
import { landscapeNoise, smoothBetween } from "../../../game/course/terrain-profile.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawWindrows(scene: Scene, course: Course): void {
    const paint = material(scene, "windblown snow on the packed ice", "#f1f7fc");
    paint.diffuseTexture = surfaceTexture(scene, "frosthaven drift snow", 0.72);
    paint.specularColor.set(0.023, 0.028, 0.034);
    const crossing = course.passages.find(passage => passage.kind === "bridge")!;
    const bridgeEnd = bridgeHalfLength(course.track.id);
    for (const side of [-1, 1]) {
        const wind = ({ x, z }: RouteSample) => landscapeNoise(x * 1.58 + side * 79, z * 1.71 - side * 27);
        const shape = strip(course.route, row => {
            const edge = roadHalfWidth(course.track.id, row.distance);
            const open = smoothBetween(bridgeEnd - 5, bridgeEnd + 11, Math.abs(row.distance - crossing.distance));
            const width = 0.18 + open * (0.21 + 0.35 * smoothBetween(-0.36, 0.62, wind(row)));
            const offsets = [edge - 0.08 - width, edge - 0.09 - width * 0.38, edge - 0.022].map(value => side * value);
            return side > 0 ? offsets : offsets.reverse();
        }, () => 0.019);
        const mesh = surface(scene, side > 0 ? "inner road snowdrifts" : "outer road snowdrifts", shape, paint, () => {
            const colors: number[] = [];
            for (const row of course.route) {
                const alpha = 0.54 + wind(row) * 0.30;
                const edge = side === 1 ? [0, alpha * 0.63, alpha] : [alpha, alpha * 0.63, 0];
                for (const strength of edge) colors.push(0.86, 0.94, 1, strength);
            }
            return new Float32Array(colors);
        });
        mesh.hasVertexAlpha = true;
    }
}
