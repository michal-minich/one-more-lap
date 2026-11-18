import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { importedModel } from "../../models/imported-model.ts";
import { material } from "../../materials.ts";
import ceramicTile from "../../models/materials/garden-ceramic.jpg?inline";
import alloyTile from "../../models/materials/garden-alloy.jpg?inline";
import concreteTile from "../../models/materials/garden-concrete.jpg?inline";
import leavesTile from "../../models/materials/garden-leaves.jpg?inline";
import building from "../../models/skygarden.bin?inline";
import buildingFinishes from "../../models/skygarden.json" with { type: "json" };
import railway from "../../models/guideway.bin?inline";
import railwayFinishes from "../../models/guideway.json" with { type: "json" };
import trainGeometry from "../../models/train.bin?inline";
import trainFinishes from "../../models/train.json" with { type: "json" };
import tree from "../../models/canopy-tree.bin?inline";
import treeFinishes from "../../models/canopy-tree.json" with { type: "json" };
import vines from "../../models/vines.bin?inline";
import vineFinishes from "../../models/vines.json" with { type: "json" };

export function drawSkygarden(scene: Scene, course: Course) {
    const { row, elevation, yaw, scale, feet } = course.skygarden!;
    const tintSources = { ceramicTile, alloyTile, concreteTile, leavesTile };
    const tiles = new Map<string, Texture>();
    const texture = (key: keyof typeof tintSources): Texture => {
        let tile = tiles.get(key);
        if (!tile) {
            tile = new Texture(tintSources[key], scene);
            tile.name = "ImageGen Skygarden " + key;
            tiles.set(key, tile);
        }
        return tile;
    };
    const textureFinish = (paint: StandardMaterial, { name }: { readonly name: string }): void => {
        if (/foliage|leaf|planted/i.test(name)) paint.diffuseTexture = texture("leavesTile");
        else if (/ceramic|enamel/i.test(name)) paint.diffuseTexture = texture("ceramicTile");
        else if (/stone|underside|footing/i.test(name)) paint.diffuseTexture = texture("concreteTile");
        else if (/mullions|guide|rail/i.test(name)) paint.diffuseTexture = texture("alloyTile");
    };
    const hall = new TransformNode("Aurora Glass Garden Hall", scene);
    hall.position.set(row.x, elevation, row.z);
    hall.scaling.setAll(scale);
    hall.rotation.y = yaw;
    const hallMeshes = importedModel(scene, hall, building, buildingFinishes, undefined, textureFinish);
    const concrete = material(scene, "Skygarden support footing", "#a7947e");
    textureFinish(concrete, concrete);
    for (const foot of feet) {
        const height = Math.max(0.16, foot.top - foot.bottom);
        const footing = MeshBuilder.CreateBox("Grounded Skygarden support", {
            width: foot.width, depth: foot.depth, height,
        }, scene);
        footing.material = concrete;
        footing.position.set(foot.x, foot.top - height / 2, foot.z);
        footing.rotation.y = yaw;
    }
    const railwayRoot = new TransformNode("Aurora Skygarden Guideway", scene);
    railwayRoot.parent = hall;
    // The packed models use glTF's forward axis. The railway is to the hall's right.
    railwayRoot.position.x = 15.2;
    importedModel(scene, railwayRoot, railway, railwayFinishes, undefined, textureFinish);
    const train = new TransformNode("Aurora Skygarden train", scene);
    train.parent = railwayRoot;
    train.position.y = 8.73;
    importedModel(scene, train, trainGeometry, trainFinishes, undefined, textureFinish);
    const garden = course.at(686);
    const roadside = pointOnRoute(garden, 19);
    const bank = course.ground.at(roadside.x, roadside.z) ?? garden.y;
    const canopy = new TransformNode("Skygarden roadside canopy", scene);
    canopy.position.set(roadside.x, bank - 0.2, roadside.z);
    canopy.scaling.setAll(1.75);
    importedModel(scene, canopy, tree, treeFinishes, undefined, textureFinish);
    const terrace = new TransformNode("Skygarden roadside vines", scene);
    terrace.parent = hall;
    terrace.position.set(-7.2, 6.45, 0);
    terrace.scaling.set(0.32, 0.8, 0.48);
    importedModel(scene, terrace, vines, vineFinishes, undefined, textureFinish);
    return {
        shadowCasters: hallMeshes.filter(mesh => /ceramic|underside|stone/i.test(mesh.name)),
        animate: (time: number): void => { train.position.z = Math.sin(time * 0.14) * 3.8; },
    };
}
