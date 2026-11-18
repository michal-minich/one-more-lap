import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { forestMillSize } from "../../../game/course/forest-mill.ts";
import type { ForestMill } from "../../../game/course/forest-mill.ts";
import { material } from "../../materials.ts";
import { beamBetween } from "../beam.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { offset, UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

const slate = "#5d697b";
const wood = "#d09868";
const darkWood = "#4d3a2a";

export function drawForestMill(scene: Scene, mill: ForestMill): (time: number) => void {
    const parts = new UrbanParts(scene);
    drawMillHouse(parts.add, mill);
    const flow = drawMillrace(scene, parts.add, mill);
    parts.draw();
    const wheel = drawWheel(scene, mill);
    return (time: number): void => {
        wheel.rotation.z = -time * 0.67;
        flow(time);
    };
}

function drawMillHouse(build: BuildPart, { position, yaw, footing }: ForestMill): void {
    const { width, depth, height } = forestMillSize;
    const wallBase = position.y + 0.55;
    build("woodland mill footing", { ...position, y: (wallBase + footing) / 2, sx: width,
        sy: wallBase - footing, sz: depth, yaw }, "#abb4b9");
    build("woodland mill siding", { ...position, y: (position.y + height + wallBase) / 2,
        sx: width, sy: height - 0.55, sz: depth, yaw }, wood);
    build("woodland mill roof", { ...position, y: position.y + height - 0.12, sx: width + 0.7, sy: 2.35,
        sz: depth + 0.82, yaw }, slate);
    const chimney = offset(position, yaw, -2.1, -1.67);
    build("stone footing", { ...chimney, y: position.y + 5.7, sx: 0.82, sy: 2.7, sz: 0.9, yaw }, "#777366");
    for (const side of [-1, 1]) {
        const front = side * (depth / 2 + 0.065);
        for (const x of [-2.62, 2.52]) {
            const glazing = offset(position, yaw, x, front);
            build("window frame", { ...glazing, y: position.y + 2.83, sx: 1.45, sy: 1.54, sz: 0.23, yaw }, darkWood);
            const panes = offset(position, yaw, x, front + side * 0.12);
            build("lit windows", { ...panes, y: position.y + 2.83, sx: 1.16, sy: 1.18, sz: 0.09, yaw }, "#dca86c");
            build("window frame", { ...panes, y: position.y + 2.83, sx: 0.11, sy: 1.28, sz: 0.13, yaw }, darkWood);
        }
        const door = offset(position, yaw, 0, front);
        build("mill door", { ...door, y: position.y + 1.44, sx: 1.6, sy: 2.35, sz: 0.24, yaw }, darkWood);
    }
}

function drawMillrace(scene: Scene, build: BuildPart, { position, wheel, yaw }: ForestMill): (time: number) => void {
    const entry = offset(position, yaw, forestMillSize.width / 2 - 0.06, 0);
    const lip = offset(wheel, yaw, -1.48, 0);
    const start = { ...entry, y: wheel.y + 2.48 };
    const end = { ...lip, y: wheel.y + 1.78 };
    build("timber race channel", beamBetween(start, end, 1.17, 0.22), wood);
    for (const z of [-0.59, 0.59]) {
        const sideA = offset({ ...start, y: start.y + 0.21 }, yaw, 0, z);
        const sideB = offset({ ...end, y: end.y + 0.21 }, yaw, 0, z);
        build("channel rails", beamBetween(sideA, sideB, 0.14, 0.36), darkWood);
    }
    for (const fraction of [0.32, 0.67]) {
        const at = {
            x: start.x + (end.x - start.x) * fraction,
            y: start.y + (end.y - start.y) * fraction - 0.18,
            z: start.z + (end.z - start.z) * fraction,
        };
        const low = wheel.y - 4.0;
        const height = at.y - low;
        for (const side of [-1, 1]) {
            const leg = offset(at, yaw, 0, side * 0.78);
            build("flume posts", { ...leg, y: low + height / 2, sx: 0.28, sy: height, sz: 0.28, yaw }, darkWood);
            const foot = offset({ ...at, y: low + 2.1 }, yaw, 0, -side * 0.78);
            build("flume braces", beamBetween(leg, foot, 0.15, 0.15), wood);
        }
    }
    for (const z of [-1.05, 1.05]) {
        const post = offset(wheel, yaw, 0, z);
        build("wheel bearing", { ...post, y: wheel.y - 1.58, sx: 0.74, sy: 3.52, sz: 0.6, yaw }, slate);
    }

    const paint = material(scene, "Blackwood millrace flow", "#81c6c8");
    const film = surfaceTexture(scene, "whitewater", 1, 0.41);
    paint.diffuseTexture = film;
    paint.specularColor.set(0.31, 0.46, 0.51);
    paint.backFaceCulling = false;
    const exit = offset({ ...end, y: wheel.y + 0.65 }, yaw, 0.27, 0);
    const rows = [{ ...start, y: start.y + 0.15 }, { ...end, y: end.y + 0.15 }, exit];
    const positions = rows.flatMap(point => [-0.43, 0.43].flatMap(side => {
        const at = offset(point, yaw, 0, side);
        return [at.x, at.y, at.z];
    }));
    surface(scene, "Blackwood millrace whitewater", {
        positions: new Float32Array(positions),
        uv: new Float32Array([0, 0, 1, 0, 0, 7, 1, 7, 0, 7.6, 1, 7.6]),
        indices: new Uint32Array([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]),
    }, paint);
    return time => { film.vOffset = time * 0.48 % 1; };
}

function drawWheel(scene: Scene, { wheel, yaw }: ForestMill): TransformNode {
    const frame = new TransformNode("Blackwood mill bearing", scene);
    frame.position.set(wheel.x, wheel.y, wheel.z);
    frame.rotation.y = yaw;
    const rotor = new TransformNode("Blackwood waterwheel rotor", scene);
    rotor.parent = frame;
    const rim = material(scene, "waterwheel rim", darkWood);
    const paddle = material(scene, "waterwheel oak paddles", "#a1794f");
    rim.diffuseTexture = paddle.diffuseTexture = surfaceTexture(scene, "sawn cedar");
    const meshes = new ActorMeshes(scene, rotor);
    const radius = forestMillSize.wheelRadius;
    for (const z of [-0.63, 0.63]) {
        const ring = MeshBuilder.CreateTorus("oak rim", { diameter: (radius - 0.16) * 2, thickness: 0.27, tessellation: 28 }, scene);
        ring.parent = rotor;
        ring.position.z = z;
        ring.rotation.x = Math.PI / 2;
        ring.material = rim;
        ring.isPickable = false;
    }
    meshes.box("wheel axle", [0.43, 0.43, 2.46], [0, 0, 0], rim);
    for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        const slat = radius - 0.27;
        meshes.box("paddle blade", [0.46, 0.16, 1.42], [x * slat, y * slat, 0], paddle).rotation.z = angle;
        if (i % 2 === 0) {
            for (const z of [-0.63, 0.63]) {
                meshes.box("radial spoke", [radius - 0.14, 0.17, 0.20], [x * 1.14, y * 1.14, z], paddle).rotation.z = angle;
            }
        }
    }
    return rotor;
}
