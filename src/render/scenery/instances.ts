import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";

export interface Stamp {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly sx: number;
    readonly sy: number;
    readonly sz: number;
    readonly yaw: number;
    readonly pitch?: number;
    readonly roll?: number;
}

export function stamp(mesh: Mesh, data: readonly Stamp[]): void {
    if (!data.length) {
        mesh.setEnabled(false);
        return;
    }
    const buffer = new Float32Array(16 * data.length);
    const rotation = new Quaternion();
    const scale = new Vector3();
    const origin = new Vector3();
    const matrix = Matrix.Identity();
    for (const [index, placement] of data.entries()) {
        const { x, y, z, sx, sy, sz, yaw, pitch, roll } = placement;
        Quaternion.RotationYawPitchRollToRef(yaw, pitch ?? 0, roll ?? 0, rotation);
        scale.set(sx, sy, sz);
        origin.set(x, y, z);
        Matrix.ComposeToRef(scale, rotation, origin, matrix);
        matrix.copyToArray(buffer, index * 16);
    }
    mesh.thinInstanceSetBuffer("matrix", buffer, 16, true);
    mesh.isPickable = false;
}
