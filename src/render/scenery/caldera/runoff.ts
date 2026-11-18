import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CalderaRunoff } from "../../../game/course/caldera-runoff.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawRunoff(scene: Scene, runoff: CalderaRunoff, texture: Texture): void {
    const stone = material(scene, "dark basalt around the lava cascade", "#67616f");
    stone.diffuseTexture = surfaceTexture(scene, "lava crust");
    stone.backFaceCulling = false;
    stone.specularColor.set(0.04, 0.03, 0.025);
    surface(scene, "basalt slopes around the cascade", runoff.rocks, stone).convertToFlatShadedMesh();
    const melt = material(scene, "molten crater runoff", "#ffffff");
    melt.disableLighting = true;
    melt.linkEmissiveWithDiffuse = true;
    melt.emissiveColor.set(1, 0.93, 0.82);
    melt.diffuseTexture = texture;
    melt.backFaceCulling = false;
    surface(scene, "lava cascades from crater to channel", runoff.flow, melt).receiveShadows = false;
}
