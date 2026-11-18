import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import basaltImage from "./materials/basalt.jpg?inline";
import calderaAsphalt from "./materials/caldera-asphalt.jpg?inline";
import calderaFracture from "./materials/caldera-fracture.jpg?inline";
import calderaScree from "./materials/caldera-scree.jpg?inline";
import calderaPatina from "./materials/caldera-patina.jpg?inline";
import cinderAsphalt from "./materials/cinder-asphalt.jpg?inline";
import cinderSandstone from "./materials/cinder-sandstone.jpg?inline";
import cinderMasonry from "./materials/cinder-masonry.jpg?inline";
import cinderGravel from "./materials/cinder-gravel.jpg?inline";
import copperAsphalt from "./materials/copper-asphalt.jpg?inline";
import copperShale from "./materials/copper-shale.jpg?inline";
import copperAshlar from "./materials/copper-ashlar.jpg?inline";
import copperStrata from "./materials/copper-strata.jpg?inline";
import juniperMasonry from "./materials/juniper-masonry.jpg?inline";
import juniperAsphalt from "./materials/juniper-asphalt.jpg?inline";
import juniperTurf from "./materials/juniper-turf.jpg?inline";
import juniperRoof from "./materials/juniper-roof.jpg?inline";
import canyonGravel from "./materials/canyon-gravel.jpg?inline";
import canyonStrata from "./materials/canyon-strata.jpg?inline";
import lavaCrust from "./materials/lava-crust.jpg?inline";
import marsRegolith from "./materials/mars-regolith.jpg?inline";
import springTurf from "./materials/spring-turf.jpg?inline";
import limestoneImage from "./materials/limestone.jpg?inline";
import coastalChalk from "./materials/coastal-chalk.jpg?inline";
import pacificChalk from "./materials/pacific-chalk.jpg?inline";
import pacificAsphalt from "./materials/pacific-asphalt.jpg?inline";
import pacificSlate from "./materials/pacific-slate.jpg?inline";
import pacificBluffGrass from "./materials/pacific-bluff-grass.jpg?inline";
import alpineGranite from "./materials/alpine-granite.jpg?inline";
import alpineFracturedGranite from "./materials/alpine-fractured-granite.jpg?inline";
import alpineAsphalt from "./materials/alpine-asphalt.jpg?inline";
import alpineDriftSnow from "./materials/alpine-drift-snow.jpg?inline";
import alpineRoofMetal from "./materials/alpine-roof-metal.jpg?inline";
import aegeanLimestone from "./materials/aegean-limestone.jpg?inline";
import aegeanMasonry from "./materials/aegean-masonry.jpg?inline";
import aegeanBedrock from "./materials/aegean-bedrock.jpg?inline";
import aegeanTerracotta from "./materials/aegean-terracotta.jpg?inline";
import aegeanAsphalt from "./materials/aegean-asphalt.jpg?inline";
import bellgateSetts from "./materials/bellgate-setts.jpg?inline";
import bellgateAshlar from "./materials/bellgate-ashlar.jpg?inline";
import bellgateTerracotta from "./materials/bellgate-terracotta.jpg?inline";
import bellgateLimewash from "./materials/bellgate-limewash.jpg?inline";
import bellgateCobbles from "./materials/bellgate-cobbles.jpg?inline";
import glasswaterAsphalt from "./materials/glasswater-asphalt.jpg?inline";
import glasswaterAshlar from "./materials/glasswater-ashlar.jpg?inline";
import glasswaterBrick from "./materials/glasswater-brick.jpg?inline";
import glasswaterEnamel from "./materials/glasswater-enamel.jpg?inline";
import glasswaterTerrazzo from "./materials/glasswater-terrazzo.jpg?inline";
import auroraAsphalt from "./materials/aurora-asphalt.jpg?inline";
import auroraIvory from "./materials/aurora-ivory.jpg?inline";
import auroraStone from "./materials/aurora-stone.jpg?inline";
import auroraPhotovoltaic from "./materials/aurora-photovoltaic.jpg?inline";
import aresAsphalt from "./materials/ares-asphalt.jpg?inline";
import aresStrata from "./materials/ares-strata.jpg?inline";
import aresCeramic from "./materials/ares-ceramic.jpg?inline";
import aresEnamel from "./materials/ares-enamel.jpg?inline";
import skywheelAsphalt from "./materials/skywheel-asphalt.jpg?inline";
import skywheelLimestone from "./materials/skywheel-limestone.jpg?inline";
import skywheelEnamel from "./materials/skywheel-enamel.jpg?inline";
import skywheelTurf from "./materials/skywheel-turf.jpg?inline";
import whiteCeramic from "./materials/white-ceramic.jpg?inline";
import frostCrust from "./materials/frost-crust.jpg?inline";
import frosthavenBlueIce from "./materials/frosthaven-blue-ice.jpg?inline";
import frosthavenDriftSnow from "./materials/frosthaven-drift-snow.jpg?inline";
import frosthavenSlate from "./materials/frosthaven-slate.jpg?inline";
import frosthavenAshlar from "./materials/frosthaven-ashlar.jpg?inline";
import cloudfoldAsphalt from "./materials/cloudfold-asphalt.jpg?inline";
import cloudfoldShale from "./materials/cloudfold-shale.jpg?inline";
import cloudfoldCeramic from "./materials/cloudfold-ceramic.jpg?inline";
import cloudfoldCopper from "./materials/cloudfold-copper.jpg?inline";
import cloudfoldSlate from "./materials/cloudfold-slate.jpg?inline";
import coralSand from "./materials/coral-sand.jpg?inline";
import coralAsphalt from "./materials/coral-asphalt.jpg?inline";
import coralLimestone from "./materials/coral-limestone.jpg?inline";
import coralRippleSand from "./materials/coral-ripple-sand.jpg?inline";
import coralCaustics from "./materials/coral-caustics.jpg?inline";
import agedCedar from "./materials/aged-cedar.jpg?inline";
import dustyAsphalt from "./materials/dusty-asphalt.jpg?inline";
import heatShield from "./materials/heat-shield.jpg?inline";
import scoriaMasonry from "./materials/scoria-masonry.jpg?inline";
import forestAsphalt from "./materials/forest-asphalt.jpg?inline";
import woodlandSlate from "./materials/woodland-slate.jpg?inline";
import sawnCedar from "./materials/sawn-cedar.jpg?inline";
import forestDuff from "./materials/forest-duff.jpg?inline";
import whitewater from "./materials/whitewater.jpg?inline";
import { seededRandom } from "../../game/random.ts";

