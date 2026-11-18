import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Point } from "../../game/point.ts";
import type { Course } from "../../game/course/course.ts";
import { districtPlans } from "../../game/course/district-plans.ts";
import type { City, District } from "../../game/course/district-plans.ts";
import { hallSetback } from "../../game/course/halls.ts";
import { locate, pointOnRoute, ROAD_HALF } from "../../game/course/route.ts";
import { material } from "../materials.ts";
import { seededRandom } from "../../game/random.ts";
import { surfaceTexture } from "./surface-textures.ts";
import { surface as meshSurface } from "./surface-mesh.ts";
import { conservatory, gardenPlaza, gardenTower } from "./solarpunk.ts";
import { glasswaterBuilding } from "./district/glasswater-towers.ts";
import { bellgateHouse } from "./district/bellgate-buildings.ts";
import { drawAuroraTerraces } from "./district/aurora-terraces.ts";
import { cloudAtrium, energyGarden, sailTower } from "./district/future-buildings.ts";
import { offset, UrbanParts } from "./urban-parts.ts";
import type { BuildPart } from "./urban-parts.ts";

export function drawUrbanDistricts(scene: Scene, course: Course, city: City): Mesh[] {
    const parts = new UrbanParts(scene);
    const random = seededRandom(city.length * 758);
    const streets = material(scene, "district side streets", city === "old-town" ? "#9c9080" : city === "future" ? "#a6b3a0" : "#6a747b");
    streets.diffuseTexture = surfaceTexture(scene, city === "old-town" ? "cobbles" : city === "future" ? "limestone" : "asphalt");
    streets.specularColor.set(0.025, 0.03, 0.035);
    for (const district of districtPlans[city]) {
        const row = course.at(district.fraction * course.length);
        const center = pointOnRoute(row, district.lateral);
        drawDistrict(course, city, district, center, parts.add, random);
        drawSideStreets(scene, course, district, center, streets);
    }
    if (city !== "future") return parts.draw();
    addSolarLandmarks(course, parts.add);
    return [...parts.draw(), ...drawAuroraTerraces(scene, course)];
}

function drawDistrict(course: Course, city: City, district: District, center: Point,
    build: BuildPart, random: () => number): void {
    const { rows, columns, gap, yaw, use } = district;
    for (let street = 0; street < rows; street++) {
        for (let block = 0; block < columns; block++) {
            const localX = (block - (columns - 1) / 2) * gap;
            const localZ = (street - (rows - 1) / 2) * gap;
            if (use === "plaza" && street === 1 && block === 1) {
                addPlaza(course, center, localX, localZ, yaw, build, city);
                continue;
            }
            if (random() < 0.16) continue;
            const at = offset(center, yaw, localX + (random() - 0.5) * 5, localZ + (random() - 0.5) * 5);
            const width = gap * (0.39 + random() * 0.24);
            const depth = gap * (0.38 + random() * 0.21);
            const ground = buildingGround(course, at, Math.max(width, depth) * (city === "future" ? 0.72 : 0.58));
            if (ground === undefined) continue;
            const site = { ...at, y: ground };
            if (city === "old-town") {
                const style = random();
                const occupied = course.biomeLandmarks.some(prop => prop.kind === "bellgate-townhouse" &&
                    Math.hypot(prop.x - at.x, prop.z - at.z) < prop.radius + Math.min(width, depth) * 0.44);
                if (!occupied) bellgateHouse(build, course, site, yaw, width, depth, use, () => style);
            }
            else if (city === "metro") {
                const storefront = course.biomeLandmarks.some(prop => prop.kind === "glasswater-cafe" &&
                    Math.hypot(prop.x - at.x, prop.z - at.z) < prop.radius + Math.min(width, depth) * 0.46);
                if (!storefront) glasswaterBuilding(build, site, yaw, width, depth, use, random);
            }
            else {
                const style = random();
                const reserved = course.biomeLandmarks.some(prop => (prop.kind === "aurora-conservatory" || prop.kind === "aurora-service-pod") &&
                    Math.hypot(prop.x - at.x, prop.z - at.z) < prop.radius + Math.min(width, depth) * 0.48);
                if (reserved) continue;
                if (use === "tower" && style < 0.38) sailTower(build, site, yaw, width, depth, 23 + random() * 29);
                else if (use === "civic" && style < 0.38) cloudAtrium(build, site, yaw, width * 0.89, depth * 0.88);
                else if (use === "civic" && style < 0.73) conservatory(build, site, yaw, width, depth);
                else gardenTower(build, site, yaw, width, depth, use === "tower", random);
            }
        }
    }
}

