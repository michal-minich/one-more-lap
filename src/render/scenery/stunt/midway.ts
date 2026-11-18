import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { material } from "../../materials.ts";
import { beamBetween } from "../beam.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { drawAnimatedLandmark } from "../landmark-models/biome-models.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawMidway(scene: Scene, build: BuildPart, course: Course): (time: number) => void {
    for (const [x, z, tint] of [[-41, 168, "#a95849"], [47, 184, "#437c84"], [57, 204, "#b26955"],
        [-50, 321, "#597987"], [48, 336, "#8d5669"]] as const) {
        const y = course.ground.at(x, z) ?? 9;
        const at = { x, y, z };
        build("station paving", { ...at, y: y - 0.12, sx: 9.5, sy: 0.53, sz: 7.9, yaw: 0 }, "#bda98a");
        build("weathered timber", { ...at, y: y + 1.59, sx: 7.9, sy: 3.33, sz: 6.28, yaw: 0 }, tint);
        build("Skywheel midway roof", { ...at, y: y + 3.25, sx: 9.15, sy: 2.2, sz: 7.74, yaw: 0 }, "#5a6259");
        build("window frame", { ...at, y: y + 1.89, z: z - 3.17, sx: 4.25, sy: 1.9, sz: 0.12, yaw: 0 }, "#d8c4a0");
        build("lit windows", { ...at, y: y + 1.89, z: z - 3.25, sx: 3.86, sy: 1.54, sz: 0.12, yaw: 0 }, "#c7a97d");
        for (let stripe = 0; stripe < 9; stripe++) {
            build("striped awning canvas", { ...at, x: x + (stripe - 4) * 0.52, y: y + 2.88, z: z - 3.95,
                sx: 0.55, sy: 0.10, sz: 2.1, yaw: 0, pitch: -0.23 }, stripe % 2 ? "#ede0b5" : tint);
        }
    }
    for (const z of [118, 136, 154, 174, 194, 215, 287, 308, 330, 352, 373]) {
        for (const side of [-1, 1]) {
            const x = side * 35;
            const y = course.ground.at(x, z) ?? 9;
            build("station canopy post", { x, y: y + 1.5, z, sx: 0.13, sy: 3.4, sz: 0.13, yaw: 0 }, "#53685b");
            build("hall lantern", { x, y: y + 3.16, z, sx: 0.34, sy: 0.29, sz: 0.34, yaw: 0 }, "#e3b580", "oval");
        }
    }
    return ferrisWheel(scene, build, course);
}

function ferrisWheel(scene: Scene, build: BuildPart, course: Course): (time: number) => void {
    const pad = course.skywheelGrounds!.wheelPad;
    const { yaw, width, depth, height } = pad;
    const base = { ...pad, y: pad.y + height / 2 };
    build("Skywheel wheel podium", { ...pad, sx: width, sy: height, sz: depth }, "#c8b18b");
    build("Skywheel wheel coping", { ...base, y: base.y - 0.14, sx: width + 0.08, sy: 0.25, sz: depth + 0.08 },
        "#e8d5a5");
    const mount = new TransformNode("Skywheel Ferris wheel pier", scene);
    mount.position.set(base.x, base.y, base.z);
    mount.rotation.y = yaw;
    for (const side of [-1, 1]) {
        for (const leg of [-1, 1]) {
            const foot = offset(base, yaw, side * 6.1, leg * 6.65);
            const head = offset({ ...base, y: base.y + 19.9 }, yaw, side * 2.45, 0);
            build("Skywheel wheel coping", { ...foot, y: base.y + 0.35, sx: 2.65, sy: 0.71, sz: 2.6, yaw },
                "#ccb48c");
            build("stunt girder", beamBetween({ ...foot, y: foot.y + 0.41 }, head, 0.93, 1.10), "#377775");
            const brace = offset({ ...base, y: base.y + 5.35 }, yaw, side * 4.95, 0);
            build("Skywheel wheel brass", beamBetween(foot, brace, 0.23, 0.31, 0.27), "#c98d52");
        }
    }
    const root = new TransformNode("slow turning Ferris wheel", scene);
    root.parent = mount;
    root.position.y = 20;
    const metal = material(scene, "painted wheel steel", "#568887");
    metal.diffuseTexture = surfaceTexture(scene, "skywheel enamel");
    const cream = material(scene, "painted wheel cream", "#eed0a0");
    cream.diffuseTexture = surfaceTexture(scene, "skywheel enamel");
    const brass = material(scene, "wheel brass fittings", "#c99553");
    brass.specularColor.set(0.27, 0.21, 0.12);
    for (const side of [-1, 1]) {
        const ring = MeshBuilder.CreateTorus("Ferris wheel rim", { diameter: 33, thickness: 0.37, tessellation: 72 }, scene);
        ring.parent = root;
        ring.rotation.z = Math.PI / 2;
        ring.position.x = side * 1.75;
        ring.material = metal;
        const trim = MeshBuilder.CreateTorus("Ferris wheel brass rim",
            { diameter: 32.94, thickness: 0.12, tessellation: 72 }, scene);
        trim.parent = root;
        trim.rotation.z = Math.PI / 2;
        trim.position.x = side * 1.96;
        trim.material = brass;
    }
    const mesh = new ActorMeshes(scene, root);
    mesh.oval("wheel axle housing", [5.8, 2.5, 2.5], [0, 0, 0], metal);
    mesh.oval("wheel axle brass cap", [6.22, 1.81, 1.81], [0, 0, 0], brass);
    const shell = drawAnimatedLandmark(scene, "skywheel-gondola");
    shell.name = "Skywheel Ferris gondola source";
    shell.setEnabled(false);
    const cabinHeight = 3.35;
    const gondolas = Array.from({ length: 10 }, (_, index) => {
        const angle = Math.PI * 2 * index / 10;
        const y = 16.25 * Math.cos(angle);
        const z = 16.25 * Math.sin(angle);
        for (const side of [-1, 1]) {
            const spoke = mesh.box("painted Ferris spoke", [0.18, 16.8, 0.26],
                [side * 1.74, y * 0.5, z * 0.5], index % 2 ? metal : cream);
            spoke.rotation.x = angle;
        }
        mesh.box("Ferris wheel cross pin", [3.65, 0.16, 0.16], [0, y, z], brass);
        const cabin = new TransformNode("wheel gondola", scene);
        cabin.parent = root;
        cabin.position.set(0, y, z);
        const cab = shell.clone("Skywheel rotating gondola", cabin, true)!;
        cab.scaling.setAll(cabinHeight);
        cab.rotation.y = Math.PI / 2;
        cab.position.set(cabinHeight * 0.106, -cabinHeight * 0.948, 0);
        cab.setEnabled(true);
        cab.receiveShadows = true;
        return cabin;
    });
    return time => {
        const turn = time * 0.065 + 0.15;
        root.rotation.x = turn;
        for (const gondola of gondolas) gondola.rotation.x = -turn;
    };
}
