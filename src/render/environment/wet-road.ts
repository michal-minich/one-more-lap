import { Constants } from "@babylonjs/core/Engines/constants.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { MirrorTexture } from "@babylonjs/core/Materials/Textures/mirrorTexture.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
// Register both passes before MirrorTexture creates the first blur effect.
import "@babylonjs/core/Shaders/kernelBlur.vertex.js";
import "@babylonjs/core/Shaders/kernelBlur.fragment.js";
import "@babylonjs/core/ShadersWGSL/kernelBlur.vertex.js";
import "@babylonjs/core/ShadersWGSL/kernelBlur.fragment.js";
import type { Point } from "../../game/point.ts";
import type { Conditions } from "../../game/race/conditions.ts";
import type { Course } from "../../game/course/course.ts";
import { roadHalfWidth } from "../../game/course/road-width.ts";
import { strip } from "../../game/course/surface.ts";
import { reflect } from "../car/reflections.ts";
import { material } from "../materials.ts";
import { surface } from "../scenery/surface-mesh.ts";
import { WetHeadlights } from "./wet-headlights.ts";

export interface ReflectingCar {
    readonly root: TransformNode;
    readonly parts: readonly AbstractMesh[];
}

export class WetRoad {
    readonly #course: Course;
    readonly #paint: StandardMaterial;
    readonly #mesh: Mesh;
    readonly #cars: readonly ReflectingCar[];
    readonly #lamps: readonly AbstractMesh[];
    readonly #headlights: WetHeadlights;
    #mirror: MirrorTexture | undefined;

    constructor(scene: Scene, course: Course, cars: readonly ReflectingCar[], lamps: readonly AbstractMesh[]) {
        this.#course = course;
        this.#cars = cars;
        this.#lamps = lamps;
        this.#headlights = new WetHeadlights(scene, course);
        const paint = material(scene, "broken-up wet sheen", "#000000");
        paint.diffuseTexture = puddleMask(scene);
        paint.useAlphaFromDiffuseTexture = true;
        paint.disableLighting = true;
        paint.disableDepthWrite = true;
        paint.alphaMode = Constants.ALPHA_ADD;
        this.#paint = paint;
        const wetSurface = strip(course.route, row => {
            const edge = roadHalfWidth(course.track.id, row.distance) - 0.21;
            return [-edge, 0, edge];
        }, () => 0.022, course.gap);
        this.#mesh = surface(scene, "wet patches on road", wetSurface, paint);
        this.#mesh.setEnabled(false);
        this.#mesh.alphaIndex = 1;
    }

    update(env: Conditions, car: Point, facing: Point, racing: boolean): void {
        const wet = env.rain > 0.035;
        this.#mesh.setEnabled(wet);
        this.#headlights.update(car, facing, racing ? env.rain : 0, env.daylight);
        if (!wet) return;
        const mirror = this.#mirror ?? this.#createMirror();
        this.#paint.alpha = env.rain * (0.72 + (1 - env.daylight) * 0.22);
        const here = this.#course.locate(car);
        const row = this.#course.at(here.distance);
        const grade = (this.#course.at(here.distance + 3).y - this.#course.at(here.distance - 3).y) / 6;
        const nx = row.dx * grade;
        const nz = row.dz * grade;
        const plane = mirror.mirrorPlane;
        plane.normal.set(nx, -1, nz);
        plane.d = row.y - nx * row.x - nz * row.z;
        plane.normalize();
        const reflected = [...this.#lamps];
        for (const { root, parts } of this.#cars) {
            const { x, z } = root.position;
            if ((x - car.x) ** 2 + (z - car.z) ** 2 < 64 ** 2) reflected.push(...parts);
        }
        mirror.renderList = reflected;
    }

    #createMirror(): MirrorTexture {
        const mirror = new MirrorTexture("blurred wet-road reflections", { width: 384, height: 216 },
            this.#mesh.getScene(), false);
        mirror.coordinatesMode = Texture.PROJECTION_MODE;
        mirror.wrapU = mirror.wrapV = Texture.CLAMP_ADDRESSMODE;
        mirror.renderParticles = false;
        mirror.clearColor = new Color4(0, 0, 0, 1);
        mirror.blurKernelX = 13;
        mirror.blurKernelY = 15;
        reflect(this.#paint, mirror, 0.82, 0.18);
        this.#mirror = mirror;
        return mirror;
    }
}

let puddlePixels: ImageData | undefined;

function puddleMask(scene: Scene): DynamicTexture {
    const size = 256;
    const texture = new DynamicTexture("irregular wet asphalt mask", size, scene, true);
    texture.getContext().putImageData(puddlePixels ??= makePuddlePixels(size), 0, 0);
    texture.update(false);
    texture.hasAlpha = true;
    texture.wrapU = texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.anisotropicFilteringLevel = 4;
    texture.uScale = 0.57;
    texture.vScale = 0.49;
    return texture;
}

function makePuddlePixels(size: number): ImageData {
    const image = new ImageData(size, size);
    for (let y = 0; y < size; y++) {
        const v = y / size * Math.PI * 2;
        for (let x = 0; x < size; x++) {
            const u = x / size * Math.PI * 2;
            const a = Math.sin(u * 2 + Math.sin(v * 2) * 0.8) * 0.23 + Math.cos(v * 3 + u) * 0.18;
            const b = Math.sin(u * 11 - v * 5) * 0.08 + Math.cos(u * 19 + v * 17) * 0.045;
            const amount = Math.max(0.035, Math.min(0.88, 0.41 + (a + b) * 1.6));
            image.data[(y * size + x) * 4 + 3] = Math.round(amount * 255);
        }
    }
    return image;
}
