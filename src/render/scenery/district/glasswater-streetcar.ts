import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Point } from "../../../game/point.ts";
import type { GlasswaterFlyover } from "../../../game/course/glasswater-flyover.ts";
import { material } from "../../materials.ts";
import type { AnimateScenery } from "../course-attractions.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawGlasswaterStreetcar(scene: Scene, flyover: GlasswaterFlyover): AnimateScenery {
    const blue = material(scene, "Glasswater transit enamel", "#77b2a8");
    blue.diffuseTexture = surfaceTexture(scene, "glasswater enamel");
    const ivory = material(scene, "Glasswater transit ivory", "#daad79");
    const rubber = material(scene, "Glasswater tram chassis", "#353947");
    const interior = material(scene, "Glasswater lit tram windows", "#ab7135");
    interior.emissiveColor.set(0.32, 0.17, 0.065);
    const [span, west, east] = flyover.spans;
    const baseYaw = flyover.yaw + Math.PI / 2;
    const along = (across: number): Point => {
        const deck = span!;
        if (across >= -19 && across <= 19) return lerp(deck.from, deck.to, (across + 19) / 38);
        const ramp = across < 0 ? west! : east!;
        return lerp(ramp.from, ramp.to, (Math.abs(across) - 19) / 25);
    };

    const cars = [-3.44, 3.44].map((offset, index) => {
        const root = new TransformNode("Glasswater streetcar " + (index + 1), scene);
        const parts = new Map<typeof blue, Mesh[]>();
        const box = (name: string, x: number, y: number, z: number, width: number, height: number, depth: number,
            paint: typeof blue): void => {
            const mesh = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
            mesh.position.set(x, y, z);
            mesh.material = paint;
            const batch = parts.get(paint);
            if (batch) batch.push(mesh);
            else parts.set(paint, [mesh]);
        };
        box("tram underframe", 0, 0.3, 0, 2.47, 0.42, 6.2, rubber);
        box("tram blue lower shell", 0, 0.79, 0, 2.67, 0.59, 6.68, blue);
        box("tram cream upper shell", 0, 1.71, 0, 2.59, 1.28, 6.61, ivory);
        box("tram chamfered roof band", 0, 2.34, 0, 2.72, 0.30, 6.7, blue);
        box("tram roof cap", 0, 2.54, 0, 2.28, 0.13, 6.2, blue);
        for (const side of [-1, 1]) {
            for (const z of [-2.64, -1.58, -0.53, 0.53, 1.58, 2.64]) {
                box("tram warm side glass", side * 1.303, 1.67, z, 0.032, 0.78, 0.89, interior);
            }
            box("tram end window", 0, 1.69, side * 3.32, 1.59, 0.80, 0.038, interior);
            box("tram bumper", 0, 0.39, side * 3.37, 2.16, 0.17, 0.2, rubber);
        }
        for (const [paint, batch] of parts) {
            const merged = batch.length > 1 ? Mesh.MergeMeshes(batch, true) : batch[0];
            if (!merged) continue;
            merged.name = paint.name + " " + (index + 1);
            merged.parent = root;
            merged.isPickable = false;
        }
        return { offset, root };
    });

    return time => {
        const position = -36 * Math.cos(Math.PI * (time * 0.028 + 0.45));
        for (const { offset, root } of cars) {
            const station = position + offset;
            const at = along(station);
            const grade = along(station + 0.7).y - along(station - 0.7).y;
            root.position.set(at.x, at.y + 0.38, at.z);
            root.rotation.set(-Math.atan2(grade, 1.4), baseYaw, 0);
        }
    };
}

function lerp(from: Point, to: Point, t: number): Point {
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t };
}
