import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { onQuad } from "./cabin.ts";
import type { CabinGlass } from "./cabin.ts";

export class CarDamage {
    readonly #body: Mesh;
    readonly #base: readonly number[];
    readonly #normals: readonly number[];
    readonly #front: TransformNode;
    readonly #rear: TransformNode;
    readonly #scuffs: readonly LinesMesh[];
    readonly #cracks: readonly LinesMesh[];
    readonly #windshield: LinesMesh;
    readonly #halfLength: number;
    #amount = -1;

    constructor(
        scene: Scene, body: Mesh, root: TransformNode, car: CarSpec, glass: CabinGlass,
        front: TransformNode, rear: TransformNode,
    ) {
        this.#body = body;
        this.#base = [...body.getVerticesData(VertexBuffer.PositionKind)!];
        this.#normals = [...body.getVerticesData(VertexBuffer.NormalKind)!];
        this.#halfLength = car.length / 2;
        this.#front = front;
        this.#rear = rear;
        this.#scuffs = [scratch(scene, car, front, 1), scratch(scene, car, rear, -1)];
        const windshield = crack(scene, root, glass.windshield, 1);
        this.#cracks = glass.rearWindow ? [crack(scene, root, glass.rearWindow, -1), windshield] : [windshield];
        this.#windshield = windshield;
        this.set(0);
    }

    set(damage: number): void {
        if (damage === this.#amount) return;
        const previous = this.#amount;
        this.#amount = damage;
        const amount = damage / 100;
        if (damage === 0) {
            if (previous >= 0) {
                this.#body.updateVerticesData(VertexBuffer.PositionKind, [...this.#base], true);
                this.#body.updateVerticesData(VertexBuffer.NormalKind, [...this.#normals]);
            }
        } else {
            this.#deform(amount);
        }
        this.#front.position.z = -this.#halfLength * amount * 0.13;
        this.#front.rotation.z = amount * 0.068;
        this.#rear.position.z = this.#halfLength * amount * 0.13;
        this.#rear.rotation.z = -amount * 0.085;
        this.#scuffs.forEach(mark => {
            mark.setEnabled(damage >= 6);
            mark.alpha = Math.min(0.94, 0.18 + amount * 1.2);
        });
        this.#cracks.forEach(mark => {
            mark.setEnabled(damage >= (mark === this.#windshield ? 35 : 19));
            mark.alpha = Math.min(0.88, 0.27 + amount * 0.85);
        });
    }

    #deform(amount: number): void {
        const positions = [...this.#base];
        for (let i = 0; i < positions.length; i += 3) {
            const x = this.#base[i]!;
            const y = this.#base[i + 1]!;
            const z = this.#base[i + 2]!;
            const edge = Math.max(0, Math.abs(z) / this.#halfLength - 0.48) / 0.52;
            const wrinkle = Math.sin(x * 4 + z * 2.4);
            positions[i] = x * (1 - amount * edge * (0.08 + 0.036 * wrinkle));
            positions[i + 1] = y + amount * edge * (wrinkle * 0.104 - 0.018);
            positions[i + 2] = z * (1 - amount * edge * 0.13);
        }
        const normals: number[] = [];
        VertexData.ComputeNormals(positions, this.#body.getIndices()!, normals);
        this.#body.updateVerticesData(VertexBuffer.PositionKind, positions, true);
        this.#body.updateVerticesData(VertexBuffer.NormalKind, normals);
    }
}

function scratch(scene: Scene, car: CarSpec, parent: TransformNode, side: number): LinesMesh {
    const line = (x: number, y: number): Vector3 =>
        new Vector3(x * car.width, car.nose - 0.60 + y, side * (car.length * 0.5 + 0.063));
    const scratches = MeshBuilder.CreateLineSystem("exposed paint scratches", { lines: [
        [line(-0.38, -0.067), line(-0.29, -0.026), line(-0.20, -0.039), line(-0.135, 0.005)],
        [line(-0.35, -0.086), line(-0.22, -0.069), line(-0.13, -0.025)],
        [line(0.13, 0.020), line(0.26, -0.024), line(0.37, -0.015)],
    ] }, scene);
    scratches.parent = parent;
    scratches.color = Color3.FromHexString("#e1ccaf");
    return scratches;
}

function crack(scene: Scene, root: TransformNode, face: CabinGlass["windshield"], side: number): LinesMesh {
    const point = (x: number, y: number): Vector3 => onQuad(face, x, y).addInPlaceFromFloats(0, 0.003, side * 0.009);
    const center = point(0.63, 0.41);
    const lines = MeshBuilder.CreateLineSystem("star cracks in glass", { lines: [
        [center, point(0.39, 0.60), point(0.18, 0.58), point(0.04, 0.73)],
        [center, point(0.78, 0.53), point(0.94, 0.82)],
        [center, point(0.69, 0.22), point(0.83, 0.09)],
        [center, point(0.56, 0.27), point(0.29, 0.06)],
        [point(0.39, 0.60), point(0.33, 0.79), point(0.26, 0.92)],
        [point(0.69, 0.22), point(0.61, 0.18), point(0.55, 0.22)],
    ] }, scene);
    lines.parent = root;
    lines.color = Color3.FromHexString("#d6edf1");
    return lines;
}
