import type { Point } from "../point.ts";
import {
    aegeanLandmarks, alpineLandmarks, cinderLandmarks, circuitLandmarkFootprints, circuitLandmarks, copperLandmarks,
    cloudfoldLandmarks, coralLandmarks, frosthavenLandmarks, juniperLandmarks, pacificLandmarks, woodlandLandmarks,
} from "./circuit-landmarks.ts";
import type { CircuitLandmarkKind, LandmarkSite } from "./circuit-landmarks.ts";
import { placeGlasswaterHarbor } from "./glasswater-harbor.ts";
import { glasswaterProps } from "./glasswater-props.ts";
import { placeAuroraGardenProps } from "./aurora-garden-props.ts";
import { auroraProps } from "./aurora-props.ts";
import { aresProps } from "./ares-props.ts";
import { skywheelProps } from "./skywheel-props.ts";
import { calderaProps } from "./caldera-props.ts";
import { bellgateProps } from "./bellgate-props.ts";
import { placeBellgateBelfry } from "./bellgate-belfry.ts";
import { placeCopperTrolleys } from "./copper-mine.ts";
import type { Course } from "./course.ts";
import { inForestBridge } from "./forest-bridge.ts";
import { inHarborClearing, placeHarborModels } from "./frosthaven/harbor.ts";
import { placeFrosthavenFloes } from "./frosthaven/ice-shelves.ts";
import { underShelter } from "./rock-shelters.ts";
import { placeJuniperShed } from "./railway/shed.ts";
import { placeJuniperSignals } from "./railway/signals.ts";
import { placeJuniperStation } from "./railway/station.ts";
import { placeReefColonies } from "./reef-colonies.ts";
import { coralLookoutFeet } from "./reef-lookout.ts";
import { placeCloudfoldGardens } from "./sky-gardens.ts";
import { roadHalfWidth } from "./road-width.ts";
import { hallSetback } from "./halls.ts";
import { pacificLighthouse, pacificLighthouseBase } from "./pacific-lighthouse.ts";
import { pointOnRoute } from "./route.ts";
import type { Biome } from "./tracks.ts";
import { waterDistance } from "./water.ts";
import { winterCabinFootprint } from "./winter-cabins.ts";

export type BiomeLandmarkKind = CircuitLandmarkKind
    | "windbreak-oak" | "cinder-hoodoo" | "copper-mesa" | "ares-breccia" | "caldera-spatter";

export interface BiomeLandmark extends Point {
    readonly kind: BiomeLandmarkKind;
    readonly height: number;
    readonly yaw: number;
    readonly pitch?: number;
    readonly radius: number;
    readonly footing?: number;
}

interface Group {
    readonly kind: BiomeLandmarkKind;
    readonly sites: readonly LandmarkSite[];
}

