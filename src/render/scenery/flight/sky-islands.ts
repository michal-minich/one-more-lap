import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { cloudfoldGarden, cloudfoldIslands, cloudfoldIslandTrees } from "../../../game/course/sky-gardens.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { seededRandom } from "../../../game/random.ts";
import { cloudMask } from "../../environment/cloud-mask.ts";
import { skyPaint } from "../../environment/sky-textures.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surface } from "../surface-mesh.ts";
import { drawDisplayLandmarks } from "../landmark-models/biome-models.ts";
import { floatingArch } from "../landmark-models/models.ts";
import { surfaceTexture } from "../surface-textures.ts";

import type { FloatingIsland } from "../../../game/course/sky-gardens.ts";

const strata = [[-1, 0.08], [-0.83, 0.31], [-0.70, 0.25], [-0.50, 0.59],
    [-0.42, 0.53], [-0.20, 0.84], [-0.13, 0.78], [-0.045, 1], [0, 0.97]] as const;
const SIDES = 18;

export function drawSkyIslands(scene: Scene, course: Course): (time: number, daylight: number) => void {
    const stone = material(scene, "layered floating slate", "#99a2bf");
    stone.diffuseTexture = surfaceTexture(scene, "cloudfold shale");
    const grass = material(scene, "hanging island meadow", "#c8ae69");
    grass.diffuseTexture = surfaceTexture(scene, "meadow");
    const moss = material(scene, "topiary teal", "#477f70");
    const pale = material(scene, "topiary lime", "#a0bd74");
    moss.diffuseTexture = pale.diffuseTexture = surfaceTexture(scene, "foliage");
    const random = seededRandom(9174);
    const cliffs: Stamp[] = [];
    const meadows: Stamp[] = [];
    const cypresses: Stamp[] = [];
    const bushes: Stamp[] = [];
    const wells: Stamp[] = [];
    const cascades: Stamp[] = [];

    const bridgeGarden = course.branch && cloudfoldGarden(course.branch);
    const mainSites: FloatingIsland[] = [...cloudfoldIslands];
    const roadside = [[1_214, 45, 9, 20], [1_274, -49, 12, 24], [512, 46, 8, 24], [300, -45, 14, 18], [845, 53, 15, 24]] as const;
    for (const [distance, lateral, drop, radius] of roadside) {
        const top = pointOnRoute(course.at(distance), lateral, drop);
        mainSites.push([top.x, top.y, top.z, radius]);
    }
    const archIsland = mainSites[cloudfoldIslands.length + 2]!;
    const arch = floatingArch(scene);
    arch.position.set(archIsland[0], archIsland[1] - 0.35, archIsland[2]);
    arch.rotation.y = 0.68;
    arch.scaling.setAll(10.8);
    if (bridgeGarden) {
        mainSites.push([bridgeGarden.x, bridgeGarden.y, bridgeGarden.z, 13.5]);
    }
    for (const [index, [x, y, z, radius]] of mainSites.entries()) {
        const yaw = random() * 2 * Math.PI;
        const height = radius * (0.92 + random() * 0.75);
        const shape = { x, y, z, sx: radius, sy: height, sz: radius * (0.72 + random() * 0.24), yaw };
        cliffs.push(shape);
        meadows.push(shape);
        for (let j = 0; j < 12; j++) {
            const angle = j * 2.399963 + yaw;
            const reach = radius * (0.20 + random() * 0.60);
            const size = 1.3 + random() * 4.9;
            const plant = { x: x + Math.sin(angle) * reach, z: z + Math.cos(angle) * reach * 0.68, yaw: angle };
            const pavilionGarden = bridgeGarden !== undefined && index === mainSites.length - 1;
            if (pavilionGarden && (reach < 7 || j % 3 !== 1)) continue;
            if (!pavilionGarden && !cloudfoldIslandTrees.includes(index) && (j + index) % 3 === 0) {
                cypresses.push({ ...plant, y: y + size * 0.47, sx: size * 0.36, sy: size, sz: size * 0.36 });
            } else {
                bushes.push({ ...plant, y: y + size * 0.15, sx: size, sy: size * 0.48, sz: size * 0.75 });
            }
        }
        if (index % 4 === 2 || index === mainSites.length - 1 || index === cloudfoldIslands.length + 3) {
            const showcase = index === cloudfoldIslands.length + 3;
            const facing = showcase ? Math.atan2(course.at(300).x - x, course.at(300).z - z) : yaw;
            const lipX = x + Math.sin(facing) * radius * (showcase ? 0.97 : 0.73);
            const lipZ = z + Math.cos(facing) * radius * (showcase ? 0.91 : 0.63);
            wells.push({ x: lipX, y: y + 0.19, z: lipZ, sx: 4.7, sy: 0.3, sz: 4.2, yaw });
            for (let stream = -1; stream <= 1; stream++) {
                const drop = (showcase ? 76 : height) * (0.92 - Math.abs(stream) * 0.18);
                const width = showcase ? 1.55 : 0.82;
                cascades.push({ x: lipX + Math.cos(facing) * stream * width,
                    y: y - drop / 2, z: lipZ - Math.sin(facing) * stream * width,
                    sx: width, sy: drop, sz: 0.52, yaw: facing });
            }
        }
    }

    const rock = islandSurface(false);
    const top = islandSurface(true);
    stamp(surface(scene, "eroded island strata", rock, stone, () => rock.colors), cliffs);
    stamp(surface(scene, "meadow caps", top, grass), meadows);
    const trees = MeshBuilder.CreateCylinder("island cypresses", {
        height: 1, diameterTop: 0.04, diameterBottom: 1, tessellation: 9,
    }, scene);
    trees.material = moss;
    stamp(trees, cypresses);
    const topiary = MeshBuilder.CreateIcoSphere("island topiary", { radius: 0.5, subdivisions: 1, flat: false }, scene);
    topiary.material = pale;
    stamp(topiary, bushes);
    const water = material(scene, "suspended blue water", "#69c3d3");
    water.diffuseTexture = surfaceTexture(scene, "water", 1, 3);
    water.emissiveColor.set(0.08, 0.19, 0.25);
    water.alpha = 0.73;
    const pools = MeshBuilder.CreateCylinder("water gardens", { diameter: 1, height: 1, tessellation: 20 }, scene);
    pools.material = water;
    stamp(pools, wells);
    const waterfall = drawWaterfall(scene, cascades);
    drawDisplayLandmarks(scene, "cloudfold-rock", floatingOutcrops(course));
    drawDisplayLandmarks(scene, "cloudfold-crag", floatingCrags(course));
    return waterfall;
}

