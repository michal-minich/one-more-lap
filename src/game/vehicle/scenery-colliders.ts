import RAPIER from "@dimforge/rapier3d-compat";
import { aqueductArchSurface, aqueductWallSurface, upperAqueduct } from "../course/aqueduct.ts";
import type { Aqueduct } from "../course/aqueduct.ts";
import { aresCanopySize, aresHabitatSize } from "../course/ares-gardens.ts";
import type { AresGardens } from "../course/ares-gardens.ts";
import { bellgateBelfryFooting } from "../course/bellgate-belfry.ts";
import { isLandmarkTree } from "../course/biome-landmarks.ts";
import type { BiomeLandmark, BiomeLandmarkKind } from "../course/biome-landmarks.ts";
import type { StreetBuilding } from "../course/city-frontage.ts";
import { forestBridgeSize } from "../course/forest-bridge.ts";
import type { ForestBridge } from "../course/forest-bridge.ts";
import { forestMillSize } from "../course/forest-mill.ts";
import type { ForestMill } from "../course/forest-mill.ts";
import type { GlasswaterFlyover } from "../course/glasswater-flyover.ts";
import { pacificLighthouse } from "../course/pacific-lighthouse.ts";
import { coolantModuleSize } from "../course/halls.ts";
import type { Hall } from "../course/halls.ts";
import { hallWalls } from "../course/hall-walls.ts";
import { juniperShedBase, juniperShedLoadingDeck } from "../course/railway/shed.ts";
import { juniperSignalBase } from "../course/railway/signals.ts";
import { juniperStationPlatform, juniperStationPlinth } from "../course/railway/station.ts";
import { coralLookoutFoundations } from "../course/reef-lookout.ts";
import { rockProfiles } from "../course/rock-profiles.ts";
import type { RockFormation } from "../course/rock-formations.ts";
import { GATE_DEPTH, GATE_WALKWAY, GATE_WIDTH } from "../course/town-gate.ts";
import type { TownGate } from "../course/town-gate.ts";
import type { RockShelter } from "../course/rock-shelters.ts";
import { boulderSizes } from "../course/vegetation/layout.ts";
import type { Vegetation } from "../course/vegetation/layout.ts";
import { treeTrunks } from "../course/vegetation/trees.ts";
import { yawPitchRotation, yawRotation } from "./pose.ts";
import { surfaceCollider } from "./surface-collider.ts";

export function addAresGardenColliders(world: RAPIER.World, plans: AresGardens): void {
    const { foundation, dome, rise, lockWidth, lockDepth } = aresHabitatSize;
    for (const { at, yaw, scale, base, bottom, lock, lockHeight } of plans.habitats) {
        const halfHeight = (base - bottom) / 2;
        world.createCollider(RAPIER.ColliderDesc.cylinder(halfHeight, foundation * scale / 2)
            .setTranslation(at.x, bottom + halfHeight, at.z).setFriction(0.58));
        const shell = [0, rise * scale, 0];
        for (let ring = 0; ring < 4; ring++) {
            const angle = ring * Math.PI / 8;
            const y = Math.sin(angle) * rise * scale;
            const radius = Math.cos(angle) * dome * scale / 2;
            for (let i = 0; i < 16; i++) {
                const bearing = i * Math.PI / 8;
                shell.push(Math.cos(bearing) * radius, y, Math.sin(bearing) * radius);
            }
        }
        const hull = RAPIER.ColliderDesc.convexHull(new Float32Array(shell))!;
        world.createCollider(hull.setTranslation(at.x, base, at.z).setFriction(0.37));
        world.createCollider(RAPIER.ColliderDesc.cuboid(lockWidth * scale / 2, lockHeight / 2, lockDepth * scale / 2)
            .setTranslation(lock.x, lock.y, lock.z).setRotation(yawRotation(yaw)).setFriction(0.56));
    }
    const { width, depth, thickness, post } = aresCanopySize;
    for (const { roof, yaw, feet } of plans.canopies) {
        const rotation = yawRotation(yaw);
        world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, thickness / 2, depth / 2)
            .setTranslation(roof.x, roof.y, roof.z).setRotation(rotation).setFriction(0.41));
        for (const foot of feet) {
            const halfHeight = (roof.y - foot.y) / 2;
            world.createCollider(RAPIER.ColliderDesc.cuboid(post / 2, halfHeight, post / 2)
                .setTranslation(foot.x, foot.y + halfHeight, foot.z).setRotation(rotation).setFriction(0.55));
        }
    }
}

export function addSceneryColliders(world: RAPIER.World, vegetation: Vegetation): void {
    for (const { kind, ground, scale } of vegetation.trees) {
        const trunk = treeTrunks[kind];
        const height = trunk.height * scale;
        world.createCollider(RAPIER.ColliderDesc.cylinder(height / 2 + 0.075, trunk.radius * scale * 0.91)
            .setTranslation(ground.x, ground.y + height / 2 - 0.055, ground.z)
            .setFriction(0.38).setRestitution(0.12));
    }
    for (const { shape, ground, scale, yaw } of vegetation.boulders) {
        if (scale < 0.88) continue;
        const size = boulderSizes[shape];
        const radius = scale * 0.11;
        world.createCollider(RAPIER.ColliderDesc.roundCuboid(
            size.width * scale * 0.59, size.height * scale * 0.63, size.depth * scale * 0.58, radius,
        ).setTranslation(ground.x, ground.y + size.lift * scale, ground.z)
            .setRotation(yawRotation(yaw)).setFriction(0.57).setRestitution(0.07));
    }
}