const SIZE = 256;
type RGB = readonly [number, number, number];
export type SurfacePattern = keyof typeof bakedPatterns | "asphalt" | "weathered asphalt" | "concrete" | "cobbles" | "brickwork" | "meadow" | "sandstone" | "granite" | "rock bedding"
    | "volcanic ash" | "weathered steel" | "ceramic plating" | "thermal cladding" | "dusty enamel"
    | "molded rubber" | "snow" | "ice" | "packed ice" | "water" | "river ripples" | "plaster" | "shingles" | "boards" | "bark" | "birch"
    | "foliage" | "glazing" | "airship fabric" | "end grain" | "straw";

const bakedPatterns = {
    basalt: basaltImage,
    "caldera asphalt": calderaAsphalt,
    "caldera fracture": calderaFracture,
    "caldera scree": calderaScree,
    "caldera patina": calderaPatina,
    limestone: limestoneImage,
    "cinder asphalt": cinderAsphalt,
    "cinder sandstone": cinderSandstone,
    "cinder masonry": cinderMasonry,
    "cinder gravel": cinderGravel,
    "copper asphalt": copperAsphalt,
    "copper shale": copperShale,
    "copper ashlar": copperAshlar,
    "copper strata": copperStrata,
    "juniper masonry": juniperMasonry,
    "juniper asphalt": juniperAsphalt,
    "juniper turf": juniperTurf,
    "juniper roof": juniperRoof,
    "canyon gravel": canyonGravel,
    "canyon strata": canyonStrata,
    "lava crust": lavaCrust,
    "mars regolith": marsRegolith,
    "spring turf": springTurf,
    "coastal chalk": coastalChalk,
    "pacific chalk": pacificChalk,
    "pacific asphalt": pacificAsphalt,
    "pacific slate": pacificSlate,
    "pacific bluff grass": pacificBluffGrass,
    "alpine granite": alpineGranite,
    "alpine fractured granite": alpineFracturedGranite,
    "alpine asphalt": alpineAsphalt,
    "alpine drift snow": alpineDriftSnow,
    "alpine roof metal": alpineRoofMetal,
    "aegean limestone": aegeanLimestone,
    "aegean masonry": aegeanMasonry,
    "aegean bedrock": aegeanBedrock,
    "aegean terracotta": aegeanTerracotta,
    "aegean asphalt": aegeanAsphalt,
    "bellgate setts": bellgateSetts,
    "bellgate ashlar": bellgateAshlar,
    "bellgate terracotta": bellgateTerracotta,
    "bellgate limewash": bellgateLimewash,
    "bellgate cobbles": bellgateCobbles,
    "glasswater asphalt": glasswaterAsphalt,
    "glasswater ashlar": glasswaterAshlar,
    "glasswater brick": glasswaterBrick,
    "glasswater enamel": glasswaterEnamel,
    "glasswater terrazzo": glasswaterTerrazzo,
    "aurora asphalt": auroraAsphalt,
    "aurora ivory": auroraIvory,
    "aurora stone": auroraStone,
    "aurora photovoltaic": auroraPhotovoltaic,
    "ares asphalt": aresAsphalt,
    "ares strata": aresStrata,
    "ares ceramic": aresCeramic,
    "ares enamel": aresEnamel,
    "skywheel asphalt": skywheelAsphalt,
    "skywheel limestone": skywheelLimestone,
    "skywheel enamel": skywheelEnamel,
    "skywheel turf": skywheelTurf,
    "white ceramic": whiteCeramic,
    "frost crust": frostCrust,
    "frosthaven blue ice": frosthavenBlueIce,
    "frosthaven drift snow": frosthavenDriftSnow,
    "frosthaven slate": frosthavenSlate,
    "frosthaven ashlar": frosthavenAshlar,
    "cloudfold asphalt": cloudfoldAsphalt,
    "cloudfold shale": cloudfoldShale,
    "cloudfold ceramic": cloudfoldCeramic,
    "cloudfold copper": cloudfoldCopper,
    "cloudfold slate": cloudfoldSlate,
    "coral sand": coralSand,
    "coral asphalt": coralAsphalt,
    "coral limestone": coralLimestone,
    "coral ripple sand": coralRippleSand,
    "coral caustics": coralCaustics,
    "aged cedar": agedCedar,
    "dusty asphalt": dustyAsphalt,
    "heat shield": heatShield,
    "scoria masonry": scoriaMasonry,
    "forest asphalt": forestAsphalt,
    "woodland slate": woodlandSlate,
    "sawn cedar": sawnCedar,
    "forest duff": forestDuff,
    whitewater,
};

