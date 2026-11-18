import RAPIER from "@dimforge/rapier3d-compat";
import type { AlpineLift } from "../course/alpine-lift.ts";
import type { Aqueduct } from "../course/aqueduct.ts";
import type { auroraGarden } from "../course/aurora-garden.ts";
import type { AresCutworks } from "../course/ares-cutworks.ts";
import type { AresGardens } from "../course/ares-gardens.ts";
import type { AuroraWaterside } from "../course/aurora-waterside.ts";
import type { Barrier } from "../course/barriers.ts";
import type { StreetBuilding } from "../course/city-frontage.ts";
import type { FrosthavenHarbor } from "../course/frosthaven/harbor.ts";
import type { WinterCabin } from "../course/winter-cabins.ts";
import type { ForestBridge } from "../course/forest-bridge.ts";
import type { ForestMill } from "../course/forest-mill.ts";
import type { ForestSpillway } from "../course/forest-spillway.ts";
import type { GlasswaterFlyover } from "../course/glasswater-flyover.ts";
import type { Hall } from "../course/halls.ts";
import type { CalderaRunoff } from "../course/caldera-runoff.ts";
import type { CalderaCrater } from "../course/caldera-crater.ts";
import type { CalderaAshworks } from "../course/caldera-ashworks.ts";
import type { CloudfoldScenery } from "../course/sky-masonry.ts";
import type { Surface } from "../course/surface.ts";
import type { RockFormation } from "../course/rock-formations.ts";
import type { BellgateStreets } from "../course/bellgate-streets.ts";
import type { GlasswaterRiverworks } from "../course/glasswater-riverworks.ts";
import type { TownGate } from "../course/town-gate.ts";
import type { RockShelter } from "../course/rock-shelters.ts";
import type { SkywheelGrounds } from "../course/stunt/grounds.ts";
import { driveableSurfaces } from "../course/surfaces.ts";
import type { CourseSurfaces } from "../course/surfaces.ts";
import { addWinterColliders } from "./winter-colliders.ts";
import { surfaceCollider } from "./surface-collider.ts";
import type { BiomeLandmark } from "../course/biome-landmarks.ts";
import type { Vegetation } from "../course/vegetation/layout.ts";
import { yawPitchRotation, yawRotation } from "./pose.ts";
import { addAqueductColliders, addAresGardenColliders, addFlyoverColliders, addForestBridgeColliders, addForestMillCollider, addHallColliders, addRockFormationColliders, addRockShelterColliders,
    addBiomeLandmarkColliders, addSceneryColliders, addTownGateColliders, addStreetBuildingColliders } from "./scenery-colliders.ts";

export const STEP = 1 / 60;

interface WorldGeometry {
    readonly surfaces: CourseSurfaces;
    readonly barriers: readonly Barrier[];
    readonly lift?: AlpineLift | undefined;
    readonly biomeLandmarks?: readonly BiomeLandmark[];
    readonly vegetation?: Vegetation;
    readonly halls?: readonly Hall[];
    readonly bellgateStreets?: BellgateStreets | undefined;
    readonly townGate?: TownGate | undefined;
    readonly aqueduct?: Aqueduct | undefined;
    readonly rockFormations?: readonly RockFormation[];
    readonly streetBuildings?: readonly StreetBuilding[];
    readonly frosthavenHarbor?: FrosthavenHarbor | undefined;
    readonly winterCabins?: readonly WinterCabin[];
    readonly forestBridge?: ForestBridge | undefined;
    readonly forestSpillway?: ForestSpillway | undefined;
    readonly forestMill?: ForestMill | undefined;
    readonly glasswaterRiverworks?: GlasswaterRiverworks | undefined;
    readonly glasswaterFlyover?: GlasswaterFlyover | undefined;
    readonly shelter?: RockShelter | undefined;
    readonly lavaEscarpment?: Surface | undefined;
    readonly calderaRunoff?: CalderaRunoff | undefined;
    readonly calderaCrater?: CalderaCrater | undefined;
    readonly calderaAshworks?: CalderaAshworks | undefined;
    readonly calderaRidges?: Surface | undefined;
    readonly copperCrossing?: Surface | undefined;
    readonly frosthavenCrossing?: Surface | undefined;
    readonly calderaCrossing?: readonly Surface[] | undefined;
    readonly juniperTerraces?: Surface | undefined;
    readonly railwayViaduct?: { readonly wall: Surface } | undefined;
    readonly reefTunnel?: Surface | undefined;
    readonly reefPortalStonework?: Surface | undefined;
    readonly cloudfoldScenery?: CloudfoldScenery | undefined;
    readonly aresCutworks?: AresCutworks | undefined;
    readonly aresGardens?: AresGardens | undefined;
    readonly skywheelGrounds?: SkywheelGrounds | undefined;
    readonly auroraWaterside?: AuroraWaterside | undefined;
    readonly skygarden?: ReturnType<typeof auroraGarden> | undefined;
}

