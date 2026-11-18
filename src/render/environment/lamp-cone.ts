import { Constants } from "@babylonjs/core/Engines/constants.js";
import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { material } from "../materials.ts";

const sections = 20;
const profile = [[0, 0.02], [0.07, 0.21], [0.26, 0.17], [0.52, 0.12], [0.77, 0.067], [1, 0]] as const;

export function lampCone(scene: Scene, color: string): Mesh {
    const mesh = new Mesh("streetlight volume", scene);
    const positions: number[] = [];
    const colors: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    for (const [width, strength] of [[0.42, 0.56], [0.65, 0.48], [0.84, 0.31], [1, 0.18]] as const) {
        const base = positions.length / 3;
        for (const [ring, [t, alpha]] of profile.entries()) {
            const radius = width * (0.012 + 0.488 * t);
            const slope = 0.488 * width;
            const normalLength = Math.hypot(1, slope);
            for (let side = 0; side < sections; side++) {
                const angle = side * 2 * Math.PI / sections;
                positions.push(Math.cos(angle) * radius, 0.5 - t, Math.sin(angle) * radius);
                normals.push(Math.cos(angle) / normalLength, slope / normalLength, Math.sin(angle) / normalLength);
                colors.push(1, 1, 1, alpha * strength);
                if (ring === 0) continue;
                const from = base + (ring - 1) * sections;
                const next = (side + 1) % sections;
                indices.push(from + side, from + next, from + side + sections,
                    from + next, from + next + sections, from + side + sections);
            }
        }
    }
    const data = new VertexData();
    data.positions = positions;
    data.colors = colors;
    data.normals = normals;
    data.indices = indices;
    data.applyToMesh(mesh);
    mesh.hasVertexAlpha = true;
    mesh.isPickable = false;
    const paint = material(scene, "volumetric streetlight scatter", color);
    paint.disableLighting = true;
    paint.emissiveColor.copyFrom(paint.diffuseColor);
    paint.emissiveFresnelParameters = new FresnelParameters({
        leftColor: new Color3(0.035, 0.035, 0.035), rightColor: Color3.White(), bias: 0, power: 1.12,
    });
    paint.disableDepthWrite = true;
    paint.backFaceCulling = false;
    paint.alphaMode = Constants.ALPHA_ADD;
    paint.alpha = 0;
    mesh.material = paint;
    return mesh;
}
