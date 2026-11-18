import { PointLight } from "@babylonjs/core/Lights/pointLight.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import type { Point } from "../../../game/point.ts";
import { channelPoint } from "../../../game/course/water.ts";
import type { WaterBody } from "../../../game/course/water.ts";
import { cloudMask } from "../../environment/cloud-mask.ts";
import { material } from "../../materials.ts";
import type { Attraction } from "../course-attractions.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { drawCalderaAshworks } from "./ashworks.ts";
import { drawEscarpment } from "./escarpment.ts";
import { drawLavaBanks } from "./lava-banks.ts";
import { drawLava } from "./lava.ts";
import { channelLightSources, galleryLightSources } from "./lava-light.ts";
import { drawCalderaRidges } from "./ridges.ts";

export function drawCaldera(scene: Scene, course: Course): Attraction {
    const lava = course.water.find(body => body.kind === "lava")!;
    const runoff = course.calderaRunoff!;
    const crater = course.calderaCrater!;
    const stone = material(scene, "broken caldera strata", "#c9bdc6");
    stone.diffuseTexture = surfaceTexture(scene, "basalt");
    stone.emissiveColor.set(0.16, 0.125, 0.12);
    stone.backFaceCulling = false;
    surface(scene, "split caldera ridge", crater.rock, stone, () => crater.colors).convertToFlatShadedMesh();
    drawCalderaRidges(scene, course.calderaRidges!);
    const shadowCasters = drawCalderaAshworks(scene, course.calderaAshworks!);
    const flow = drawLava(scene, lava, runoff);
    drawEscarpment(scene, course);
    drawLavaBanks(scene, course, lava);
    const sources = [...channelLightSources(course), ...galleryLightSources(course)]
        .map(({ x, y, z }) => new Vector3(x, y, z));
    const light = new PointLight("warm light from the lava", sources[0]!.clone(), scene);
    light.diffuse = Color3.FromHexString("#ff6e2d");
    light.specular.set(0.28, 0.087, 0.02);
    light.range = 54;
    steam(scene, lava, crater.vent, runoff.cascade);
    const animate = (seconds: number): void => {
        flow(seconds);
        const camera = scene.activeCamera?.globalPosition;
        if (!camera) return;
        let strength = 0;
        light.position.set(0, 0, 0);
        for (const source of sources) {
            const reach = Math.max(0, 1 - Vector3.DistanceSquared(camera, source) / light.range ** 2);
            const weight = reach ** 3;
            light.position.addInPlaceFromFloats(source.x * weight, source.y * weight, source.z * weight);
            strength += weight;
        }
        if (strength > 0) light.position.scaleInPlace(1 / strength);
        light.intensity = Math.min(1, strength * 3.6) * (1.45 + 0.063 * Math.sin(seconds * 2.3));
    };
    return { animate, shadowCasters };
}

function steam(scene: Scene, lava: WaterBody, crater: Point, cascade: Point): void {
    const texture = cloudMask(scene, 2_307);
    const vents = [[-0.79, 0.14], [-0.65, 0.41], [-0.42, 0.33], [-0.19, 0.29], [0.46, -0.22]] as const;
    const sites = vents.map(([along, bank]) => {
        const point = channelPoint(lava, along, bank);
        return new Vector3(point.x, point.y + 0.5, point.z);
    });
    sites.push(new Vector3(cascade.x, cascade.y - 1.4, cascade.z), new Vector3(crater.x, crater.y, crater.z));
    for (const [index, site] of sites.entries()) {
        const high = index === sites.length - 1;
        const cloud = new ParticleSystem("drifting volcanic steam", high ? 48 : 26, scene);
        cloud.particleTexture = texture;
        cloud.emitter = site;
        cloud.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        cloud.minEmitBox.set(-3.2, 0, -1.6);
        cloud.maxEmitBox.set(3.2, 1.5, 1.6);
        cloud.color1 = new Color4(0.95, 0.89, 0.85, 0.44);
        cloud.color2 = new Color4(0.69, 0.7, 0.75, 0.3);
        cloud.colorDead = new Color4(0.61, 0.62, 0.67, 0);
        cloud.minSize = high ? 12.5 : 5.6;
        cloud.maxSize = high ? 29 : 11.5;
        cloud.minInitialRotation = -1.3;
        cloud.maxInitialRotation = 1.3;
        cloud.minAngularSpeed = -0.34;
        cloud.maxAngularSpeed = 0.38;
        cloud.minLifeTime = 3.5;
        cloud.maxLifeTime = 6.4;
        cloud.direction1.set(-0.36, 1.8, -0.42);
        cloud.direction2.set(1.3, high ? 5.1 : 3.6, 1.38);
        cloud.emitRate = high ? 8 : 5;
        cloud.preWarmCycles = 85;
        cloud.preWarmStepOffset = 4;
        cloud.start();
    }
}
