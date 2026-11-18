import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import type { RockShelter } from "../../../game/course/rock-shelters.ts";
import type { Surface } from "../../../game/course/surface.ts";
import { material } from "../../materials.ts";
import { drawBasaltColumns } from "../caldera/basalt-columns.ts";
import { galleryLightSources, tintLavaFaces } from "../caldera/lava-light.ts";
import { addBasaltRelief } from "../basalt-relief.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";
import { drawCopperPillars } from "./gallery-pillars.ts";

export function drawRockShelter(scene: Scene, course: Course, shelter: RockShelter): Mesh[] {
    const tunnel = shelter.kind === "tunnel";
    const alpine = course.track.id === "alpine";
    const basalt = course.track.id === "caldera";
    const copper = course.track.id === "gorge";
    const tint = basalt ? "#bfb1ba" : alpine ? "#827f77" : copper ? "#b89073" : "#b88362";
    const outside = material(scene, "rock overhang exterior", tint);
    const interiorTint = basalt ? "#aea0ae" : alpine ? "#65646a" : copper ? "#9a8778" : "#8f644b";
    const inside = material(scene, "rock overhang interior", interiorTint);
    const texture = surfaceTexture(scene, basalt ? "scoria masonry" : alpine ? "alpine fractured granite" : copper ? "copper strata" : "cinder sandstone");
    outside.diffuseTexture = texture;
    inside.diffuseTexture = copper ? surfaceTexture(scene, "copper shale") : texture;
    for (const stone of [outside, inside]) {
        stone.backFaceCulling = false;
        stone.specularColor.set(0.025, 0.028, 0.026);
    }
    if (basalt) {
        inside.emissiveColor.set(0.48, 0.42, 0.39);
        addBasaltRelief(scene, inside, 0.54);
        addBasaltRelief(scene, outside, 0.42);
    }
    const skins = shelter.surfaces;
    const faceted = basalt || tunnel || copper;
    const roof = drawRock(scene, "rough rock mass", skins.outside, outside, faceted);
    const vault = basalt ? { ...skins.vault, indices: skins.vault.indices.slice() } : skins.vault;
    if (basalt) {
        // The player sees the vault from below. Point the lit faces into the gallery.
        for (let i = 0; i < vault.indices.length; i += 3) {
            const second = vault.indices[i + 1]!;
            vault.indices[i + 1] = vault.indices[i + 2]!;
            vault.indices[i + 2] = second;
        }
    }
    const ceiling = drawRock(scene, tunnel ? "full tunnel vault" : "open gallery vault", vault, inside, faceted);
    if (basalt) tintLavaFaces(ceiling, galleryLightSources(course), 1.76);
    drawRock(scene, "rock portal faces", skins.portals, outside, faceted);
    if (skins.lip) drawRock(scene, "rock gallery edge", skins.lip, outside, basalt || copper);

    const parts = new UrbanParts(scene);
    for (const post of shelter.columns) {
        if (!basalt && !copper) {
            parts.add("rough gallery pillars", { ...post, y: post.y + post.height * 0.49,
                sx: post.radius * 2.08, sy: post.height * 1.05, sz: post.radius * 2.05, yaw: post.x * 0.13 }, tint, "oval");
        }
        parts.add(basalt ? "basalt footings" : "weathered gallery footings", { ...post, y: post.y + 0.59,
            sx: post.radius * 2.6, sy: 1.28, sz: post.radius * 2.35, yaw: post.z * 0.23 }, tint, "leaf");
    }
    const fixtureStride = tunnel ? 3 : (basalt ? 7 : 5);
    for (let index = 1; index < shelter.rows.length - 1; index += fixtureStride) {
        const row = shelter.rows[index]!;
        const lamp = skins.fixtureAnchors[index]!;
        if (basalt) {
            parts.add("gallery lantern bracket", { ...lamp, y: lamp.y + 0.17, sx: 0.52, sy: 0.35, sz: 2.06,
                yaw: Math.atan2(row.dx, row.dz) }, "#413e40");
        }
        parts.add("hall lantern", { ...lamp, sx: 0.43, sy: 0.16, sz: 1.78,
            yaw: Math.atan2(row.dx, row.dz) }, "#f2c58a");
    }
    const pillars = parts.draw().filter(mesh => mesh.name !== "hall lantern");
    if (basalt) pillars.push(drawBasaltColumns(scene, shelter.columns));
    if (copper) pillars.push(drawCopperPillars(scene, shelter.columns));
    return [roof, ...pillars];
}

function drawRock(scene: Scene, name: string, shape: Surface, paint: StandardMaterial, faceted: boolean): Mesh {
    const mesh = faceted ? { ...shape, uv: rockUV(shape.positions) } : shape;
    const rock = surface(scene, name, mesh, paint, () => {
        const colors = new Float32Array(shape.positions.length / 3 * 4);
        for (let i = 0; i < shape.positions.length / 3; i++) {
            const x = shape.positions[i * 3]!;
            const y = shape.positions[i * 3 + 1]!;
            const z = shape.positions[i * 3 + 2]!;
            const tint = 0.88 + 0.11 * Math.sin(y * 0.73 + Math.sin(x * 0.2) * 0.73) + 0.052 * Math.cos(z * 0.52);
            colors.set([tint, tint * 0.97, tint * 0.95, 1], i * 4);
        }
        return colors;
    });
    if (faceted) rock.convertToFlatShadedMesh();
    return rock;
}

function rockUV(positions: Float32Array): Float32Array {
    const uv = new Float32Array(positions.length / 3 * 2);
    for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
        const x = positions[i]!;
        const y = positions[i + 1]!;
        const z = positions[i + 2]!;
        const shear = Math.sin(z * 0.117 + x * 0.33) * 0.65;
        uv[j] = (x * 0.83 + y * 0.58 - z * 0.27 + shear) / 9.4;
        uv[j + 1] = (z * 0.87 + y * 0.44 + x * 0.27 - shear * 0.6) / 7.3;
    }
    return uv;
}
