import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Constants } from "@babylonjs/core/Engines/constants.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Point } from "../../game/point.ts";
import type { Course } from "../../game/course/course.ts";
import { ROAD_HALF } from "../../game/course/route.ts";
import { material } from "../materials.ts";

const SEGMENTS = 9;
const ROWS = SEGMENTS + 1;

export class WetHeadlights {
    readonly #mesh: Mesh;
    readonly #paint: StandardMaterial;
    readonly #course: Course;
    readonly #positions = new Float32Array(ROWS * 4 * 3);
    readonly #colors = new Float32Array(ROWS * 4 * 4).fill(1);

    constructor(scene: Scene, course: Course) {
        this.#course = course;
        this.#mesh = new Mesh("rough wet headlight streaks", scene);
        this.#paint = material(scene, "warm headlight sheen", "#eddfb5");
        this.#paint.diffuseTexture = wetLampMask(scene);
        this.#paint.useAlphaFromDiffuseTexture = true;
        this.#paint.disableLighting = true;
        this.#paint.disableDepthWrite = true;
        this.#paint.alphaMode = Constants.ALPHA_ADD;
        this.#mesh.material = this.#paint;
        this.#mesh.isPickable = false;
        this.#mesh.alwaysSelectAsActiveMesh = true;
        this.#mesh.hasVertexAlpha = true;
        this.#mesh.alphaIndex = 2;

        const indices: number[] = [];
        const normals: number[] = [];
        const uv: number[] = [];
        for (let lamp = 0; lamp < 2; lamp++) {
            for (let row = 0; row < ROWS; row++) {
                uv.push(0, row / SEGMENTS, 1, row / SEGMENTS);
                normals.push(0, 1, 0, 0, 1, 0);
                if (row === 0) continue;
                const before = (lamp * ROWS + row - 1) * 2;
                indices.push(before, before + 1, before + 2, before + 1, before + 3, before + 2);
            }
        }
        const data = new VertexData();
        data.positions = this.#positions;
        data.colors = this.#colors;
        data.indices = indices;
        data.normals = normals;
        data.uvs = uv;
        data.applyToMesh(this.#mesh, true);
        this.#mesh.setEnabled(false);
    }

    update(car: Point, facing: Point, wet: number, daylight: number): void {
        const strength = wet * (0.17 + (1 - daylight) * 0.52);
        const active = strength > 0.03;
        this.#mesh.setEnabled(active);
        if (!active) return;
        this.#paint.alpha = strength;
        const magnitude = Math.hypot(facing.x, facing.z) || 1;
        const dx = facing.x / magnitude;
        const dz = facing.z / magnitude;

        for (let lamp = 0; lamp < 2; lamp++) {
            for (let row = 0; row < ROWS; row++) {
                const t = row / SEGMENTS;
                const forward = 1.6 + 22 * t;
                const center = (lamp === 0 ? -1 : 1) * (0.49 + t * 0.20);
                const width = 0.45 + t * 0.85;
                for (let edge = 0; edge < 2; edge++) {
                    const offset = center + (edge === 0 ? -width : width);
                    const x = car.x + dx * forward + dz * offset;
                    const z = car.z + dz * forward - dx * offset;
                    const point = this.#course.locate({ x, y: car.y, z });
                    const vertex = (lamp * ROWS + row) * 2 + edge;
                    this.#positions.set([x, point.elevation + 0.059, z], vertex * 3);
                    const fade = Math.min(1, Math.max(0, (ROAD_HALF - Math.abs(point.lateral)) * 0.8));
                    const drop = Math.max(0, 1 - Math.max(0, Math.abs(car.y - point.elevation) - 2.5) * 0.11);
                    this.#colors[vertex * 4 + 3] = this.#course.isGap(point.distance, 2.45) ? 0 : fade * drop;
                }
            }
        }
        this.#mesh.updateVerticesData(VertexBuffer.PositionKind, this.#positions);
        this.#mesh.updateVerticesData(VertexBuffer.ColorKind, this.#colors);
    }
}

function wetLampMask(scene: Scene): DynamicTexture {
    const texture = new DynamicTexture("broken soft headlight gradient", { width: 64, height: 128 }, scene, true);
    const image = new ImageData(64, 128);
    for (let y = 0; y < 128; y++) {
        const t = (y + 0.5) / 128;
        for (let x = 0; x < 64; x++) {
            const u = (x + 0.5) / 32 - 1;
            const stretch = Math.sin(t * 93 + u * 5.1) * 0.18 + Math.sin(t * 39 - u * 17) * 0.20;
            const jag = Math.sin(t * 74) * 0.15 + Math.cos(t * 124 + u * 14) * 0.08;
            const sideways = Math.max(0, 1 - ((u + jag) * 1.14) ** 2) ** 2.1;
            const length = Math.min(1, t * 11) * (1 - t) ** 1.6;
            const i = (y * 64 + x) * 4;
            image.data[i] = 255;
            image.data[i + 1] = 253;
            image.data[i + 2] = 245;
            image.data[i + 3] = Math.round(225 * sideways * length * Math.max(0.22, 0.63 + stretch));
        }
    }
    texture.getContext().putImageData(image, 0, 0);
    texture.update(false);
    texture.hasAlpha = true;
    return texture;
}
