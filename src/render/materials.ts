import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { Scene } from "@babylonjs/core/scene.js";

export function material(scene: Scene, name: string, color: string): StandardMaterial {
    const result = new StandardMaterial(name, scene);
    result.diffuseColor = Color3.FromHexString(color);
    result.specularColor = new Color3(0.22, 0.23, 0.24);
    result.specularPower = 36;
    return result;
}
