import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { material } from "../../materials.ts";
import type { AnimateScenery } from "../course-attractions.ts";
import { stamp } from "../instances.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawBellgateFountains(scene: Scene, course: Course): AnimateScenery {
    const fountains = course.biomeLandmarks.filter(site => site.kind === "bellgate-fountain");
    const water = MeshBuilder.CreateDisc("Bellgate fountain pools", { radius: 1, tessellation: 32 }, scene);
    const pool = material(scene, "Bellgate fountain water", "#60a8a7");
    const ripples = surfaceTexture(scene, "river ripples", 1.66, 1.46).clone();
    pool.diffuseTexture = ripples;
    pool.specularColor.set(0.4, 0.56, 0.62);
    pool.specularPower = 89;
    pool.backFaceCulling = false;
    water.material = pool;
    water.receiveShadows = true;
    stamp(water, fountains.map(({ x, y, z, height }) => {
        const radius = height * 0.425;
        return { x, y: y + height * 0.234, z, sx: radius, sy: radius, sz: 1, yaw: 0, pitch: Math.PI / 2 };
    }));

    const spray = MeshBuilder.CreateIcoSphere("Bellgate falling water", { radius: 1, subdivisions: 1 }, scene);
    const foam = material(scene, "Bellgate moving water droplets", "#c3e7dd");
    foam.emissiveColor.set(0.14, 0.24, 0.22);
    foam.specularColor.set(0.31, 0.49, 0.55);
    spray.material = foam;
    spray.isPickable = false;
    const streams = 6;
    const packets = 13;
    const matrices = new Float32Array(fountains.length * streams * packets * 16);
    const update = (time: number): void => {
        let instance = 0;
        for (const { x, y, z, height, yaw } of fountains) {
            for (let stream = 0; stream < streams; stream++) {
                const angle = yaw + stream * 2 * Math.PI / streams;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                for (let packet = 0; packet < packets; packet++) {
                    const progress = (time * 0.9 + packet / packets + stream * 0.031) % 1;
                    const radius = height * (0.155 + 0.262 * progress);
                    const scale = height * (0.0062 + 0.0023 * Math.sin(packet * 2.8));
                    const offset = instance++ * 16;
                    matrices[offset] = scale;
                    matrices[offset + 5] = scale * (1.55 + progress * 1.54);
                    matrices[offset + 10] = scale;
                    matrices[offset + 12] = x + cos * radius;
                    matrices[offset + 13] = y + height * (0.89 + 0.2 * progress - 0.84 * progress * progress);
                    matrices[offset + 14] = z + sin * radius;
                    matrices[offset + 15] = 1;
                }
            }
        }
    };
    update(0);
    spray.thinInstanceSetBuffer("matrix", matrices, 16, false);
    return time => {
        ripples.uOffset = time * 0.061 % 1;
        ripples.vOffset = time * 0.032 % 1;
        update(time);
        spray.thinInstanceBufferUpdated("matrix");
    };
}
