import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Course } from "../../game/course/course.ts";
import type { PassageKind } from "../../game/course/passages.ts";
import { isHall } from "../../game/course/halls.ts";
import { pointOnRoute } from "../../game/course/route.ts";
import type { RouteSample } from "../../game/course/route.ts";
import { material } from "../materials.ts";
import { drawCalderaArch } from "./caldera/bridge-arch.ts";
import { drawBridgeDeck } from "./bridge.ts";
import { surface } from "./surface-mesh.ts";
import { surfaceTexture } from "./surface-textures.ts";
import { drawAresCutworks } from "./flight/ares-cutworks.ts";
import { drawAuroraWaterside } from "./district/aurora-waterside.ts";
import { drawBellgateGate } from "./district/bellgate-gate.ts";
import { drawForestBridge } from "./district/forest-bridge.ts";
import { drawHalls } from "./district/halls.ts";
import { drawGlasswaterRiverworks } from "./district/glasswater-riverworks.ts";
import { drawGlasswaterOverpass } from "./district/glasswater-overpass.ts";
import { greatAqueduct } from "./district/greek-monuments.ts";
import { drawSkyway } from "./district/solar-crossings.ts";

type Size = readonly [number, number, number];

export function buildPassages(scene: Scene, course: Course): Mesh[] {
    const shadows: Mesh[] = [];
    for (const { kind, distance } of course.passages) {
        if (isHall(kind) || kind === "aqueduct" || kind === "town gate") continue;
        const row = course.at(distance);
        if (kind === "bridge") {
            shadows.push(...(course.glasswaterRiverworks ? drawGlasswaterRiverworks(scene, course) : bridge(scene, course, row)));
            if (course.auroraWaterside) shadows.push(...drawAuroraWaterside(scene, course.auroraWaterside));
        } else if (kind === "flyover" && course.track.id === "future") {
            drawSkyway(scene, course, row);
        } else if (kind === "flyover" && course.aresCutworks) {
            shadows.push(...drawAresCutworks(scene, course.aresCutworks));
        } else if (kind === "flyover" && course.glasswaterFlyover) {
            shadows.push(...drawGlasswaterOverpass(scene, course.glasswaterFlyover));
        } else {
            const root = anchor(scene, row, kind);
            if (kind === "stone arch") arch(scene, root, course);
            else overhead(scene, root, kind, course, row);
        }
    }
    if (course.townGate) shadows.push(...drawBellgateGate(scene, course.townGate));
    if (course.aqueduct) shadows.push(...greatAqueduct(scene, course.aqueduct));
    if (course.halls.length) shadows.push(...drawHalls(scene, course));
    return shadows;
}

function anchor(scene: Scene, row: RouteSample, name: string): TransformNode {
    const root = new TransformNode(name, scene);
    root.position.set(row.x, row.y, row.z);
    root.rotation.y = Math.atan2(row.dx, row.dz);
    return root;
}

function box(scene: Scene, root: TransformNode, name: string, size: Size, position: Size, paint: StandardMaterial): Mesh {
    const mesh = MeshBuilder.CreateBox(name, { width: size[0], height: size[1], depth: size[2] }, scene);
    mesh.parent = root;
    mesh.position.set(...position);
    mesh.material = paint;
    mesh.isPickable = false;
    return mesh;
}