export function addBiomeLandmarkColliders(world: RAPIER.World, landmarks: readonly BiomeLandmark[]): void {
    for (const landmark of landmarks) {
        const { kind, x, y, z, height, yaw, radius } = landmark;
        if (kind === "frosthaven-boathouse" || kind === "frosthaven-beacon") continue;
        if (kind === "aegean-ruin") {
            addStoaColliders(world, landmark);
            continue;
        }
        if (kind === "caldera-tussock" || kind === "blackwood-fern" || kind === "aegean-tuft" || kind === "pacific-thrift" ||
            kind === "cloudfold-grasses" || kind === "coral-hibiscus" || kind === "alpine-shrub" || kind === "cinder-sage" || kind === "copper-wildflowers" || kind === "juniper-flowers") continue;
        if (kind === "juniper-station") {
            for (const plinth of [...juniperStationPlinth(landmark), juniperStationPlatform(landmark)]) {
                world.createCollider(RAPIER.ColliderDesc.cuboid(plinth.width / 2, plinth.height / 2, plinth.depth / 2)
                    .setTranslation(plinth.x, plinth.y, plinth.z)
                    .setRotation(yawRotation(plinth.yaw)).setFriction(0.67));
            }
        }
        if (kind === "juniper-semaphore") {
            const base = juniperSignalBase(landmark);
            world.createCollider(RAPIER.ColliderDesc.cuboid(base.width / 2, base.height / 2, base.width / 2)
                .setTranslation(base.x, base.y, base.z).setRotation(yawRotation(base.yaw)).setFriction(0.65));
        }
        if (kind === "juniper-shed" && landmark.footing !== undefined) {
            for (const base of [juniperShedBase(landmark), juniperShedLoadingDeck(landmark)]) {
                world.createCollider(RAPIER.ColliderDesc.cuboid(base.width / 2, base.height / 2, base.depth / 2)
                    .setTranslation(base.x, base.y, base.z).setRotation(yawRotation(base.yaw)).setFriction(0.67));
            }
        }
        if (kind === "coral-lookout") {
            for (const base of coralLookoutFoundations(landmark)) {
                world.createCollider(RAPIER.ColliderDesc.cuboid(base.sx / 2, base.sy / 2, base.sz / 2)
                    .setTranslation(base.x, base.y, base.z).setRotation(yawRotation(base.yaw)).setFriction(0.63));
            }
        }
        if (kind === "bellgate-citrus") {
            const centerX = x + height * (0.021 * Math.sin(yaw) - 0.007 * Math.cos(yaw));
            const centerZ = z + height * (0.021 * Math.cos(yaw) + 0.007 * Math.sin(yaw));
            for (const [rise, half, width] of [[0.13, 0.134, 0.177], [0.262, 0.066, 0.205],
                [0.364, 0.044, 0.169], [0.467, 0.088, 0.057]] as const) {
                world.createCollider(RAPIER.ColliderDesc.cylinder(height * half, height * width)
                    .setTranslation(centerX, y + height * rise, centerZ).setFriction(0.59));
            }
            continue;
        }
        if (kind === "bellgate-fountain") {
            const rim = height * 0.154;
            world.createCollider(RAPIER.ColliderDesc.cylinder(rim, height * 0.53)
                .setTranslation(x, y + rim, z).setFriction(0.59));
            continue;
        }
        if (kind === "bellgate-belfry") {
            const base = bellgateBelfryFooting(landmark);
            world.createCollider(RAPIER.ColliderDesc.cuboid(base.sx / 2, base.sy / 2, base.sz / 2)
                .setTranslation(x, base.y, z).setRotation(yawRotation(yaw)).setFriction(0.62));
        }
        const parts = landmarkBoxes[kind];
        if (parts) {
            addLocalBoxes(world, landmark, parts);
            continue;
        }
        if (kind === "cinder-juniper") {
            const cos = Math.cos(yaw);
            const sin = Math.sin(yaw);
            const trunkX = height * 0.236;
            const trunkZ = -height * 0.115;
            world.createCollider(RAPIER.ColliderDesc.cylinder(height * 0.17, height * 0.098)
                .setTranslation(x + trunkX * cos + trunkZ * sin, y + height * 0.17, z - trunkX * sin + trunkZ * cos)
                .setFriction(0.43));
            continue;
        }
        if (kind === "frosthaven-spruce") {
            const across = height * 0.019;
            const along = height * -0.058;
            const halfHeight = height * 0.146;
            world.createCollider(RAPIER.ColliderDesc.cylinder(halfHeight, height * 0.069)
                .setTranslation(x + across * Math.cos(yaw) + along * Math.sin(yaw), y + halfHeight,
                    z - across * Math.sin(yaw) + along * Math.cos(yaw)).setFriction(0.43));
            continue;
        }
        if (kind === "coral-palm") {
            const across = height * 0.284;
            const along = height * -0.213;
            const halfHeight = height * 0.159;
            world.createCollider(RAPIER.ColliderDesc.cylinder(halfHeight, height * 0.073)
                .setTranslation(x + across * Math.cos(yaw) + along * Math.sin(yaw), y + halfHeight,
                    z - across * Math.sin(yaw) + along * Math.cos(yaw)).setFriction(0.44));
            continue;
        }
        if (kind === "cinder-banded-hoodoo") {
            const turn = yawRotation(yaw);
            for (const [rise, width, depth, halfHeight] of [[0.14, 0.29, 0.31, 0.15],
                [0.42, 0.17, 0.16, 0.145], [0.68, 0.12, 0.13, 0.14], [0.90, 0.20, 0.18, 0.09]] as const) {
                world.createCollider(RAPIER.ColliderDesc.roundCuboid(height * width, height * halfHeight,
                    height * depth, height * 0.035).setTranslation(x, y + height * rise, z).setRotation(turn).setFriction(0.63));
            }
            continue;
        }
        if (kind === "alpine-fence") {
            world.createCollider(RAPIER.ColliderDesc.cuboid(height * 0.83, height * 0.36, height * 0.29)
                .setTranslation(x, y + height * 0.37, z).setRotation(yawRotation(yaw)).setFriction(0.57));
            continue;
        }
        if (kind === "alpine-station") {
            const halfHeight = height * 0.290;
            world.createCollider(RAPIER.ColliderDesc.cuboid(height * 0.540, halfHeight, height * 0.440)
                .setTranslation(x, y + halfHeight, z).setRotation(yawRotation(yaw)).setFriction(0.61));
            continue;
        }
        if (kind === "pacific-lighthouse") {
            const cos = Math.cos(yaw);
            const sin = Math.sin(yaw);
            const rotation = yawRotation(yaw);
            const { footing } = pacificLighthouse;
            const bottom = landmark.footing ?? y;
            const top = y + 0.82;
            world.createCollider(RAPIER.ColliderDesc.cuboid(height * footing.width / 2, (top - bottom) / 2,
                height * footing.depth / 2).setTranslation(x, (top + bottom) / 2, z)
                .setRotation(rotation).setFriction(0.64));
            const { across, depth } = pacificLighthouse.tower;
            const towerX = x + height * (across * cos + depth * sin);
            const towerZ = z + height * (-across * sin + depth * cos);
            world.createCollider(RAPIER.ColliderDesc.cylinder(height * 0.45, height * 0.10)
                .setTranslation(towerX, y + height * 0.37, towerZ).setFriction(0.57));
            world.createCollider(RAPIER.ColliderDesc.cuboid(height * 0.24, height * 0.18, height * 0.20)
                .setTranslation(x + height * 0.145 * cos, y + height * 0.11, z - height * 0.145 * sin)
                .setRotation(rotation).setFriction(0.57));
            continue;
        }
        if (kind === "aegean-pillar") {
            const halfHeight = height * 0.45;
            world.createCollider(RAPIER.ColliderDesc.cylinder(halfHeight, height * 0.125)
                .setTranslation(x, y + halfHeight, z).setFriction(0.58));
            continue;
        }
        if (kind === "aegean-bench") {
            const turn = yawRotation(yaw);
            world.createCollider(RAPIER.ColliderDesc.cuboid(height * 0.92, height * 0.17, height * 0.43)
                .setTranslation(x, y + height * 0.79, z).setRotation(turn).setFriction(0.56));
            for (const across of [-0.60, 0.02, 0.65]) {
                world.createCollider(RAPIER.ColliderDesc.cuboid(height * 0.13, height * 0.33, height * 0.30)
                    .setTranslation(x + height * across * Math.cos(yaw), y + height * 0.33, z - height * across * Math.sin(yaw))
                    .setRotation(turn).setFriction(0.56));
            }
            continue;
        }
        if (kind === "aegean-shrine" || kind === "aegean-entablature") {
            const shrine = kind === "aegean-shrine";
            const halfHeight = height * (shrine ? 0.34 : 0.39);
            const halfWidth = height * (shrine ? 0.36 : 0.48);
            const halfDepth = height * (shrine ? 0.42 : 0.70);
            world.createCollider(RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight, halfDepth)
                .setTranslation(x, y + halfHeight, z).setRotation(yawRotation(yaw)).setFriction(0.58));
            continue;
        }
        if (kind === "pacific-shelter") {
            addCoastalShelterColliders(world, landmark);
            continue;
        }
        if (kind === "blackwood-pier") {
            const turn = yawRotation(yaw);
            world.createCollider(RAPIER.ColliderDesc.cuboid(height * 0.40, height * 0.15, height * 0.52)
                .setTranslation(x, y + height * 0.15, z).setRotation(turn).setFriction(0.58));
            // The reconstructed remnant has an opening above its plinth.
            const side = height * 0.17;
            world.createCollider(RAPIER.ColliderDesc.cuboid(height * 0.13, height * 0.35, height * 0.39)
                .setTranslation(x - side * Math.cos(yaw), y + height * 0.65, z + side * Math.sin(yaw))
                .setRotation(turn).setFriction(0.58));
            continue;
        }
        if (kind === "blackwood-lodge" || kind === "blackwood-shelter" || kind === "blackwood-mill") {
            // Roof overhangs extend beyond the foundations. Place the solid wall under the eaves.
            const width = kind === "blackwood-lodge" ? 0.49 : kind === "blackwood-mill" ? 0.44 : 0.52;
            const depth = kind === "blackwood-lodge" ? 0.488 : kind === "blackwood-shelter" ? 0.273 : 0.37;
            const rise = kind === "blackwood-shelter" ? 0.31 : 0.58;
            world.createCollider(RAPIER.ColliderDesc.cuboid(height * width, height * rise / 2, height * depth)
                .setTranslation(x, y + height * rise / 2, z).setRotation(yawRotation(yaw)).setFriction(0.57));
            continue;
        }
        const tree = isLandmarkTree(kind);
        const halfHeight = height * (tree ? 0.21 : 0.27);
        const shape = tree ? RAPIER.ColliderDesc.cylinder(halfHeight, height * (kind === "alpine-larch" ? 0.075 : 0.105))
            : RAPIER.ColliderDesc.roundCuboid(radius * 0.41, halfHeight, radius * 0.34, height * 0.045);
        // The tree trunks sit off-center under their crowns.
        const crownOffset = kind === "pacific-monterey" ? 0.34 : kind === "pacific-sapling" ? 0.33
            : kind === "pacific-cypress" || kind === "aegean-olive" ? 0.17 : kind === "windbreak-oak"
            ? 0.1 : kind === "blackwood-cedar" ? -0.034 : 0;
        const trunkOffset = height * crownOffset;
        const trunkDepth = kind === "pacific-cypress" ? -height * 0.045 : kind === "blackwood-cedar" ? height * 0.017
            : kind === "aegean-olive" ? -height * 0.19 : kind === "pacific-monterey" ? -height * 0.12
                : kind === "pacific-sapling" ? -height * 0.16 : kind === "alpine-larch" ? -height * 0.061 : 0;
        const sin = Math.sin(yaw);
        const cos = Math.cos(yaw);
        world.createCollider(shape.setTranslation(x + cos * trunkOffset + sin * trunkDepth, y + halfHeight,
            z - sin * trunkOffset + cos * trunkDepth)
            .setRotation(yawRotation(yaw)).setFriction(tree ? 0.43 : 0.58));
    }
}

