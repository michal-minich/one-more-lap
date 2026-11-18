import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { outsidePoint, smoothBetween } from "../../../game/course/terrain-profile.ts";
import type { Point } from "../../../game/point.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

export function drawCopperCascade(scene: Scene, course: Course): (time: number, daylight: number) => void {
    const river = course.water.find(body => body.kind === "river")!;
    const rock = course.at(531);
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const stone = (reach: number): Point => outsidePoint(course.track, course.center, rock, reach);

    const highBank = 204;
    const lowBank = 151;
    const run = highBank - lowBank;
    const crown = stone(highBank);
    const base = stone(lowBank);
    const dx = (crown.x - base.x) / run;
    const dz = (crown.z - base.z) / run;
    for (let i = 0; i <= 36; i++) {
        const down = i / 36;
        const reach = highBank - run * down;
        const point = stone(reach);
        const span = 2.9 + down * 3.4 + Math.sin(down * 16.3) * 0.64;
        const drift = Math.sin(down * 8.1) * 2.65 + Math.sin(down * 21) * 0.6;
        for (const [side, alpha] of [[-1, 0], [-0.48, 0.83], [0.15, 0.96], [0.65, 0.57], [1, 0]] as const) {
            const x = point.x - dz * (drift + side * span);
            const z = point.z + dx * (drift + side * span);
            const bed = course.ground.at(x, z) ?? point.y;
            const y = Math.max(river.center.y + 0.04, bed + 0.38 + (1 - Math.abs(side)) * 0.3);
            positions.push(x, y, z);
            uv.push((side + 1) / 2, -down * 4.5 + side * 0.19);
            const strength = 0.88 + 0.12 * Math.sin(down * 18 + side * 12);
            const fade = smoothBetween(0, 0.09, down) * (1 - smoothBetween(0.87, 1, down));
            colors.push(strength, strength, strength, alpha * fade);
        }
        if (i === 0) continue;
        for (let side = 0; side < 4; side++) {
            const a = (i - 1) * 5 + side;
            indices.push(a, a + 5, a + 1, a + 1, a + 5, a + 6);
        }
    }

    const whitewater = material(scene, "Copper cascade whitewater", "#d5f5f4");
    const film = surfaceTexture(scene, "whitewater", 1.1, 0.85);
    whitewater.diffuseTexture = film;
    const reflectedLight = Color3.FromHexString("#a3c9cb");
    whitewater.ambientColor.copyFrom(reflectedLight);
    whitewater.backFaceCulling = false;
    whitewater.specularColor.set(0.21, 0.36, 0.39);
    const waterfall = surface(scene, "Copper Gorge cascade", {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
    }, whitewater, () => new Float32Array(colors));
    waterfall.hasVertexAlpha = true;
    waterfall.receiveShadows = false;
    const foot = stone(165);
    drawPlungeFoam(scene, course, river.center.y, foot, dx, dz, whitewater);
    return (time, daylight) => {
        film.vOffset = time * 0.61 % 1;
        whitewater.emissiveColor.set(daylight * 0.75, daylight * 0.74, daylight * 0.69);
    };
}

function drawPlungeFoam(
    scene: Scene, course: Course, waterline: number, foot: Point, dx: number, dz: number, paint: StandardMaterial,
): void {
    // Begin at the actual intersection between the channel and the waterfall.
    let x = foot.x;
    let z = foot.z;
    for (let step = 0; step < 22; step++) {
        if ((course.ground.at(x, z) ?? waterline) < waterline) break;
        x -= dx * 0.8;
        z -= dz * 0.8;
    }
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const sections = 24;
    for (let i = 0; i <= sections; i++) {
        const t = i / sections;
        const stretch = 2.6 + 3.8 * Math.sin(t * Math.PI / 2);
        const distance = 1.4 + t * 14.9;
        for (const [side, strength] of [[-1, 0], [-0.38, 0.7], [0.18, 1], [0.69, 0.54], [1, 0]] as const) {
            const lateral = side * stretch + Math.sin(t * 4.3) * 2.7;
            positions.push(x - dx * distance - dz * lateral, waterline + 0.039, z - dz * distance + dx * lateral);
            uv.push(side * 0.64 + t * 0.23, t * 2.4);
            const alpha = strength * (1 - smoothBetween(0.05, 1, t)) * (0.67 + 0.18 * Math.cos(t * 32 + side * 3));
            colors.push(0.84, 0.96, 0.98, alpha);
        }
        if (i === 0) continue;
        for (let edge = 0; edge < 4; edge++) {
            const a = (i - 1) * 5 + edge;
            indices.push(a, a + 5, a + 1, a + 1, a + 5, a + 6);
        }
    }
    const foam = surface(scene, "Copper cascade plunge foam", {
        positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv),
    }, paint, () => new Float32Array(colors));
    foam.hasVertexAlpha = true;
    foam.receiveShadows = false;
}