function isBaked(pattern: SurfacePattern): pattern is keyof typeof bakedPatterns {
    return Object.hasOwn(bakedPatterns, pattern);
}
type ProceduralPattern = Exclude<SurfacePattern, keyof typeof bakedPatterns>;

const patterns: Record<ProceduralPattern, { color: RGB; shade: (s: Sample) => number }> = {
    asphalt: { color: [117, 119, 122], shade: s =>
        8 * s.cloud + 19 * s.detail + 23 * s.grain + (s.grain > 0.45 ? 22 : 0) },
    "weathered asphalt": { color: [120, 121, 116], shade: s =>
        29 * s.cloud + 20 * s.detail + 24 * s.grain - 13 * Math.max(0, s.cloud - 0.04) },
    concrete: { color: [154, 161, 157], shade: s => panelSeams(s, 1, 1) * 0.25 + 14 * s.cloud + 10 * s.grain },
    cobbles: { color: [144, 130, 112], shade: s => masonry(s, 9, 10, 0.070) + 12 * s.detail },
    brickwork: { color: [208, 189, 174], shade: s =>
        masonry(s, 12, 17, 0.037) * 0.54 + 11 * s.detail + 12 * s.cloud },
    meadow: { color: [228, 234, 215], shade: s =>
        24 * s.cloud + 43 * s.detail + 28 * s.grain + (s.detail > 0.19 && s.grain > 0.24 ? 17 : 0) },
    granite: { color: [234, 231, 226], shade: s =>
        12 * s.cloud + 30 * s.detail + 25 * s.grain - (s.detail + s.grain * 0.28 > 0.25 ? 11 : 0) },
    sandstone: { color: [238, 226, 219], shade: s =>
        24 * s.cloud + 26 * s.detail + 18 * s.grain + 5 * Math.sin((s.v * 5 + s.cloud * 0.72) * Math.PI * 2) },
    "rock bedding": { color: [225, 215, 203], shade: s => {
        const v = s.v + s.cloud * 0.047 + Math.sin(s.u * Math.PI * 2) * 0.024;
        const bedding = Math.sin(v * Math.PI * 8 + Math.sin(v * Math.PI * 2) * 1.36);
        const seam = Math.max(0, Math.cos(v * Math.PI * 18 + Math.sin(s.u * Math.PI * 4) * 0.46)) ** 13;
        return bedding * 10 - seam * 27 + 19 * s.cloud + 29 * s.detail + 16 * s.grain;
    } },
    "volcanic ash": { color: [218, 216, 218], shade: s => {
        const gravel = s.detail > 0.14 ? 31 * s.grain : 13 * s.grain;
        const chips = s.detail < -0.27 && s.grain < -0.03 ? -27 : 0;
        return 42 * s.cloud + 25 * s.detail + gravel + chips;
    } },
    "weathered steel": { color: [212, 208, 199], shade: s =>
        panelSeams(s, 3, 2) * 0.50 + 14 * s.cloud + 11 * s.detail + 12 * s.grain },
    "ceramic plating": { color: [222, 218, 205], shade: s =>
        panelSeams(s, 4, 3) + 18 * s.cloud + 8 * s.detail },
    "thermal cladding": { color: [207, 197, 185], shade: s =>
        panelSeams(s, 7, 5) * 0.78 + 16 * s.detail + 10 * s.grain },
    "dusty enamel": { color: [243, 237, 225], shade: s =>
        22 * s.cloud + 13 * s.detail + 7 * s.grain - (s.detail < -0.26 && s.grain > 0.1 ? 25 : 0) },
    "molded rubber": { color: [230, 223, 216], shade: s =>
        10 * s.cloud + 12 * s.detail + 12 * s.grain - (s.v * 6 % 1 < 0.045 ? 28 : 0) },
    snow: { color: [236, 243, 249], shade: s => 19 * s.cloud + 17 * s.detail + 10 * s.grain },
    ice: { color: [176, 200, 218], shade: s =>
        25 * s.cloud + 15 * s.detail + 3 * Math.sin((s.u * 4 + s.v * 2 + s.cloud * 0.52) * Math.PI * 2) },
    "packed ice": { color: [160, 177, 191], shade: s =>
        26 * s.cloud + 23 * s.detail + 13 * s.grain + 2.8 * Math.sin((s.v * 3 + s.cloud * 1.5) * 2 * Math.PI) },
    water: { color: [206, 223, 230], shade: s =>
        18 * s.cloud + 13 * Math.sin((s.v * 7 + s.u * 2 + s.cloud * 0.50) * Math.PI * 2) + 7 * s.detail },
    "river ripples": { color: [211, 226, 229], shade: s => {
        const swells = Math.sin((s.v * 6 + s.u * 2 + s.cloud * 1.45) * Math.PI * 2);
        const ripples = Math.sin((s.v * 3 - s.u * 8 + s.detail * 0.64) * Math.PI * 2);
        const glints = Math.max(0, swells * 0.62 + ripples * 0.38) ** 4;
        return 20 * s.cloud + 7 * swells + 3 * ripples + 22 * glints;
    } },
    plaster: { color: [234, 226, 213], shade: s => 21 * s.cloud + 23 * s.detail + 13 * s.grain },
    shingles: { color: [226, 216, 202], shade: s => masonry(s, 12, 12, 0.048) + 13 * s.detail },
    boards: { color: [222, 214, 201], shade: s =>
        12 * s.cloud + 22 * s.detail + (s.v * 10 % 1 < 0.065 ? -53 : 0) },
    bark: { color: [210, 195, 177], shade: s =>
        27 * s.detail + 13 * s.grain - Math.max(0, Math.sin(s.u * Math.PI * 24 + s.cloud * 2.6)) ** 8 * 43 },
    birch: { color: [245, 238, 222], shade: s =>
        24 * s.grain + 17 * s.detail - (Math.sin(s.v * Math.PI * 26 + s.cloud * 4) > 0.83 && s.detail > -0.04 ? 113 : 0) },
    foliage: { color: [246, 246, 235], shade: s =>
        24 * s.cloud + 40 * s.detail + 20 * s.grain - Math.max(0, 0.13 - s.detail - s.grain * 0.4) * 65 },
    glazing: { color: [204, 218, 229], shade: s =>
        21 * Math.cos((s.u * 2 + s.v * 0.43) * Math.PI) + 14 * s.cloud + 8 * s.detail },
    "airship fabric": { color: [243, 234, 223], shade: s => {
        const seam = Math.sin(s.u * 24 * Math.PI);
        return 10 * s.cloud + 7 * s.grain - Math.max(0, seam) ** 30 * 23;
    } },
    "end grain": { color: [234, 218, 192], shade: s => {
        const x = s.u - 0.43;
        const y = s.v - 0.52;
        const radius = Math.hypot(x, y * 0.93) + s.cloud * 0.026;
        const ring = Math.max(0, Math.sin(radius * 130 + 1.9 * Math.sin(radius * 18)));
        const split = x > 0.08 && Math.abs(y + x * 0.31 + s.detail * 0.023) < 0.008 ? 26 : 0;
        return 13 * s.detail + 10 * s.grain - 33 * ring ** 6 - split;
    } },
    straw: { color: [230, 217, 182], shade: s => {
        const stalks = Math.sin((s.u * 78 + s.v * 6 + s.detail * 0.9) * Math.PI * 2);
        return 26 * s.cloud + 20 * s.detail + 22 * s.grain + stalks * 16;
    } },
};