export function createWorld({
    surfaces, barriers, lift, vegetation, biomeLandmarks = [], halls = [], aqueduct, shelter, townGate, bellgateStreets, rockFormations = [], streetBuildings = [],
    forestBridge, forestSpillway, forestMill, glasswaterFlyover, glasswaterRiverworks, frosthavenHarbor, winterCabins = [], lavaEscarpment, calderaRunoff, calderaCrater,
    calderaRidges, calderaCrossing, calderaAshworks, copperCrossing, frosthavenCrossing, reefTunnel, reefPortalStonework, cloudfoldScenery,
    railwayViaduct, juniperTerraces, skygarden, auroraWaterside, aresCutworks, aresGardens, skywheelGrounds,
}: WorldGeometry): RAPIER.World {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    try {
        world.timestep = STEP;
        world.numSolverIterations = 8;
        world.createCollider(surfaceCollider(driveableSurfaces(surfaces)).setFriction(0.85));
        addBarriers(world, barriers);
        if (lift) addLiftMasts(world, lift);
        if (vegetation) addSceneryColliders(world, vegetation);
        addBiomeLandmarkColliders(world, biomeLandmarks);
        addHallColliders(world, halls);
        if (skygarden) addSkygardenSupports(world, skygarden);
        if (auroraWaterside) {
            const { ribs, walks, solarRoof, terraces, footings } = auroraWaterside;
            world.createCollider(surfaceCollider([ribs, ...walks, ...solarRoof, ...terraces]).setFriction(0.61));
            for (const { x, y, z, width, height, depth, yaw } of footings) {
                world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
                    .setTranslation(x, y, z).setRotation(yawRotation(yaw)).setFriction(0.64));
            }
        }
        if (aresCutworks) {
            const { frames, baffles, inspectionLane, retainingLedges, overlook, footings, pads } = aresCutworks;
            world.createCollider(surfaceCollider([frames, ...baffles, ...inspectionLane, ...retainingLedges, ...overlook, ...pads.map(pad => pad.solid)])
                .setFriction(0.69));
            for (const { x, y, z, width, height, depth, yaw } of footings) {
                world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
                    .setTranslation(x, y, z).setRotation(yawRotation(yaw)).setFriction(0.64));
            }
        }
        if (aresGardens) addAresGardenColliders(world, aresGardens);
        if (skywheelGrounds) {
            const { ribs, roof, terraces, paving, footings, catwalk, wheelPad, carousel } = skywheelGrounds;
            world.createCollider(surfaceCollider([ribs, ...roof, ...terraces, ...paving]).setFriction(0.62));
            for (const { x, y, z, width, height, depth, yaw } of [...footings, catwalk, wheelPad]) {
                world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
                    .setTranslation(x, y, z).setRotation(yawRotation(yaw)).setFriction(0.59));
            }
            world.createCollider(RAPIER.ColliderDesc.cylinder(0.48, 6.76)
                .setTranslation(carousel.x, carousel.y + 0.48, carousel.z).setFriction(0.59));
        }
        addStreetBuildingColliders(world, streetBuildings);
        addWinterColliders(world, winterCabins, frosthavenHarbor);
        if (forestMill) addForestMillCollider(world, forestMill);
        if (forestBridge) addForestBridgeColliders(world, forestBridge);
        if (forestSpillway) {
            world.createCollider(surfaceCollider(forestSpillway.banks).setFriction(0.55));
            world.createCollider(surfaceCollider([forestSpillway.water]).setFriction(0.18));
        }
        if (glasswaterFlyover) addFlyoverColliders(world, glasswaterFlyover);
        if (glasswaterRiverworks) {
            const { arches, deck, walks, parapets, quays, columns } = glasswaterRiverworks;
            world.createCollider(surfaceCollider([deck, arches, ...walks, ...parapets, ...quays]).setFriction(0.61));
            for (const { x, y, z, width, height, depth, yaw } of columns) {
                world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
                    .setTranslation(x, y, z).setRotation(yawRotation(yaw)).setFriction(0.61));
            }
        }
        addRockFormationColliders(world, rockFormations);
        if (townGate) addTownGateColliders(world, townGate);
        if (bellgateStreets) {
            world.createCollider(surfaceCollider([...bellgateStreets.curbs, ...bellgateStreets.terraces]).setFriction(0.60));
        }
        if (aqueduct) addAqueductColliders(world, aqueduct);
        if (shelter) addRockShelterColliders(world, shelter);
        if (lavaEscarpment) world.createCollider(surfaceCollider([lavaEscarpment]).setFriction(0.71));
        if (calderaRunoff) world.createCollider(surfaceCollider([calderaRunoff.rocks, calderaRunoff.flow]).setFriction(0.71));
        if (calderaCrater) world.createCollider(surfaceCollider([calderaCrater.rock]).setFriction(0.71));
        if (calderaAshworks) {
            const { notch, banks, overlooks, aprons } = calderaAshworks;
            world.createCollider(surfaceCollider([notch, ...banks, ...overlooks, ...aprons]).setFriction(0.68));
        }
        if (calderaRidges) world.createCollider(surfaceCollider([calderaRidges]).setFriction(0.71));
        if (copperCrossing) world.createCollider(surfaceCollider([copperCrossing]).setFriction(0.61));
        if (frosthavenCrossing) world.createCollider(surfaceCollider([frosthavenCrossing]).setFriction(0.61));
        if (calderaCrossing) world.createCollider(surfaceCollider(calderaCrossing).setFriction(0.71));
        if (juniperTerraces) world.createCollider(surfaceCollider([juniperTerraces]).setFriction(0.64));
        if (railwayViaduct) world.createCollider(surfaceCollider([railwayViaduct.wall]).setFriction(0.76));
        if (reefTunnel) world.createCollider(surfaceCollider([reefTunnel]).setFriction(0.4));
        if (reefPortalStonework) world.createCollider(surfaceCollider([reefPortalStonework]).setFriction(0.63));
        if (cloudfoldScenery) {
            const { portal, viaduct, ledges } = cloudfoldScenery;
            world.createCollider(surfaceCollider([portal, viaduct, ...ledges]).setFriction(0.62));
        }
        return world;
    } catch (error) {
        world.free();
        throw error;
    }
}

