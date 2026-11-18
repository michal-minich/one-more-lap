import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { treeTrunks } from "../../../game/course/vegetation/trees.ts";
import type { TreeKind } from "../../../game/course/vegetation/trees.ts";
import { woodlandFir } from "./woodland-fir.ts";

export interface TreeMeshParts {
    readonly wood: Mesh[];
    readonly foliage: Mesh[];
    readonly snow: Mesh[];
}

export function buildTree(scene: Scene, kind: TreeKind, woodland = false): TreeMeshParts {
    const { radius, height } = treeTrunks[kind];
    const trunk = limb(scene, new Vector3(0, -0.17, 0), new Vector3(0, height, 0), radius, radius * 0.61);
    const parts: TreeMeshParts = { wood: [trunk], foliage: [], snow: [] };
    if (woodland && (kind === "fir" || kind === "spruce")) {
        parts.foliage.push(woodlandFir(scene, kind === "fir"));
    } else if (kind === "spruce" || kind === "fir" || kind === "snow-pine") {
        conifer(scene, parts, kind);
    } else if (kind === "ancient-oak") {
        oldOak(scene, parts);
    } else if (kind === "cypress") {
        parts.foliage.push(crown(scene, 0, 3.12, 0, 0.73, 2.32, 0.73, 0.83));
        parts.foliage.push(crown(scene, 0.17, 4.48, 0.12, 0.46, 1.46, 0.52, 0.98));
    } else {
        broadCrown(scene, parts, kind);
    }
    return parts;
}

function oldOak(scene: Scene, parts: TreeMeshParts): void {
    for (let i = 0; i < 7; i++) {
        const angle = i * 2.399963;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        const reach = 2.7 + Math.sin(i * 2.8) * 0.71;
        parts.wood.push(limb(scene, new Vector3(x * 0.66, 1.25, z * 0.66), new Vector3(x * reach, -0.25, z * reach),
            0.61, 0.23));
        const tip = new Vector3(x * (4.25 + Math.cos(i) * 0.84), 6.2 + Math.sin(i * 1.78) * 1.39, z * 3.9);
        const fork = new Vector3(x * 1.5, 5.65 + Math.sin(i) * 0.38, z * 1.5);
        parts.wood.push(limb(scene, new Vector3(x * 0.46, 3.1 + i % 3 * 0.4, z * 0.52), fork, 0.66, 0.41));
        parts.wood.push(limb(scene, fork, tip, 0.43, 0.19));
        parts.foliage.push(crown(scene, tip.x, tip.y + 1.32, tip.z, 2.23, 1.42, 2.08, 0.75 + i % 3 * 0.10));
        parts.foliage.push(crown(scene, tip.x * 0.70, tip.y + 2.38, tip.z * 0.71, 1.71, 1.32, 1.79, 0.88));
    }
    parts.foliage.push(crown(scene, 0.31, 9.24, -0.37, 2.86, 1.52, 2.68, 0.94));
}

function conifer(scene: Scene, parts: TreeMeshParts, kind: "spruce" | "fir" | "snow-pine"): void {
    const wide = kind !== "spruce";
    const layers = wide ? 5 : 6;
    for (let layer = 0; layer < layers; layer++) {
        const fraction = layer / layers;
        const y = 1.19 + layer * (wide ? 0.79 : 0.84);
        const radius = (wide ? 1.54 : 1.08) * (1 - fraction * 0.82);
        const height = (wide ? 2.13 : 2.47) - fraction * 0.95;
        const skirt = MeshBuilder.CreateCylinder("conifer boughs", {
            diameterBottom: radius * 2, diameterTop: 0.08, height, tessellation: 9,
        }, scene);
        skirt.position.set(Math.sin(layer * 1.8) * 0.16, y + height / 2, Math.cos(layer * 2.2) * 0.13);
        skirt.rotation.y = layer * 0.46;
        skirt.rotation.z = Math.sin(layer * 1.7) * 0.079;
        skirt.scaling.z = 0.87 + fraction * 0.17;
        tint(skirt, 0.65 + fraction * 0.26);
        parts.foliage.push(skirt);
        if (kind === "snow-pine") {
            const cap = MeshBuilder.CreateCylinder("snow on the bough", {
                diameterBottom: radius * 1.34, diameterTop: 0.045, height: height * 0.66, tessellation: 9,
            }, scene);
            cap.position.copyFrom(skirt.position);
            cap.position.y += height * 0.189;
            cap.rotation.copyFrom(skirt.rotation);
            cap.scaling.copyFrom(skirt.scaling);
            tint(cap, 0.91 + fraction * 0.08);
            parts.snow.push(cap);
        }
    }
}

