import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Biome } from "../../game/course/tracks.ts";
import type { Course } from "../../game/course/course.ts";
import type { Surface } from "../../game/course/surface.ts";
import { terrainSurfaces } from "../../game/course/surfaces.ts";
import { landscapeNoise, smoothBetween } from "../../game/course/terrain-profile.ts";
import { waterDistance } from "../../game/course/water.ts";
import { material } from "../materials.ts";
import { weldLand } from "./land-mesh.ts";
import { surface } from "./surface-mesh.ts";
import { surfaceTexture } from "./surface-textures.ts";
import type { SurfacePattern } from "./surface-textures.ts";

const terrainPattern: Record<Biome, SurfacePattern> = {
    stunt: "skywheel turf", rail: "juniper turf", reef: "coral ripple sand", coast: "pacific chalk", alpine: "alpine fractured granite", canyon: "cinder gravel", ruins: "aegean bedrock", forest: "forest duff",
    "old-town": "spring turf", metro: "spring turf", future: "spring turf", mars: "mars regolith", arctic: "frosthaven drift snow", gorge: "copper shale",
    sky: "plaster", caldera: "lava crust",
};

const terrainRepeat: Partial<Record<SurfacePattern, number>> = {
    "spring turf": 3.6, "cinder gravel": 5, "juniper turf": 4.8, "copper shale": 4.3, "canyon gravel": 2.75, "mars regolith": 3.9, "lava crust": 2.7,
    "pacific chalk": 4.1, "alpine fractured granite": 3.6, "aegean bedrock": 6.15,
    "frosthaven drift snow": 2.15, "coral ripple sand": 2.7, "forest duff": 3.1,
    "skywheel turf": 3.6,
};

const sand = Color3.FromHexString("#e0bb79");
const snow = Color3.FromHexString("#e4eff7");
const alpineStone = Color3.FromHexString("#82807b");
const slate = Color3.FromHexString("#53565e");
const cooledBasalt = Color3.FromHexString("#414453");
const purpleAsh = Color3.FromHexString("#6f646a");
const canyonLight = Color3.FromHexString("#d69660");
const canyonDark = Color3.FromHexString("#8f4732");
const park = Color3.FromHexString("#6b915c");
const windSnow = Color3.FromHexString("#aec8d1");
const frozenSlate = Color3.FromHexString("#465366");
const darkGreen = Color3.FromHexString("#48763f");
const dampBank = Color3.FromHexString("#777456");
const dampRock = Color3.FromHexString("#686c65");
const redEarth = Color3.FromHexString("#b7a07a");
const martianDust = Color3.FromHexString("#c17959");
const martianIron = Color3.FromHexString("#774753");
const limestoneBluff = Color3.FromHexString("#d5ad7a");
const meadowSun = Color3.FromHexString("#9aa658");
const heath = Color3.FromHexString("#b1a176");
const alpineMeadow = Color3.FromHexString("#b39758");
const coastalPasture = Color3.FromHexString("#c1a76a");
const lowSlate = Color3.FromHexString("#757a83");
const cliffChalk = Color3.FromHexString("#ded9cf");
const sunlitLimestone = Color3.FromHexString("#ded1b7");
const reefRock = Color3.FromHexString("#658b9b");
const reefSand = Color3.FromHexString("#8fafac");
const tropicalLeaf = Color3.FromHexString("#526c3b");

