import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pirateBerth, pirateCove } from "../../../game/course/reef-lagoon.ts";
import { material } from "../../materials.ts";
import { batchRigidMeshes } from "../../rigid-meshes.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawPirateShip(scene: Scene, course: Course): (time: number) => void {
    const row = course.at(pirateCove.distance);
    const at = pirateBerth(course);
    const root = new TransformNode("pirate ship", scene);
    root.position.set(at.x, -0.8, at.z);
    root.scaling.setAll(1.61);
    const heading = Math.atan2(row.dx, row.dz) - 1.43;
    root.rotation.y = heading;
    const wood = material(scene, "ship oak planks", "#785548");
    wood.diffuseTexture = surfaceTexture(scene, "boards");
    const trim = material(scene, "ship oak trim", "#a6844c");
    trim.diffuseTexture = wood.diffuseTexture;
    const black = material(scene, "ship ironwork", "#383d41");
    black.diffuseTexture = surfaceTexture(scene, "weathered steel");
    const glass = material(scene, "ship stern glazing", "#d4a568");
    glass.emissiveColor.set(0.36, 0.21, 0.09);
    const cloth = material(scene, "ship linen sails", "#ded3b5");
    cloth.diffuseTexture = surfaceTexture(scene, "airship fabric");
    cloth.backFaceCulling = false;
    const hull = new ActorMeshes(scene, root);
    drawHull(scene, root, wood, trim);
    hull.hull("raised stern cabin", [7.5, 3.3, 8.5], [0, 5.74, -8.8], wood);
    hull.hull("stern cabin roof", [8.4, 0.5, 8.8], [0, 7.48, -8.8], trim);
    hull.hull("bowsprit", [0.53, 0.68, 8.2], [0, 6.04, 14.7], trim).rotation.x = -0.18;
    for (const side of [-1, 1]) {
        for (let port = 0; port < 6; port++) {
            const z = -7.3 + port * 2.85;
            const x = halfBeam(z);
            hull.box("gunport brass frame", [0.31, 1.02, 1.2], [side * x, 3.71, z], trim);
            hull.box("gunport shutter", [0.35, 0.75, 0.91], [side * (x + 0.02), 3.71, z], black);
        }
        for (const z of [-10.7, -8.5, -6.3]) {
            hull.box("stern glazing frame", [0.19, 1.32, 1.48], [side * 3.75, 6.03, z], trim);
            hull.box("stern glazing", [0.24, 1.02, 1.14], [side * 3.76, 6.03, z], glass);
        }
    }
    for (const x of [-2.65, 0, 2.65]) {
        hull.box("transom window frame", [1.34, 1.33, 0.21], [x, 6.16, -13.05], trim);
        hull.box("transom window", [1.02, 1.02, 0.24], [x, 6.16, -13.11], glass);
    }
    for (const [z, height, span] of [[-7.1, 14.9, 8.8], [1.9, 19.1, 11.1], [10.0, 14.3, 8.1]] as const) {
        hull.box("oak mast", [0.61, height, 0.61], [0, 4.3 + height / 2, z], wood);
        for (const fraction of [0.48, 0.82]) {
            const y = 4.9 + height * fraction;
            const width = span * (fraction > 0.5 ? 0.74 : 1);
            hull.box("wooden yardarm", [width + 0.95, 0.21, 0.21], [0, y, z], wood);
            const sail = sailSurface(width, height * 0.3);
            const canvas = surface(scene, "curved linen sail", sail, cloth);
            canvas.parent = root;
            canvas.position.set(0, y, z + 0.19);
        }
    }
    const flag = material(scene, "pirate swallowtail", "#363149");
    flag.backFaceCulling = false;
    const banner = surface(scene, "forked mast pennant", {
        positions: new Float32Array([0, 0, 0, 3.3, 0.12, 0.18, 2.54, -0.52, 0.1, 3.4, -1.11, 0.21, 0, -1.06, 0]),
        uv: new Float32Array([0, 0, 1, 0, 0.76, 0.5, 1, 1, 0, 1]),
        indices: new Uint32Array([0, 1, 2, 0, 2, 4, 2, 3, 4]),
    }, flag);
    banner.position.set(0.28, 22.4, 1.9);
    banner.parent = root;
    batchRigidMeshes(root);
    return time => {
        root.position.y = -0.8 + Math.sin(time * 0.91) * 0.24;
        root.rotation.x = Math.sin(time * 0.77) * 0.020;
        root.rotation.z = Math.cos(time * 0.68) * 0.044;
    };
}

