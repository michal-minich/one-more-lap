import type { Point } from "../../point.ts";
import { seededRandom } from "../../random.ts";
import type { Course } from "../course.ts";
import { tramwayClearing } from "../copper-mine.ts";
import { inForestBridge } from "../forest-bridge.ts";
import { inHarborClearing } from "../frosthaven/harbor.ts";
import { GLASSWATER_PAVEMENT } from "../city-frontage.ts";
import { inStreetWalk, streetLandscape } from "../street-landscape.ts";
import { districtPlans } from "../district-plans.ts";
import { hallSetback } from "../halls.ts";
import { underShelter } from "../rock-shelters.ts";
import { bridgeDrop } from "../passages.ts";
import { goodsShed, railwayEnds, railwayOffset, railwayPoint, railwayStation } from "../railway/line.ts";
import { juniperOverlook } from "../railway/valley.ts";
import { locate, pointOnRoute } from "../route.ts";
import { insidePoint, landscapeNoise, outsidePoint } from "../terrain-profile.ts";
import { waterDistance, waterPoint } from "../water.ts";
import { winterCabinFootprint } from "../winter-cabins.ts";
import { habitats } from "./habitats.ts";
import type { GroundPlant } from "./habitats.ts";
import { placeVegetationLandmarks } from "./landmarks.ts";
import { scatterPatch } from "./scatter.ts";
import type { TreePlacement } from "./trees.ts";

interface Planted {
    readonly ground: Point;
    readonly scale: number;
    readonly yaw: number;
}

export interface PlantPlacement extends Planted {
    readonly kind: GroundPlant;
}

export interface BoulderPlacement extends Planted {
    readonly shape: "slab" | "round" | "shard";
}

interface BoulderSize {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
    readonly lift: number;
}

export const boulderSizes: Record<BoulderPlacement["shape"], BoulderSize> = {
    slab: { width: 1.1, height: 0.53, depth: 0.66, lift: 0.34 },
    round: { width: 0.83, height: 0.59, depth: 0.76, lift: 0.34 },
    shard: { width: 0.77, height: 0.79, depth: 0.63, lift: 0.39 },
};

export interface Vegetation {
    readonly trees: readonly TreePlacement[];
    readonly plants: readonly PlantPlacement[];
    readonly boulders: readonly BoulderPlacement[];
}

type GrowingSite = Pick<Course, "track" | "route" | "ground" | "center" | "water" | "outposts" | "streetBuildings"
    | "forestMill" | "forestBridge" | "rockFormations" | "winterCabins" | "frosthavenHarbor" | "length" | "at"
    | "biomeLandmarks">;