const groups: Partial<Record<Biome, Group>> = {
    forest: { kind: "windbreak-oak", sites: [
        [459, -30, 9.5, -0.5], [913, -25, 9.6, 0.83], [1_204, -28, 9.1, 0.28],
    ] },
    rail: { kind: "windbreak-oak", sites: [
        [69, -20, 10.2, 1.9], [410, -23, 12.6, 0.2], [550, 21, 9.3, -0.9], [690, -20, 11.4, 0.4],
        [775, 21, 12.2, 1.4], [821, 29, 9.2, -2.1], [884, -24, 9.6, 1.6], [1_052, -22, 11.5, -0.4],
        [1_338, 23, 11.2, 1.3], [1_743, 24, 10.7, 0.2],
    ] },
    stunt: { kind: "windbreak-oak", sites: [
        [127, -29.6, 10.2, -0.65], [174, -25.6, 12.4, -0.44], [208, 37.5, 11.7, 0.75],
        [241, -36.4, 13.1, -0.49], [350, 36.2, 11.9, 0.41], [420, 23.7, 10.7, 0.88],
        [497, -26.4, 12.5, 1.47], [544, 26.7, 11.6, 0.4], [609, -29.6, 12.1, -1.54],
        [682, 32.3, 12.9, 0.9], [733, 30.3, 11.9, 1.43], [805, -28.8, 10.5, 1.44],
        [857, 25.9, 12.1, 1.55], [918, -31.2, 11.8, -1.35], [1_093, 32.5, 11.8, 1.44],
        [1_163, -27.6, 12.2, -1.43], [1_263, -36.2, 13.3, -1.57], [1_361, 28.5, 12.31, 1.49],
        [1_464, 27.8, 12.7, 0.4],
    ] },
    canyon: { kind: "cinder-hoodoo", sites: [
        [69, 27, 14.5, 0.8], [174, -27, 18, -0.4], [246, 28, 13.3, 2.1], [350, -25, 17.8, 1.2],
        [525, 30, 21, -1.8], [713, -25, 16.3, 0.5], [833, 26, 19.8, 2.7],
        [1_030, -28, 18.1, 0.9], [1_253, 28, 19, 0.35], [1_478, -26, 15.7, -2.4],
    ] },
    gorge: { kind: "copper-mesa", sites: [[120, -32, 10.8, 0.71], [906, 40, 12.9, -1.45], [1_555, 40, 13.1, 1.2]] },
    mars: { kind: "ares-breccia", sites: [
        [61, -24, 6.8, 0.75], [105, -29, 10.8, -0.3], [303, -31, 9.3, 1.2], [359, -26, 10.2, -0.7],
        [523, 25, 11.7, 0.3], [562, 32, 7.1, 2.8], [771, -25, 9.8, 0.9], [949, -38, 10.3, -1.1],
        [1_120, -24, 11.2, 2.4], [1_308, 25, 8.5, -0.3], [1_533, -25, 8.1, 0.8],
    ] },
    caldera: { kind: "caldera-spatter", sites: [
        [47, -22, 7.8, 0.5], [325, -24, 8.1, -0.3], [364, 23, 8.3, 0.8], [430, -28, 9.9, 1.2],
        [486, 23, 11.2, -0.4], [531, 29, 8.3, 2.1], [684, -24, 9.4, -1.2], [780, 27, 12.3, 0.7],
        [1_010, -31, 11.7, 2.5], [1_270, 25, 9.2, 1.6], [1_604, -24, 10.2, -0.9],
        [1_920, 26, 9.1, 1.2], [2_170, 24, 8.3, -2], [2_300, -23, 6.7, 1.4],
    ] },
};

const footprint: Record<BiomeLandmarkKind, number> = {
    ...circuitLandmarkFootprints,
    "windbreak-oak": 0.72, "cinder-hoodoo": 0.61, "copper-mesa": 0.8, "ares-breccia": 0.86, "caldera-spatter": 0.69,
};

export function isLandmarkTree(kind: BiomeLandmarkKind): boolean {
    return kind === "windbreak-oak" || kind === "pacific-cypress" ||
        kind === "blackwood-cedar" || kind === "aegean-olive" || kind === "pacific-monterey" || kind === "pacific-sapling" ||
        kind === "alpine-larch" || kind === "cinder-juniper" || kind === "frosthaven-spruce" || kind === "coral-palm" || kind === "cloudfold-cypress" || kind === "aurora-ginkgo";
}