export function drawLand(scene: Scene, course: Course): StandardMaterial {
    const { track, surfaces } = course;
    const ground = material(scene, "landscape", "#ffffff");
    const pattern = terrainPattern[track.id];
    ground.diffuseTexture = surfaceTexture(scene, pattern, terrainRepeat[pattern]);
    ground.specularColor.set(0.025, 0.03, 0.032);
    const base = Color3.FromHexString(track.terrain);
    const welded = weldLand(terrainSurfaces(surfaces));
    const land = track.id === "gorge" ? slopeTextureUV(welded) : welded;
    let coverColors: Float32Array | undefined;
    let reefGrass: Float32Array | undefined;
    const alpine = track.id === "alpine";
    const juniper = track.id === "rail";
    const arctic = track.id === "arctic";
    const reef = track.id === "reef";
    const ares = track.id === "mars";
    const skywheel = track.id === "stunt";
    surface(scene, "continuous terrain and stream beds", land, ground, normals => {
        const colors = landscapeColors(land, normals, course, base);
        if (track.id === "coast") coverColors = coastalGroundcover(land, normals, colors);
        if (alpine) coverColors = alpineSnowdrifts(land, normals);
        if (juniper) coverColors = juniperSlateRibs(land, normals);
        if (arctic) coverColors = frosthavenExposedSlate(land, normals);
        if (ares) coverColors = aresExposedStrata(land, normals);
        if (skywheel) coverColors = skywheelCliffFaces(land, normals);
        if (reef) {
            coverColors = coralLimestoneFaces(land, normals);
            reefGrass = coralGrassCover(land, normals, colors);
        }
        return colors;
    });
    if (coverColors) {
        const colors = coverColors;
        const { label, name, repeat, pattern } = alpine
            ? { label: "Alpine snowdrifts", name: "Alpine drift snow", repeat: 4.2, pattern: "alpine drift snow" as const }
            : juniper
                ? { label: "Juniper exposed slate ribs", name: "Juniper slate ribs", repeat: 4.9, pattern: "woodland slate" as const }
                : arctic
                    ? { label: "Frosthaven exposed slate", name: "Frosthaven exposed slate", repeat: 1.25, pattern: "frosthaven slate" as const }
                    : reef
                        ? { label: "Coral Passage limestone shelves", name: "Coastal and submerged limestone", repeat: 0.89, pattern: "coral limestone" as const }
                        : ares
                            ? { label: "Ares exposed strata", name: "Martian rock strata", repeat: 2.15, pattern: "ares strata" as const }
                            : skywheel
                                ? { label: "Skywheel pale limestone bluffs", name: "Skywheel natural limestone",
                                    repeat: 2.62, pattern: "pacific chalk" as const }
                                : { label: "Pacific grass on the bluffs", name: "Pacific bluff grass",
                                    repeat: 5.6, pattern: "pacific bluff grass" as const };
        const coverMaterial = material(scene, name, "#ffffff");
        coverMaterial.diffuseTexture = surfaceTexture(scene, pattern, repeat);
        coverMaterial.specularColor.set(0.02, 0.021, 0.018);
        coverMaterial.zOffset = -1;
        const coverLand = arctic || reef || ares || skywheel ? slopeTextureUV(land) : land;
        const cover = surface(scene, label, groundCoverSurface(coverLand, colors), coverMaterial, () => colors);
        cover.hasVertexAlpha = true;
        if (reef) cover.alphaIndex = 4;
    }
    if (reefGrass) {
        const colors = reefGrass;
        const grass = material(scene, "Coral Passage headland grass", "#ffffff");
        grass.diffuseTexture = surfaceTexture(scene, "pacific bluff grass", 5.8);
        grass.specularColor.set(0.014, 0.018, 0.012);
        grass.zOffset = -1;
        const cover = surface(scene, "groundcover on the upper limestone shelves", groundCoverSurface(land, colors), grass, () => colors);
        cover.hasVertexAlpha = true;
        cover.alphaIndex = 5;
    }
    return ground;
}

function slopeTextureUV(land: Surface): Surface {
    const uv = new Float32Array(land.uv.length);
    for (let i = 0, j = 0; i < land.positions.length; i += 3, j += 2) {
        const x = land.positions[i]!;
        const y = land.positions[i + 1]!;
        const z = land.positions[i + 2]!;
        uv[j] = (x + y * 0.47) / 6;
        uv[j + 1] = (z - y * 0.72) / 6;
    }
    return { ...land, uv };
}

function groundCoverSurface(land: Surface, colors: Float32Array): Surface {
    const positions = land.positions.map((value, index) => index % 3 === 1 ? value + 0.018 : value);
    const indices: number[] = [];
    for (let i = 0; i < land.indices.length; i += 3) {
        const a = land.indices[i]!;
        const b = land.indices[i + 1]!;
        const c = land.indices[i + 2]!;
        if (colors[a * 4 + 3]! + colors[b * 4 + 3]! + colors[c * 4 + 3]! > 0.02) indices.push(a, b, c);
    }
    return { ...land, positions, indices: new Uint32Array(indices) };
}

function coastalGroundcover(land: Surface, normals: readonly number[], terrain: Float32Array): Float32Array {
    const colors = new Float32Array(terrain);
    for (let i = 0; i < land.positions.length / 3; i++) {
        const x = land.positions[i * 3]!;
        const y = land.positions[i * 3 + 1]!;
        const z = land.positions[i * 3 + 2]!;
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const patch = landscapeNoise(x * 2.1 + 31, z * 2.1 - 34);
        colors[i * 4 + 3] = (1 - smoothBetween(0.09, 0.24, slope))
            * smoothBetween(-0.8, 6.5, y) * (0.61 + patch * 0.28);
    }
    return colors;
}