function addSolarLandmarks(course: Course, build: BuildPart): void {
    for (const [distance, lateral, yaw] of [[81, 31, 0.33], [431, 32, -0.55], [889, -36, 0.57], [1_317, 35, 0.46]] as const) {
        const at = pointOnRoute(course.at(distance), lateral);
        const ground = buildingGround(course, at, 13.5);
        if (ground !== undefined) gardenPlaza(build, { ...at, y: ground }, yaw);
    }
    for (const [distance, lateral, yaw, tall] of [[126, -57, -0.52, 50], [174, 61, 0.2, 43], [594, -48, 1.0, 48]] as const) {
        const at = pointOnRoute(course.at(distance), lateral);
        const ground = buildingGround(course, at, 15);
        if (ground !== undefined) sailTower(build, { ...at, y: ground }, yaw, 19, 17, tall);
    }
    for (const [distance, lateral, yaw] of [[343, -43, 0.68], [596, 57, 0.83], [1_203, -50, 0.25]] as const) {
        const at = pointOnRoute(course.at(distance), lateral);
        const ground = buildingGround(course, at, 16);
        if (ground !== undefined) energyGarden(build, { ...at, y: ground }, yaw, 1);
    }
}

function drawSideStreets(scene: Scene, course: Course, district: District, center: Point, paint: StandardMaterial): void {
    const { rows, columns, gap, yaw } = district;
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const addStreet = (street: Point, direction: number, length: number): void => {
        let previous: number | undefined;
        const steps = Math.ceil(length / 5);
        for (let i = 0; i <= steps; i++) {
            const along = (i / steps - 0.5) * length;
            const left = offset(street, direction, -2.15, along);
            const right = offset(street, direction, 2.15, along);
            const leftY = buildingGround(course, left, 1.2);
            const rightY = buildingGround(course, right, 1.2);
            if (leftY === undefined || rightY === undefined) {
                previous = undefined;
                continue;
            }
            const index = positions.length / 3;
            positions.push(left.x, leftY + 0.052, left.z, right.x, rightY + 0.052, right.z);
            uv.push(0, along / 4, 1, along / 4);
            if (previous !== undefined) indices.push(previous, previous + 1, index, previous + 1, index + 1, index);
            previous = index;
        }
    };
    for (let i = 1; i < columns; i++) addStreet(offset(center, yaw, (i - columns / 2) * gap, 0), yaw, rows * gap);
    // Leave the intersecting strips to the first set of streets so two coplanar surfaces never overlap.
    for (let i = 1; i < rows; i++) {
        const streetZ = (i - rows / 2) * gap;
        for (let block = 0; block < columns; block++) {
            const left = (block - columns / 2) * gap + (block > 0 ? 2.15 : 0);
            const right = (block + 1 - columns / 2) * gap - (block < columns - 1 ? 2.15 : 0);
            addStreet(offset(center, yaw, (left + right) / 2, streetZ), yaw + Math.PI / 2, right - left);
        }
    }
    if (indices.length === 0) return;
    meshSurface(scene, "connected side streets", {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
    }, paint);
}

function buildingGround(course: Course, position: Point, radius: number): number | undefined {
    const nearest = locate(course.route, position);
    const setback = Math.max(ROAD_HALF + 4, hallSetback(course.track.id, nearest.distance));
    if (Math.abs(nearest.lateral) < setback + radius) return undefined;
    if (course.outposts.some(outpost =>
        Math.hypot(outpost.position.x - position.x, outpost.position.z - position.z) < outpost.radius + radius)) return undefined;
    if (course.streetBuildings.some(building =>
        Math.hypot(building.x - position.x, building.z - position.z) < Math.hypot(building.width, building.depth) / 2 + radius)) {
        return undefined;
    }
    return course.ground.at(position.x, position.z);
}

function addPlaza(course: Course, center: Point, x: number, z: number, yaw: number, build: BuildPart, city: City): void {
    const pos = offset(center, yaw, x, z);
    const height = buildingGround(course, pos, city === "future" ? 13.5 : 8);
    if (height === undefined) return;
    if (city === "future") {
        gardenPlaza(build, { ...pos, y: height }, yaw);
        return;
    }
    build("courtyard", { ...pos, y: height + 0.12, sx: 15, sy: 0.20, sz: 16, yaw }, "#b3aa94");
    build("plaza monument", { ...pos, y: height + 1.5, sx: 2.8, sy: 3, sz: 2.8, yaw: yaw + 0.4 },
        "#8b9083");
}
