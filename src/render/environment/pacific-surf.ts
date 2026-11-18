import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import { landscapeNoise, outsidePoint } from "../../game/course/terrain-profile.ts";
import type { RouteSample } from "../../game/course/route.ts";
import type { WaterBody } from "../../game/course/water.ts";
import type { Point } from "../../game/point.ts";
import { material } from "../materials.ts";
import { surface } from "../scenery/surface-mesh.ts";
import { surfaceTexture } from "../scenery/surface-textures.ts";

export function pacificSurf(scene: Scene, course: Course, ocean: WaterBody): Texture {
    const paint = material(scene, "Pacific surf foam", "#e4f3ed");
    const texture = surfaceTexture(scene, "whitewater", 1, 0.65);
    paint.diffuseTexture = texture;
    paint.specularColor.set(0.04, 0.07, 0.07);
    paint.alpha = 0.92;
    paint.emissiveColor.set(0.06, 0.09, 0.08);
    paint.backFaceCulling = false;
    paint.zOffset = -1;
    const shore = course.route.map(row => shoreline(course, row, ocean.center.y));
    for (const [index, offset] of [0.65, 4.1, 9.6].entries()) {
        const positions: number[] = [];
        const uv: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];
        let previous = false;
        for (const [station, bounds] of shore.entries()) {
            const row = course.route[station]!;
            if (!bounds) {
                previous = false;
                continue;
            }
            const { center, dx, dz } = bounds;
            const wrinkle = landscapeNoise(center.x * 1.94, center.z * 1.93);
            const width = (index === 0 ? 3.2 : 1.72) * (1 + wrinkle * 0.49);
            const base = positions.length / 3;
            for (const [cross, strength] of [[0, 0], [0.35, 1], [1, 0]] as const) {
                const reach = offset + width * cross + wrinkle * index * 1.28;
                positions.push(center.x + dx * reach, ocean.center.y + 0.031 + index * 0.003, center.z + dz * reach);
                uv.push(cross, row.distance / (18 + index * 7));
                const alpha = strength * (0.92 - 0.23 * index) * (0.83 + wrinkle * 0.34);
                colors.push(0.87, 0.96, 0.95, alpha);
            }
            if (previous) {
                indices.push(base - 3, base, base - 2, base - 2, base, base + 1,
                    base - 2, base + 1, base - 1, base - 1, base + 1, base + 2);
            }
            previous = true;
        }
        if (!indices.length) continue;
        const mesh = surface(scene, "Pacific surf band " + (index + 1), {
            positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices),
        }, paint, () => new Float32Array(colors));
        mesh.hasVertexAlpha = true;
    }
    return texture;
}

function shoreline(
    course: Course, row: RouteSample, level: number,
): { center: Point; dx: number; dz: number } | undefined {
    const edge = outsidePoint(course.track, course.center, row, 0);
    const offshore = outsidePoint(course.track, course.center, row, 112);
    const dx = (offshore.x - edge.x) / 112;
    const dz = (offshore.z - edge.z) / 112;
    const at = (reach: number): number => course.ground.at(edge.x + dx * reach, edge.z + dz * reach) ?? level - 12;
    let lower = 0;
    let upper = 112;
    if (at(lower) < level || at(upper) > level) return undefined;
    for (let step = 0; step < 9; step++) {
        const middle = (lower + upper) / 2;
        if (at(middle) > level) lower = middle;
        else upper = middle;
    }
    return { center: { x: edge.x + dx * upper, y: level, z: edge.z + dz * upper }, dx, dz };
}
