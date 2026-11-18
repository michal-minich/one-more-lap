import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { archHeight, calderaBridgeEdge, calderaSpanEdges } from "../../../game/course/caldera-bridge.ts";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { channelLightSources, tintLavaFaces } from "./lava-light.ts";
import { drawCalderaBridgeApproach } from "./bridge-approach.ts";

export function drawCalderaArch(scene: Scene, course: Course, crossing: number, stone: StandardMaterial): Mesh[] {
    const [arches, foundations] = course.calderaCrossing!;
    const arch = surface(scene, "three basalt bridge arches", arches, stone);
    const pier = material(scene, "basalt bridge pier masonry", "#a4979b");
    pier.diffuseTexture = surfaceTexture(scene, "brickwork");
    pier.backFaceCulling = false;
    pier.specularColor.set(0.045, 0.042, 0.041);
    pier.emissiveColor.set(0.19, 0.12, 0.09);
    const piers = surface(scene, "grounded basalt bridge piers", foundations, pier);
    piers.convertToFlatShadedMesh();
    const sources = channelLightSources(course);
    stone.emissiveColor.set(0.20, 0.15, 0.12);
    tintLavaFaces(arch, sources, 1.07);
    tintLavaFaces(piers, sources, 1.07);
    const masonry = material(scene, "split basalt bridge voussoirs", "#b8a7a0");
    masonry.diffuseTexture = surfaceTexture(scene, "limestone");
    masonry.specularColor.set(0.06, 0.05, 0.04);
    masonry.emissiveColor.set(0.16, 0.085, 0.037);
    masonry.backFaceCulling = false;
    for (const side of [-1, 1]) drawArchStones(scene, course, crossing, side * (calderaBridgeEdge + 0.055), masonry);
    return [arch, piers, ...drawCalderaBridgeApproach(scene, course, crossing)];
}

function drawArchStones(scene: Scene, course: Course, crossing: number, edge: number, stone: StandardMaterial): void {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const count = 18;
    for (const [span, start] of calderaSpanEdges.slice(0, -1).entries()) {
        const length = calderaSpanEdges[span + 1]! - start;
        for (let i = 0; i < count; i++) {
            const base = positions.length / 3;
            for (const [end, height] of [[0.025, 0.02], [0.975, 0.02], [0.975, 0.66], [0.025, 0.66]] as const) {
                const t = (i + end) / count;
                const row = course.at(crossing + start + length * (1 - Math.cos(Math.PI * t)) / 2);
                const at = pointOnRoute(row, edge, archHeight(t) + height);
                positions.push(at.x, at.y, at.z);
                uv.push(end + i * 0.183, height + i * 0.229);
            }
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
    }
    surface(scene, "visible stone arch blocks", {
        positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices),
    }, stone);
}