function alpineSnowdrifts(land: Surface, normals: readonly number[]): Float32Array {
    const count = land.positions.length / 3;
    const colors = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
        const x = land.positions[i * 3]!;
        const y = land.positions[i * 3 + 1]!;
        const z = land.positions[i * 3 + 2]!;
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const folds = landscapeNoise(x * 1.26 + 43, z * 1.29 - 62);
        const crystals = landscapeNoise(x * 3.6 + 48, z * 3.1 + 27);
        const snowline = y + folds * 32;
        const peak = smoothBetween(125, 176, snowline) * (1 - smoothBetween(0.21, 0.60, slope));
        const pocket = smoothBetween(67, 94, y) * smoothBetween(0.17, 0.50, folds * 0.73 + crystals * 0.27)
            * smoothBetween(0.008, 0.034, slope) * (1 - smoothBetween(0.17, 0.43, slope));
        const light = 0.92 + folds * 0.09;
        colors.set([light * 0.91, light * 0.95, light, Math.max(peak * 0.94, pocket * 0.76)], i * 4);
    }
    return colors;
}

function juniperSlateRibs(land: Surface, normals: readonly number[]): Float32Array {
    const colors = new Float32Array(land.positions.length / 3 * 4);
    for (let i = 0; i < land.positions.length / 3; i++) {
        const x = land.positions[i * 3]!;
        const y = land.positions[i * 3 + 1]!;
        const z = land.positions[i * 3 + 2]!;
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const noise = landscapeNoise(x * 1.18 + 15, z * 1.27 - 28);
        const seam = Math.cos((y + 0.046 * x - 0.079 * z) * 0.62 + noise * 1.85);
        const beds = smoothBetween(0.12, 0.74, seam) * (0.47 + noise * 0.29);
        const cliff = smoothBetween(0.15, 0.35, slope) * (0.39 + beds);
        const ledge = smoothBetween(0.055, 0.15, slope) * beds;
        const cover = smoothBetween(49, 98, y + noise * 16) * Math.max(cliff, ledge);
        colors.set([0.68 + noise * 0.15, 0.73 + noise * 0.12, 0.81 + noise * 0.08, cover], i * 4);
    }
    return colors;
}

function frosthavenExposedSlate(land: Surface, normals: readonly number[]): Float32Array {
    const colors = new Float32Array(land.positions.length / 3 * 4);
    for (let i = 0; i < land.positions.length / 3; i++) {
        const x = land.positions[i * 3]!;
        const y = land.positions[i * 3 + 1]!;
        const z = land.positions[i * 3 + 2]!;
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const wind = landscapeNoise(x * 1.42 + 57, z * 1.56 - 23);
        const beds = Math.sin(y * 0.27 + x * 0.075 - z * 0.042 + wind * 2.7);
        const face = smoothBetween(0.047, 0.155, slope + wind * 0.048 + beds * 0.027);
        const footing = smoothBetween(-0.5, 4.5, y) * smoothBetween(0.17, 0.38, slope);
        const mountain = smoothBetween(20, 48, y) * face * (0.78 + 0.18 * beds);
        const cap = smoothBetween(81, 118, y + wind * 19) * (1 - face * 0.81);
        colors.set([0.58 + wind * 0.09, 0.66 + wind * 0.09, 0.84 + wind * 0.08,
            Math.max(footing * 0.80, mountain) * (1 - 0.92 * cap)], i * 4);
    }
    return colors;
}

function aresExposedStrata(land: Surface, normals: readonly number[]): Float32Array {
    const count = land.positions.length / 3;
    const colors = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
        const x = land.positions[i * 3]!;
        const y = land.positions[i * 3 + 1]!;
        const z = land.positions[i * 3 + 2]!;
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const erosion = landscapeNoise(x * 1.88 - 71, z * 1.59 + 22);
        const bedding = Math.sin(y * 0.47 + x * 0.023 - z * 0.037 + erosion * 0.76);
        const face = smoothBetween(0.076, 0.29, slope + erosion * 0.044);
        const shelf = smoothBetween(0.022, 0.087, slope) * smoothBetween(31, 53, y) *
            smoothBetween(0.42, 0.9, bedding) * 0.49;
        const lit = 0.81 + bedding * 0.12;
        colors.set([lit, lit * (0.84 + bedding * 0.025), lit * 0.79, Math.max(face * 0.89, shelf)], i * 4);
    }
    return colors;
}

