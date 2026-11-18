import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CalderaAshworks } from "../../../game/course/caldera-ashworks.ts";
import type { Surface } from "../../../game/course/surface.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawCalderaAshworks(scene: Scene, works: CalderaAshworks): Mesh[] {
    const rock = material(scene, "weathered caldera basalt", "#8e8297");
    rock.diffuseTexture = surfaceTexture(scene, "caldera fracture");
    rock.specularColor.set(0.025, 0.023, 0.032);
    rock.emissiveColor.set(0.058, 0.044, 0.059);
    const rim = material(scene, "cool basalt beds", "#5c606c");
    rim.diffuseTexture = surfaceTexture(scene, "caldera fracture", 0.66, 0.59);
    rim.specularColor.set(0.022, 0.022, 0.025);
    rim.emissiveColor.set(0.025, 0.026, 0.034);
    const scree = material(scene, "graded ash and cinder gravel", "#696675");
    scree.diffuseTexture = surfaceTexture(scene, "caldera scree", 1.6, 1.3);
    scree.specularColor.set(0.027, 0.024, 0.028);
    scree.emissiveColor.set(0.034, 0.027, 0.03);
    for (const [index, apron] of works.aprons.entries()) {
        const mesh = surface(scene, `Caldera field station apron ${index + 1}`, apron, scree, () => apronColors(apron));
        mesh.hasVertexAlpha = true;
    }
    for (const overlook of works.overlooks) surface(scene, "Caldera rim overlook", overlook, scree);
    for (const bank of works.banks) {
        surface(scene, "Caldera stepped rim", bank, rim, normals => strata(bank, normals)).convertToFlatShadedMesh();
    }
    const notch = surface(scene, "Caldera ash cleft", works.notch, rock, normals => strata(works.notch, normals));
    notch.convertToFlatShadedMesh();
    return [notch];
}

function apronColors(shape: Surface): Float32Array {
    const opacity = [0, 0.82, 1, 0.86, 0];
    const count = shape.positions.length / 3;
    const rows = count / opacity.length;
    const colors = new Float32Array(count * 4);
    for (let index = 0; index < count; index++) {
        const row = Math.floor(index / opacity.length);
        const fade = Math.min(1, row / 6, (rows - 1 - row) / 6);
        colors.set([1, 1, 1, fade * opacity[index % opacity.length]!], index * 4);
    }
    return colors;
}

function strata(shape: Surface, normals: readonly number[]): Float32Array {
    const count = shape.positions.length / 3;
    const colors = new Float32Array(count * 4);
    for (let index = 0; index < count; index++) {
        const [x, y, z] = shape.positions.subarray(index * 3, index * 3 + 3);
        const shelf = Math.max(0, normals[index * 3 + 1]!);
        const band = Math.sin(y! * 1.57 + Math.sin(x! * 0.15 + z! * 0.12) * 0.72);
        const value = 0.76 + 0.14 * band + 0.15 * shelf;
        colors.set([value * (0.98 + shelf * 0.1), value * 0.94, value * (1.08 - shelf * 0.1), 1], index * 4);
    }
    return colors;
}
