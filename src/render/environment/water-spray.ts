import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { WaterContact } from "../../game/course/water.ts";
import type { Point } from "../../game/point.ts";
import type { CarSpec } from "../../game/vehicle/cars.ts";

interface Jet {
    readonly emitter: Vector3;
    readonly drops: ParticleSystem;
    readonly side: number;
}

export class WaterSpray {
    readonly #jets: readonly Jet[];
    readonly #width: number;
    readonly #nose: number;
    #wading = false;

    constructor(scene: Scene, texture: Texture, car: CarSpec) {
        this.#width = car.width * 0.48;
        this.#nose = car.wheelbase * 0.46;
        this.#jets = [-1, 1].map(side => {
            const emitter = new Vector3();
            const drops = new ParticleSystem("tire spray", 180, scene);
            drops.particleTexture = texture;
            drops.emitter = emitter;
            drops.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            drops.emitRate = 0;
            drops.minEmitBox.set(-0.12, -0.01, -0.13);
            drops.maxEmitBox.set(0.12, 0.08, 0.13);
            drops.gravity.set(0, -9.81, 0);
            drops.color1 = new Color4(0.91, 0.99, 1, 0.82);
            drops.color2 = new Color4(0.51, 0.85, 0.92, 0.69);
            drops.colorDead = new Color4(0.62, 0.88, 0.92, 0);
            drops.minSize = 0.09;
            drops.maxSize = 0.33;
            drops.minLifeTime = 0.22;
            drops.maxLifeTime = 0.62;
            drops.minEmitPower = 0.72;
            drops.maxEmitPower = 1.26;
            drops.start();
            return { emitter, drops, side };
        });
    }

    update(water: WaterContact | undefined, speed: number, position: Point, facing: Point): void {
        if (!water || speed < 0.75) {
            for (const { drops } of this.#jets) drops.emitRate = 0;
            this.#wading = false;
            return;
        }
        const depth = Math.min(1, water.depth * 1.8);
        const kick = Math.min(5.2, 0.6 + speed * 0.33);
        for (const { emitter, drops, side } of this.#jets) {
            const x = side * facing.z;
            const z = -side * facing.x;
            emitter.set(
                position.x + x * this.#width + facing.x * this.#nose,
                water.level + 0.025,
                position.z + z * this.#width + facing.z * this.#nose,
            );
            drops.direction1.set(x * kick * 0.49 - facing.x * 0.65, 0.6 + kick * 0.33, z * kick * 0.49 - facing.z * 0.65);
            drops.direction2.set(x * kick - facing.x * 2.7, 1.1 + kick * 0.67, z * kick - facing.z * 2.7);
            drops.emitRate = Math.min(170, speed * 9.8) * (0.25 + depth * 0.75);
            drops.maxSize = 0.23 + depth * 0.23;
            if (!this.#wading) drops.manualEmitCount = Math.min(38, Math.ceil(speed * 2.4));
        }
        this.#wading = true;
    }
}
