import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import type { Point } from "../../game/point.ts";
import type { Course } from "../../game/course/course.ts";
import { material } from "../materials.ts";

const falloffs = new Map<number, ImageData>();

function falloffPixels(opacity: number): ImageData {
    const cached = falloffs.get(opacity);
    if (cached) return cached;
    const image = new ImageData(128, 128);
    for (let y = 0; y < 128; y++) {
        for (let x = 0; x < 128; x++) {
            const u = (x + 0.5) / 64 - 1;
            const v = (y + 0.5) / 64 - 1;
            const distance = Math.hypot(u * 1.12, v * 1.1);
            const falloff = Math.max(0, 1 - distance ** 2.6) ** 2.3;
            const i = (y * 128 + x) * 4;
            image.data[i] = 9;
            image.data[i + 1] = 16;
            image.data[i + 2] = 25;
            image.data[i + 3] = Math.round(opacity * falloff);
        }
    }
    falloffs.set(opacity, image);
    return image;
}

export function contactShadowMaterial(scene: Scene, opacity = 143): StandardMaterial {
    const texture = new DynamicTexture("soft shadow falloff", 128, scene, true);
    texture.getContext().putImageData(falloffPixels(opacity), 0, 0);
    texture.update(false);
    texture.hasAlpha = true;
    const shade = material(scene, "soft contact shade", "#ffffff");
    shade.diffuseTexture = texture;
    shade.useAlphaFromDiffuseTexture = true;
    shade.disableLighting = true;
    shade.disableDepthWrite = true;
    shade.specularColor.set(0, 0, 0);
    return shade;
}

export class ContactShadow {
    readonly #mesh: Mesh;
    readonly #course: Course;
    readonly #width: number;
    readonly #length: number;
    readonly #vertices = new Float32Array(12);

    constructor(scene: Scene, course: Course, car: CarSpec, shade: StandardMaterial) {
        this.#course = course;
        this.#width = car.width;
        this.#length = car.length;
        this.#mesh = new Mesh("soft shadow under " + car.name, scene);
        const data = new VertexData();
        data.positions = this.#vertices;
        data.indices = [0, 1, 2, 1, 3, 2];
        data.uvs = [0, 0, 1, 0, 0, 1, 1, 1];
        data.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
        data.applyToMesh(this.#mesh, true);
        this.#mesh.material = shade;
        this.#mesh.isPickable = false;
        this.#mesh.alwaysSelectAsActiveMesh = true;
    }

    move(position: Point, yaw: number, daylight: number): void {
        const ground = this.#course.ground;
        const elevation = ground.at(position.x, position.z, position.y + 0.2);
        if (elevation === undefined) {
            this.#mesh.visibility = 0;
            return;
        }
        const clearance = Math.max(0, position.y - elevation - 0.61);
        const alpha = Math.max(0, 1 - clearance * 0.21);
        this.#mesh.visibility = alpha * (0.44 + daylight * 0.56);
        if (alpha === 0) return;
        const hx = Math.sin(yaw);
        const hz = Math.cos(yaw);
        const spread = Math.min(1.5, clearance * 0.31);
        const width = this.#width * 0.86 + spread;
        const length = this.#length * 0.71 + spread;
        const corners = [[-width, -length], [width, -length], [-width, length], [width, length]] as const;
        for (const [i, [right, forward]] of corners.entries()) {
            const x = hz * right + hx * forward;
            const z = -hx * right + hz * forward;
            const height = ground.at(position.x + x, position.z + z, position.y + 1) ?? elevation;
            this.#vertices.set([position.x + x, height + 0.067, position.z + z], i * 3);
        }
        this.#mesh.updateVerticesData(VertexBuffer.PositionKind, this.#vertices);
    }
}
