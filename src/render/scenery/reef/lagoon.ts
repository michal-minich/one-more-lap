import type { Scene } from "@babylonjs/core/scene.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { Course } from "../../../game/course/course.ts";
import { lagoonSurface } from "../../../game/course/reef-lagoon.ts";
import { landscapeNoise, smoothBetween } from "../../../game/course/terrain-profile.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawLagoon(scene: Scene, course: Course): (time: number) => void {
    const water = material(scene, "lagoon surface and underwater caustics", "#a8ced5");
    const ripples = surfaceTexture(scene, "water", 33, 29);
    const reflections = surfaceTexture(scene, "coral caustics", 51, 49);
    ripples.level = 0.76;
    water.diffuseTexture = ripples;
    water.emissiveTexture = reflections;
    reflections.level = 0.36;
    water.backFaceCulling = false;
    water.twoSidedLighting = true;
    water.emissiveColor.set(0.017, 0.045, 0.081);
    water.specularColor.set(0.2, 0.37, 0.41);
    const shape = lagoonSurface(course);
    const shore = Color3.FromHexString("#75e6cb");
    const deep = Color3.FromHexString("#358fbd");
    const tone = new Color3();
    const colors = new Float32Array(shape.positions.length / 3 * 4);
    for (let i = 0, vertex = 0; i < shape.positions.length; i += 3, vertex++) {
        const x = shape.positions[i]!;
        const z = shape.positions[i + 2]!;
        const bottom = course.ground.at(x, z, -0.025) ?? -29;
        const drift = landscapeNoise(x * 0.61 + 32, z * 0.71 - 18);
        const depth = smoothBetween(0.9, 22.5, -bottom + drift * 2.9);
        Color3.LerpToRef(shore, deep, depth, tone);
        colors.set([tone.r, tone.g, tone.b, 0.66 + depth * 0.23], vertex * 4);
    }
    const lagoon = surface(scene, "lagoon surface with dry tube openings", shape, water, () => colors);
    lagoon.hasVertexAlpha = true;
    lagoon.receiveShadows = false;
    lagoon.alphaIndex = 10;
    return time => {
        ripples.uOffset = time * 0.012 % 1;
        ripples.vOffset = time * 0.018 % 1;
        reflections.uOffset = time * -0.009 % 1;
        reflections.vOffset = time * 0.013 % 1;
    };
}
