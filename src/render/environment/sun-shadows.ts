import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import type { Point } from "../../game/point.ts";
import type { Scenery } from "../scenery/scenery.ts";

const shadowWalls = new Set([
    "stone house", "weathered timber", "building body", "tower podium", "painted trim",
    "sheet metal warehouse", "cut limestone", "mission walls", "beacon tower",
    "garden podium", "white upper stories", "white terrace", "sail base", "atrium podium",
]);
const LOCAL_RANGE = 96;

interface ShadowInstance {
    readonly matrix: Matrix;
    readonly center: Point;
}

export class SunShadows {
    readonly #scene: Scene;
    readonly #sun: DirectionalLight;
    readonly #course: Course;
    readonly #scenery: Scenery;
    readonly #cars: readonly AbstractMesh[];
    readonly #readEnhanced: () => boolean;
    #generator: ShadowGenerator | undefined;
    #details: LocalCasters | undefined;
    #enhanced = false;

    constructor(scene: Scene, sun: DirectionalLight, course: Course, scenery: Scenery,
        cars: readonly AbstractMesh[], readEnhanced: () => boolean) {
        this.#scene = scene;
        this.#sun = sun;
        this.#course = course;
        this.#scenery = scenery;
        this.#cars = cars;
        this.#readEnhanced = readEnhanced;
        if (scenery.shadowCasters.length) this.#generator = this.#createGenerator();
    }

    update(time: number, car: Point, daylight: number): boolean {
        const enabled = this.#readEnhanced();
        if (enabled !== this.#enhanced) this.#change(enabled);
        if (enabled) this.#details?.update(time, car, daylight);
        return enabled;
    }

    #createGenerator(): ShadowGenerator {
        this.#sun.shadowFrustumSize = 144;
        this.#sun.shadowMinZ = 0.5;
        this.#sun.shadowMaxZ = 154;
        const shadows = new ShadowGenerator(1_024, this.#sun);
        shadows.usePercentageCloserFiltering = true;
        shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
        shadows.normalBias = 0.032;
        shadows.bias = 0.00034;
        shadows.setDarkness(0.22);
        for (const mesh of this.#scenery.shadowCasters) shadows.addShadowCaster(mesh, false);
        for (const mesh of this.#cars) mesh.receiveShadows = true;
        return shadows;
    }

    #change(enabled: boolean): void {
        this.#enhanced = enabled;
        if (enabled) {
            this.#details ??= new LocalCasters(this.#scene, this.#course, this.#scenery);
            const generator = this.#generator ??= this.#createGenerator();
            this.#details.attach(generator);
            generator.setDarkness(0.14);
        } else if (this.#generator && this.#details) {
            this.#details.detach(this.#generator);
            this.#generator.setDarkness(0.22);
            if (this.#scenery.shadowCasters.length === 0) {
                this.#generator.dispose();
                this.#generator = undefined;
                for (const mesh of this.#cars) mesh.receiveShadows = false;
            }
        }
    }
}

class LocalCasters {
    readonly #batches: readonly CasterBatch[];
    readonly #receivers: readonly Mesh[];
    #next = 0;
    #day = false;
    #last: Point | undefined;

    constructor(scene: Scene, course: Course, scenery: Scenery) {
        const buildingBodies = scenery.facadeMeshes.filter(mesh => shadowWalls.has(mesh.name) && mesh.thinInstanceCount > 0);
        const buildings = buildingBodies.flatMap(mesh => mesh.thinInstanceGetWorldMatrices()
            .map(matrix => ({ matrix, center: matrix.getTranslation() })));
        const conifers: ShadowInstance[] = [];
        const crowns: ShadowInstance[] = [];
        for (const { kind, ground, scale, yaw } of course.vegetation.trees) {
            const pine = kind === "spruce" || kind === "fir" || kind === "snow-pine";
            const [width, height, lift] = pine ? [2.65, 5.05, 3.84]
                : kind === "ancient-oak" ? [12.2, 4.7, 7.8]
                    : kind === "cypress" ? [1.38, 4.6, 3.63]
                        : kind === "coastal-pine" ? [5.0, 1.72, 4.4]
                            : [3.82, 2.3, kind === "olive" ? 2.59 : 3.55];
            const center = new Vector3(ground.x, ground.y + lift * scale, ground.z);
            const dimensions = new Vector3(width * scale, height * scale, width * scale * 0.91);
            const matrix = Matrix.Compose(dimensions, Quaternion.RotationYawPitchRoll(yaw, 0, 0), center);
            (pine ? conifers : crowns).push({ matrix, center });
        }
        this.#batches = [
            new CasterBatch(MeshBuilder.CreateBox("local building shadow hulls", { size: 1 }, scene), buildings, 76),
            new CasterBatch(MeshBuilder.CreateCylinder("local conifer shadow hulls",
                { height: 1, diameterTop: 0.055, diameterBottom: 1, tessellation: 8 }, scene), conifers, 84),
            new CasterBatch(MeshBuilder.CreateIcoSphere("local tree crown shadow hulls",
                { radius: 0.5, subdivisions: 1 }, scene), crowns, 84),
        ];
        this.#receivers = [...new Set([...scenery.shadowCasters, ...scenery.facadeMeshes])]
            .filter(mesh => !mesh.receiveShadows);
    }

    attach(generator: ShadowGenerator): void {
        this.#next = 0;
        for (const batch of this.#batches) generator.addShadowCaster(batch.mesh, false);
        for (const mesh of this.#receivers) mesh.receiveShadows = true;
    }

    detach(generator: ShadowGenerator): void {
        for (const batch of this.#batches) {
            batch.mesh.setEnabled(false);
            generator.removeShadowCaster(batch.mesh, false);
        }
        for (const mesh of this.#receivers) mesh.receiveShadows = false;
    }

    update(time: number, position: Point, daylight: number): void {
        const day = daylight > 0.12;
        const moved = this.#last === undefined || gapSquared(this.#last, position) > 10 ** 2;
        if (day === this.#day && time < this.#next && !moved) return;
        this.#next = time + 0.24;
        this.#last = { ...position };
        this.#day = day;
        for (const batch of this.#batches) batch.select(position, day);
    }
}

class CasterBatch {
    readonly mesh: Mesh;
    readonly #instances: readonly ShadowInstance[];
    readonly #matrices: Float32Array;

    constructor(mesh: Mesh, instances: readonly ShadowInstance[], limit: number) {
        this.mesh = mesh;
        this.#instances = instances;
        this.#matrices = new Float32Array(Math.min(limit, instances.length) * 16);
        // The explicit shadow render list ignores the camera layer mask.
        mesh.layerMask = 0;
        mesh.isPickable = false;
        mesh.setEnabled(false);
        if (instances.length) mesh.thinInstanceSetBuffer("matrix", this.#matrices, 16, false);
    }

    select(position: Point, day: boolean): void {
        const nearby = [];
        if (day) {
            for (const instance of this.#instances) {
                const gap = gapSquared(instance.center, position);
                if (gap <= LOCAL_RANGE ** 2) nearby.push({ instance, gap });
            }
        }
        nearby.sort((a, b) => a.gap - b.gap);
        const count = Math.min(nearby.length, this.#matrices.length / 16);
        this.mesh.setEnabled(count > 0);
        if (!count) return;
        for (let i = 0; i < count; i++) nearby[i]!.instance.matrix.copyToArray(this.#matrices, i * 16);
        this.mesh.thinInstanceCount = count;
        this.mesh.thinInstanceBufferUpdated("matrix");
    }
}

function gapSquared(a: Point, b: Point): number {
    return (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
}