interface Sample {
    u: number;
    v: number;
    cloud: number;
    detail: number;
    grain: number;
}

function noiseGrid(cells: number, random: () => number): (u: number, v: number) => number {
    const grid = Array.from({ length: cells * cells }, () => random() - 0.5);
    const at = (x: number, y: number): number => grid[(y % cells) * cells + x % cells]!;
    return (u, v) => {
        const x = Math.floor(u * cells);
        const y = Math.floor(v * cells);
        const dx = u * cells - x;
        const dy = v * cells - y;
        const tx = dx * dx * (3 - 2 * dx);
        const ty = dy * dy * (3 - 2 * dy);
        const a = at(x, y) * (1 - tx) + at(x + 1, y) * tx;
        const b = at(x, y + 1) * (1 - tx) + at(x + 1, y + 1) * tx;
        return a * (1 - ty) + b * ty;
    };
}

function masonry(s: Sample, columns: number, rows: number, joint: number): number {
    const y = s.v * rows;
    const row = Math.floor(y);
    const x = s.u * columns + (row % 2) * 0.5;
    const cell = Math.floor(x) % columns;
    const hue = Math.sin((cell * 11 + row * 17) * 2.34) * 17;
    const marginX = x % 1;
    const marginY = y % 1;
    const edge = Math.min(marginX, 1 - marginX, marginY, 1 - marginY) + s.detail * 0.053;
    if (edge < joint) return -52 + 13 * s.grain;
    const bevel = Math.max(0, 1 - (edge - joint) * 10);
    return hue + (marginY < 0.5 ? 28 : -21) * bevel + 9 * s.grain;
}