function skywheelCliffFaces(land: Surface, normals: readonly number[]): Float32Array {
    const count = land.positions.length / 3;
    const colors = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
        const x = land.positions[i * 3]!;
        const y = land.positions[i * 3 + 1]!;
        const z = land.positions[i * 3 + 2]!;
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const grain = landscapeNoise(x * 1.69 + 18, z * 1.54 - 45);
        const band = Math.sin(y * 0.48 + grain * 1.2);
        const face = smoothBetween(22, 38, y) * smoothBetween(0.049, 0.19, slope + band * 0.026);
        const light = 0.77 + 0.15 * band + 0.07 * grain;
        colors.set([light, light * 0.84, light * 0.68, face * 0.91], i * 4);
    }
    return colors;
}

function coralLimestoneFaces(land: Surface, normals: readonly number[]): Float32Array {
    const colors = new Float32Array(land.positions.length / 3 * 4);
    for (let i = 0; i < land.positions.length / 3; i++) {
        const x = land.positions[i * 3]!;
        const y = land.positions[i * 3 + 1]!;
        const z = land.positions[i * 3 + 2]!;
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const bands = Math.sin((y + x * 0.04 - z * 0.093) * 0.83
            + landscapeNoise(x * 1.2 + 92, z * 1.4) * 2.3);
        const cliff = smoothBetween(0.064, 0.32, slope + bands * 0.038);
        const sandbar = 1 - smoothBetween(1, 9, Math.abs(y));
        const aboveWater = smoothBetween(-3, 4, y);
        const ambient = 0.87 + bands * 0.082;
        const tone = Color3.Lerp(reefRock, sunlitLimestone, aboveWater);
        colors.set([ambient * tone.r, ambient * tone.g, ambient * tone.b,
            cliff * (0.94 - sandbar * 0.28)], i * 4);
    }
    return colors;
}

function coralGrassCover(land: Surface, normals: readonly number[], terrain: Float32Array): Float32Array {
    const colors = terrain.slice();
    for (let i = 0; i < land.positions.length / 3; i++) {
        const x = land.positions[i * 3]!;
        const y = land.positions[i * 3 + 1]!;
        const z = land.positions[i * 3 + 2]!;
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const brush = landscapeNoise(x * 2.4 + 75, z * 2.13 + 14);
        const cover = smoothBetween(1.1, 7.5 + brush * 2.6, y)
            * (1 - smoothBetween(0.07, 0.21, slope)) * (0.80 + brush * 0.12);
        colors[i * 4 + 3] = cover;
    }
    return colors;
}

function landscapeColors(shape: Surface, normals: readonly number[], course: Course, base: Color3): Float32Array {
    const colors = new Float32Array(shape.positions.length / 3 * 4);
    for (let i = 0; i < shape.positions.length / 3; i++) {
        const x = shape.positions[i * 3]!;
        const y = shape.positions[i * 3 + 1]!;
        const z = shape.positions[i * 3 + 2]!;
        const noise = landscapeNoise(x, z);
        const slope = 1 - Math.max(0, normals[i * 3 + 1]!);
        const texture = landscapeNoise(x * 1.74 + 93, z * 1.48 - 170);
        const color = landColor(course.track.id, base, y, noise, texture, slope);
        for (const body of course.water) {
            const height = y - body.center.y;
            if (body.kind === "lava") {
                const channel = waterDistance(body, x, z);
                const heat = (1 - smoothBetween(0.84, 1.75, channel)) * (1 - smoothBetween(1.0, 10, height));
                const strata = 0.12 * Math.sin(height * 1.27 + noise * 2.6);
                Color3.LerpToRef(color, slate, smoothBetween(0.11, 0.50, slope) * (0.44 + strata), color);
                color.r += 0.24 * heat;
                color.g += 0.065 * heat;
                color.b *= 1 - 0.24 * heat;
                continue;
            }
            if (body.kind === "ice" || height < -3 || height > 1.65 || waterDistance(body, x, z) > 1.12) continue;
            Color3.LerpToRef(color, dampBank, (1 - smoothBetween(0.1, 1.65, height)) * 0.59, color);
        }
        // Low-frequency tonal variation supplies soft shade without an extra shadow map.
        const brightness = 0.94 + noise * 0.135 + texture * 0.095;
        colors.set([color.r * brightness, color.g * brightness, color.b * brightness, 1], i * 4);
    }
    return colors;
}