export function placeBiomeLandmarks(course: Course): BiomeLandmark[] {
    const id = course.track.id;
    const authored = [groups[id], circuitLandmarks[id]].filter(group => group !== undefined);
    const woodland = woodlandLandmarks[id] ?? [];
    const aegean = aegeanLandmarks[id] ?? [];
    const pacific = pacificLandmarks[id] ?? [];
    const alpine = alpineLandmarks[id] ?? [];
    const cinder = cinderLandmarks[id] ?? [];
    const copper = copperLandmarks[id] ?? [];
    const juniper = juniperLandmarks[id] ?? [];
    const frosthaven = frosthavenLandmarks[id] ?? [];
    const coral = coralLandmarks[id] ?? [];
    const cloudfold = cloudfoldLandmarks[id] ?? [];
    const plan = id === "forest" ? [...woodland, ...authored, ...juniper]
        : [...cinder, ...copper, ...authored, ...alpine, ...woodland, ...aegean, ...pacific, ...juniper, ...frosthaven, ...coral, ...cloudfold];
    const landmarks = id === "gorge" ? placeCopperTrolleys(course) : [];
    if (course.branch) landmarks.push(...placeCloudfoldGardens(course, course.branch));
    if (id === "future") landmarks.push(...placeAuroraGardenProps(course));
    if (id === "metro") landmarks.push(...placeGlasswaterHarbor(course));
    if (id === "old-town") {
        const belfry = placeBellgateBelfry(course);
        if (belfry) landmarks.push(belfry);
        landmarks.push(...bellgateGateTroughs(course));
    }
    if (id === "reef") landmarks.push(...placeReefColonies(course));
    if (id === "rail") landmarks.push(placeJuniperStation(course), placeJuniperShed(course), ...placeJuniperSignals(course));
    if (course.frosthavenHarbor) landmarks.push(...placeHarborModels(course.frosthavenHarbor, course), ...placeFrosthavenFloes(course));
    const extras = [
        ...(bellgateProps[id] ?? []), ...(glasswaterProps[id] ?? []), ...(auroraProps[id] ?? []),
        ...(aresProps[id] ?? []), ...(skywheelProps[id] ?? []), ...(calderaProps[id] ?? []),
    ];
    for (const group of [...plan, ...extras]) placeGroup(course, group, landmarks);
    if (id === "coast") {
        const lighthouse = course.outposts.find(site => site.kind === "lighthouse");
        if (lighthouse) {
            const kind = "pacific-lighthouse";
            const { height } = pacificLighthouse;
            const { position, yaw } = lighthouse;
            const footing = pacificLighthouseBase(position, yaw, course.ground);
            landmarks.push({ ...position, y: position.y - 0.13, yaw, footing, kind, height, radius: footprint[kind] * height });
        }
    }
    return landmarks;
}

function bellgateGateTroughs(course: Course): BiomeLandmark[] {
    const gate = course.townGate;
    if (!gate) return [];
    const kind = "bellgate-flower-trough";
    const { row, yaw } = gate;
    const height = 1.06;
    return [-1, 1].flatMap(side => [3.78, -3.78].map(across => {
        const edge = pointOnRoute(row, across, 9.02);
        return { x: edge.x + row.dx * side * 2.08, y: edge.y, z: edge.z + row.dz * side * 2.08,
            yaw: yaw - 0.627 + (side > 0 ? Math.PI : 0), kind, height, radius: height * footprint[kind] };
    }));
}

function placeGroup(course: Course, { kind, sites }: Group, landmarks: BiomeLandmark[]): void {
    const { track, forestBridge, forestMill } = course;
    for (const [distance, side, height, twist] of sites) {
        if (underShelter(track.id, distance)) continue;
        const radius = footprint[kind] * height;
        const row = course.at(distance);
        const point = pointOnRoute(row, side);
        const near = course.locate(point);
        const room = Math.abs(near.lateral);
        const clearance = roadHalfWidth(track.id, near.distance) + radius + 2;
        if (room < clearance || room < hallSetback(track.id, near.distance) + radius) continue;
        if (forestBridge && kind !== "blackwood-pier" && inForestBridge(forestBridge, near.distance, near.lateral)) {
            continue;
        }
        if (forestMill && separation(forestMill.position, point) < radius + 9) continue;
        if (course.frosthavenHarbor && inHarborClearing(course.frosthavenHarbor, point)) continue;
        if (course.winterCabins.some(cabin => separation(cabin, point) < radius +
            Math.hypot(winterCabinFootprint.width, winterCabinFootprint.depth) / 2)) continue;
        if (course.aqueduct?.columns.some(column => {
            const columnRadius = Math.hypot(column.width, column.depth) / 2;
            return separation(column.center, point) < radius + columnRadius + 0.5;
        }) === true) continue;
        if (course.aresCutworks?.pads.some(pad => separation(pad, point) < radius + 6.3)) continue;
        if (course.outposts.some(({ position, radius: setback }) => separation(position, point) < radius + setback)) continue;
        if (course.rockFormations.some(rock => separation(rock, point) < radius + Math.max(rock.sx, rock.sz) * 0.49)) {
            continue;
        }
        if (course.streetBuildings.some(building => separation(building, point) <
            radius + Math.hypot(building.width, building.depth) * 0.5)) continue;
        if (landmarks.some(landmark => separation(landmark, point) < radius + landmark.radius)) continue;
        const y = landmarkGround(course, point.x, point.z);
        const footing = landmarkFootings[kind];
        if (y === undefined || (track.id === "reef" && y <= 0.55) || Math.abs(y - row.y) > (footing?.heightDifference ?? 10)) continue;
        if (overlapsSkywheel(course, { ...point, y }, radius, height)) continue;
        const pad = radius * (isLandmarkTree(kind) ? 0.29 : 0.74);
        const yaw = Math.atan2(row.dx, row.dz) + twist;
        const samples = footing ? landmarkFootSamples(footing.points, height, yaw)
            : [[0, 0], [-pad, 0], [pad, 0], [0, -pad], [0, pad]] as const;
        const elevations = samples.map(([x, z]) => {
            const at = { x: point.x + x, z: point.z + z };
            const elevation = landmarkGround(course, at.x, at.z);
            if (elevation === undefined || course.water.some(body =>
                elevation <= body.center.y + 1.25 && waterDistance(body, at.x, at.z) < 1.15)) return NaN;
            return elevation;
        });
        const floor = Math.min(...elevations);
        if (!Number.isFinite(floor) || Math.max(...elevations) - floor > height * (footing?.maxGroundVariation ?? 0.33)) continue;
        landmarks.push({ ...point, y: floor - height * (footing?.embed ?? 0.055), kind, height, radius, yaw });
    }
}