type ColliderBox = readonly [
    x: number, y: number, z: number, halfWidth: number, halfHeight: number, halfDepth: number, twist?: number,
];

const cinderArchBoxes = [
    [-0.49, 0.12, -0.18, 0.20, 0.13, 0.16], [0.44, 0.12, 0.15, 0.20, 0.13, 0.16],
    [-0.53, 0.38, -0.08, 0.145, 0.27, 0.115], [0.47, 0.36, 0.22, 0.145, 0.25, 0.115],
    [-0.35, 0.71, 0.01, 0.205, 0.18, 0.132], [0.04, 0.77, 0.13, 0.255, 0.118, 0.132],
    [0.36, 0.68, 0.24, 0.16, 0.16, 0.115],
] as const;

const cinderShadeBoxes = [
    [-0.45, 0.24, -0.13, 0.052, 0.38, 0.062], [-0.19, 0.25, -0.40, 0.055, 0.37, 0.064],
    [0.43, 0.23, -0.12, 0.062, 0.37, 0.064], [-0.20, 0.26, 0.17, 0.073, 0.36, 0.071],
    [0.08, 0.21, 0.31, 0.14, 0.37, 0.12],
    [0, 0.66, -0.03, 0.49, 0.065, 0.48], [-0.07, 0.76, -0.04, 0.38, 0.045, 0.31],
] as const;

