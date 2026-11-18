import { Constants } from "@babylonjs/core/Engines/constants.js";
import { SpotLight } from "@babylonjs/core/Lights/spotLight.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Point } from "../../game/point.ts";
import type { Conditions } from "../../game/race/conditions.ts";
import type { Course } from "../../game/course/course.ts";
import { hallSetback } from "../../game/course/halls.ts";
import { bridgeDrop } from "../../game/course/passages.ts";
import { roadHalfWidth } from "../../game/course/road-width.ts";
import { pointOnRoute, ROAD_HALF } from "../../game/course/route.ts";
import { groundHeight } from "../../game/course/terrain-profile.ts";
import { material } from "../materials.ts";
import { stamp } from "../scenery/instances.ts";
import type { Stamp } from "../scenery/instances.ts";
import { surfaceTexture } from "../scenery/surface-textures.ts";
import { lampCone } from "./lamp-cone.ts";

interface Lamp {
    readonly bulb: Point;
    readonly color: Color3;
}

interface LampGlow {
    readonly mesh: Mesh;
    readonly material: StandardMaterial;
}

const REACH = 68;

export class StreetLights {
    readonly bulbs: Mesh[] = [];
    readonly #lamps: Lamp[] = [];
    readonly #bulbMaterials = new Map<string, StandardMaterial>();
    readonly #shafts: LampGlow[] = [];
    readonly #pools: LampGlow[] = [];
    readonly #spot?: SpotLight;
    readonly #city: boolean;

