import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { RockColumn } from "../../../game/course/rock-shelters.ts";
import { material } from "../../materials.ts";
import { addBasaltRelief } from "../basalt-relief.ts";
import { stamp } from "../instances.ts";
import { unpackProp } from "../reconstructed-prop.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import rock from "./split-basalt-support.json" with { type: "json" };

const shape = unpackProp(rock, value => 0.63 + Math.min(1, value / 150) * 0.36);

export function drawBasaltColumns(scene: Scene, columns: readonly RockColumn[]): Mesh {
    const paint = material(scene, "basalt with exposed mineral faces", "#e7d2cc");
    paint.diffuseTexture = surfaceTexture(scene, "basalt");
    addBasaltRelief(scene, paint, 0.41);
    paint.specularColor.set(0.04, 0.034, 0.036);
    const mesh = surface(scene, "split basalt gallery piers", shape, paint, () => shape.colors);
    stamp(mesh, columns.map((post, index) => ({
        x: post.x, y: post.y, z: post.z, sx: post.radius * 1.19, sy: post.height + 0.35, sz: post.radius * 1.19, yaw: index * 2.39,
    })));
    return mesh;
}