const landmarkBoxes: Partial<Record<BiomeLandmarkKind, readonly ColliderBox[]>> = {
    "caldera-station": [
        [-0.004, 0.072, -0.042, 0.49, 0.093, 0.47, -0.70],
        [-0.024, 0.341, -0.018, 0.41, 0.252, 0.425, -0.70],
        [-0.019, 0.565, -0.013, 0.48, 0.058, 0.46, -0.70],
        [-0.304, 0.802, -0.019, 0.136, 0.159, 0.132, -0.55],
    ],
    "caldera-lamp": [
        [-0.004, 0.087, 0.009, 0.199, 0.105, 0.163, 0.68],
        [-0.013, 0.353, -0.045, 0.083, 0.184, 0.073, 0.26],
        [-0.015, 0.732, -0.084, 0.123, 0.189, 0.102, 0.15],
    ],
    "caldera-fins": [
        [-0.02, 0.114, 0.102, 0.408, 0.132, 0.31, -0.18],
        [0.04, 0.226, -0.264, 0.264, 0.158, 0.214, 0.21],
        [-0.131, 0.474, 0.254, 0.198, 0.195, 0.21, 0.27],
        [-0.167, 0.564, -0.084, 0.133, 0.215, 0.127, -0.21],
        [-0.253, 0.733, 0.179, 0.157, 0.194, 0.211, 0.13],
        [-0.392, 0.877, -0.024, 0.091, 0.108, 0.122, -0.24],
    ],
    "caldera-rope-lava": [
        [-0.032, 0.105, -0.021, 0.98, 0.131, 1.02, -0.16],
        [-0.09, 0.300, 0.042, 0.73, 0.24, 0.76, -0.21],
        [-0.17, 0.562, 0.067, 0.53, 0.21, 0.48, -0.24],
        [-0.037, 0.771, 0.096, 0.29, 0.18, 0.25, -0.16],
    ],
    "caldera-marker": [
        [0.047, 0.104, 0.04, 0.47, 0.123, 0.452, -0.33],
        [0.015, 0.387, -0.038, 0.343, 0.183, 0.334, -0.35],
        [0.028, 0.697, -0.082, 0.263, 0.166, 0.251, -0.37],
        [0.051, 0.882, -0.149, 0.195, 0.101, 0.202, -0.39],
    ],
    "skywheel-booth": [
        [-0.008, 0.065, 0.039, 0.281, 0.094, 0.217, -0.18],
        [-0.025, 0.402, -0.022, 0.236, 0.325, 0.171, -0.17],
        [-0.028, 0.758, -0.061, 0.241, 0.111, 0.187, -0.17],
        [-0.020, 0.617, -0.194, 0.183, 0.048, 0.104, -0.17],
    ],
    "skywheel-gondola": [
        [0.005, 0.166, 0.036, 0.316, 0.164, 0.237, -0.06],
        [-0.013, 0.725, -0.013, 0.305, 0.104, 0.224, -0.06],
        [-0.28, 0.49, -0.167, 0.061, 0.19, 0.047],
        [0.26, 0.49, 0.209, 0.064, 0.19, 0.046],
    ],
    "skywheel-lamp": [
        [0.09, 0.068, 0.154, 0.119, 0.085, 0.118, 0.24],
        [0.098, 0.313, 0.137, 0.062, 0.231, 0.062],
        [0.079, 0.656, 0.106, 0.041, 0.17, 0.048],
        [-0.015, 0.9, -0.035, 0.118, 0.066, 0.084, 0.38],
        [-0.158, 0.668, -0.199, 0.080, 0.132, 0.087],
    ],
    "skywheel-cart": [
        [-0.025, 0.285, 0.012, 0.358, 0.207, 0.224, -0.42],
        [-0.237, 0.151, -0.15, 0.127, 0.165, 0.105, -0.42],
        [0.23, 0.155, 0.164, 0.145, 0.156, 0.102, -0.42],
        [-0.023, 0.773, -0.067, 0.36, 0.106, 0.302, -0.20],
    ],
    "skywheel-planter": [
        [-0.016, 0.093, 0.038, 0.269, 0.114, 0.25, -0.35],
        [-0.024, 0.255, 0.075, 0.242, 0.135, 0.228, -0.35],
        [-0.026, 0.396, 0.072, 0.298, 0.041, 0.264, -0.35],
    ],
    "skywheel-bollard": [
        [0.013, 0.081, 0.021, 0.303, 0.12, 0.303, 0.29],
        [0.016, 0.434, -0.037, 0.276, 0.294, 0.272, 0.29],
        [0.013, 0.752, -0.055, 0.254, 0.172, 0.237, 0.29],
    ],
    "ares-dish": [
        [0.006, 0.098, 0.028, 0.285, 0.123, 0.275],
        [0.009, 0.219, 0.013, 0.236, 0.064, 0.228],
        [-0.026, 0.327, -0.017, 0.110, 0.113, 0.118],
        [-0.044, 0.506, -0.088, 0.146, 0.076, 0.131],
    ],
    "ares-rover": [
        [0.018, 0.345, -0.018, 0.74, 0.14, 0.30, 0.65],
        [-0.401, 0.658, 0.329, 0.27, 0.247, 0.31, 0.65],
        [0.352, 0.522, -0.229, 0.439, 0.13, 0.34, 0.65],
        [-0.156, 0.188, -0.241, 0.68, 0.19, 0.116, 0.65],
        [0.218, 0.199, 0.253, 0.66, 0.18, 0.118, 0.65],
    ],
    "ares-pod": [
        [0.021, 0.114, -0.047, 0.51, 0.13, 0.31, 0.73],
        [0.037, 0.453, -0.081, 0.57, 0.29, 0.346, 0.73],
        [-0.031, 0.742, -0.056, 0.46, 0.14, 0.236, 0.73],
    ],
    "ares-tank": [
        [-0.015, 0.083, -0.017, 0.34, 0.108, 0.32, 0.19],
        [-0.02, 0.338, -0.01, 0.225, 0.24, 0.23, 0.19],
        [-0.019, 0.658, -0.053, 0.245, 0.19, 0.24],
        [-0.064, 0.861, -0.112, 0.156, 0.085, 0.172],
        [-0.229, 0.252, -0.278, 0.073, 0.153, 0.092],
    ],
    "ares-slate": [
        [-0.046, 0.096, -0.058, 0.47, 0.12, 0.33, -0.32],
        [-0.286, 0.239, -0.206, 0.229, 0.15, 0.176, 0.26],
        [0.288, 0.297, 0.147, 0.241, 0.169, 0.179, -0.41],
        [0.004, 0.487, -0.053, 0.184, 0.232, 0.137, -0.27],
        [0.068, 0.735, 0.019, 0.142, 0.118, 0.104, -0.31],
    ],
    "ares-radiator": [
        [-0.039, 0.13, -0.075, 0.423, 0.103, 0.37, 0.27],
        [0.028, 0.452, -0.028, 0.39, 0.335, 0.327, 0.27],
        [-0.006, 0.758, -0.096, 0.35, 0.113, 0.296, 0.27],
    ],
    "aurora-orbit": [
        [-0.008, 0.079, -0.078, 0.342, 0.087, 0.304],
        [-0.027, 0.151, -0.083, 0.257, 0.061, 0.256],
        [0.107, 0.252, -0.103, 0.091, 0.095, 0.125],
    ],
    "aurora-succulent": [
        [0.002, 0.14, -0.029, 0.91, 0.15, 0.632],
        [0.002, 0.138, -0.029, 0.65, 0.149, 0.82],
    ],
    "aurora-ginkgo": [
        [0.178, 0.094, -0.153, 0.118, 0.116, 0.126, 0.17],
        [0.108, 0.186, -0.106, 0.111, 0.071, 0.092, 0.15],
        [-0.024, 0.274, -0.01, 0.114, 0.069, 0.084, -0.22],
        [-0.113, 0.35, 0.044, 0.073, 0.068, 0.062, 0.08],
    ],
    "aurora-service-pod": [
        [0.003, 0.083, -0.073, 0.76, 0.095, 0.483, 0.14],
        [0.21, 0.354, 0.128, 0.52, 0.275, 0.43, 0.15],
        [0.294, 0.694, 0.137, 0.394, 0.197, 0.325, 0.15],
        [-0.532, 0.31, -0.09, 0.266, 0.269, 0.321, 0.31],
    ],
    "aurora-conservatory": [
        [-0.009, 0.144, -0.006, 0.58, 0.159, 0.46],
        [-0.009, 0.143, -0.006, 0.427, 0.158, 0.68],
        [-0.018, 0.414, -0.019, 0.55, 0.225, 0.56],
        [-0.024, 0.655, -0.014, 0.43, 0.177, 0.48],
        [-0.083, 0.857, -0.08, 0.27, 0.111, 0.30],
    ],
    "aurora-solar-tree": [
        [-0.018, 0.07, 0.071, 0.239, 0.087, 0.216],
        [-0.021, 0.337, 0.083, 0.073, 0.269, 0.078],
        [0.002, 0.82, 0.015, 0.449, 0.076, 0.381, 0.18],
    ],
    "glasswater-reeds": [[0.018, 0.129, -0.052, 0.505, 0.133, 0.282, 0.389]],
    "glasswater-sail": [
        [0.002, 0.092, -0.026, 0.199, 0.105, 0.207, -0.12],
        [-0.050, 0.288, 0.064, 0.128, 0.128, 0.101, 0.45],
        [-0.116, 0.520, 0.123, 0.104, 0.184, 0.062, 0.46],
        [-0.108, 0.721, 0.13, 0.079, 0.109, 0.059, 0.73],
    ],
    "glasswater-shelter": [
        [-0.017, 0.04, -0.048, 0.608, 0.064, 0.225, 0.092],
        [-0.029, 0.43, 0.103, 0.478, 0.347, 0.045, 0.092],
        [-0.491, 0.428, -0.043, 0.043, 0.354, 0.055],
        [0.431, 0.421, -0.083, 0.050, 0.352, 0.059],
        [-0.032, 0.205, -0.081, 0.329, 0.064, 0.113, 0.092],
        [-0.019, 0.828, -0.009, 0.607, 0.087, 0.243, 0.092],
    ],
    "glasswater-crane": [
        [-0.026, 0.087, -0.067, 0.257, 0.108, 0.206],
        [0.042, 0.337, 0.007, 0.117, 0.249, 0.119],
        [0.049, 0.661, 0.067, 0.231, 0.071, 0.127, -0.34],
        [-0.203, 0.89, -0.156, 0.164, 0.047, 0.089, -0.44],
    ],
    "glasswater-cafe": [
        [0, 0.389, 0.119, 0.428, 0.407, 0.268],
        [-0.317, 0.357, -0.162, 0.228, 0.376, 0.092, 0.49],
        [0.325, 0.356, -0.158, 0.227, 0.374, 0.1, -0.54],
        [0.012, 0.352, -0.294, 0.191, 0.364, 0.111],
    ],
    "glasswater-ferry": [
        [0.044, 0.198, -0.03, 0.610, 0.159, 0.326, 0.695],
        [0.028, 0.428, -0.021, 0.479, 0.107, 0.270, 0.695],
        [-0.105, 0.643, 0.093, 0.274, 0.151, 0.244, 0.695],
    ],
    "bellgate-flower-trough": [[0.088, 0.237, -0.065, 0.681, 0.244, 0.29, 0.627]],
    "bellgate-townhouse": [
        [0, 0.355, -0.03, 0.224, 0.37, 0.295, -0.48],
        [0.167, 0.054, -0.304, 0.12, 0.06, 0.10, -0.48],
    ],
    "bellgate-fruit-cart": [
        [-0.052, 0.42, 0.028, 0.337, 0.204, 0.374, -0.716],
        [0.276, 0.218, 0.337, 0.055, 0.219, 0.218, -0.716],
        [-0.315, 0.208, -0.149, 0.058, 0.212, 0.207, -0.716],
        [0.151, 0.231, -0.464, 0.041, 0.037, 0.204, -0.716],
        [0.449, 0.218, -0.227, 0.046, 0.04, 0.219, -0.716],
    ],
    "bellgate-stall": [
        [0.01, 0.195, -0.016, 0.414, 0.202, 0.274],
        [-0.416, 0.43, -0.267, 0.047, 0.38, 0.053], [0.421, 0.43, -0.228, 0.047, 0.38, 0.051],
        [-0.385, 0.465, 0.272, 0.048, 0.425, 0.06], [0.409, 0.464, 0.238, 0.044, 0.425, 0.056],
        [0, 0.729, -0.161, 0.463, 0.073, 0.263], [0.014, 0.830, 0.175, 0.446, 0.076, 0.162],
    ],
    "bellgate-belfry": [[-0.025, 0.061, 0.005, 0.255, 0.064, 0.253], [-0.014, 0.329, -0.009, 0.173, 0.217, 0.175],
        [0, 0.765, 0, 0.171, 0.072, 0.166]],
    "frosthaven-crates": [
        [-0.064, 0.47, 0.22, 0.29, 0.42, 0.32, -0.32],
        [-0.28, 0.32, -0.15, 0.29, 0.29, 0.25, -0.24],
        [0.25, 0.15, -0.32, 0.28, 0.14, 0.24, 0.12],
    ],
    "frosthaven-ice-shelf": [
        [-0.49, 0.68, -0.36, 0.39, 0.15, 0.51, -0.26],
        [-0.11, 0.70, 0.60, 0.46, 0.17, 0.39, 0.29],
        [0.49, 0.71, -0.47, 0.39, 0.15, 0.49, -0.48],
    ],
    "frosthaven-derrick": [
        [-0.025, 0.085, -0.006, 0.31, 0.089, 0.245, 0.81],
        [-0.015, 0.21, -0.035, 0.238, 0.12, 0.12, -0.76],
        [0.143, 0.43, 0.205, 0.067, 0.36, 0.078, 0.81],
    ],
    "juniper-outcrop": [
        [-0.27, 0.173, -0.11, 0.432, 0.19, 0.43],
        [0.43, 0.15, 0.047, 0.31, 0.18, 0.48],
        [-0.33, 0.47, 0.01, 0.36, 0.24, 0.35],
        [0.427, 0.39, -0.018, 0.19, 0.215, 0.31],
        [-0.34, 0.76, -0.011, 0.292, 0.211, 0.264],
    ],
    "juniper-shed": [
        [-0.014, 0.318, -0.055, 0.540, 0.319, 0.359, 0.80],
        [-0.022, 0.707, -0.069, 0.489, 0.097, 0.232, 0.80],
    ],
    "juniper-semaphore": [
        [-0.081, 0.446, 0.019, 0.030, 0.421, 0.033],
        [-0.060, 0.827, 0.055, 0.067, 0.057, 0.048],
    ],
    "juniper-tower": [
        [-0.124, 0.164, -0.037, 0.045, 0.19, 0.046],
        [0.191, 0.162, -0.062, 0.061, 0.20, 0.059],
        [0.109, 0.164, 0.102, 0.045, 0.20, 0.048],
        [0.023, 0.147, -0.171, 0.049, 0.19, 0.052],
        [0.041, 0.639, 0.015, 0.174, 0.174, 0.159],
        [0.040, 0.810, 0.011, 0.154, 0.058, 0.140],
        [-0.243, 0.554, -0.045, 0.044, 0.084, 0.039],
    ],
    "juniper-station": [
        [0.335, 0.35, -0.199, 0.345, 0.23, 0.282, 0.855],
        [0.365, 0.60, -0.220, 0.244, 0.097, 0.238, 0.855],
        [-0.578, 0.285, -0.105, 0.052, 0.205, 0.048],
        [-0.30, 0.27, 0.42, 0.051, 0.187, 0.052],
    ],
    "copper-split-mesa": [
        [-0.16, 0.15, 0.16, 0.23, 0.17, 0.22], [0.19, 0.19, 0.13, 0.17, 0.20, 0.25],
        [-0.28, 0.42, 0.13, 0.15, 0.25, 0.18], [-0.30, 0.65, 0.19, 0.115, 0.18, 0.14],
        [0.17, 0.47, 0.15, 0.16, 0.23, 0.23], [0.085, 0.78, 0.16, 0.16, 0.20, 0.19],
    ],
    "copper-survey-tower": [
        [-0.176, 0.14, -0.015, 0.044, 0.21, 0.048], [0.162, 0.15, -0.054, 0.051, 0.21, 0.043],
        [0.059, 0.17, 0.114, 0.047, 0.22, 0.05], [-0.023, 0.22, -0.134, 0.037, 0.23, 0.048],
        [-0.099, 0.41, -0.002, 0.043, 0.17, 0.042], [0.092, 0.42, 0.019, 0.052, 0.16, 0.043],
        [0, 0.58, 0.047, 0.112, 0.063, 0.091], [0, 0.70, 0.053, 0.135, 0.065, 0.115],
    ],
    "copper-ore-hut": [
        [0.025, 0.22, -0.025, 0.343, 0.30, 0.350, -0.80],
        [-0.01, 0.586, -0.046, 0.25, 0.108, 0.26, -0.80],
        [-0.054, 0.81, -0.082, 0.13, 0.155, 0.116],
    ],
    "copper-ore-trolley": [
        [0.015, 0.47, 0.02, 0.315, 0.23, 0.30], [0.055, 0.69, -0.042, 0.355, 0.075, 0.365],
        [-0.303, 0.135, -0.228, 0.07, 0.134, 0.11], [0.252, 0.135, -0.228, 0.07, 0.134, 0.11],
        [-0.314, 0.135, 0.354, 0.07, 0.134, 0.11], [0.265, 0.135, 0.354, 0.07, 0.134, 0.11],
    ],
    "copper-talus": [
        [0.02, 0.13, -0.025, 0.45, 0.16, 0.48], [0.23, 0.32, -0.16, 0.28, 0.22, 0.34],
        [-0.21, 0.32, 0.09, 0.32, 0.22, 0.38], [-0.20, 0.55, 0.08, 0.26, 0.22, 0.26],
        [-0.33, 0.77, 0.05, 0.18, 0.19, 0.16],
    ],
    "cloudfold-armillary": [
        [0, 0.089, -0.087, 0.36, 0.105, 0.35, -0.34],
        [-0.304, 0.27, -0.29, 0.081, 0.24, 0.098, -0.33],
        [0.30, 0.27, 0.115, 0.085, 0.24, 0.086, -0.33],
    ],
    "cloudfold-cypress": [
        [0.162, 0.09, 0.173, 0.199, 0.11, 0.148],
        [0.134, 0.23, 0.117, 0.095, 0.14, 0.09, -0.18],
        [0.092, 0.39, 0.109, 0.079, 0.09, 0.075, -0.18],
    ],
    "cloudfold-pavilion": [
        [0, 0.092, 0, 0.31, 0.095, 0.285, 0.78],
        [0.072, 0.34, 0.298, 0.044, 0.154, 0.043], [-0.247, 0.34, 0.07, 0.045, 0.154, 0.045],
        [0.223, 0.34, 0.05, 0.043, 0.154, 0.043], [-0.058, 0.34, -0.151, 0.043, 0.154, 0.045],
        [0, 0.588, 0, 0.27, 0.102, 0.26, 0.78],
    ],
    "coral-marker": [
        [0, 0.115, 0, 0.31, 0.13, 0.30, Math.PI / 4],
        [0, 0.30, 0, 0.276, 0.096, 0.265, Math.PI / 4],
        [0, 0.425, 0, 0.212, 0.107, 0.128, Math.PI / 4],
        [-0.124, 0.625, 0.124, 0.074, 0.111, 0.135, Math.PI / 4],
        [0.131, 0.625, -0.131, 0.068, 0.111, 0.13, Math.PI / 4],
        [0, 0.78, 0, 0.185, 0.062, 0.13, Math.PI / 4],
        [-0.015, 0.90, 0.014, 0.106, 0.069, 0.098, Math.PI / 4],
    ],
    "coral-lookout": [
        [-0.23, 0.23, -0.13, 0.04, 0.18, 0.048], [0.23, 0.25, -0.12, 0.045, 0.16, 0.048],
        [-0.019, 0.18, 0.31, 0.043, 0.17, 0.045], [0.02, 0.42, -0.012, 0.31, 0.049, 0.318],
        [-0.03, 0.61, 0.015, 0.20, 0.187, 0.20],
    ],
    "coral-sponges": [
        [0, 0.13, -0.12, 0.44, 0.14, 0.26], [-0.12, 0.49, -0.13, 0.31, 0.29, 0.23],
        [-0.10, 0.76, -0.14, 0.14, 0.19, 0.14], [0.28, 0.42, 0.213, 0.11, 0.19, 0.115],
    ],
    "coral-bommie": [
        [0, 0.22, 0.025, 0.294, 0.24, 0.28], [-0.10, 0.51, 0.062, 0.29, 0.22, 0.23],
        [-0.12, 0.73, 0.033, 0.23, 0.19, 0.20],
    ],
    "cinder-arch": cinderArchBoxes,
    "cinder-shade": cinderShadeBoxes,
    "cinder-flume": [
        [-0.31, 0.25, 0.22, 0.11, 0.36, 0.09], [-0.12, 0.26, 0.36, 0.095, 0.37, 0.083],
        [0.18, 0.25, -0.14, 0.085, 0.36, 0.088], [0.36, 0.24, -0.11, 0.10, 0.35, 0.087],
        [-0.31, 0.69, 0.10, 0.16, 0.078, 0.14], [-0.05, 0.66, -0.035, 0.18, 0.072, 0.16],
        [0.22, 0.60, -0.22, 0.20, 0.084, 0.16],
    ],
};