function floatingCrags(course: Course): Stamp[] {
    const sites = [
        [94, -64, 14, 45, -1.5], [165, -80, 30, 63, 1.13], [228, -51, 14, 50, 0.56],
        [253, 93, -13, 52, 1.76], [308, -54, 5, 52, -1.18], [352, 72, 25, 65, 0.89],
        [456, 62, -4, 43, 2.12], [560, -81, 31, 71, -0.78], [600, 38, 4, 36, 0.76],
        [624, -45, 12, 44, -2.1], [649, 69, 10, 54, -1.42],
        [768, -72, 16, 61, 0.43], [876, 53, -14, 47, 2.24], [1_032, -66, 9, 65, 1.46],
        [1_163, 61, 13, 49, 0.64], [1_247, 53, -8, 42, -0.31], [1_308, -50, 3, 57, 1.53],
        [1_388, -84, 26, 68, -0.78],
    ] as const;
    const decks = [...course.route, ...course.branch?.route ?? []];
    const placements: Stamp[] = [];
    for (const [distance, side, lift, height, yaw] of sites) {
        const top = pointOnRoute(course.at(distance), side, lift);
        const bottom = top.y - height;
        const radius = height * 0.388;
        const clear = decks.every(row => {
            return row.y + 3 < bottom || row.y > top.y + 5 || Math.hypot(row.x - top.x, row.z - top.z) >= radius + 11;
        });
        if (clear) placements.push({ ...top, y: bottom, sx: height, sy: height, sz: height, yaw });
    }
    return placements;
}

function floatingOutcrops(course: Course): Stamp[] {
    const sites = [[118, 73, 4, 21, 0.6], [387, -63, 6, 26, 1.75], [541, -68, 8, 19, 1.4],
        [666, -66, 11, 28, -1.15], [1_014, 64, 8, 24, 3.1], [1_190, 68, 10, 25, -0.7]] as const;
    return sites.map(([distance, side, drop, height, yaw]) => {
        const top = pointOnRoute(course.at(distance), side, -drop);
        return { ...top, y: top.y - height, sx: height * 1.08, sy: height, sz: height * 0.9, yaw };
    });
}

