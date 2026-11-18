import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../game/course/course.ts";
import type { Point } from "../game/point.ts";
import type { RaceCoin } from "../game/race/coin-field.ts";
import type { Conditions } from "../game/race/conditions.ts";
import type { RivalSpec } from "../game/race/opponents.ts";
import type { Setup } from "../game/race/setup.ts";
import { bodyForward } from "../game/vehicle/pose.ts";
import type { VehiclePose } from "../game/vehicle/pose.ts";
import { RaceCamera } from "./camera/race-camera.ts";
import type { CameraKick } from "./camera/race-camera.ts";
import { CarModel } from "./car/model.ts";
import { reflectionSky, tintedGlass } from "./car/reflections.ts";
import { RaceEnvironment } from "./environment/race-environment.ts";
import type { SurfaceActivity } from "./environment/race-environment.ts";
import { garageRoof, parkCar } from "./garage-preview.ts";
import { ContactShadow, contactShadowMaterial } from "./scenery/contact-shadow.ts";
import { createScenery } from "./scenery/scenery.ts";
import { SpeedBlur } from "./environment/speed-blur.ts";

interface RenderCar {
    readonly model: CarModel;
    readonly shadow: ContactShadow;
}

export interface RaceAppearance extends SurfaceActivity {
    readonly driveTime: number;
    readonly braking: boolean;
    readonly boosting: boolean;
    readonly phasing: boolean;
    readonly forwardSpeed: number;
}

interface SceneRace {
    readonly rivals: readonly RivalSpec[];
    readonly coins: readonly RaceCoin[];
}

interface SceneParts {
    readonly scene: Scene;
    readonly player: RenderCar;
    readonly rivals: readonly RenderCar[];
    readonly camera: RaceCamera;
    readonly stunt: boolean;
    readonly sky: Texture;
    readonly environment: RaceEnvironment;
    readonly garageRoof?: Vector3;
}

export class RaceSceneFactory {
    readonly #engine: AbstractEngine;
    readonly #enhancedShadows: () => boolean;

    constructor(engine: AbstractEngine, enhancedShadows: () => boolean) {
        this.#engine = engine;
        this.#enhancedShadows = enhancedShadows;
    }

    create(setup: Setup, course: Course, race?: SceneRace): RaceScene {
        const scene = new Scene(this.#engine);
        scene.skipPointerMovePicking = true;
        scene.imageProcessingConfiguration.contrast = 1.05;

        try {
            const sky = reflectionSky(scene, course.track.id);
            const scenery = createScenery(scene, course, course.raceLine(setup.direction), sky);
            const glass = tintedGlass(scene);
            const shade = contactShadowMaterial(scene);
            const player: RenderCar = {
                model: new CarModel(scene, setup.car, setup.paint, sky, glass),
                shadow: new ContactShadow(scene, course, setup.car, shade),
            };
            const rivals = (race?.rivals ?? []).map(({ car, paint }): RenderCar => {
                return {
                    model: new CarModel(scene, car, paint, sky, glass, false),
                    shadow: new ContactShadow(scene, course, car, shade),
                };
            });
            const framing = course.track.id === "caldera" ? { lift: 0.58, fov: 1.11 }
                : course.track.id === "gorge" ? { lift: 0.44, fov: 1.10 }
                    : course.track.id === "sky" ? { lift: 0.38, fov: 1.06 } : undefined;
            const camera = new RaceCamera(scene, player.model.root, course.ground, framing);
            const actors = [player, ...rivals].map(({ model }) => ({
                root: model.root, parts: model.root.getChildMeshes(),
            }));
            const environment = new RaceEnvironment(scene, course, scenery, setup.car, actors, race?.coins ?? [], this.#enhancedShadows);
            if (!race) parkCar(scene, course, player.model, camera, setup.car, setup.direction);
            return new RaceScene({
                scene, player, rivals, camera, sky, environment, stunt: course.stuntLoops.length > 0,
                ...(!race && { garageRoof: garageRoof(setup.car) }),
            });
        } catch (error) {
            scene.dispose();
            throw error;
        }
    }
}

export class RaceScene {
    readonly #parts: SceneParts;
    readonly #paintAnchor = new Vector3();
    #garageAspect = 0;
    #blur: SpeedBlur | undefined;
    readonly #reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    #time = 0;

    constructor(parts: SceneParts) {
        this.#parts = parts;
    }

    setPaint(paint: string): void {
        this.#parts.player.model.setPaint(paint);
    }

    follow(pose: VehiclePose, rivals: readonly VehiclePose[], damage: number, seconds: number, snap: boolean, kick?: CameraKick): void {
        const { player, camera } = this.#parts;
        player.model.follow(pose, damage);
        camera.follow(pose, seconds, snap, kick, this.#parts.stunt);
        for (const [index, other] of this.#parts.rivals.entries()) other.model.follow(rivals[index]!, 0);
    }

    useFirstPerson(firstPerson: boolean): void {
        this.#parts.camera.useFirstPerson(firstPerson);
    }

    get cameraWaterDepth(): number {
        const { camera, environment } = this.#parts;
        return environment.waterDepthAt(camera.view.position);
    }

    get garagePaintAnchor(): Readonly<{ x: number; y: number }> | undefined {
        const { camera, garageRoof, player, scene } = this.#parts;
        if (!garageRoof) return undefined;
        const aspect = scene.getEngine().getAspectRatio(camera.view);
        if (aspect !== this.#garageAspect) {
            this.#garageAspect = aspect;
            Vector3.ProjectToRef(garageRoof, player.model.root.getWorldMatrix(), scene.getTransformMatrix(),
                camera.view.viewport, this.#paintAnchor);
        }
        return this.#paintAnchor;
    }

    pickCoins(indices: readonly number[]): void {
        this.#parts.environment.pickCoins(indices);
    }

    flashTeleport(): void {
        this.#parts.player.model.flashTeleport(this.#time);
    }

    draw(dt: number, conditions: Conditions, race?: RaceAppearance): void {
        const { player, rivals, camera, sky, environment, scene } = this.#parts;
        if (!race) camera.fitGarage();
        this.#time += dt;
        player.model.setBoost(race?.boosting ?? false, this.#time);
        player.model.setPhase(race?.phasing ?? false, this.#time);
        sky.level = 0.24 + conditions.daylight * (0.76 - conditions.rain * 0.21);
        const facing = updateCar(player, conditions.daylight, race?.braking ?? false);
        for (const rival of rivals) updateCar(rival, conditions.daylight, false);
        camera.light = race ? Math.max(conditions.rain * 0.55, 1 - conditions.daylight) * (2.2 - race.damage / 100) : 0;
        environment.update(conditions, {
            camera: camera.view.position, car: player.model.root.position, facing, time: this.#time,
            firstPerson: camera.firstPerson, forwardSpeed: race?.forwardSpeed ?? 0,
            ...(race && { driveTime: race.driveTime }),
        }, race);
        if (race && !this.#reducedMotion.matches) {
            if (race.speed > 40) this.#blur ??= new SpeedBlur(camera.view);
            this.#blur?.update(race.speed, dt);
        } else {
            this.#blur?.update(0, 1);
        }
        scene.render();
    }

    dispose(): void {
        this.#blur?.dispose();
        this.#parts.scene.dispose();
    }
}

function updateCar(car: RenderCar, daylight: number, braking: boolean): Point {
    car.model.illuminate(daylight, braking);
    const root = car.model.root;
    const facing = bodyForward(root.rotationQuaternion!);
    car.shadow.move(root.position, Math.atan2(facing.x, facing.z), daylight);
    return facing;
}
