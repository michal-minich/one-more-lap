import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem.js";
import type { Scene } from "@babylonjs/core/scene.js";
import "@babylonjs/core/Shaders/particles.vertex.js";
import "@babylonjs/core/Shaders/particles.fragment.js";
import "@babylonjs/core/ShadersWGSL/particles.vertex.js";
import "@babylonjs/core/ShadersWGSL/particles.fragment.js";
import type { Point } from "../../game/point.ts";
import type { Conditions } from "../../game/race/conditions.ts";
import { smokeAmount } from "../../game/vehicle/damage.ts";

export class RaceParticles {
    readonly #precipitation: ParticleSystem;
    readonly #sparks: ParticleSystem;
    readonly #smoke: ParticleSystem;
    readonly #emitter = new Vector3();
    readonly #impactAt = new Vector3();
    readonly #smokeAt = new Vector3();
    #smokeHidden = false;

    constructor(scene: Scene, texture: DynamicTexture) {
        const particles = (name: string, capacity: number, emitter: Vector3): ParticleSystem => {
            const system = new ParticleSystem(name, capacity, scene);
            system.emitter = emitter;
            system.particleTexture = texture;
            system.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            system.emitRate = 0;
            system.start();
            return system;
        };
        this.#precipitation = particles("rain or snow", 2_200, this.#emitter);
        this.#precipitation.minEmitBox.set(-19, 7, -18);
        this.#precipitation.maxEmitBox.set(19, 12, 29);
        this.#precipitation.minLifeTime = 0.55;
        this.#precipitation.maxLifeTime = 1.35;
        this.#precipitation.colorDead = new Color4(0.79, 0.87, 1, 0);
        this.#sparks = particles("impact sparks", 180, this.#impactAt);
        this.#sparks.color1 = new Color4(1, 0.75, 0.3, 1);
        this.#sparks.color2 = new Color4(1, 0.43, 0.15, 1);
        this.#sparks.colorDead = new Color4(1, 0.12, 0.05, 0);
        this.#sparks.direction1.set(-8, 2, -6);
        this.#sparks.direction2.set(8, 6, 6);
        this.#sparks.gravity.set(0, -15, 0);
        this.#sparks.minSize = 0.035;
        this.#sparks.maxSize = 0.12;
        this.#sparks.minLifeTime = 0.16;
        this.#sparks.maxLifeTime = 0.45;
        this.#smoke = particles("engine smoke", 210, this.#smokeAt);
        this.#smoke.color1 = new Color4(0.29, 0.3, 0.33, 0.48);
        this.#smoke.color2 = new Color4(0.16, 0.18, 0.2, 0.61);
        this.#smoke.colorDead = new Color4(0.35, 0.36, 0.37, 0);
        this.#smoke.direction1.set(-0.12, 0.4, -0.15);
        this.#smoke.direction2.set(0.3, 1.4, 0.18);
        this.#smoke.minSize = 0.30;
        this.#smoke.maxSize = 0.8;
        this.#smoke.minLifeTime = 0.78;
        this.#smoke.maxLifeTime = 2.3;
    }

    update(value: Conditions, camera: Vector3, car: Vector3, facing: Point, damage: number, impact: number,
        firstPerson: boolean, forwardSpeed: number): void {
        const { rain, snow } = value;
        this.#emitter.copyFrom(camera);
        const fallingSnow = snow > rain;
        const system = this.#precipitation;
        system.emitRate = rain * 1_680 + snow * 520;
        system.minSize = fallingSnow ? 0.095 : 0.034;
        system.maxSize = fallingSnow ? 0.22 : 0.064;
        system.minScaleY = fallingSnow ? 1 : 5.6;
        system.maxScaleY = fallingSnow ? 1 : 7.8;
        system.direction1.set(-1.9, fallingSnow ? -8 : -20, -0.5);
        system.direction2.set(0.65, fallingSnow ? -4 : -16, 0.5);
        system.color1 = new Color4(0.9, 0.94, 1, fallingSnow ? 0.85 : 0.52);
        system.color2 = new Color4(0.75, 0.85, 1, fallingSnow ? 0.7 : 0.35);
        const hideSmoke = firstPerson && forwardSpeed > (this.#smokeHidden ? 6 : 9);
        if (hideSmoke && !this.#smokeHidden) this.#smoke.reset();
        this.#smokeHidden = hideSmoke;
        const smoke = hideSmoke ? 0 : smokeAmount(damage);
        this.#smokeAt.copyFrom(car).addInPlaceFromFloats(facing.x * 1.08, 0.35, facing.z * 1.08);
        this.#smoke.emitRate = smoke * 47 + smoke * smoke * 37;
        this.#smoke.minSize = 0.23 + smoke * 0.35;
        this.#smoke.maxSize = 0.52 + smoke * 0.78;
        this.#smoke.direction1.set(-0.21 - facing.x * 0.48, 0.58, -0.23 - facing.z * 0.48);
        this.#smoke.direction2.set(0.17 - facing.x * 0.66, 1.55, 0.27 - facing.z * 0.66);
        if (impact > 0) {
            this.#impactAt.copyFrom(car).addInPlaceFromFloats(facing.x * 1.42, -0.11, facing.z * 1.42);
            this.#sparks.manualEmitCount = Math.min(75, Math.ceil(impact * 2.1));
        }
    }
}