function addLocalBoxes(world: RAPIER.World, landmark: BiomeLandmark, boxes: readonly ColliderBox[]): void {
    const { x, y, z, height, yaw, pitch = 0 } = landmark;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const pitchCos = Math.cos(pitch);
    const pitchSin = Math.sin(pitch);
    for (const [u, v, w, sx, sy, sz, twist = 0] of boxes) {
        const depth = w * pitchCos + v * pitchSin;
        const rise = v * pitchCos - w * pitchSin;
        world.createCollider(RAPIER.ColliderDesc.cuboid(height * sx, height * sy, height * sz)
            .setTranslation(x + height * (u * cos + depth * sin), y + height * rise, z + height * (-u * sin + depth * cos))
            .setRotation(yawPitchRotation(yaw + twist, pitch)).setFriction(0.64));
    }
}

function addCoastalShelterColliders(world: RAPIER.World, { x, y, z, height, yaw }: BiomeLandmark): void {
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const turn = yawRotation(yaw);
    const parts = [
        [-0.36, 0.33, -0.41, 0.073, 0.34, 0.071], [0.36, 0.33, -0.41, 0.073, 0.34, 0.071],
        [-0.36, 0.33, 0.26, 0.073, 0.34, 0.071], [0.36, 0.33, 0.26, 0.073, 0.34, 0.071],
        [0, 0.18, 0.22, 0.39, 0.19, 0.09], [0, 0.68, -0.058, 0.40, 0.08, 0.43],
    ] as const;
    for (const [u, v, w, halfWidth, halfHeight, halfDepth] of parts) {
        world.createCollider(RAPIER.ColliderDesc.cuboid(halfWidth * height, halfHeight * height, halfDepth * height)
            .setTranslation(x + (u * cos + w * sin) * height, y + v * height, z + (-u * sin + w * cos) * height)
            .setRotation(turn).setFriction(0.56));
    }
}