    constructor(scene: Scene, course: Course) {
        const biome = course.track.id;
        this.#city = biome === "metro" || biome === "future";
        if (!this.#city && biome !== "arctic" && biome !== "old-town" && biome !== "forest") return;
        const bellgate = biome === "old-town";
        const lanternCaps: Stamp[] = [];
        const lanternFrames: Stamp[] = [];
        const poles: Stamp[] = [];
        const arms: Stamp[] = [];
        const bases: Stamp[] = [];
        const cones = new Map<string, Stamp[]>();
        const pools = new Map<string, Stamp[]>();
        const bulbs = new Map<string, Stamp[]>();
        const step = this.#city ? 32 : bellgate ? 57 : 105;
        const height = this.#city ? 6.0 : 3.8;

        for (let distance = 22, i = 0; distance < course.length - 10; distance += step, i++) {
            if (bellgate && Math.abs(distance - (course.townGate?.row.distance ?? 0)) < 19) continue;
            if (bridgeDrop(biome, distance) > 0 || !this.#nearSettlement(distance / course.length)) continue;
            const row = course.at(distance);
            const side = i % 2 === 0 ? -1 : 1;
            const lateral = side * ((bellgate ? roadHalfWidth(biome, distance) : ROAD_HALF) + 2.6);
            const base = pointOnRoute(row, lateral, groundHeight(course.track, row, lateral));
            const yaw = Math.atan2(row.dx, row.dz);
            const color = biome === "future" && i % 3 === 0 ? "#a8dceb"
                : this.#city ? "#dceaff" : "#f4d4a1";
            const bulb = pointOnRoute(row, lateral - side * (bellgate ? 0.87 : 1.55), base.y + height - row.y);
            this.#lamps.push({ bulb, color: Color3.FromHexString(color) });
            if (!hallSetback(biome, distance)) {
                poles.push({ ...base, y: base.y + height / 2, sx: 0.15, sy: height, sz: 0.15, yaw });
                bases.push({ ...base, y: base.y + 0.16, sx: 0.34, sy: 0.39, sz: 0.34, yaw });
                const arm = pointOnRoute(row, lateral - side * (bellgate ? 0.42 : 0.78), base.y + height - row.y);
                arms.push({ ...arm, sx: bellgate ? 0.93 : 1.68, sy: 0.15, sz: 0.16, yaw });
            }
            if (bellgate) {
                lanternCaps.push({ ...bulb, y: bulb.y - 0.02, sx: 0.45, sy: 0.24, sz: 0.45, yaw: yaw + Math.PI / 4 });
                lanternFrames.push({ ...bulb, y: bulb.y - 0.65, sx: 0.38, sy: 0.12, sz: 0.37, yaw });
            }
            add(bulbs, color, bellgate
                ? { ...bulb, y: bulb.y - 0.33, sx: 0.34, sy: 0.59, sz: 0.33, yaw }
                : { ...bulb, y: bulb.y - 0.05, sx: 0.52, sy: 0.12, sz: 0.38, yaw });
            const beamHeight = bulb.y - row.y + 0.04;
            add(cones, color, { ...bulb, y: bulb.y - beamHeight / 2, sx: height * 2.04, sy: beamHeight,
                sz: height * 2.04, yaw: 0 });
            const pool = pointOnRoute(row, lateral - side * 2.35, 0.078);
            const rise = course.at(distance + 2).y - course.at(distance - 2).y;
            add(pools, color, { ...pool, sx: height * 2.36, sy: 1, sz: height * 2.10, yaw, pitch: -Math.atan2(rise, 4) });
        }

        const metal = material(scene, "lamp posts and arms", "#485052");
        metal.diffuseTexture = surfaceTexture(scene, "weathered steel");
        const post = MeshBuilder.CreateCylinder("streetlight posts", { diameter: 1, height: 1, tessellation: 7 }, scene);
        post.material = metal;
        stamp(post, poles);
        const arm = MeshBuilder.CreateBox("streetlight arms", { size: 1 }, scene);
        arm.material = metal;
        stamp(arm, arms);
        const footing = MeshBuilder.CreateCylinder("streetlight base collars", {
            diameterTop: 0.62, diameterBottom: 1, height: 1, tessellation: 8,
        }, scene);
        footing.material = metal;
        stamp(footing, bases);

        if (bellgate) {
            const cap = MeshBuilder.CreateCylinder("Bellgate lantern hoods", {
                diameterTop: 0.31, diameterBottom: 1.22, height: 1, tessellation: 4,
            }, scene);
            cap.material = metal;
            stamp(cap, lanternCaps);
            const frame = MeshBuilder.CreateBox("Bellgate lantern bases", { size: 1 }, scene);
            frame.material = metal;
            stamp(frame, lanternFrames);
        }
        const poolTexture = lightMask(scene);
        for (const [color, lamps] of bulbs) {
            const bulb = MeshBuilder.CreateBox("lamp glass", { size: 1 }, scene);
            const lens = material(scene, "lamp lenses", "#575a58");
            bulb.material = lens;
            stamp(bulb, lamps);
            this.bulbs.push(bulb);
            this.#bulbMaterials.set(color, lens);

            const mist = lampCone(scene, color);
            this.#shafts.push({ mesh: mist, material: mist.material as StandardMaterial });
            stamp(mist, cones.get(color)!);
            const pool = MeshBuilder.CreateGround("soft streetlight pools", { width: 1, height: 1 }, scene);
            const poolPaint = haze(scene, color, poolTexture);
            pool.material = poolPaint;
            this.#pools.push({ mesh: pool, material: poolPaint });
            stamp(pool, pools.get(color)!);
        }
        this.#spot = new SpotLight("nearest streetlamp", Vector3.Zero(), new Vector3(0, -1, 0), 1.76, 8, scene);
        this.#spot.range = 30;
        this.#spot.intensity = 0;
    }

    #nearSettlement(fraction: number): boolean {
        return this.#city || fraction < 0.24 || (fraction > 0.48 && fraction < 0.68) || fraction > 0.89;
    }

    update(env: Conditions, car: Point): void {
        const sun = Math.sin((env.hour - 6) * Math.PI / 12);
        const twilight = 1 - smooth((sun - 0.04) / 0.53);
        const weather = Math.max(env.rain * 0.45, env.snow * 0.34, (env.fog - 0.18) * 0.38);
        const light = Math.max(twilight, weather);
        const mist = Math.min(1, 0.40 + env.fog * 0.49 + env.rain * 0.64 + env.snow * 0.34);
        const strength = this.#city ? 1 : 0.62;
        showGlow(this.#shafts, strength * light * mist);
        showGlow(this.#pools, strength * light * 0.63);
        for (const [color, lens] of this.#bulbMaterials) {
            lens.emissiveColor.copyFrom(Color3.FromHexString(color).scale(light * (this.#city ? 0.86 : 0.65)));
        }
        if (!this.#spot) return;
        this.#spot.intensity = 0;
        if (light < 0.01) return;
        let nearest: Lamp | undefined;
        let distance = REACH;
        for (const lamp of this.#lamps) {
            const gap = Math.hypot(lamp.bulb.x - car.x, lamp.bulb.z - car.z);
            if (gap < distance) {
                nearest = lamp;
                distance = gap;
            }
        }
        if (!nearest) return;
        this.#spot.position.set(nearest.bulb.x, nearest.bulb.y, nearest.bulb.z);
        this.#spot.diffuse.copyFrom(nearest.color);
        this.#spot.intensity = (1 - smooth((distance - 13) / (REACH - 13))) * light * strength * 1.15;
    }
}

function smooth(value: number): number {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
}

function showGlow(glows: readonly LampGlow[], alpha: number): void {
    for (const { mesh, material } of glows) {
        mesh.setEnabled(alpha > 0.008);
        material.alpha = alpha;
    }
}

function add(map: Map<string, Stamp[]>, color: string, position: Stamp): void {
    const values = map.get(color);
    if (values) values.push(position);
    else map.set(color, [position]);
}

function haze(scene: Scene, color: string, texture: DynamicTexture): StandardMaterial {
    const paint = material(scene, "light falloff", color);
    paint.diffuseTexture = texture;
    paint.useAlphaFromDiffuseTexture = true;
    paint.disableLighting = true;
    paint.emissiveColor.copyFrom(paint.diffuseColor);
    paint.disableDepthWrite = true;
    paint.backFaceCulling = false;
    paint.alphaMode = Constants.ALPHA_ADD;
    paint.alpha = 0;
    return paint;
}

function lightMask(scene: Scene): DynamicTexture {
    const texture = new DynamicTexture("soft light pool", 64, scene, true);
    const image = new ImageData(64, 64);
    for (let y = 0; y < 64; y++) {
        const v = (y + 0.5) / 64;
        for (let x = 0; x < 64; x++) {
            const u = (x + 0.5) / 32 - 1;
            const edge = Math.hypot(u, v * 2 - 1);
            const falloff = Math.max(0, 1 - edge ** 2) ** 2;
            const i = (y * 64 + x) * 4;
            image.data[i] = 255;
            image.data[i + 1] = 255;
            image.data[i + 2] = 255;
            image.data[i + 3] = Math.round(225 * falloff);
        }
    }
    texture.getContext().putImageData(image, 0, 0);
    texture.update(true);
    texture.hasAlpha = true;
    return texture;
}