function bridge(scene: Scene, course: Course, row: RouteSample): Mesh[] {
    const copper = course.track.id === "gorge";
    const frozen = course.track.id === "arctic";
    const stone = material(scene, "bridge concrete and piers", course.track.id === "future" ? "#d9d5c1"
        : copper ? "#d0c2b1" : frozen ? "#a9b4c1" : "#828781");
    const basalt = course.track.id === "caldera";
    stone.diffuseTexture = surfaceTexture(scene, basalt ? "basalt" : course.forestBridge ? "woodland slate"
        : copper ? "copper ashlar" : frozen ? "frosthaven ashlar" : course.track.id === "future" ? "aurora stone" : "limestone");
    if (basalt) stone.diffuseColor.set(0.83, 0.75, 0.74);
    drawBridgeDeck(scene, course, row.distance, stone);
    if (basalt) return drawCalderaArch(scene, course, row.distance, stone);
    const masonry = course.copperCrossing ?? course.frosthavenCrossing;
    if (masonry) {
        const arches = surface(scene, frozen ? "Frosthaven ashlar crossing" : "Copper Gorge ashlar crossing", masonry, stone);
        arches.convertToFlatShadedMesh();
        return [arches];
    }
    if (course.forestBridge) return drawForestBridge(scene, course, course.forestBridge);
    for (const offset of [-12, 0, 12]) {
        const section = course.at(row.distance + offset);
        const local = anchor(scene, section, "bridge supports");
        for (const side of [-1, 1]) {
            const x = side * 4.8;
            const point = pointOnRoute(section, x);
            const bed = course.ground.at(point.x, point.z, section.y - 1.15);
            if (bed === undefined) continue;
            const height = section.y - bed - 0.65;
            box(scene, local, "bridge pier", [1.25, height, 1.65], [x, -height / 2 - 0.88, 0], stone);
        }
    }
    return [];
}

function arch(scene: Scene, root: TransformNode, course: Course): void {
    const sand = course.track.id === "gorge" || course.track.id === "canyon";
    const masonry = material(scene, "weathered arch stone", sand ? "#c58157" : "#b6a087");
    masonry.diffuseTexture = surfaceTexture(scene, course.track.id === "gorge" ? "copper ashlar" : sand ? "sandstone" : "limestone");
    const accent = material(scene, "arch keystone", sand ? "#d1986f" : "#d2c6a7");
    accent.diffuseTexture = masonry.diffuseTexture;
    for (const side of [-1, 1]) {
        box(scene, root, "arch footing", [2.1, 1.1, 3.4], [side * 8.1, 0.35, 0], masonry);
        box(scene, root, "arch column", [1.45, 3.2, 2.55], [side * 8.1, 1.95, 0], masonry);
    }
    const sections = 13;
    for (let i = 0; i < sections; i++) {
        const angle = (i + 0.5) * Math.PI / sections;
        const wedge = box(scene, root, "arch voussoir", [2.02, 0.84, 2.6],
            [8.1 * Math.cos(angle), 3.33 + 5.15 * Math.sin(angle), 0], i === 6 ? accent : masonry);
        wedge.rotation.z = Math.atan2(5.15 * Math.cos(angle), -8.1 * Math.sin(angle));
    }
}

function overhead(scene: Scene, root: TransformNode, kind: PassageKind, course: Course, row: RouteSample): void {
    const wood = kind === "timber walk";
    const structure = material(scene, "overhead crossing", wood ? "#7c563a" : "#636e83");
    structure.diffuseTexture = surfaceTexture(scene, wood ? "boards" : "plaster");
    const deck = material(scene, "crossing trim", wood ? "#ae784d" : "#a6b2b1");
    deck.diffuseTexture = surfaceTexture(scene, course.track.id === "alpine" ? "alpine roof metal"
        : wood ? "boards" : "weathered steel");
    for (const side of [-1, 1]) {
        for (const z of [-2.4, 2.4]) {
            box(scene, root, "overpass pier", [1.05, 6.2, 1.03], [side * 10.4, 2.9, z], structure);
        }
    }
    box(scene, root, "overpass underside", [32, 0.72, 6.4], [0, 5.92, 0], structure);
    for (const side of [-1, 1]) {
        const end = pointOnRoute(row, side * 38);
        const ground = course.ground.at(end.x, end.z) ?? row.y;
        const landing = ground - row.y + 0.23;
        const height = 5.92;
        const ramp = box(scene, root, "grounded overpass approach", [Math.hypot(22, height - landing), 0.67, 6.4],
            [side * 27, (height + landing) / 2, 0], structure);
        ramp.rotation.z = Math.atan2((landing - height) * side, 22);
    }
    for (const side of [-1, 1]) {
        box(scene, root, "overpass fascia", [32, 0.50, 0.20], [0, 6.35, side * 3.19], deck);
        for (let x = -14; x <= 14; x += 4) {
            box(scene, root, "overpass parapet post", [0.14, 0.80, 0.18], [x, 6.85, side * 3.02], structure);
        }
        box(scene, root, "overpass parapet", [32, 0.12, 0.17], [0, 7.18, side * 3.02], deck);
    }
}
