import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { AuroraWaterside } from "../../../game/course/aurora-waterside.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";

export function drawAuroraWaterside(scene: Scene, works: AuroraWaterside): Mesh[] {
    const ivory = material(scene, "Aurora sunlit canopy ceramic", "#f9e6ca");
    ivory.diffuseTexture = surfaceTexture(scene, "aurora ivory", 2.3, 1.2);
    ivory.backFaceCulling = false;
    ivory.specularColor.set(0.19, 0.18, 0.16);
    for (const walk of works.walks) surface(scene, "Aurora bridge sidewalks", walk, ivory);
    const solar = material(scene, "Aurora indigo canopy cells", "#7a97ad");
    solar.diffuseTexture = surfaceTexture(scene, "aurora photovoltaic", 0.65, 0.72);
    solar.backFaceCulling = false;
    solar.specularColor.set(0.37, 0.47, 0.59);
    solar.specularPower = 60;
    const terraces = material(scene, "Aurora wetland garden stone", "#ebddc3");
    terraces.diffuseTexture = surfaceTexture(scene, "aurora stone", 1.26, 1.23);
    terraces.backFaceCulling = false;
    const copper = material(scene, "Aurora hammered copper seams", "#c6a072");
    copper.diffuseTexture = surfaceTexture(scene, "cloudfold copper", 0.69, 0.72);
    copper.specularColor.set(0.32, 0.22, 0.13);
    copper.backFaceCulling = false;
    surface(scene, "Aurora solar arcade copper seams", works.copperSeams, copper);
    const rib = surface(scene, "Aurora solar arcade ribs", works.ribs, ivory);
    const cells = works.solarRoof.map(panel => surface(scene, "Aurora solar arcade panels", panel, solar));
    for (const bank of works.terraces) surface(scene, "Aurora stepped rain gardens", bank, terraces);

    const parts = new UrbanParts(scene);
    for (const footing of works.footings) {
        const { width, height, depth, yaw } = footing;
        parts.add("Aurora retaining stone", { ...footing, sx: width, sy: height, sz: depth }, "#cccac0");
        parts.add("Aurora terrace shell", { ...footing, y: footing.y + height / 2, sx: width + 0.26,
            sy: 0.21, sz: depth + 0.29, yaw }, "#e8d3a9");
        parts.add("Aurora terrace rim", { ...footing, y: footing.y + height / 2 + 0.14, sx: width * 0.93,
            sy: 0.12, sz: depth * 0.86, yaw }, "#b58359");
        for (const side of [-1, 1]) {
            const t = side * width * 0.39;
            parts.add("promenade shrubs", { ...footing, x: footing.x + Math.cos(yaw) * t,
                z: footing.z - Math.sin(yaw) * t, y: footing.y + height / 2 + 0.24,
                sx: 0.93, sy: 0.71, sz: 1.55, yaw }, "#8a9a55", "leaf");
        }
    }
    for (const lamp of works.luminaires) {
        parts.add("Aurora arcade lantern", { ...lamp, sx: 0.29, sy: 0.46, sz: 0.63, yaw: 0 }, "#ffc980");
    }
    return [rib, ...cells, ...parts.draw().filter(mesh => mesh.name === "Aurora retaining stone")];
}