function panelSeams(s: Sample, columns: number, rows: number): number {
    const x = s.u * columns;
    const y = s.v * rows;
    const tx = x % 1;
    const ty = y % 1;
    const edge = Math.min(tx, ty, 1 - tx, 1 - ty);
    if (edge < 0.022) return -33;
    const rivetX = Math.min(Math.abs(tx - 0.092), Math.abs(tx - 0.908));
    const rivetY = Math.min(Math.abs(ty - 0.095), Math.abs(ty - 0.905));
    const rivet = rivetX * rivetX + rivetY * rivetY < 0.0008 ? -19 : 0;
    return rivet + 10 * Math.cos(Math.floor(x) * 4.8 + Math.floor(y) * 8.2);
}

const tiles = new Map<ProceduralPattern, ImageData>();
const staticTextures = new WeakMap<Scene, Map<string, Texture>>();

function tile(pattern: ProceduralPattern): ImageData {
    const cached = tiles.get(pattern);
    if (cached) return cached;
    const large = pattern === "granite" || pattern === "meadow" || pattern === "sandstone" ||
        pattern === "snow" || pattern === "volcanic ash";
    const size = large ? SIZE * 2 : SIZE;
    const pixels = new ImageData(size, size);
    const random = seededRandom(931);
    const cloud = noiseGrid(5, random);
    const detail = noiseGrid(large ? 93 : 26, random);
    const { color, shade } = patterns[pattern];
    const sample: Sample = { u: 0, v: 0, cloud: 0, detail: 0, grain: 0 };
    for (let y = 0; y < size; y++) {
        sample.v = y / size;
        for (let x = 0; x < size; x++) {
            sample.u = x / size;
            sample.cloud = cloud(sample.u, sample.v);
            sample.detail = detail(sample.u, sample.v);
            sample.grain = random() - 0.5;
            const value = shade(sample);
            const i = (y * size + x) * 4;
            pixels.data[i] = color[0] + value;
            pixels.data[i + 1] = color[1] + value;
            pixels.data[i + 2] = color[2] + value;
            pixels.data[i + 3] = 255;
        }
    }
    tiles.set(pattern, pixels);
    return pixels;
}