export function growCourse(site: GrowingSite): Vegetation {
    const { track, route, center, water, forestMill, forestBridge } = site;
    const { id } = track;
    if (id === "sky") return { trees: [], plants: [], boulders: [] };
    const habitat = habitats[id];
    const random = seededRandom([...id].reduce((seed, letter) => seed * 13 + letter.charCodeAt(0), 577));
    const city = id === "old-town" || id === "metro" || id === "future";
    const walks = streetLandscape(id);
    const railwayYard = id === "rail" ? [
        { at: railwayOffset(goodsShed.x, goodsShed.offset), radius: 16.1 },
    ] : [];
    const mineTracks = id === "gorge" ? tramwayClearing(site) : [];
    const arid = id === "canyon" || id === "gorge" || id === "mars" || id === "caldera";
    const districts = city ? districtPlans[id].map(plan => ({
        at: pointOnRoute(site.at(plan.fraction * site.length), plan.lateral),
        width: (plan.columns * plan.gap) / 2, depth: (plan.rows * plan.gap) / 2,
        sin: Math.sin(plan.yaw), cos: Math.cos(plan.yaw),
    })) : [];
    const landAt = (point: Point, margin: number): Point | undefined => {
        const y = site.ground.at(point.x, point.z);
        if (site.frosthavenHarbor && inHarborClearing(site.frosthavenHarbor, point)) return undefined;
        if (mineTracks.some(at => Math.hypot(point.x - at.x, point.z - at.z) < 1.42 + margin)) return undefined;
        if (railwayYard.some(({ at, radius }) => Math.hypot(point.x - at.x, point.z - at.z) < radius)) return undefined;
        if (id === "stunt" && Math.abs(point.x) < 29 && point.z > 76 && point.z < 433) return undefined;
        if (id === "rail" && point.x > railwayEnds[0] - 5 && point.x < railwayEnds[1] + 5) {
            const { z } = railwayPoint(point.x);
            if (Math.abs(point.z - z) < 6.4 || (Math.abs(point.x + 38) < 10 && Math.abs(point.z - z + 13.5) < 8) ||
                (Math.abs(point.x - railwayStation) < 28 && Math.abs(point.z - z) < 22)) return undefined;
        }
        if (id === "reef" && (y ?? -1) < 0.65) return undefined;
        if (y === undefined || water.some(body =>
            y < body.center.y + margin && waterDistance(body, point.x, point.z) < 1.04)) return undefined;
        if (margin >= 0.4 && site.biomeLandmarks.some(landmark => {
            const setback = landmark.kind === "copper-ore-hut" ? 2.4 : (landmark.kind === "aegean-ruin" || landmark.kind === "juniper-tower") ? 1.45 : 0.96;
            return Math.hypot(point.x - landmark.x, point.z - landmark.z) < landmark.radius * setback;
        })) return undefined;
        if (site.outposts.some(({ position, radius }) => Math.hypot(position.x - point.x, position.z - point.z) < radius)) return undefined;
        if ((id === "forest" || id === "ruins" || id === "coast" || id === "arctic" || id === "reef") && site.rockFormations.some(rock =>
            Math.hypot(point.x - rock.x, point.z - rock.z) < Math.max(rock.sx, rock.sz) * 0.48)) return undefined;
        if (forestBridge) {
            const { distance, lateral } = locate(route, point);
            if (inForestBridge(forestBridge, distance, lateral)) return undefined;
        }
        if (forestMill && Math.hypot(point.x - forestMill.position.x, point.z - forestMill.position.z) < 9) return undefined;
        if (site.winterCabins.some(cabin => {
            const x = point.x - cabin.x;
            const z = point.z - cabin.z;
            const cos = Math.cos(cabin.yaw);
            const sin = Math.sin(cabin.yaw);
            return Math.abs(x * cos - z * sin) < winterCabinFootprint.width / 2 + 1.4 &&
                Math.abs(x * sin + z * cos) < winterCabinFootprint.depth / 2 + 1.4;
        })) return undefined;
        if (walks.length || site.streetBuildings.length) {
            const { lateral, distance } = locate(route, point);
            const pavement = GLASSWATER_PAVEMENT;
            if (inStreetWalk(walks, distance, lateral) ||
                (id === "metro" && Math.abs(lateral) < pavement.setback + 0.4 &&
                    distance >= pavement.start - 4 && distance <= pavement.end + 4)) {
                return undefined;
            }
        }
        if (site.streetBuildings.some(building =>
            Math.hypot(point.x - building.x, point.z - building.z) < Math.hypot(building.width, building.depth) * 0.54
        )) return undefined;
        if (districts.some(({ at, width, depth, sin, cos }) => {
            const x = point.x - at.x;
            const z = point.z - at.z;
            return Math.abs(x * cos - z * sin) < width && Math.abs(x * sin + z * cos) < depth;
        })) return undefined;
        return { x: point.x, y, z: point.z };
    };
    const landmarks = placeVegetationLandmarks(site, landAt);
    const trees = [...landmarks.trees];
    const boulders = [...landmarks.boulders];
    const plants = [...landmarks.plants];
    const plantTree = (point: Point, scale: number): void => {
        const ground = landAt(point, 0.42);
        if (!ground || (id === "alpine" && ground.y > 113)) return;
        if (site.outposts.some(({ kind, position, radius }) =>
            (kind === "guardian" || kind === "forum") && Math.hypot(position.x - ground.x, position.z - ground.z) < radius + 10
        )) return;
        if (landmarks.trees.some(tree => Math.hypot(tree.ground.x - ground.x, tree.ground.z - ground.z) <
            (tree.kind === "ancient-oak" ? 16 : 4)) ||
            landmarks.boulders.some(rock => Math.hypot(rock.ground.x - ground.x, rock.ground.z - ground.z) < rock.scale)) return;
        const next = site.ground.at(ground.x + 1, ground.z + 1);
        if (next === undefined || Math.abs(next - ground.y) > 1.12) return;
        const kind = habitat.trees[Math.floor(random() * habitat.trees.length)]!;
        trees.push({ kind, ground, scale, yaw: random() * Math.PI * 2 });
    };

    for (let i = 4; i < route.length - 2; i += habitat.stride) {
        const row = route[i]!;
        if (bridgeDrop(id, row.distance) > 0) continue;
        if (hallSetback(id, row.distance) > 0 || underShelter(id, row.distance)) continue;
        for (const side of [-1, 1]) {
            const park = Math.sin(row.x * 0.035 + row.z * 0.022);
            if (city && (id === "future" ? park > 0.45 : side < 0 || park > 0.15)) continue;
            const oasis = id !== "mars" || water.some(body => body.kind === "lake" && waterDistance(body, row.x, row.z) < 1.75);
            const position = pointOnRoute(row, side * (13.8 + random() * 8.4));
            const scale = 0.75 + random() * 1.08;
            const coastalView = side < 0 && (
                (id === "coast" && (row.distance > 161 && row.distance < 425 || row.distance > 499 && row.distance < 795)) ||
                (id === "ruins" && row.distance > 146 && row.distance < 392) ||
                (id === "arctic" && row.distance > 144 && row.distance < 494));
            const lakesideView = side > 0 && (id === "forest" && row.distance > 102 && row.distance < 198 ||
                id === "alpine" && row.distance > 450 && row.distance < 703);
            const valleyView = id === "rail" && side < 0 && juniperOverlook(row.distance);
            if (oasis && random() < habitat.density && !coastalView && !lakesideView && !valleyView) plantTree(position, scale);
            else if (random() < habitat.stones) {
                const ground = landAt(position, 0.2);
                if (ground) {
                    const shape = id === "alpine" ? "slab" : arid && random() < 0.63 ? "shard" : "round";
                    boulders.push({ shape, ground, scale: 0.57 + random() * 1.22, yaw: random() * Math.PI * 2 });
                }
            }

            if (habitat.groves && random() < (id === "arctic" ? 0.37 : 0.86) && !coastalView && !lakesideView && !valleyView) {
                const candidate = side < 0
                    ? outsidePoint(track, center, row, 12 + random() * (id === "forest" ? 62 : 43))
                    : insidePoint(track, center, row, 0.09 + random() * 0.39);
                plantTree(candidate, scale * (0.79 + random() * 0.47));
            }
            const clusters = id === "caldera" ? 5 : id === "forest" || id === "alpine" || id === "rail" ? 3 : 2;
            for (let plant = 0; plant < clusters; plant++) {
                const ground = landAt(pointOnRoute(row, side * (8 + random() * 6)), 0.08);
                if (!ground) continue;
                const kind = habitat.verge[Math.floor(random() * habitat.verge.length)]!;
                plants.push({ kind, ground, scale: (id === "caldera" ? 0.62 : 0.38) + random() * 0.67, yaw: random() * Math.PI * 2 });
            }
        }
    }
    for (const body of water) {
        if (body.kind !== "lake") continue;
        for (let index = 0; index < 53; index++) {
            const angle = index * 2.39996;
            const shore = waterPoint(body, angle, 0.78 + random() * 0.21);
            const y = site.ground.at(shore.x, shore.z);
            if (y === undefined || y < shore.y - 0.16 || y > shore.y + 0.68 ||
                Math.abs(locate(route, shore).lateral) < 10.4) continue;
            plants.push({ kind: "reeds", ground: { x: shore.x, y, z: shore.z }, scale: 0.75 + random() * 0.56, yaw: angle });
        }
    }
    if (id === "caldera") {
        // Golden clumps take root on the cooler side of the gallery piers.
        for (const distance of [88, 108, 128, 151, 177, 192, 211]) {
            const row = site.at(distance);
            for (let i = 0; i < 4; i++) {
                const point = pointOnRoute(row, -8.4 - random() * 2.2);
                const at = { ...point, x: point.x + row.dx * (i - 1.5), z: point.z + row.dz * (i - 1.5) };
                const ground = landAt(at, 0.84);
                if (!ground) continue;
                plants.push({ kind: "dry-grass", ground, scale: 0.66 + random() * 0.72, yaw: random() * Math.PI * 2 });
            }
        }
    }
    const terrainStride = id === "forest" ? 6 : id === "arctic" ? 15 : 9;
    for (let i = terrainStride; i < route.length - 3; i += terrainStride) {
        const row = route[Math.min(route.length - 2, i + Math.floor(random() * terrainStride))]!;
        for (const side of [-1, 1]) {
            const count = id === "forest" ? 7 : arid || id === "arctic" ? 3 : 5;
            const patch = side < 0
                ? outsidePoint(track, center, row, 30 + random() * (id === "alpine" ? 110 : 86))
                : insidePoint(track, center, row, 0.18 + random() * 0.44);
            const sites = scatterPatch(patch, 13 + random() * 16, 17 + random() * 12, Math.atan2(row.dx, row.dz), count, random);
            for (const candidate of sites) {
                const ground = landAt(candidate, 0.36);
                if (!ground || Math.abs(locate(route, ground).lateral) < 28) continue;
                const lush = landscapeNoise(ground.x * 2.1, ground.z * 2.1) > -0.22;
                const oasis = id !== "mars" || water.some(body =>
                    body.kind === "lake" && waterDistance(body, ground.x, ground.z) < 1.5);
                if (oasis && lush && random() < habitat.density * 0.83) {
                    plantTree(ground, 0.92 + random() * (id === "forest" ? 1.16 : 0.82));
                } else if (random() < (arid ? 0.62 : 0.40)) {
                    const shape = arid || id === "alpine" ? "slab" : "round";
                    boulders.push({ shape, ground, scale: 0.83 + random() * (arid ? 3.15 : 1.68), yaw: random() * Math.PI * 2 });
                }
                const kind = habitat.verge[Math.floor(random() * habitat.verge.length)]!;
                plants.push({ kind, ground, scale: 0.85 + random() * 0.81, yaw: random() * Math.PI * 2 });
            }
        }
    }
    const lava = water.find(body => body.kind === "lava");
    const supported = lava ? boulders.filter(({ ground, shape, scale, yaw }) => {
        const { width, depth, height } = boulderSizes[shape];
        const along = Math.sin(yaw) * depth * scale * 0.62;
        const forward = Math.cos(yaw) * depth * scale * 0.62;
        const across = Math.cos(yaw) * width * scale * 0.62;
        const sideways = -Math.sin(yaw) * width * scale * 0.62;
        for (const [dx, dz] of [[0, 0], [along, forward], [-along, -forward], [across, sideways], [-across, -sideways]] as const) {
            const x = ground.x + dx;
            const z = ground.z + dz;
            if (waterDistance(lava, x, z) > 2.2) continue;
            const y = site.ground.at(x, z);
            if (y === undefined || y < lava.center.y + 0.45 || Math.abs(y - ground.y) > height * scale * 0.7) return false;
        }
        return true;
    }) : boulders;
    const station = id === "alpine" ? site.biomeLandmarks.find(landmark => landmark.kind === "alpine-station") : undefined;
    const visibleTrees = station ? trees.filter(({ ground }) =>
        Math.hypot(ground.x - station.x, ground.z - station.z) >= station.radius + 5.8) : trees;
    return { trees: visibleTrees, plants, boulders: supported };
}
