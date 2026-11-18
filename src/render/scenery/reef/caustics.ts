import { Constants } from "@babylonjs/core/Engines/constants.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { terrainSurfaces } from "../../../game/course/surfaces.ts";
import { landscapeNoise, smoothBetween } from "../../../game/course/terrain-profile.ts";
import { material } from "../../materials.ts";
import { lampCone } from "../../environment/lamp-cone.ts";
import { weldLand } from "../land-mesh.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawReefCaustics(scene: Scene, course: Course): (time: number, daylight: number) => void {
    const terrain = weldLand(terrainSurfaces(course.surfaces));
    const positions = terrain.positions.slice();
    const uv = new Float32Array(terrain.uv.length);
    const colors = new Float32Array(positions.length / 3 * 4);
    const indices: number[] = [];
    for (let i = 0, vertex = 0; i < positions.length; i += 3, vertex++) {
        const x = positions[i]!;
        const y = positions[i + 1]!;
        const z = positions[i + 2]!;
        const grain = landscapeNoise(x * 0.87 + 52, z * 0.91 + 13);
        const light = (1 - smoothBetween(22, 53, -y)) * smoothBetween(0.1, 2.7, -y);
        const lagoon = smoothBetween(-91, -42, x) * (1 - smoothBetween(302, 404, x))
            * smoothBetween(104, 171, z) * (1 - smoothBetween(467, 545, z));
        positions[i + 1] = y + 0.061;
        uv[vertex * 2] = (x + y * 0.13 + grain * 2) / 19;
        uv[vertex * 2 + 1] = (z - y * 0.14 - grain * 2.4) / 18;
        colors.set([0.89, 0.94, 1, light * lagoon * (0.68 + grain * 0.28)], vertex * 4);
    }
    for (let i = 0; i < terrain.indices.length; i += 3) {
        const a = terrain.indices[i]!;
        const b = terrain.indices[i + 1]!;
        const c = terrain.indices[i + 2]!;
        if (colors[a * 4 + 3]! + colors[b * 4 + 3]! + colors[c * 4 + 3]! > 0.031) indices.push(a, b, c);
    }
    const light = material(scene, "refracted sunlight on the reef floor", "#86cedc");
    const tile = surfaceTexture(scene, "coral caustics");
    light.emissiveTexture = tile;
    light.emissiveColor.copyFrom(light.diffuseColor);
    light.disableLighting = true;
    light.fogEnabled = false;
    light.disableDepthWrite = true;
    light.alphaMode = Constants.ALPHA_ADD;
    light.specularColor.set(0, 0, 0);
    const reef = surface(scene, "animated sand caustics", { positions, uv, indices: new Uint32Array(indices) }, light, () => colors);
    reef.alphaIndex = 7;
    reef.receiveShadows = false;
    reef.hasVertexAlpha = true;
    const shafts = [[236, -25, 29, 10.6], [269, 22, 41, 17.1], [309, -30, 34, 15.2],
        [366, 25, 34, 12.4], [407, -24, 37, 16.6], [458, 32, 38, 15.1],
        [491, -26, 37, 12.7], [548, 27, 30, 15.1], [586, -30, 27, 13.8]] as const;
    const volumes = shafts.map(([distance, side, length, spread]) => {
        const at = pointOnRoute(course.at(distance), side);
        const shaft = lampCone(scene, "#8be4f7");
        shaft.name = "refracted sunlight shaft";
        shaft.alphaIndex = 8;
        shaft.position.set(at.x, -length / 2 - 0.42, at.z);
        shaft.scaling.set(spread, length, spread * 0.59);
        shaft.rotation.set(0.16, 0.08, -0.19);
        return shaft;
    });
    return (time, daylight) => {
        light.alpha = daylight * 0.36;
        tile.uOffset = time * 0.036 % 1;
        tile.vOffset = time * -0.024 % 1;
        for (const [i, shaft] of volumes.entries()) {
            shaft.material!.alpha = daylight * (0.38 + Math.sin(time * 0.88 + i) * 0.15);
            shaft.rotation.z = -0.19 + Math.sin(time * 0.26 + i * 0.62) * 0.086;
        }
    };
}