// Normalized offsets follow the reconstructed plinth, columns and lintel.
function addStoaColliders(world: RAPIER.World, { x, y, z, height, yaw }: BiomeLandmark): void {
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const turn = yawRotation(yaw);
    const parts = [
        [0, 0.071, 0, 0.365, 0.08, 0.209],
        [-0.2, 0.434, -0.025, 0.093, 0.35, 0.088],
        [0.285, 0.49, 0.11, 0.084, 0.42, 0.086],
        [0.03, 0.819, 0.1, 0.23, 0.071, 0.095],
    ] as const;
    for (const [u, v, w, halfWidth, halfHeight, halfDepth] of parts) {
        world.createCollider(RAPIER.ColliderDesc.cuboid(halfWidth * height, halfHeight * height, halfDepth * height)
            .setTranslation(x + (u * cos + w * sin) * height, y + v * height, z + (-u * sin + w * cos) * height)
            .setRotation(turn).setFriction(0.58));
    }
}

export function addHallColliders(world: RAPIER.World, halls: readonly Hall[]): void {
    for (const hall of halls) {
        const { frames, coolantModules } = hall;
        world.createCollider(surfaceCollider([hallWalls(hall)]).setFriction(0.4));
        for (const { posts } of frames) {
            for (const { x, y, z, height, radius } of posts) {
                world.createCollider(RAPIER.ColliderDesc.cylinder(height / 2, radius)
                    .setTranslation(x, y + height / 2, z).setFriction(0.35));
            }
        }
        const { width, height, depth } = coolantModuleSize;
        for (const { x, y, z, yaw } of coolantModules) {
            world.createCollider(RAPIER.ColliderDesc.roundCuboid(width * 0.44, height * 0.42, depth * 0.44, 0.16)
                .setTranslation(x, y + height / 2, z).setRotation(yawRotation(yaw)).setFriction(0.5));
        }
    }
}