function addSkygardenSupports(world: RAPIER.World, garden: ReturnType<typeof auroraGarden>): void {
    for (const { x, z, bottom, postTop, width, depth } of garden.feet) {
        const halfHeight = (postTop - bottom) / 2;
        world.createCollider(RAPIER.ColliderDesc.cuboid(width * 0.37, halfHeight, depth * 0.37)
            .setTranslation(x, bottom + halfHeight, z).setRotation(yawRotation(garden.yaw)).setFriction(0.54));
    }
}

function addBarriers(world: RAPIER.World, barriers: readonly Barrier[]): void {
    for (const { a, b } of barriers) {
        const distance = Math.hypot(b.x - a.x, b.z - a.z);
        const length = Math.hypot(distance, b.y - a.y);
        const yaw = Math.atan2(b.x - a.x, b.z - a.z);
        const pitch = -Math.atan2(b.y - a.y, distance);
        world.createCollider(RAPIER.ColliderDesc.cuboid(0.23, 0.53, length / 2 + 0.055)
            .setTranslation((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.47, (a.z + b.z) / 2)
            .setRotation(yawPitchRotation(yaw, pitch)).setFriction(0.22).setRestitution(0.15));
    }
}

function addLiftMasts(world: RAPIER.World, lift: AlpineLift): void {
    for (const { foot, head, width } of lift.masts) {
        const dx = head.x - foot.x;
        const dy = head.y - foot.y;
        const dz = head.z - foot.z;
        const direction = yawPitchRotation(Math.atan2(dx, dz), -Math.atan2(dy, Math.hypot(dx, dz)));
        world.createCollider(RAPIER.ColliderDesc.cuboid(width * 0.5, width * 0.5, Math.hypot(dx, dy, dz) * 0.5)
            .setTranslation((foot.x + head.x) * 0.5, (foot.y + head.y) * 0.5, (foot.z + head.z) * 0.5)
            .setRotation(direction).setFriction(0.57));
    }
}
