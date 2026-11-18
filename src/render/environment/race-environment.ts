import type { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import type { WaterContact } from "../../game/course/water.ts";
import type { Point } from "../../game/point.ts";
import type { RaceCoin } from "../../game/race/coin-field.ts";
import type { Conditions } from "../../game/race/conditions.ts";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import type { Scenery } from "../scenery/scenery.ts";
import { Atmosphere } from "./atmosphere.ts";
import { CoinModels } from "./coins.ts";
import { particleFalloff } from "./particle-texture.ts";
import { RaceParticles } from "./race-particles.ts";
import { StreetLights } from "./street-lights.ts";
import { SunShadows } from "./sun-shadows.ts";
import { WaterSpray } from "./water-spray.ts";
import { WaterSurfaces } from "./water-surfaces.ts";
import { WetRoad } from "./wet-road.ts";
import type { ReflectingCar } from "./wet-road.ts";

export interface SurfaceActivity {
    readonly damage: number;
    readonly impact: number;
    readonly speed: number;
    readonly water: WaterContact | undefined;
}

interface View {
    readonly camera: Vector3;
    readonly car: Vector3;
    readonly facing: Point;
    readonly time: number;
    readonly driveTime?: number;
    readonly firstPerson: boolean;
    readonly forwardSpeed: number;
}

export class RaceEnvironment {
    readonly #raceClock: boolean;
    readonly #animate: Scenery["animate"];
    readonly #groundShade: StandardMaterial;
    readonly #atmosphere: Atmosphere;
    readonly #shadows: SunShadows;
    readonly #particles: RaceParticles;
    readonly #spray: WaterSpray;
    readonly #lamps: StreetLights;
    readonly #wet: WetRoad;
    readonly #water: WaterSurfaces;
    readonly #coins: CoinModels;

    constructor(
        scene: Scene, course: Course, scenery: Scenery, car: CarSpec,
        actors: readonly ReflectingCar[], coins: readonly RaceCoin[], enhancedShadows: () => boolean,
    ) {
        this.#animate = scenery.animate;
        this.#raceClock = scenery.raceClock === true;
        this.#groundShade = scenery.groundShade;
        this.#atmosphere = new Atmosphere(scene, scenery, course.track.id);
        this.#shadows = new SunShadows(scene, this.#atmosphere.sun, course, scenery,
            actors.flatMap(({ parts }) => parts), enhancedShadows);
        const falloff = particleFalloff(scene);
        this.#particles = new RaceParticles(scene, falloff);
        this.#spray = new WaterSpray(scene, falloff, car);
        this.#water = new WaterSurfaces(scene, course);
        this.#lamps = new StreetLights(scene, course);
        this.#wet = new WetRoad(scene, course, actors, this.#lamps.bulbs);
        this.#coins = new CoinModels(scene, coins);
    }

    update(conditions: Conditions, view: View, activity?: SurfaceActivity): void {
        const { camera, car, facing, time } = view;
        this.#animate?.(this.#raceClock ? view.driveTime ?? time : time, conditions);
        this.#groundShade.alpha = 0.43 + conditions.daylight * 0.57;
        const enhanced = this.#shadows.update(time, car, conditions.daylight);
        this.#atmosphere.update(conditions, camera, car, time, enhanced);
        this.#particles.update(conditions, camera, car, facing, activity?.damage ?? 0, activity?.impact ?? 0,
            view.firstPerson, view.forwardSpeed);
        this.#spray.update(activity?.water, activity?.speed ?? 0, car, facing);
        this.#lamps.update(conditions, car);
        this.#wet.update(conditions, car, facing, activity !== undefined);
        this.#water.update(time);
        this.#coins.update(time);
    }

    waterDepthAt(camera: Point): number {
        return this.#water.depthAt(camera);
    }

    pickCoins(indices: readonly number[]): void {
        this.#coins.pick(indices);
    }
}
