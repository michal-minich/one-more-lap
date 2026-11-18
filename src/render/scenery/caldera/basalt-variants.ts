import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { BoulderPlacement } from "../../../game/course/vegetation/layout.ts";
import { unpackSurface } from "../packed-surface.ts";
import { surface } from "../surface-mesh.ts";
import packed from "./basalt-variants.json" with { type: "json" };

const [round, shard, slab] = packed.map(unpackSurface);
const forms = { round: round!, shard: shard!, slab: slab! };

export function basaltBoulder(scene: Scene, shape: BoulderPlacement["shape"], stone: StandardMaterial): Mesh {
    return surface(scene, "caldera " + shape + " basalt", forms[shape], stone);
}
