import type { Scene } from "@babylonjs/core/scene.js";
import type { Surface } from "../../../game/course/surface.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawCalderaRidges(scene: Scene, shape: Surface): void {
    const rock = material(scene, "layered caldera ridge stone", "#53505e");
    rock.diffuseTexture = surfaceTexture(scene, "lava crust");
    rock.backFaceCulling = false;
    rock.specularColor.set(0.027, 0.031, 0.038);
    rock.emissiveColor.set(0.045, 0.038, 0.058);
    const ridge = surface(scene, "stepped caldera ridges", shape, rock, normals => {
        const colors = new Float32Array(shape.positions.length / 3 * 4);
        for (let i = 0; i < shape.positions.length / 3; i++) {
            const x = shape.positions[i * 3]!;
            const y = shape.positions[i * 3 + 1]!;
            const z = shape.positions[i * 3 + 2]!;
            const vein = Math.sin(y * 0.62 + Math.sin(x * 0.048 + z * 0.023) * 0.76);
            const shelf = Math.max(0, normals[i * 3 + 1]!);
            const tone = 0.76 + vein * 0.078 + shelf * 0.19;
            colors.set([tone * (0.91 + shelf * 0.13), tone * 0.96, tone * (1.08 - shelf * 0.13), 1], i * 4);
        }
        return colors;
    });
    ridge.convertToFlatShadedMesh();
}
