import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import type { TreeKind } from "../../../game/course/vegetation/trees.ts";
import { material } from "../../materials.ts";
import { contactShadowMaterial } from "../contact-shadow.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { buildTree } from "./tree-mesh.ts";
import { stampSnowPine } from "./snow-pine.ts";

const foliage: Record<TreeKind, string> = {
    spruce: "#3f7346", fir: "#547746", oak: "#789c4b", birch: "#9cb858", "coastal-pine": "#507949",
    "ancient-oak": "#7f9b45", olive: "#839367", cypress: "#4c7351", "snow-pine": "#517d76",
};

export function drawGrove(scene: Scene, course: Course): void {
    const groves = new Map<TreeKind, Stamp[]>();
    const isolated: [Stamp[], Stamp[]] = [[], []];
    const shade: Stamp[] = [];
    const trees = course.vegetation.trees;
    for (const tree of trees) {
        const { kind, ground, scale, yaw } = tree;
        const instance = { ...ground, sx: scale, sy: scale, sz: scale, yaw };
        const grove = groves.get(kind);
        if (grove) grove.push(instance);
        else groves.set(kind, [instance]);
        if (kind === "snow-pine" && trees.every(neighbor => {
            return neighbor === tree || Math.hypot(ground.x - neighbor.ground.x, ground.z - neighbor.ground.z) >= 12 * scale;
        })) {
            const variant = yaw < Math.PI ? 0 : 1;
            isolated[variant].push(instance);
        }
        const rise = course.ground.at(ground.x + Math.sin(yaw) * 1.6, ground.z + Math.cos(yaw) * 1.6);
        if (rise !== undefined && Math.abs(rise - ground.y) < 0.4) {
            const span = kind === "ancient-oak" ? 11 : 3.8;
            shade.push({ ...ground, y: ground.y + 0.058, sx: span * scale, sy: 1, sz: span * scale * 0.94,
                yaw, pitch: -Math.atan2(rise - ground.y, 1.6) });
        }
    }
    if (!groves.size) return;
    const woodland = course.track.id === "forest";
    const bark = material(scene, "tree bark", woodland ? "#895e48" : "#70513b");
    bark.diffuseTexture = surfaceTexture(scene, "bark", 2, 1);
    const pale = groves.has("birch") ? material(scene, "birch bark", "#e3dbce") : undefined;
    if (pale) pale.diffuseTexture = surfaceTexture(scene, "birch");
    const snow = groves.has("snow-pine") ? material(scene, "snow on branches", "#e8f3f8") : undefined;
    if (snow) snow.diffuseTexture = surfaceTexture(scene, "snow");
    for (const [kind, instances] of groves) {
        const parts = buildTree(scene, kind, woodland);
        const color = woodland && kind === "fir" ? "#6c934a" : foliage[kind];
        const leaves = material(scene, kind + " foliage", color);
        leaves.diffuseTexture = surfaceTexture(scene, "foliage");
        leaves.specularColor.set(0.019, 0.023, 0.013);
        if (woodland) leaves.backFaceCulling = false;
        const wood = Mesh.MergeMeshes(parts.wood, true, true)!;
        wood.material = kind === "birch" && pale ? pale : bark;
        stamp(wood, instances);
        const crown = Mesh.MergeMeshes(parts.foliage, true, true)!;
        crown.material = leaves;
        const standalone = kind === "snow-pine" ? new Set(isolated.flat()) : undefined;
        const clustered = standalone ? instances.filter(instance => !standalone.has(instance)) : instances;
        stamp(crown, clustered);
        if (snow && parts.snow.length > 0) {
            const caps = Mesh.MergeMeshes(parts.snow, true, true)!;
            caps.material = snow;
            stamp(caps, clustered);
            for (const [index, placements] of isolated.entries()) {
                if (placements.length === 0) continue;
                stampSnowPine(scene, placements, { needles: leaves, snow }, index === 0 ? 71 : 103);
            }
        }
    }
    const shadow = MeshBuilder.CreateGround("soft grove shade", { width: 1, height: 1 }, scene);
    shadow.material = contactShadowMaterial(scene, 105);
    stamp(shadow, shade);
}
