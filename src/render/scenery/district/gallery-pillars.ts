import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { RockColumn } from "../../../game/course/rock-shelters.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

const profile = [
    [0, 1.09, 0.82], [0.10, 1.04, 0.91], [0.18, 0.85, 0.83], [0.31, 0.91, 0.95],
    [0.48, 0.88, 0.92], [0.56, 0.78, 0.81], [0.70, 0.91, 0.88], [0.91, 0.99, 0.97], [1.07, 1.12, 0.86],
] as const;

export function drawCopperPillars(scene: Scene, columns: readonly RockColumn[]): Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const sides = 9;
    for (const [ring, [height, radius, shade]] of profile.entries()) {
        for (let side = 0; side <= sides; side++) {
            const angle = (side % sides) / sides * Math.PI * 2;
            const width = radius * (1 + Math.sin(angle * 3 + 1.1) * 0.11);
            positions.push(width * Math.cos(angle) + Math.sin(height * 3) * 0.12, height,
                width * Math.sin(angle) - height * 0.09);
            uv.push(side / sides, height * 1.48);
            colors.push(shade, shade * (0.95 + height * 0.05), shade * 0.92, 1);
            if (ring && side) {
                const i = ring * (sides + 1) + side;
                indices.push(i - sides - 2, i - sides - 1, i, i - sides - 2, i, i - 1);
            }
        }
    }
    const stone = material(scene, "iron-banded gallery rock", "#bd987c");
    stone.diffuseTexture = surfaceTexture(scene, "copper strata");
    stone.specularColor.set(0.023, 0.020, 0.016);
    const pillar = surface(scene, "eroded Copper Gorge pillars", {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
    }, stone, () => new Float32Array(colors));
    pillar.convertToFlatShadedMesh();
    stamp(pillar, columns.map(({ x, y, z, radius, height }) =>
        ({ x, y, z, sx: radius, sy: height, sz: radius, yaw: x * 0.17 + z * 0.08 })));
    return pillar;
}