export function surfaceTexture(scene: Scene, pattern: SurfacePattern, repeatU = 1, repeatV = repeatU): Texture {
    // Water offsets are animated by each caller.
    if (pattern === "water" || pattern === "river ripples" || pattern === "whitewater" || pattern === "coral caustics") {
        return createTexture(scene, pattern, repeatU, repeatV);
    }
    let textures = staticTextures.get(scene);
    if (!textures) {
        textures = new Map();
        staticTextures.set(scene, textures);
    }
    const key = [pattern, repeatU, repeatV].join(":");
    const existing = textures.get(key);
    if (existing) return existing;
    const texture = createTexture(scene, pattern, repeatU, repeatV);
    textures.set(key, texture);
    return texture;
}

function createTexture(scene: Scene, pattern: SurfacePattern, repeatU: number, repeatV: number): Texture {
    const texture = isBaked(pattern)
        ? new Texture(bakedPatterns[pattern], scene)
        : proceduralTexture(scene, pattern);
    texture.name = pattern;
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.uScale = repeatU;
    texture.vScale = repeatV;
    texture.anisotropicFilteringLevel = 8;
    return texture;
}

function proceduralTexture(scene: Scene, pattern: ProceduralPattern): Texture {
    const image = tile(pattern);
    const texture = new DynamicTexture(pattern, image.width, scene, true);
    texture.getContext().putImageData(image, 0, 0);
    texture.update(false);
    return texture;
}