function landmarkGround(course: Course, x: number, z: number): number | undefined {
    const ground = course.ground.at(x, z);
    const paving = course.skywheelGrounds?.pavingHeight.at(x, z) ?? course.calderaAshworks?.apronHeight.at(x, z);
    return paving === undefined ? ground : Math.max(paving, ground ?? paving);
}

function overlapsSkywheel(course: Course, at: Point, radius: number, height: number): boolean {
    const grounds = course.skywheelGrounds;
    if (!grounds) return false;
    if (separation(grounds.carousel, at) < radius + 7.7) return true;
    const { wheelPad } = grounds;
    const dx = at.x - wheelPad.x;
    const dz = at.z - wheelPad.z;
    const cos = Math.cos(wheelPad.yaw);
    const sin = Math.sin(wheelPad.yaw);
    if (Math.abs(dx * cos - dz * sin) < radius + wheelPad.width / 2 &&
        Math.abs(dx * sin + dz * cos) < radius + wheelPad.depth / 2) return true;
    if (grounds.footings.some(post => separation(post, at) < radius + 1.68)) return true;
    return course.stuntLoops.some(loop => loop.rows.some(row => {
        return row.y > at.y - 0.42 && row.y < at.y + height + 0.55 && separation(row, at) < radius + 3.89;
    }));
}

type FootprintPoint = readonly [number, number];

interface LandmarkFooting {
    readonly points: readonly FootprintPoint[];
    readonly heightDifference?: number;
    readonly embed?: number;
    readonly maxGroundVariation?: number;
}

