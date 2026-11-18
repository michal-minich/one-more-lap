import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { bladeCenters, gateClearance, gateSites, stuntBladeHeight, stuntGateThickness, stuntGateWidth } from "../../../game/course/stunt/gate.ts";
import { stuntLoopHalf, stuntLoopZ, sweep } from "../../../game/course/stunt/loop.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { RouteSample } from "../../../game/course/route.ts";
import type { StuntLoop } from "../../../game/course/stunt/loop.ts";
import { material } from "../../materials.ts";
import { beamBetween } from "../beam.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { stamp } from "../instances.ts";
import { drawParkRides } from "./attractions.ts";
import { drawMidway } from "./midway.ts";
import { drawGrandstands } from "./grandstands.ts";
import { drawSkywheelGrounds } from "./grounds.ts";

export function drawStuntPark(scene: Scene, course: Course) {
    const parts = new UrbanParts(scene);
    const road = material(scene, "gritted stunt track", "#e4c4aa");
    road.diffuseTexture = surfaceTexture(scene, "skywheel asphalt", 1.6);
    road.backFaceCulling = false;
    const cream = material(scene, "cream painted loop edging", "#ffe0ac");
    cream.diffuseTexture = surfaceTexture(scene, "skywheel enamel");
    cream.backFaceCulling = false;
    const steel = material(scene, "coated stunt deck", "#a44b4a");
    steel.diffuseTexture = surfaceTexture(scene, "skywheel enamel");
    steel.backFaceCulling = false;
    const cast: Mesh[] = [];
    for (const loop of course.stuntLoops) {
        const paint = loop.direction === "forward" ? steel : steel.clone("blue coated stunt deck");
        if (paint !== steel) paint.diffuseColor.set(0.24, 0.48, 0.64);
        cast.push(surface(scene, "loop drive surface", loop.road, road));
        surface(scene, "painted loop fascia", loop.deck, paint);
        surface(scene, "painted loop handrails", loop.rails, paint);
        for (const side of [-1, 1]) {
            const x = side * (stuntLoopHalf - 0.27);
            surface(scene, "cream loop stripe", sweep(loop.rows, [[x - 0.065, 0.026], [x + 0.065, 0.026]]), cream);
        }
        supports(parts.add, course, loop);
        directions(scene, parts.add, loop);
    }
    const gates = gateSites(course).map(site => drawGate(scene, parts.add, site));
    const wheel = drawMidway(scene, parts.add, course);
    const carousel = drawParkRides(scene, course);
    drawGrandstands(parts.add, course);
    if (course.skywheelGrounds) cast.push(...drawSkywheelGrounds(scene, parts.add, course.skywheelGrounds));
    const structures = parts.draw();
    cast.push(...structures.filter(mesh => mesh.name === "stunt girder" || mesh.name === "stunt footing" ||
        mesh.name === "grandstand roof" || mesh.name === "grandstand foundation" ||
        mesh.name === "Skywheel catwalk structure" || mesh.name === "Skywheel stone pier"));
    return { shadowCasters: cast, animate: (time: number) => {
        for (const gate of gates) gate(time);
        wheel(time);
        carousel(time);
    } };
}

function supports(build: BuildPart, course: Course, loop: StuntLoop): void {
    const tint = loop.direction === "forward" ? "#aa5049" : "#4f8aa1";
    const side = loop.direction === "forward" ? 1 : -1;
    for (const [index, row] of loop.rows.entries()) {
        const previous = loop.rows[index - 5];
        if (index % 5 || !previous || row.y < 10.5 || previous.y < 10.5) continue;
        const fascia = (point: typeof row, edge: number) => ({ ...point, x: point.x + edge * 3.47, y: point.y - 0.13 });
        for (const edge of [-1, 1]) {
            build("stunt enamel trim", beamBetween(fascia(previous, edge), fascia(row, edge), 0.18, 0.16, 0.1),
                loop.direction === "forward" ? "#e3b77b" : "#a8d3cc");
        }
    }
    for (const [index, row] of loop.rows.entries()) {
        if (row.y < 10.6 || index % 20 !== 0) continue;
        const x = row.x + side * 4.4;
        const y = course.ground.at(x, row.z) ?? 8;
        const top = { x, y: row.y - 0.25, z: row.z };
        const foot = { x: x + side * 2, y: y - 0.25, z: row.z };
        build("stunt footing", { ...foot, sx: 1.42, sy: 0.64, sz: 1.22, yaw: 0 }, "#aaa192");
        build("stunt girder", beamBetween(foot, top, 0.21, 0.32, 0.11), tint);
        build("stunt girder", beamBetween(top, { ...row, x: row.x + side * 3.21, y: row.y - 0.18 },
            0.19, 0.30, 0.14), tint);
    }
    for (const z of [stuntLoopZ - 14.5, stuntLoopZ + 14.5]) {
        const x = loop.mouth.x + side * 7.4;
        const ground = course.ground.at(x, z) ?? 8;
        const foot = { x, y: ground, z };
        const crown = { x: loop.mouth.x + side * 4.4, y: loop.exit.y + 23, z: stuntLoopZ };
        build("stunt girder", beamBetween(foot, crown, 0.64, 0.66, 0.4), tint);
    }
}