function broadCrown(scene: Scene, parts: TreeMeshParts, kind: "birch" | "oak" | "coastal-pine" | "olive"): void {
    const shape = {
        birch: { fork: 2.15, high: 4.1, width: 1.23, lift: 1.21, shift: 0.15, lobes: 5, spread: 0.76 },
        oak: { fork: 1.62, high: 3.44, width: 1.49, lift: 1.06, shift: 0.09, lobes: 6, spread: 1.17 },
        "coastal-pine": { fork: 2.22, high: 4.65, width: 1.66, lift: 0.58, shift: 0.82, lobes: 5, spread: 1.16 },
        olive: { fork: 1.02, high: 2.59, width: 1.0, lift: 0.69, shift: 0.39, lobes: 5, spread: 0.93 },
    }[kind];
    const bark = treeTrunks[kind].radius;
    for (let i = 0; i < shape.lobes; i++) {
        const angle = i * 2.4;
        const spread = shape.spread * (0.76 + 0.25 * Math.sin(i * 1.6 + 0.9));
        const x = Math.cos(angle) * spread + shape.shift;
        const z = Math.sin(angle) * spread;
        const y = shape.high + Math.sin(i * 1.97) * shape.lift * 0.5;
        const scale = 0.74 + 0.29 * Math.cos(i * 1.55);
        parts.wood.push(limb(scene, new Vector3(0, shape.fork, 0), new Vector3(x * 0.79, y - shape.lift * 0.48, z * 0.78),
            bark * 0.54, bark * 0.23));
        parts.foliage.push(crown(scene, x, y, z, shape.width * scale, shape.lift * (0.86 + scale * 0.19),
            shape.width * (0.6 + scale * 0.29), 0.74 + (i % 3) * 0.11));
    }
}

function limb(scene: Scene, from: Vector3, to: Vector3, base: number, tip: number): Mesh {
    const direction = to.subtract(from);
    const height = direction.length();
    const branch = MeshBuilder.CreateCylinder("bark", { diameterBottom: base * 2, diameterTop: tip * 2, height, tessellation: 8 }, scene);
    branch.position.copyFrom(from.add(to).scaleInPlace(0.5));
    const axis = new Vector3(direction.z, 0, -direction.x);
    if (axis.lengthSquared() > 0.0001) {
        branch.rotationQuaternion = Quaternion.RotationAxis(axis.normalize(), Math.acos(direction.y / height));
    }
    return branch;
}

function crown(scene: Scene, x: number, y: number, z: number, sx: number, sy: number, sz: number, shade: number): Mesh {
    const mesh = MeshBuilder.CreateIcoSphere("crown lobe", { radius: 1, subdivisions: 2, flat: false }, scene);
    mesh.position.set(x, y, z);
    mesh.scaling.set(sx, sy, sz);
    mesh.rotation.y = x + y * 0.31;
    tint(mesh, shade);
    return mesh;
}

function tint(mesh: Mesh, base: number): void {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
    const colors: number[] = [];
    for (let i = 1; i < positions.length; i += 3) {
        const shade = base * (0.92 + Math.min(0.22, Math.max(-0.14, positions[i]! * 0.18)));
        colors.push(shade * 0.97, shade, shade * 0.96, 1);
    }
    mesh.setVerticesData(VertexBuffer.ColorKind, colors);
}