const landmarkFootings: Partial<Record<BiomeLandmarkKind, LandmarkFooting>> = {
    "caldera-station": { embed: 0.051, maxGroundVariation: 0.22,
        points: [[-0.48, -0.26], [-0.24, 0.45], [0.47, 0.29], [0.28, -0.48]] },
    "caldera-lamp": { embed: 0.039, maxGroundVariation: 0.22,
        points: [[-0.17, -0.08], [-0.12, 0.13], [0.15, -0.12], [0.15, 0.12]] },
    "caldera-fins": { embed: 0.089, heightDifference: 15, maxGroundVariation: 0.28,
        points: [[-0.26, -0.06], [-0.39, 0.17], [0.08, 0.31], [0.37, 0.19], [0.28, -0.13]] },
    "caldera-rope-lava": { embed: 0.072, heightDifference: 13, maxGroundVariation: 0.36,
        points: [[-0.76, -0.5], [-0.54, 0.72], [0.44, 0.76], [0.78, 0.05], [0.34, -0.87]] },
    "caldera-tussock": { embed: 0.085, maxGroundVariation: 0.42,
        points: [[-0.52, -0.24], [-0.31, 0.45], [0.38, 0.37], [0.56, -0.24]] },
    "caldera-marker": { embed: 0.061, maxGroundVariation: 0.27,
        points: [[-0.33, -0.20], [-0.33, 0.30], [0.31, 0.32], [0.34, -0.19]] },
    "skywheel-booth": { embed: 0.039, maxGroundVariation: 0.21,
        points: [[-0.24, -0.105], [-0.19, 0.199], [0.23, -0.14], [0.225, 0.192]] },
    "skywheel-gondola": { embed: 0.054, maxGroundVariation: 0.19,
        points: [[-0.14, -0.04], [-0.18, 0.15], [0.19, -0.03], [0.16, 0.17]] },
    "skywheel-lamp": { embed: 0.032, maxGroundVariation: 0.18,
        points: [[0.03, 0.065], [0.02, 0.21], [0.167, 0.08], [0.164, 0.206]] },
    "skywheel-cart": { embed: 0.052, maxGroundVariation: 0.18,
        points: [[-0.32, -0.12], [-0.145, -0.24], [0.16, 0.13], [0.33, 0.22]] },
    "skywheel-planter": { embed: 0.047, maxGroundVariation: 0.22,
        points: [[-0.243, -0.092], [-0.15, 0.209], [0.212, -0.07], [0.21, 0.203]] },
    "skywheel-bollard": { embed: 0.048, maxGroundVariation: 0.22,
        points: [[-0.27, 0], [0.26, 0], [0, -0.27], [0, 0.25]] },
    "ares-dish": { embed: 0.045,
        points: [[-0.24, -0.22], [0.25, -0.19], [-0.20, 0.24], [0.23, 0.24]] },
    "ares-rover": { embed: 0.082, maxGroundVariation: 0.19,
        points: [[-0.59, 0.06], [-0.24, 0.54], [-0.17, -0.26], [0.22, 0.26], [0.27, -0.59], [0.64, -0.07]] },
    "ares-pod": { embed: 0.052, maxGroundVariation: 0.21,
        points: [[-0.44, 0.03], [0.16, -0.47], [-0.06, 0.31], [0.43, -0.09]] },
    "ares-tank": { embed: 0.048, maxGroundVariation: 0.19,
        points: [[-0.28, -0.27], [-0.25, 0.22], [0.24, -0.29], [0.29, 0.23]] },
    "ares-slate": { embed: 0.092, heightDifference: 16, maxGroundVariation: 0.30,
        points: [[-0.40, -0.23], [-0.22, 0.34], [0.23, -0.32], [0.47, 0.08]] },
    "ares-radiator": { embed: 0.083, maxGroundVariation: 0.18,
        points: [[-0.40, -0.20], [-0.31, 0.22], [0.30, -0.35], [0.43, 0.19]] },
    "aurora-orbit": { embed: 0.031,
        points: [[-0.29, -0.24], [0.33, -0.21], [-0.20, 0.22], [0.25, 0.19]] },
    "aurora-succulent": { embed: 0.037,
        points: [[-0.62, -0.48], [-0.62, 0.32], [0.64, -0.46], [0.62, 0.31]] },
    "aurora-ginkgo": { embed: 0.038,
        points: [[0.13, -0.06], [0.24, -0.11], [0.12, -0.23], [0.23, -0.21]] },
    "aurora-service-pod": { embed: 0.043,
        points: [[-0.72, -0.09], [-0.35, -0.48], [0.63, -0.33], [0.58, 0.36], [-0.20, 0.54]] },
    "aurora-conservatory": { embed: 0.052,
        points: [[-0.52, -0.36], [0.52, -0.36], [-0.52, 0.36], [0.52, 0.36], [0, -0.69], [0, 0.69]] },
    "aurora-solar-tree": { embed: 0.04,
        points: [[-0.23, -0.09], [0.17, -0.10], [-0.17, 0.26], [0.15, 0.25]] },
    "glasswater-reeds": { embed: 0.046,
        points: [[-0.52, -0.10], [-0.35, 0.36], [0.36, -0.46], [0.60, 0.02]] },
    "glasswater-sail": { embed: 0.023,
        points: [[-0.14, -0.15], [0.15, -0.15], [-0.15, 0.12], [0.15, 0.12]] },
    "glasswater-shelter": { embed: 0.045,
        points: [[-0.56, -0.19], [0.56, -0.30], [-0.55, 0.20], [0.57, 0.10]] },
    "glasswater-crane": { embed: 0.038, points: [[-0.22, -0.23], [0.12, -0.22], [0.24, 0.14], [-0.18, 0.095]] },
    "glasswater-cafe": { embed: 0.046,
        points: [[-0.49, -0.147], [0.49, -0.13], [-0.35, 0.33], [0.36, 0.33]] },
    "bellgate-flower-trough": { embed: 0.035,
        points: [[-0.53, 0.12], [0.48, -0.61], [0.69, -0.27], [-0.28, 0.47]] },
    "bellgate-townhouse": { embed: 0.038, heightDifference: 15.5,
        points: [[-0.07, -0.35], [0.32, -0.14], [0.07, 0.33], [-0.31, 0.14]] },
    "bellgate-citrus": { embed: 0.024, points: [[-0.12, -0.10], [0.12, -0.10], [-0.12, 0.126], [0.12, 0.126]] },
    "bellgate-fruit-cart": { embed: 0.034, points: [[-0.31, -0.15], [-0.28, -0.07], [0.27, 0.35], [0.32, 0.32]] },
    "cloudfold-armillary": { embed: 0.07, points: [[-0.25, -0.27], [0.24, -0.26], [-0.22, 0.16], [0.22, 0.13]] },
    "coral-marker": { embed: 0.10, points: [[-0.23, -0.16], [0.22, -0.17], [0.23, 0.13], [-0.20, 0.21]] },
    "coral-lookout": { heightDifference: 17, embed: 0.035, points: coralLookoutFeet },
    "coral-palm": { heightDifference: 16, embed: 0.032,
        points: [[0.218, -0.23], [0.26, -0.28], [0.32, -0.23], [0.358, -0.19], [0.274, -0.15]] },
    "frosthaven-spruce": { embed: 0.025, heightDifference: 64,
        points: [[-0.048, -0.08], [0.027, -0.12], [0.078, -0.05], [0.01, 0.018]] },
    "juniper-outcrop": { embed: 0.10, heightDifference: 15.5,
        points: [[-0.55, -0.23], [-0.28, -0.62], [0.48, -0.49], [0.51, 0.30], [-0.41, 0.59]] },
    "juniper-shed": { embed: 0.09, points: [[-0.70, -0.09], [0.03, 0.49], [-0.04, -0.56], [0.64, -0.02]] },
    "juniper-tower": { embed: 0.095, points: [[0.118, 0.112], [0.229, -0.053], [0.026, -0.187], [-0.122, -0.034]] },
    "copper-ore-hut": { embed: 0.038, points: [[0, 0.385], [-0.44, -0.06], [0.47, -0.07], [-0.04, -0.43]] },
    "copper-survey-tower": { embed: 0.10, points: [[-0.20, -0.025], [0.19, -0.065], [0.075, 0.145], [-0.025, -0.17]] },
    "copper-split-mesa": { embed: 0.08, points: [[-0.33, 0.17], [-0.20, 0.36], [0.18, 0.34], [0.35, 0.12], [0.30, -0.14]] },
    "cinder-arch": { heightDifference: 24, embed: 0.027,
        points: [[-0.48, -0.19], [-0.60, -0.10], [-0.36, -0.22], [0.43, 0.15], [0.31, 0.23], [0.60, 0.14]] },
    "cinder-juniper": { points: [[0.22, -0.13], [0.08, -0.27], [0.35, -0.22], [0.37, -0.02], [0.06, 0.02]] },
    "cinder-shade": { embed: 0.15, points: [[-0.45, -0.16], [-0.18, -0.39], [0.43, -0.13], [0.09, 0.31], [-0.21, 0.17]] },
    "cinder-flume": { heightDifference: 19, embed: 0.09,
        points: [[-0.33, 0.17], [-0.23, 0.29], [0.15, -0.16], [0.38, -0.09], [0.44, -0.03]] },
};

function landmarkFootSamples(footings: readonly FootprintPoint[], height: number, yaw: number): FootprintPoint[] {
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    return footings.map(([x, z]) => [height * (x * cos + z * sin), height * (-x * sin + z * cos)]);
}

function separation(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.z - b.z);
}