function directions(scene: Scene, build: BuildPart, loop: StuntLoop): void {
    const sign = loop.direction === "forward" ? 1 : -1;
    const center = loop.rows.find(row => (row.z - stuntLoopZ) * sign > -142)!;
    const arrow = MeshBuilder.CreateBox("stunt runway arrow", { size: 1 }, scene);
    const paint = material(scene, "stunt runway stripe", sign > 0 ? "#edc479" : "#b4d9df");
    paint.diffuseTexture = surfaceTexture(scene, "skywheel enamel");
    arrow.material = paint;
    const startZ = stuntLoopZ - sign * 82;
    const marks = [0, 9, 18].flatMap(advance => [-1, 1].map(side => ({
        x: loop.mouth.x + side * sign * 0.49, y: loop.mouth.y + 0.03, z: startZ + sign * (advance + 0.52),
        sx: 0.19, sy: 0.035, sz: 1.44, yaw: (sign < 0 ? Math.PI : 0) - side * 0.70,
    })));
    const turnout = [13, 24, 36].flatMap(index => {
        const row = loop.rows[index]!;
        const next = loop.rows[index + 1]!;
        const yaw = Math.atan2(-row.nz, row.nx);
        const pitch = -Math.atan2(next.y - row.y, Math.hypot(next.x - row.x, next.z - row.z));
        return [-1, 1].map(side => ({
            ...row, x: row.x + side * row.nx * 0.49, y: row.y + 0.042, z: row.z + side * row.nz * 0.49,
            sx: 0.20, sy: 0.022, sz: 1.44, yaw: yaw - side * 0.70, pitch,
        }));
    });
    stamp(arrow, [...marks, ...turnout]);
    const at = { x: center.x + sign * 3.7, y: center.y + 2.3, z: center.z };
    build("stunt girder", { ...at, y: at.y - 0.93, sx: 0.12, sy: 3.25, sz: 0.13, yaw: 0 }, "#435466");
    const signboard = MeshBuilder.CreatePlane("stunt runway direction sign", { width: 2.1, height: 1.35 }, scene);
    signboard.position.set(at.x, at.y, at.z);
    signboard.rotation.y = sign > 0 ? 0 : Math.PI;
    signboard.isPickable = false;
    const board = material(scene, "stunt direction enamel", "#ffffff");
    const face = new DynamicTexture("stunt entrance loop pictogram", { width: 256, height: 160 }, scene, true);
    const brush = face.getContext();
    brush.fillStyle = loop.direction === "forward" ? "#8f4a49" : "#426b82";
    brush.fillRect(0, 0, 256, 160);
    brush.lineWidth = 10;
    brush.strokeStyle = "#f2ce8a";
    brush.strokeRect(8, 8, 240, 144);
    brush.beginPath();
    brush.moveTo(44, 112);
    brush.lineTo(145, 112);
    brush.arc(124, 75, 35, Math.PI / 2, Math.PI * 2.5);
    brush.lineTo(207, 111);
    brush.lineTo(185, 93);
    brush.moveTo(207, 111);
    brush.lineTo(185, 129);
    brush.stroke();
    face.update(true);
    board.diffuseTexture = face;
    signboard.material = board;
}

function drawGate(scene: Scene, build: BuildPart, at: RouteSample): (time: number) => void {
    const yaw = Math.atan2(at.dx, at.dz);
    for (const side of [-1, 1]) {
        const post = pointOnRoute(at, side * (stuntGateWidth / 2 + 0.42), 2.1);
        build("stunt girder", { ...post, sx: 0.63, sy: 5.35, sz: 0.86, yaw }, "#50476b");
        build("stunt footing", { ...post, y: at.y - 0.24, sx: 1.15, sy: 0.55, sz: 1.44, yaw }, "#ab9f83");
    }
    build("stunt girder", { ...at, y: at.y + 4.9, sx: stuntGateWidth + 1.5, sy: 0.6, sz: 0.91, yaw }, "#50476b");
    const warning = material(scene, "stunt gate warning light", "#f2ad5a");
    const bulbs = [-1, 0, 1].map(side => {
        const bulb = MeshBuilder.CreateSphere("stunt gate warning bulb", { diameter: 0.35, segments: 8 }, scene);
        bulb.material = warning;
        const lamp = pointOnRoute(at, side * 0.64, 4.93);
        bulb.position.set(lamp.x - at.dx * 0.49, lamp.y, lamp.z - at.dz * 0.49);
        return bulb;
    });
    const enamel = surfaceTexture(scene, "skywheel enamel");
    const gold = material(scene, "padded blade yellow", "#efae52");
    const red = material(scene, "padded blade red", "#a34354");
    gold.diffuseTexture = red.diffuseTexture = enamel;
    const blades = [0, 1].map((_, index) => {
        const root = new TransformNode("timed stunt blade", scene);
        root.position.set(at.x, at.y, at.z);
        root.rotation.y = yaw;
        const mesh = new ActorMeshes(scene, root);
        mesh.box("padded crossbar", [stuntGateWidth, stuntBladeHeight * 0.62, stuntGateThickness], [0, 0, 0], red);
        for (let tooth = 0; tooth < 5; tooth++) {
            const x = (tooth - 2) * 0.70;
            mesh.hull("rounded blade tooth", [0.59, 0.5, 0.63], [x, index === 0 ? -0.33 : 0.33, 0], gold);
        }
        return root;
    });
    return time => {
        const open = gateClearance(time);
        warning.emissiveColor.set(1 - open * 0.95, 0.15 + open * 0.83, 0.05 + open * 0.25);
        bulbs[1]!.scaling.setAll(0.85 + 0.15 * Math.sin(time * 8));
        for (const [index, y] of bladeCenters(at.y, time).entries()) blades[index]!.position.y = y;
    };
}