export function addAqueductColliders(world: RAPIER.World, aqueduct: Aqueduct): void {
    const yaw = yawRotation(aqueduct.yaw);
    for (const { center, width, height, depth } of aqueduct.columns) {
        world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
            .setTranslation(center.x, center.y, center.z).setRotation(yaw).setFriction(0.53));
    }
    const arcade = upperAqueduct(aqueduct);
    const walls = [aqueductWallSurface(aqueduct), aqueductArchSurface(aqueduct),
        aqueductWallSurface(arcade, 1.24), aqueductArchSurface(arcade, 1.35, 0.63)];
    world.createCollider(surfaceCollider(walls).setFriction(0.53));
}

export function addRockShelterColliders(world: RAPIER.World, shelter: RockShelter): void {
    const { outside, vault, portals, lip } = shelter.surfaces;
    const surfaces = [outside, vault, portals];
    if (lip) surfaces.push(lip);
    world.createCollider(surfaceCollider(surfaces).setFriction(0.48));
    for (const { x, y, z, height, radius } of shelter.columns) {
        world.createCollider(RAPIER.ColliderDesc.cylinder(height / 2, radius)
            .setTranslation(x, y + height / 2, z).setFriction(0.44));
    }
}

export function addRockFormationColliders(world: RAPIER.World, formations: readonly RockFormation[]): void {
    for (const { x, y, z, sx, sy, sz, yaw, profile } of formations) {
        const shape = rockProfiles[profile];
        const positions = shape.positions.map((value, index) => {
            const axis = index % 3;
            return value * (axis === 0 ? sx : axis === 1 ? sy : sz);
        });
        world.createCollider(surfaceCollider([{ positions, indices: shape.indices }])
            .setTranslation(x, y, z).setRotation(yawRotation(yaw)).setFriction(0.55));
    }
}

