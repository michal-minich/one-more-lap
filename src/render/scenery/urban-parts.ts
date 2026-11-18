import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Point } from "../../game/point.ts";
import { material } from "../materials.ts";
import { stamp } from "./instances.ts";
import type { Stamp } from "./instances.ts";
import { surfaceTexture } from "./surface-textures.ts";
import { urbanFinishes } from "./urban-finishes.ts";

type Form = "box" | "oval" | "dome" | "leaf";
export type BuildPart = (part: string, position: Stamp, tint: string, form?: Form) => void;

interface Batch {
    readonly mesh: Mesh;
    readonly instances: Stamp[];
}

export class UrbanParts {
    readonly #scene: Scene;
    readonly #parts = new Map<string, Batch>();

    constructor(scene: Scene) {
        this.#scene = scene;
    }

    add: BuildPart = (part, position, tint, form = "box") => {
        const key = part + tint + form;
        let group = this.#parts.get(key);
        if (!group) {
            const scene = this.#scene;
            const mesh = createPart(scene, part, form);
            const paint = material(scene, part, tint);
            const finish = urbanFinishes[part] ?? (form === "leaf" ? "foliage" : undefined);
            if (finish) {
                paint.diffuseTexture = part === "brick frontage"
                    ? surfaceTexture(scene, finish, 3.25, 3.55)
                    : part === "Bellgate market paving" ? surfaceTexture(scene, finish, 5.7, 6.9)
                    : part === "Bellgate market plinth" ? surfaceTexture(scene, finish, 3.9, 2.1)
                    : part === "Bellgate tower" || part === "Bellgate masonry footing" ? surfaceTexture(scene, finish, 2, 2.7)
                    : part === "Bellgate tile roof" || part === "Bellgate hip roof" ? surfaceTexture(scene, finish, 2, 2.5)
                    : part === "Aegean temple roof" ? surfaceTexture(scene, finish, 6, 4) : surfaceTexture(scene, finish);
            }
            if (part === "lit windows" || part === "garden glass") {
                paint.emissiveColor.copyFrom(Color3.FromHexString(tint).scale(part === "lit windows" ? 0.23 : 0.10));
                paint.specularColor.set(0.24, 0.32, 0.33);
                paint.specularPower = 64;
            }
            if (part === "cast bronze" || part === "cast bronze sun shield" || part === "bronze standard") {
                paint.specularColor.set(0.18, 0.16, 0.09);
                paint.specularPower = 39;
            }
            if (part === "Ares habitat glazing") {
                paint.alpha = 0.53;
                paint.needDepthPrePass = true;
                paint.specularColor.set(0.34, 0.44, 0.49);
                paint.specularPower = 62;
                paint.emissiveColor.set(0.038, 0.074, 0.066);
            }
            if (part === "office glazing" || part === "shop glazing") {
                paint.diffuseTexture = surfaceTexture(scene, "glazing");
                paint.specularColor.set(0.22, 0.28, 0.31);
                paint.specularPower = 82;
            }
            if ((part === "solar cells" || part === "Aurora photovoltaic panels")) {
                paint.specularColor.set(0.20, 0.30, 0.43);
                paint.specularPower = 91;
            }
            if (part === "Ares cyan guide strip" || part === "Aurora arcade lantern" || part === "Glasswater bridge globe" || part === "hall lantern" || part === "entry lantern" || part === "lit lift rail" ||
                part === "orbital ring illuminated section") paint.emissiveColor.copyFrom(Color3.FromHexString(tint).scale(0.68));
            mesh.material = paint;
            group = { mesh, instances: [] };
            this.#parts.set(key, group);
        }
        group.instances.push(position);
    };

    draw(): Mesh[] {
        const meshes: Mesh[] = [];
        for (const { mesh, instances } of this.#parts.values()) {
            stamp(mesh, instances);
            meshes.push(mesh);
        }
        return meshes;
    }
}

function createPart(scene: Scene, part: string, form: Form): Mesh {
    if (part === "gable roof" || part === "snow on gable" || part === "woodland mill roof" ||
        part === "Aegean temple roof" || part === "Aegean temple pediment" || part === "alpine station roof" || part === "Bellgate tile roof") return gableRoof(scene, part);
    if (part === "hip roof" || part === "Bellgate hip roof") return MeshBuilder.CreateCylinder(part, {
        diameterTop: 0.69, diameterBottom: Math.SQRT2, height: 1, tessellation: 4,
    }, scene);
    if (part === "Ares cyan guide strip" || part === "Aurora arcade lantern" || part === "Glasswater bridge globe") return MeshBuilder.CreateSphere(part, { diameter: 1, segments: 8 }, scene);
    if (part === "Skywheel midway roof") return gableRoof(scene, part);
    if (part === "beacon cap") return MeshBuilder.CreateSphere(part, { diameter: 1, segments: 8, slice: 0.5 }, scene);
    switch (form) {
        case "oval": return MeshBuilder.CreateCylinder(part, { diameter: 1, height: 1, tessellation: 22 }, scene);
        case "dome": return MeshBuilder.CreateSphere(part, { diameter: 1, segments: 20, slice: 0.5 }, scene);
        case "leaf": return MeshBuilder.CreateIcoSphere(part, { radius: 0.5, subdivisions: 2, flat: false }, scene);
        default: return MeshBuilder.CreateBox(part, { size: 1 }, scene);
    }
}

function gableRoof(scene: Scene, name: string): Mesh {
    const mesh = new Mesh(name, scene);
    const vertices = [-0.5, 0, -0.5, 0, 1, -0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0, 1, 0.5, 0.5, 0, 0.5];
    const ends = [[0, 2, 1], [3, 4, 5]];
    const slopes = [[0, 1, 4, 3], [1, 2, 5, 4]];
    const faces = name === "Aegean temple roof" ? slopes : name === "Aegean temple pediment"
        ? ends : [...ends, ...slopes, [0, 3, 5, 2]];
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (const face of faces) {
        const start = positions.length / 3;
        for (const index of face) positions.push(...vertices.slice(index * 3, index * 3 + 3));
        if (name === "Aegean temple roof") {
            for (const index of face) uv.push(vertices[index * 3 + 2]! + 0.5, vertices[index * 3 + 1]!);
        } else {
            uv.push(...(face.length === 4 ? [0, 0, 0, 1, 1, 1, 1, 0] : [0, 0, 1, 0, 0.5, 1]));
        }
        indices.push(start, start + 1, start + 2);
        if (face.length === 4) indices.push(start, start + 2, start + 3);
    }
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.uvs = uv;
    data.normals = normals;
    data.applyToMesh(mesh);
    return mesh;
}

export function offset(center: Point, yaw: number, x: number, z: number): Point {
    return {
        x: center.x + Math.cos(yaw) * x + Math.sin(yaw) * z, y: center.y,
        z: center.z - Math.sin(yaw) * x + Math.cos(yaw) * z,
    };
}