function landColor(
    biome: Biome, base: Color3, height: number, noise: number, texture: number, slope: number,
): Color3 {
    if (biome === "reef") {
        const openBeach = Color3.Lerp(sand, cliffChalk, smoothBetween(-0.27, 0.55, texture) * 0.61);
        const seaGrass = Color3.Lerp(tropicalLeaf, meadowSun, smoothBetween(-0.36, 0.81, texture * 0.83 + noise * 0.7));
        const shore = Color3.Lerp(openBeach, seaGrass, smoothBetween(0.8, 12 + noise * 4.2, height) *
            (0.96 - smoothBetween(0.12, 0.36, slope) * 0.72));
        const depth = smoothBetween(4, 40, -height);
        const seabed = Color3.Lerp(reefSand, reefRock, 0.15 + depth * 0.66 + texture * 0.11);
        return Color3.Lerp(seabed, shore, smoothBetween(-4, 0.8, height));
    }
    if (biome === "coast") {
        const blades = smoothBetween(-0.46, 0.7, noise * 0.78 + texture * 0.58);
        const pasture = Color3.Lerp(base, coastalPasture, 0.26 + blades * 0.68);
        const ground = Color3.Lerp(sand, pasture, smoothBetween(-2.5, 9 + noise * 4, height));
        const cut = smoothBetween(0.086, 0.37, slope);
        const strata = 0.13 * Math.sin(height * 0.83 + noise * 3.4 + texture * 0.45);
        const rock = Color3.Lerp(lowSlate, cliffChalk, 0.13 + smoothBetween(-4.5, 18, height) * 0.69 + strata);
        return Color3.Lerp(ground, rock, cut * 0.97);
    }
    if (biome === "alpine") {
        const cliff = smoothBetween(0.08, 0.39, slope);
        const bands = 0.15 * (1 + Math.sin(height * 0.19 + noise * 4.7 + texture * 1.6));
        const mineral = Color3.Lerp(alpineStone, slate, cliff * 0.53 + bands + Math.max(0, noise) * 0.16);
        const meadow = Color3.Lerp(base, alpineMeadow, smoothBetween(-0.26, 0.62, noise * 0.56 + texture * 0.44) * 0.73);
        const rock = Color3.Lerp(meadow, mineral, Math.max(cliff, smoothBetween(78, 115, height + noise * 13)));
        const snowLine = height + noise * 16 - cliff * 31;
        const cap = smoothBetween(166, 201, snowLine + texture * 11) * (1 - cliff * 0.76);
        return Color3.Lerp(rock, snow, cap);
    }
    if (biome === "caldera") {
        const band = Math.sin(height * 0.37 + noise * 5.3);
        const face = smoothBetween(0.16, 0.44, slope);
        const stone = Color3.Lerp(base, cooledBasalt, (0.54 + band * 0.21 + noise * 0.15) * face);
        Color3.LerpToRef(stone, purpleAsh, smoothBetween(0.13, 0.73, band + noise * 0.35) * 0.38, stone);
        const ash = smoothBetween(0.06, 0.52, texture * 0.61 + noise) * (1 - Math.min(0.84, slope));
        return Color3.Lerp(stone, alpineStone, ash * 0.34);
    }
    if (biome === "mars") {
        const scoria = smoothBetween(0.06, 0.58, noise + slope * 0.62 + texture * 0.21);
        const dryDust = smoothBetween(-0.2, 0.78, -noise + texture * 0.41);
        const shade = Color3.Lerp(base, martianIron, scoria * 0.67);
        return Color3.Lerp(shade, martianDust, dryDust * 0.56);
    }
    if (biome === "stunt") {
        const meadow = Color3.Lerp(base, meadowSun, 0.49 * smoothBetween(-0.28, 0.59, noise + texture * 0.31));
        const bluff = smoothBetween(22, 41, height) * smoothBetween(0.041, 0.19, slope);
        return Color3.Lerp(meadow, limestoneBluff, bluff * 0.87);
    }
    if (biome === "canyon") {
        const cliff = smoothBetween(0.055, 0.30, slope);
        const bedding = 0.52 + Math.sin(height * 0.43 + noise * 1.7 + texture * 0.24) * 0.41;
        const bands = Color3.Lerp(canyonDark, canyonLight, bedding);
        const wash = Color3.Lerp(base, sand, smoothBetween(-0.46, 0.64, noise * 0.77 + texture * 0.42) * 0.66);
        return Color3.Lerp(wash, bands, 0.79 * Math.max(cliff, smoothBetween(31, 68, height)));
    }
    if (biome === "gorge") {
        const cliff = smoothBetween(0.04, 0.29, slope);
        const bed = Math.sin(height * 0.224 + noise * 1.83 + texture * 0.28);
        const upperRim = smoothBetween(78, 115, height + bed * 7 + noise * 6);
        const shale = Color3.Lerp(slate, lowSlate, 0.27 + 0.23 * bed + texture * 0.19);
        const iron = Color3.Lerp(canyonDark, canyonLight, 0.46 + 0.34 * bed + texture * 0.17);
        const bench = Color3.Lerp(base, heath, smoothBetween(-0.54, 0.62, noise + texture * 0.24) * 0.64);
        return Color3.Lerp(bench, Color3.Lerp(shale, iron, upperRim), Math.max(cliff, upperRim * 0.76));
    }
    if (biome === "old-town") {
        const garden = Color3.Lerp(base, park, smoothBetween(-0.27, 0.45, noise + texture * 0.58) * 0.78);
        const warmBank = Color3.Lerp(heath, coastalPasture, Math.max(0, texture * 0.56 + noise * 0.25));
        return Color3.Lerp(garden, warmBank, smoothBetween(0.055, 0.26, slope + texture * 0.04) * 0.87);
    }
    if (biome === "future") {
        const lawns = Color3.Lerp(base, meadowSun,
            smoothBetween(-0.43, 0.58, noise * 0.52 + texture * 0.76) * 0.62);
        const strata = 0.14 * Math.sin(height * 1.02 + noise * 2.21);
        const face = Color3.Lerp(lowSlate, alpineStone, 0.53 + strata);
        return Color3.Lerp(lawns, face, smoothBetween(0.065, 0.32, slope) * 0.89);
    }
    if (biome === "metro") {
        return Color3.Lerp(base, park, smoothBetween(0.1, 0.61, noise) * 0.78);
    }
    if (biome === "ruins") {
        const dust = smoothBetween(0.05, 0.67, noise * 0.71 + texture * 0.59);
        const drySlope = smoothBetween(0.055, 0.28, slope);
        const color = Color3.Lerp(base, heath, 0.29 + dust * 0.55);
        const bands = 0.16 * Math.sin(height * 0.82 + noise * 1.68);
        const limestone = Color3.Lerp(redEarth, sunlitLimestone, 0.65 + bands);
        return Color3.Lerp(color, limestone, drySlope * (0.76 + dust * 0.21));
    }
    if (biome === "forest") {
        const green = Color3.Lerp(base, darkGreen, Math.max(0, noise + texture * 0.45) * 0.55);
        const leafy = Color3.Lerp(green, heath, smoothBetween(0.04, 0.72, texture - noise * 0.3) * 0.46);
        const layers = 0.13 * Math.sin(height * 0.60 + texture * 1.5);
        const outcrop = smoothBetween(0.15, 0.43, slope) * 0.79;
        const crown = smoothBetween(58, 103, height + 17 * noise) * 0.52;
        return Color3.Lerp(leafy, Color3.Lerp(slate, dampRock, 0.35 + layers), Math.max(outcrop, crown));
    }
    if (biome === "rail") {
        const pasture = Color3.Lerp(base, darkGreen, smoothBetween(0.04, 0.62, noise + slope) * 0.45);
        const meadow = Color3.Lerp(pasture, meadowSun, smoothBetween(-0.16, 0.7, texture - noise) * 0.69);
        const cuts = smoothBetween(0.09, 0.28, slope);
        const strata = 0.40 + Math.sin(height * 0.37 + texture * 1.17) * 0.32;
        const ribs = Math.max(cuts, smoothBetween(82, 135, height + noise * 22));
        return Color3.Lerp(meadow, Color3.Lerp(slate, lowSlate, strata), ribs * 0.89);
    }
    if (biome === "arctic") {
        const drift = Color3.Lerp(base, windSnow, Math.max(0, texture * 0.6 + slope) * 0.55);
        const gullies = Math.sin(height * 0.17 + noise * 4.45 + texture * 1.1);
        const face = smoothBetween(0.035, 0.19, slope + gullies * 0.034) * smoothBetween(7, 30, height);
        const rock = Color3.Lerp(lowSlate, frozenSlate, 0.55 + gullies * 0.29);
        Color3.LerpToRef(drift, rock, face * (0.74 + texture * 0.14), drift);
        const cap = smoothBetween(85, 123, height + noise * 27) * (1 - face * 0.76);
        return Color3.Lerp(drift, snow, cap);
    }
    return base;
}