export function addTownGateColliders(world: RAPIER.World, { row, towers, yaw, arch }: TownGate): void {
    const turn = yawRotation(yaw);
    for (const tower of towers) {
        world.createCollider(RAPIER.ColliderDesc.cuboid(GATE_WIDTH / 2, tower.height / 2, GATE_DEPTH / 2)
            .setTranslation(tower.x, tower.base + tower.height / 2, tower.z).setRotation(turn).setFriction(0.50));
    }
    world.createCollider(surfaceCollider([arch]).setFriction(0.52));
    world.createCollider(RAPIER.ColliderDesc.cuboid(9.75, 0.525, 2.1)
        .setTranslation(row.x, row.y + GATE_WALKWAY, row.z).setRotation(turn).setFriction(0.50));
}

export function addStreetBuildingColliders(world: RAPIER.World, buildings: readonly StreetBuilding[]): void {
    for (const { x, y, z, width, depth, height, base, yaw } of buildings) {
        const top = y + height;
        world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, (top - base) / 2, depth / 2)
            .setTranslation(x, (top + base) / 2, z).setRotation(yawRotation(yaw)).setFriction(0.56));
    }
}

export function addFlyoverColliders(world: RAPIER.World, flyover: GlasswaterFlyover): void {
    const turn = yawRotation(flyover.yaw);
    for (const { x, y, z, width, height, depth } of flyover.footings) {
        world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
            .setTranslation(x, y, z).setRotation(turn).setFriction(0.56));
    }
    for (const { from, to, width, height } of [...flyover.spans, ...flyover.braces]) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dz = to.z - from.z;
        const run = Math.hypot(dx, dz);
        world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, Math.hypot(run, dy) / 2 + 0.12)
            .setTranslation((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2)
            .setRotation(yawPitchRotation(Math.atan2(dx, dz), -Math.atan2(dy, run))).setFriction(0.56));
    }
}

export function addForestBridgeColliders(world: RAPIER.World, bridge: ForestBridge): void {
    for (const { x, y, z, base, yaw } of bridge.supports) {
        const top = y + forestBridgeSize.clearance;
        world.createCollider(RAPIER.ColliderDesc.cuboid(forestBridgeSize.plinthWidth / 2, (top - base) / 2, 1)
            .setTranslation(x, (top + base) / 2, z).setRotation(yawRotation(yaw)).setFriction(0.54));
    }
    world.createCollider(surfaceCollider([bridge.roof]).setFriction(0.53));
}

export function addForestMillCollider(world: RAPIER.World, mill: ForestMill): void {
    const { position, yaw, footing } = mill;
    const { width, depth, height } = forestMillSize;
    const top = position.y + height;
    world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, (top - footing) / 2, depth / 2)
        .setTranslation(position.x, (top + footing) / 2, position.z).setRotation(yawRotation(yaw)).setFriction(0.54));
}