function drawWaterfall(scene: Scene, placements: readonly Stamp[]): (time: number, daylight: number) => void {
    const water = material(scene, "Cloudfold waterfall currents", "#81ccdf");
    const current = surfaceTexture(scene, "whitewater", 1, 4.6);
    water.diffuseTexture = current;
    water.backFaceCulling = false;
    water.emissiveColor.set(0.1, 0.24, 0.29);
    water.specularColor.set(0.23, 0.36, 0.43);
    const positions: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= 12; i++) {
        const down = i / 12;
        const width = 1.04 - down * 0.62;
        const shift = Math.sin(down * 4.8) * 0.28;
        for (const side of [-1, 0, 1]) {
            positions.push(shift + width * side * 0.5, 0.5 - down, 0.20 * Math.sin(down * 8 + side));
            uv.push((side + 1) * 0.5, down);
            const white = 0.76 + Math.sin(i * 1.77 + side * 4.3) * 0.12;
            colors.push(white * 0.84, white * 0.96, white, 0.14 + Math.sin((0.15 + down * 0.85) * Math.PI) * (side ? 0.41 : 0.8));
        }
        if (i === 0) continue;
        const a = (i - 1) * 3;
        indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
    const shape = { positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices) };
    const veil = surface(scene, "Cloudfold waterfall ribbons", shape, water, () => new Float32Array(colors));
    veil.hasVertexAlpha = true;
    stamp(veil, placements);
    const spray = skyPaint(scene, "waterfall spray", cloudMask(scene, 8312, "bank"));
    const plumes = placements.filter((_, index) => index % 3 === 1).map(({ x, y, z, sy }, index) => {
        const mist = MeshBuilder.CreatePlane("Cloudfold waterfall plume", {
            width: Math.max(8, sy * 0.25), height: Math.max(3.4, sy * 0.07),
        }, scene);
        mist.material = spray;
        mist.billboardMode = Mesh.BILLBOARDMODE_ALL;
        mist.isPickable = false;
        mist.alphaIndex = 14;
        return { mist, x, y: y - sy * 0.46, z, phase: index * 2.19 };
    });
    return (time, daylight) => {
        current.vOffset = (1 - time * 0.31 % 1) % 1;
        current.uOffset = Math.sin(time * 0.23) * 0.065;
        spray.diffuseColor.set(0.52 + daylight * 0.46, 0.65 + daylight * 0.32, 0.77 + daylight * 0.20);
        for (const { mist, x, y, z, phase } of plumes) {
            mist.position.set(x + Math.sin(time * 0.39 + phase) * 1.5, y + Math.cos(time * 0.50 + phase) * 0.59, z);
            mist.visibility = 0.65 + Math.sin(time * 0.68 + phase) * 0.13;
        }
    };
}

function islandSurface(top: boolean): IslandSurface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const profile = top ? [[0, 0.97], [0.006, 0.78], [0.008, 0.47]] as const : strata;
    for (const [layer, [height, radius]] of profile.entries()) {
        for (let i = 0; i < SIDES; i++) {
            const angle = i / SIDES * Math.PI * 2;
            const rough = 1 + Math.sin(angle * 3 + 0.9) * 0.14 + Math.sin(angle * 5 - 0.4) * 0.063;
            const x = Math.sin(angle) * rough * radius + (top ? 0 : height * 0.22);
            const z = Math.cos(angle) * rough * radius + (top ? 0 : height * 0.15);
            const y = height + (top || layer === profile.length - 1 ? 0 : 0.04 * Math.sin(angle * 2 + layer * 0.4));
            positions.push(x, y, z);
            uv.push(x * 1.7 + y * 0.27, z * 1.7 + y * 0.62);
            const shade = 0.81 + Math.sin(angle * 2) * 0.065 + layer % 2 * 0.15;
            colors.push(shade, shade * 0.96, shade, 1);
            if (layer > 0) {
                const a = (layer - 1) * SIDES + i;
                const b = (layer - 1) * SIDES + (i + 1) % SIDES;
                indices.push(a, a + SIDES, b, b, a + SIDES, b + SIDES);
            }
        }
    }
    if (top) {
        const center = positions.length / 3;
        positions.push(0, 0.01, 0);
        uv.push(0, 0);
        for (let i = 0; i < SIDES; i++) indices.push(center - SIDES + i, center, center - SIDES + (i + 1) % SIDES);
    }
    return {
        positions: new Float32Array(positions), indices: new Uint32Array(indices),
        uv: new Float32Array(uv), colors: new Float32Array(colors),
    };
}

interface IslandSurface {
    readonly positions: Float32Array;
    readonly indices: Uint32Array;
    readonly uv: Float32Array;
    readonly colors: Float32Array;
}
