import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { aqueductArchSurface, aqueductWallSurface } from "../../../game/course/aqueduct.ts";
import type { AqueductTier } from "../../../game/course/aqueduct.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function aqueductWall(scene: Scene, tier: AqueductTier, depth?: number): Mesh {
    const stone = material(scene, "aqueduct coursed masonry", "#c8b793");
    stone.diffuseTexture = surfaceTexture(scene, "aegean masonry");
    stone.specularColor.set(0.017, 0.017, 0.015);
    stone.backFaceCulling = false;
    return surface(scene, "continuous aqueduct spandrels", aqueductWallSurface(tier, depth), stone);
}

export function aqueductArchBands(scene: Scene, tier: AqueductTier, depth?: number, scale?: number): Mesh {
    const stone = material(scene, "aqueduct cut arch stone", "#e8d4b0");
    stone.diffuseTexture = surfaceTexture(scene, "aegean limestone");
    stone.specularColor.set(0.023, 0.023, 0.02);
    stone.backFaceCulling = false;
    const shape = aqueductArchSurface(tier, depth, scale);
    return surface(scene, "continuous aqueduct arch bands", shape, stone, () => shape.colors);
}
