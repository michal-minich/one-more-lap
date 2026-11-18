import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import { rockProfiles } from "../../game/course/rock-profiles.ts";
import type { RockProfile } from "../../game/course/rock-profiles.ts";
import { smoothBetween } from "../../game/course/terrain-profile.ts";
import { material } from "../materials.ts";
import { drawVolcano } from "./district/volcano.ts";
import { stamp } from "./instances.ts";
import { surface } from "./surface-mesh.ts";
import { surfaceTexture } from "./surface-textures.ts";

export function drawRockFormations(scene: Scene, course: Course): void {
    const biome = course.track.id;
    const tint = biome === "forest" ? "#afb6ba" : biome === "coast" ? "#dbd5c5" : biome === "alpine" ? "#a4a5a8" : biome === "mars" ? "#9e6253"
        : biome === "ruins" ? "#e2cbab" : biome === "gorge" ? "#c7c0bd" : biome === "arctic" ? "#b2bbcf"
            : biome === "reef" ? "#e4d6b3" : "#d59364";
    const stone = material(scene, "sedimentary rock", tint);
    stone.diffuseTexture = surfaceTexture(scene, biome === "forest" ? "woodland slate" : biome === "alpine" ? "alpine fractured granite" : biome === "mars" ? "mars regolith"
        : biome === "ruins" ? "aegean bedrock" : biome === "coast" ? "pacific chalk" : biome === "canyon" ? "cinder sandstone"
            : biome === "gorge" ? "copper strata" : biome === "arctic" ? "frosthaven slate"
                : biome === "reef" ? "coral limestone" : "coastal chalk");
    stone.specularColor.set(0, 0, 0);
    const shale = Color3.FromHexString("#596885");
    for (const profile of Object.keys(rockProfiles) as RockProfile[]) {
        const placements = course.rockFormations.filter(rock => rock.profile === profile);
        if (!placements.length) continue;
        const shape = rockProfiles[profile];
        const mesh = surface(scene, "eroded rock " + profile, shape, stone, normals => {
            if (biome === "arctic") {
                const colors = new Float32Array(shape.colors.length);
                for (let i = 0, v = 0; i < colors.length; i += 4, v += 3) {
                    const y = shape.positions[v + 1]!;
                    const snow = Math.max(smoothBetween(0.41, 0.83, normals[v + 1]!) * smoothBetween(0.29, 0.74, y),
                        smoothBetween(0.73, 0.98, y) * 0.76);
                    const shade = 0.57 + shape.colors[i]! * 0.15;
                    colors.set([shade + snow * 0.48, shade + snow * 0.52, shade + 0.10 + snow * 0.45, 1], i);
                }
                return colors;
            }
            if (biome !== "gorge") return shape.colors;
            const colors = shape.colors.slice();
            for (let i = 0; i < colors.length; i += 4) {
                const y = shape.positions[(i / 4) * 3 + 1]!;
                const blend = smoothBetween(0.34, 0.80, y);
                colors[i] = colors[i]! * (shale.r + (1 - shale.r) * blend);
                colors[i + 1] = colors[i + 1]! * (shale.g + (1 - shale.g) * blend);
                colors[i + 2] = colors[i + 2]! * (shale.b + (1 - shale.b) * blend);
            }
            return colors;
        });
        if (biome === "forest" || biome === "ruins" || biome === "coast" || biome === "alpine" || biome === "gorge" ||
            biome === "arctic" || biome === "reef") {
            mesh.convertToFlatShadedMesh();
        }
        stamp(mesh, placements);
    }
    if (biome === "canyon") drawVolcano(scene, course);
}
