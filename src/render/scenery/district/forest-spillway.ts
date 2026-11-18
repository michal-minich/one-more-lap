import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { ForestSpillway } from "../../../game/course/forest-spillway.ts";
import { cloudMask } from "../../environment/cloud-mask.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawForestSpillway(scene: Scene, spillway: ForestSpillway): (time: number, daylight: number) => void {
    const rocks = material(scene, "Blackwood spillway slate", "#c6c9c9");
    rocks.diffuseTexture = surfaceTexture(scene, "woodland slate", 0.48, 0.42);
    rocks.specularColor.set(0.045, 0.063, 0.074);
    for (const bank of spillway.banks) surface(scene, "Blackwood spillway bank", bank, rocks).convertToFlatShadedMesh();
    const water = material(scene, "Blackwood spillway whitewater", "#c1e7e7");
    const film = surfaceTexture(scene, "whitewater", 0.82, 0.64);
    water.diffuseTexture = film;
    water.emissiveTexture = film;
    water.emissiveColor.set(0.06, 0.21, 0.28);
    water.specularColor.set(0.39, 0.60, 0.64);
    water.specularPower = 39;
    water.backFaceCulling = false;
    surface(scene, "Blackwood flowing spillway", spillway.water, water).receiveShadows = false;
    const mask = cloudMask(scene, 2_511);
    for (const pool of spillway.pools) {
        const mist = new ParticleSystem("Blackwood fine pool spray", 29, scene);
        mist.particleTexture = mask;
        mist.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        mist.emitter = new Vector3(pool.x, pool.y + 0.25, pool.z);
        mist.minEmitBox.set(-2.75, 0, -1.8);
        mist.maxEmitBox.set(2.75, 0.55, 1.8);
        mist.color1 = new Color4(0.75, 0.94, 0.96, 0.31);
        mist.color2 = new Color4(0.78, 0.9, 0.96, 0.21);
        mist.colorDead = new Color4(0.76, 0.88, 0.91, 0);
        mist.minSize = 1.35;
        mist.maxSize = 4.9;
        mist.minLifeTime = 1.15;
        mist.maxLifeTime = 2.5;
        mist.direction1.set(-0.48, 0.8, -0.42);
        mist.direction2.set(0.85, 1.52, 0.7);
        mist.emitRate = 13;
        mist.preWarmCycles = 45;
        mist.preWarmStepOffset = 5;
        mist.start();
    }
    return (time, daylight) => {
        film.vOffset = time * 0.77 % 1;
        const lift = 0.12 + daylight * 0.72;
        water.emissiveColor.set(lift * 0.045, lift * 0.15, lift * 0.18);
    };
}
