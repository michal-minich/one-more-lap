import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { PointLight } from "@babylonjs/core/Lights/pointLight.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Point } from "../../../game/point.ts";
import type { Course } from "../../../game/course/course.ts";
import { forestBridgeSize } from "../../../game/course/forest-bridge.ts";
import type { ForestBridge } from "../../../game/course/forest-bridge.ts";
import { pointOnRoute, ROAD_HALF } from "../../../game/course/route.ts";
import { strip } from "../../../game/course/surface.ts";
import { material } from "../../materials.ts";
import { beamBetween } from "../beam.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";

const cedar = "#d49b6d";
const raisedTrim = "#deaa79";
const darkCedar = "#956440";
const { clearance, posts, roofEdge, ridge, plinthWidth } = forestBridgeSize;

export function drawForestBridge(scene: Scene, course: Course, bridge: ForestBridge): Mesh[] {
    const parts = new UrbanParts(scene);
    const roofPaint = material(scene, "Blackwood slate roof", "#7b879b");
    roofPaint.diffuseTexture = surfaceTexture(scene, "woodland slate", 1.24, 1.78);
    roofPaint.specularColor.set(0.11, 0.13, 0.16);

    const roof = surface(scene, "Blackwood covered bridge roof", bridge.roof, roofPaint);
    const interior = material(scene, "Blackwood cedar roof lining", "#805343");
    interior.diffuseTexture = surfaceTexture(scene, "sawn cedar", 1.1, 0.83);
    surface(scene, "Blackwood roof cedar lining", {
        ...bridge.roof, positions: bridge.roof.positions.map((value, i) => i % 3 === 1 ? value - 0.09 : value),
        indices: bridge.roof.indices.slice().reverse(),
    }, interior);

    for (const support of bridge.supports) {
        const { y, base, cap, yaw } = support;
        parts.add("woodland bridge plinth", { ...support, y: (cap + base) / 2,
            sx: plinthWidth, sy: cap - base, sz: 2, yaw }, "#bbc3c6");
        parts.add("woodland bridge beams", { ...support, y: (cap + y + clearance) / 2,
            sx: 0.74, sy: y + clearance - cap, sz: 0.8, yaw }, cedar);
        parts.add("woodland bridge trim", { ...support, y: cap + 0.05,
            sx: 1.28, sy: 0.24, sz: 1.3, yaw }, darkCedar);
    }
    for (const distance of bridge.frames) {
        const row = course.at(distance);
        const outer = distance === bridge.frames[0] || distance === bridge.frames.at(-1);
        const strutWidth = outer ? 0.71 : 0.52;
        const peak = pointOnRoute(row, 0, ridge - 0.1);
        const rafter = (side: number): Point =>
            pointOnRoute(row, side * (roofEdge + 0.14), clearance + 0.37);
        parts.add("woodland bridge truss", beamBetween(
            pointOnRoute(row, -posts, clearance - 0.03), pointOnRoute(row, posts, clearance - 0.03),
            strutWidth, outer ? 0.66 : 0.48, 0.31), cedar);
        parts.add("woodland bridge trim", beamBetween(pointOnRoute(row, 0, clearance), peak, 0.46, 0.48), raisedTrim);
        for (const side of [-1, 1]) {
            parts.add("woodland bridge beams", beamBetween(rafter(side), peak, strutWidth, 0.37, 0.2), raisedTrim);
            parts.add("woodland bridge truss", beamBetween(
                pointOnRoute(row, posts * side, clearance - 2.18),
                pointOnRoute(row, (posts - 2.31) * side, clearance), 0.48, 0.49, 0.18), cedar);
            if (!outer) continue;
            const light = pointOnRoute(row, side * (posts - 0.47), 3.08);
            const yaw = Math.atan2(row.dx, row.dz);
            parts.add("woodland lantern cage", { ...light, sx: 0.28, sy: 0.52, sz: 0.29, yaw }, "#594434");
            const lens = pointOnRoute(row, side * (posts - 0.59), 3.08);
            parts.add("entry lantern", { ...lens, sx: 0.22, sy: 0.34, sz: 0.23, yaw }, "#ffcb7e");
        }
    }
    for (let i = 1; i < bridge.frames.length; i++) {
        const from = course.at(bridge.frames[i - 1]!);
        const to = course.at(bridge.frames[i]!);
        for (const offset of [-roofEdge, -roofEdge * 0.49, 0, roofEdge * 0.49, roofEdge]) {
            const height = ridge - (ridge - clearance - 0.34) * Math.abs(offset / roofEdge) - 0.17;
            parts.add("woodland bridge trim", beamBetween(pointOnRoute(from, offset, height),
                pointOnRoute(to, offset, height), 0.39, 0.28, 0.19), darkCedar);
        }
    }
    return [roof, ...parts.draw().filter(mesh => mesh.name !== "entry lantern")];
}


export function lightForestBridge(scene: Scene, course: Course, bridge: ForestBridge): (daylight: number) => void {
    const lamps = bridge.frames.map(distance => pointOnRoute(course.at(distance), -posts + 0.5, 3.1));
    const lamp = new PointLight("Blackwood covered bridge lantern light", Vector3.Zero(), scene);
    lamp.diffuse.copyFrom(Color3.FromHexString("#ed9b55"));
    lamp.specular.set(0.31, 0.18, 0.08);
    lamp.range = 13.5;
    const bandPaint = material(scene, "Blackwood cedar truss soft shade", "#151d29");
    bandPaint.disableLighting = true;
    bandPaint.emissiveColor.copyFrom(bandPaint.diffuseColor);
    bandPaint.disableDepthWrite = true;
    bandPaint.backFaceCulling = false;
    const panels = bridge.frames.map(distance => {
        const rows = [-1.25, -0.76, 0.36, 0.93].map(delta => course.at(distance + delta));
        return strip(rows, [-ROAD_HALF, ROAD_HALF], () => 0.018);
    });
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const panelShade = [0, 0.83, 0.83, 0].flatMap(alpha => [1, 1, 1, alpha, 1, 1, 1, alpha]);
    for (const panel of panels) {
        const start = positions.length / 3;
        for (const i of panel.indices) indices.push(start + i);
        positions.push(...panel.positions);
        uv.push(...panel.uv);
        colors.push(...panelShade);
    }
    const shade = surface(scene, "Blackwood cross-beam shade", {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
    }, bandPaint, () => new Float32Array(colors));
    shade.hasVertexAlpha = true;
    shade.receiveShadows = false;
    return daylight => {
        bandPaint.alpha = daylight * 0.19;
        shade.setEnabled(daylight > 0.055);
        const camera = scene.activeCamera;
        if (!camera) return;
        let distance = lamp.range;
        for (const point of lamps) {
            const reach = Math.hypot(camera.position.x - point.x, camera.position.z - point.z);
            if (reach >= distance) continue;
            distance = reach;
            lamp.position.set(point.x, point.y, point.z);
        }
        lamp.intensity = (1 - daylight * 0.58) * (1 - distance / lamp.range) ** 1.4 * 0.82;
    };
}
