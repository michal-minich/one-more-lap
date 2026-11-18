import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import type { Conditions } from "../../../game/race/conditions.ts";
import { reflect } from "../../car/reflections.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { drawAirship } from "./airship.ts";
import { drawCloudSea } from "./cloud-sea.ts";
import { drawSkyAccelerators } from "./sky-accelerators.ts";
import { drawSkyGyroscope } from "./sky-gyroscope.ts";
import { drawSkyDeck } from "./sky-deck.ts";
import { drawSkyIslands } from "./sky-islands.ts";
import { drawSkyLanterns } from "./sky-lanterns.ts";

export function drawCloudfold(scene: Scene, course: Course, reflection: Texture): {
    readonly shadowCasters: readonly Mesh[];
    readonly animate: (time: number, conditions: Conditions) => void;
} {
    const shadowCasters = [...drawSkyDeck(scene, course), ...drawStonework(scene, course)];
    drawSkyAccelerators(scene, course);
    drawSkyLanterns(scene, course);
    const gyroscope = drawSkyGyroscope(scene, course);
    const sail = drawAirship(scene);
    const clouds = drawCloudSea(scene);
    const marble = material(scene, "peach stone", "#efc5ad");
    marble.diffuseTexture = surfaceTexture(scene, "cloudfold ceramic");
    const jade = material(scene, "sea-glass ceramic", "#73b8b2");
    jade.diffuseTexture = surfaceTexture(scene, "ceramic plating");
    const falls = drawSkyIslands(scene, course);
    sculpture(scene, marble, jade);
    const orbit = spheres(scene, reflection);
    return {
        shadowCasters,
        animate: (time, conditions) => {
            sail(time);
            gyroscope(time);
            clouds(time, conditions);
            falls(time, conditions.daylight);
            orbit(time);
        },
    };
}

function drawStonework(scene: Scene, course: Course): Mesh[] {
    const layout = course.cloudfoldScenery;
    if (!layout) return [];
    const limestone = material(scene, "cream porcelain and limestone", "#e7d8c6");
    limestone.diffuseTexture = surfaceTexture(scene, "cloudfold ceramic");
    limestone.backFaceCulling = false;
    limestone.specularColor.set(0.12, 0.10, 0.083);
    const bridge = surface(scene, "four garden viaduct arches", layout.viaduct, limestone);
    const portal = surface(scene, "Cloudfold porcelain portal", layout.portal, limestone);
    const shale = material(scene, "Cloudfold exposed shale", "#abb6c4");
    shale.diffuseTexture = surfaceTexture(scene, "cloudfold shale");
    shale.backFaceCulling = false;
    shale.specularColor.set(0.023, 0.028, 0.037);
    shale.emissiveColor.set(0.045, 0.044, 0.049);
    const ledges = layout.ledges.map((shape, index) => {
        const cliffs = surface(scene, "hanging roadside slate " + index, shape, shale, normals => {
            const colors = new Float32Array(shape.positions.length / 3 * 4);
            for (let i = 0; i < shape.positions.length; i += 3) {
                const x = shape.positions[i]!;
                const y = shape.positions[i + 1]!;
                const z = shape.positions[i + 2]!;
                const green = shape.meadow[i / 3]! * Math.abs(normals[i + 1]!) ** 1.1;
                const stone = 0.84 + Math.sin(x * 0.16 + z * 0.12 + y * 0.44) * 0.13;
                colors.set([stone * (1 + green * 0.12), stone * (1 + green * 0.13),
                    stone * (1 - green * 0.57), 1], i / 3 * 4);
            }
            return colors;
        });
        cliffs.convertToFlatShadedMesh();
        return cliffs;
    });
    return [bridge, portal, ...ledges];
}

function sculpture(scene: Scene, marble: StandardMaterial, jade: StandardMaterial): void {
    const rings = [
        [-8, 96, 32, 21, 0.66], [148, 115, 18, 21, -0.48], [54, 121, -26, 16, 0.91],
        [-106, 119, 10, 26, -0.62], [205, 127, -55, 26, 0.37], [-172, 137, -131, 32, 0.11],
    ] as const;
    for (const [index, [x, y, z, diameter, roll]] of rings.entries()) {
        const mesh = MeshBuilder.CreateTorus("floating ceramic arch", { diameter, thickness: diameter * 0.064, tessellation: 42 }, scene);
        mesh.position.set(x, y, z);
        mesh.rotation.set(Math.PI * 0.42, index * 0.83, roll);
        mesh.material = index % 2 ? jade : marble;
        mesh.isPickable = false;
    }
    const stairs = MeshBuilder.CreateBox("stairs to nowhere", { size: 1 }, scene);
    stairs.material = marble;
    const steps: Stamp[] = [];
    for (const [x, y, z, yaw, turn] of [[-20, 74, 25, 0.47, -1], [119, 88, -23, -0.9, 1], [-97, 91, 92, 1.7, -1]] as const) {
        for (let step = 0; step < 14; step++) {
            const along = step * 1.49;
            steps.push({ x: x + Math.sin(yaw) * along, y: y + step * 0.84,
                z: z + Math.cos(yaw) * along, sx: 4.1, sy: 0.86, sz: 1.58, yaw });
        }
        for (let step = 0; step < 10; step++) {
            const across = step * 1.37 * turn;
            steps.push({ x: x + Math.sin(yaw) * 21 + Math.cos(yaw) * across,
                y: y + 11.75 + step * 0.56, z: z + Math.cos(yaw) * 21 - Math.sin(yaw) * across,
                sx: 3.55, sy: 0.72, sz: 1.48, yaw: yaw + Math.PI / 2, roll: -turn * 0.12 });
        }
    }
    stamp(stairs, steps);
}

function spheres(scene: Scene, reflection: Texture): (time: number) => void {
    const chrome = material(scene, "mirror chrome", "#34374b");
    chrome.specularColor.set(0.87, 0.90, 1);
    chrome.specularPower = 115;
    reflect(chrome, reflection, 0.94, 0.87);
    const balls = [
        [17, 106, 40, 18], [23, 97, 19, 7.2], [42, 115, 28, 10.4], [-30, 103, 8, 12.5],
        [110, 109, 27, 13.5], [-115, 129, 66, 16], [236, 133, -59, 23],
        [-164, 120, -94, 21], [109, 124, -56, 12], [56, 138, -4, 11],
    ] as const;
    const meshes = balls.map(([x, y, z, diameter], index) => {
        const mesh = MeshBuilder.CreateSphere("reflective sphere", { diameter, segments: 24 }, scene);
        mesh.material = chrome;
        mesh.isPickable = false;
        return { mesh, x, y, z, phase: index * 2.39 };
    });
    return time => {
        for (const { mesh, x, y, z, phase } of meshes) {
            mesh.position.set(x + Math.sin(time * 0.20 + phase) * 1.65, y + Math.cos(time * 0.24 + phase) * 2.3, z);
        }
    };
}