const stations = [[-14.1, 1.1], [-13.1, 2.9], [-10, 4.02], [-6, 4.47], [0, 4.67],
    [5.7, 4.47], [9.5, 3.55], [12.5, 2.19], [15.0, 0.18]] as const;

function halfBeam(z: number): number {
    for (let i = 1; i < stations.length; i++) {
        const [b, w] = stations[i]!;
        if (z > b) continue;
        const [a, v] = stations[i - 1]!;
        return v + (w - v) * (z - a) / (b - a);
    }
    return stations.at(-1)![1];
}

function drawHull(scene: Scene, root: TransformNode, wood: StandardMaterial, trim: StandardMaterial): void {
    const profile = [[-0.88, 0.19], [-0.31, 0.53], [0.54, 0.83], [1.58, 0.99],
        [3.42, 1.017], [4.45, 0.98], [4.89, 0.96]] as const;
    const width = profile.length;
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    for (const side of [-1, 1]) {
        const start = positions.length / 3;
        for (const [station, [z, beam]] of stations.entries()) {
            const sheer = Math.abs(z / 14.5) ** 2 * 1.11;
            for (const [ring, [y, spread]] of profile.entries()) {
                positions.push(side * beam * spread, y + sheer * (ring + 2) / (width + 1), z);
                uv.push(z / 7.8, y / 3.8);
                if (station === 0 || ring === 0) continue;
                const i = start + station * width + ring;
                if (side < 0) indices.push(i - width - 1, i - width, i - 1, i - width, i, i - 1);
                else indices.push(i - width - 1, i - 1, i - width, i - width, i - 1, i);
            }
        }
    }
    wood.backFaceCulling = false;
    const shell = surface(scene, "shaped oak ship hull", {
        positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices),
    }, wood);
    shell.parent = root;
    const parts = new ActorMeshes(scene, root);
    for (const side of [-1, 1]) {
        for (let i = 1; i < stations.length; i++) {
            const [a, aw] = stations[i - 1]!;
            const [b, bw] = stations[i]!;
            const x = (aw + bw) * 0.48 * side;
            const z = (a + b) / 2;
            const rail = parts.box("sheer rail", [0.24, 0.26, Math.hypot(b - a, bw - aw) + 0.1],
                [x, 4.94 + Math.abs(z / 14.5) ** 2 * 1.12, z], trim);
            rail.rotation.y = Math.atan2((bw - aw) * 0.96 * side, b - a);
        }
    }
    parts.hull("oak weather deck", [8.85, 0.35, 26], [0, 4.7, 0], trim);
    parts.hull("stern transom", [6.2, 4.16, 0.89], [0, 3.23, -12.71], wood);
}

function sailSurface(width: number, height: number) {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    for (let row = 0; row <= 4; row++) {
        const v = row / 4;
        for (let col = 0; col <= 8; col++) {
            const u = col / 8;
            const belly = Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
            positions.push((u - 0.5) * width * (1 - v * 0.11), -v * height, belly * 1.85);
            uv.push(u, v);
            if (!row || !col) continue;
            const i = row * 9 + col;
            indices.push(i - 10, i - 1, i - 9, i - 9, i - 1, i);
        }
    }
    return {positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv)};
}
