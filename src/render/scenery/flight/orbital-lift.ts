import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Point } from "../../../game/point.ts";
import { material } from "../../materials.ts";
import { beamBetween } from "../beam.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { ActorMeshes } from "./actor-meshes.ts";

const ivory = "#d4c4ab";
const steel = "#46505c";
const rust = "#bf7951";
const lamp = "#92d9d3";

export function drawOrbitalLift(scene: Scene, build: BuildPart, at: Point, yaw: number): (time: number) => void {
    liftTerminal(build, at, yaw);
    const hub = addTransferRing(build, at, yaw);
    addMast(build, at, yaw, hub);
    const root = new TransformNode("orbital lift moving car", scene);
    root.position.set(at.x, at.y + 16, at.z);
    root.rotation.y = yaw;
    const ceramic = material(scene, "orbital lift car ceramic", "#e4d6b5");
    ceramic.diffuseTexture = surfaceTexture(scene, "ceramic plating");
    const glass = material(scene, "orbital lift windows", "#537b89");
    glass.emissiveColor.set(0.06, 0.11, 0.14);
    const beam = material(scene, "lift guide strips", lamp);
    beam.emissiveColor.set(0.27, 0.47, 0.44);
    const mesh = new ActorMeshes(scene, root);
    mesh.hull("elevator cabin", [6.8, 5.0, 5.35], [0, 0, 0], ceramic);
    mesh.hull("elevator panoramic glass", [6.9, 1.74, 5.46], [0, 0.4, 0], glass);
    for (const side of [-1, 1]) {
        mesh.box("lit cabin guides", [0.33, 3.82, 4.11], [side * 3.37, 0.02, 0], beam);
    }
    return time => {
        root.position.y = at.y + 16 + (1 - Math.cos(time * 0.115)) * 29;
    };
}

function liftTerminal(build: BuildPart, at: Point, yaw: number): void {
    build("elevator launch plinth", { ...at, y: at.y - 0.77, sx: 37.8, sy: 5.9, sz: 31.8, yaw }, rust, "oval");
    build("elevator terminal ring", { ...at, y: at.y + 3.42, sx: 28.6, sy: 3.8, sz: 25.1, yaw }, steel, "oval");
    build("garden glass", { ...at, y: at.y + 4.13, sx: 29.0, sy: 1.87, sz: 25.6, yaw }, "#78aca9", "oval");
    build("elevator station roof", { ...at, y: at.y + 5.59, sx: 31.1, sy: 1.25, sz: 26.2, yaw }, ivory, "oval");
    for (const side of [-1, 1]) {
        const fin = offset(at, yaw, side * 13.4, 0);
        build("entry lantern", { ...fin, y: at.y + 5.88, sx: 2.4, sy: 0.34, sz: 14.8, yaw }, lamp);
        for (const end of [-1, 1]) {
            const foot = offset(at, yaw, side * 10.8, end * 10.5);
            const shoulder = offset(at, yaw, side * 4.8, end * 4.2);
            beam(build, "lift buttress", { ...foot, y: at.y + 1.4 }, { ...shoulder, y: at.y + 33 }, 2.25, 2.14, ivory);
        }
    }
}

function addMast(build: BuildPart, at: Point, yaw: number, hub: Point): void {
    for (const side of [-1, 1]) {
        const rail = offset(at, yaw, side * 3.92, 0);
        const tether = offset(at, yaw, side * 1.6, 0);
        build("elevator lift rail", { ...rail, y: at.y + 57.5, sx: 1.44, sy: 104, sz: 1.5, yaw }, steel);
        build("lit lift rail", { ...rail, y: at.y + 59.5, sx: 0.40, sy: 100, sz: 1.58, yaw }, lamp);
        build("orbital tethers", { ...tether, y: at.y + 243, sx: 0.59, sy: 386, sz: 0.63, yaw }, ivory, "oval");
        const top = offset(hub, yaw, side * 1.62, 0);
        beam(build, "outgoing tether brace", { ...rail, y: at.y + 107 }, { ...top, y: at.y + 123 }, 1.19, 1.32, rust);
    }
    for (let level = 1; level <= 7; level++) {
        const y = at.y + 13 + level * 12.7;
        const left = { ...offset(at, yaw, -3.9, 3.3), y };
        const right = { ...offset(at, yaw, 3.9, 3.3), y };
        beam(build, "lift truss tie", left, right, 1.32, 0.75, ivory);
        if (level < 7) {
            const low = level % 2 ? left : right;
            const high = level % 2 ? right : left;
            beam(build, "diagonal lift truss", low, { ...high, y: y + 12.7 }, 0.64, 0.82, rust);
        }
    }
}

function addTransferRing(build: BuildPart, foot: Point, yaw: number): Point {
    const count = 36;
    const hub = { ...foot, y: foot.y + 74 };
    const ringPoint = (radius: number, index: number, level = 0): Point => {
        const angle = index * Math.PI * 2 / count;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return { x: hub.x + x, y: hub.y + z * 0.30 - x * 0.12 + level, z: hub.z + z };
    };
    for (let i = 0; i < count; i++) {
        const a = ringPoint(58, i);
        const b = ringPoint(58, i + 1);
        const inner = ringPoint(47, i);
        const color = i % 6 < 2 ? rust : ivory;
        beam(build, "orbital ring outer armor", a, b, 3.9, 2.1, color);
        beam(build, "orbital ring underside", ringPoint(57, i, -3.7), ringPoint(57, i + 1, -3.7), 2.65, 1.15, steel);
        beam(build, "orbital ring inner walkway", inner, ringPoint(47, i + 1), 2.36, 1.57, steel);
        if (i % 2 === 0) {
            beam(build, "orbital ring radial brace", inner, a, 1.43, 0.92, ivory);
            beam(build, "orbital ring web", a, ringPoint(57, i + 1, -3.7), 0.8, 0.74, color);
        }
        if (i % 6 !== 0) continue;
        const lowerHub = { ...hub, y: hub.y - 16 };
        beam(build, "orbital ring tension support", lowerHub, inner, 0.91, 1.14, rust);
        beam(build, "orbital ring illuminated section", ringPoint(59.65, i, -0.91), ringPoint(59.65, i + 2, -0.91),
            0.51, 0.53, lamp);
        const solar = ringPoint(52, i + 1, 0.53);
        build("solar cells", { ...solar, sx: 7.8, sy: 0.33, sz: 11.2, yaw: i * Math.PI * 2 / count, pitch: 0.2 }, "#4b6688");
    }
    build("orbital ring hub", { ...hub, sx: 18.4, sy: 5.1, sz: 18.4, yaw }, ivory, "oval");
    build("garden glass", { ...hub, y: hub.y + 2.61, sx: 16.4, sy: 1.3, sz: 16.4, yaw }, "#76aeb8", "oval");
    return hub;
}

function beam(build: BuildPart, name: string, a: Point, b: Point, width: number, height: number, color: string): void {
    build(name, beamBetween(a, b, width, height, 0.21), color);
}
