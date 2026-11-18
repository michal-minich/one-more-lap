import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Scene } from "@babylonjs/core/scene.js";
import type { Biome } from "../../game/course/tracks.ts";
import type { Conditions } from "../../game/race/conditions.ts";
import type { Scenery } from "../scenery/scenery.ts";
import { HorizonHaze } from "./haze.ts";
import { SkyObjects } from "./sky-objects.ts";

function rgb(color: string): Color3 {
    return Color3.FromHexString(color);
}

const palette = {
    day: rgb("#3a80bc"), night: rgb("#111c39"),
    cold: rgb("#839bce"), warm: rgb("#ffba83"), white: rgb("#fff4e5"),
    dawnClouds: rgb("#c1a9ca"), dawnHorizon: rgb("#f7be9f"),
    dusk: rgb("#a8678c"), horizonGlow: rgb("#ffa070"), overcast: rgb("#8494ad"),
};

export class Atmosphere {
    readonly sun: DirectionalLight;
    readonly #fill: HemisphericLight;
    readonly #scene: Scene;
    readonly #sky: Mesh;
    readonly #skyVertices: readonly number[];
    readonly #objects: SkyObjects;
    readonly #scenery: Scenery;
    readonly #ground: Color3;
    readonly #daySky: Color3;
    readonly #roadTint: Color3;
    readonly #sunBearing: readonly [sin: number, cos: number];
    readonly #sunriseFill: number;
    readonly #sunArc: number;
    readonly #haze: HorizonHaze;
    readonly #reef: boolean;
    readonly #cloudfold: boolean;
    readonly #bellgate: boolean;
    readonly #glasswater: boolean;
    readonly #aurora: boolean;
    readonly #ares: boolean;
    #nextSky = 0;

    constructor(scene: Scene, scenery: Scenery, biome: Biome) {
        this.#scene = scene;
        this.#scenery = scenery;
        this.#haze = new HorizonHaze(biome);
        this.#reef = biome === "reef";
        this.#cloudfold = biome === "sky";
        this.#bellgate = biome === "old-town";
        this.#glasswater = biome === "metro";
        this.#aurora = biome === "future";
        this.#ares = biome === "mars";
        const azimuth = this.#ares ? -Math.PI * 0.33 : this.#aurora ? -Math.PI * 0.52 : this.#glasswater ? Math.PI * 0.27 : this.#bellgate ? -Math.PI * 0.67 : biome === "ruins" ? -Math.PI * 0.63 : biome === "coast" ? -Math.PI * 0.47
            : biome === "alpine" ? -Math.PI * 0.52 : biome === "canyon" ? -Math.PI * 0.59
                : biome === "rail" ? -Math.PI * 0.36 : biome === "gorge" ? -Math.PI * 0.61 : biome === "arctic" ? -Math.PI * 0.54 : 0;
        this.#sunBearing = [Math.sin(azimuth), Math.cos(azimuth)];
        this.#sunriseFill = biome === "ruins" ? 0.19 : this.#cloudfold ? 0.64 : this.#bellgate ? 0.29 : this.#glasswater ? 0.39 : this.#aurora ? 0.29 : this.#ares ? 0.91 : 0;
        this.#sunArc = biome === "gorge" ? 0.64 : biome === "arctic" ? 0.48 : this.#bellgate ? 0.82 : this.#glasswater ? 0.77 : 1;
        this.#ground = scenery.terrain.diffuseColor.clone();
        this.#daySky = this.#ares ? rgb("#ab97ae") : biome === "arctic" ? rgb("#6198c7")
            : biome === "sky" ? rgb("#6e91ce") : biome === "caldera" ? rgb("#5679a6")
                : biome === "ruins" || biome === "alpine" ? rgb("#3b83cd")
                    : biome === "canyon" ? rgb("#426cb5") : this.#bellgate ? rgb("#607fbd") : palette.day;
        this.#roadTint = biome === "sky" ? rgb("#f0e5ee") : biome === "caldera" ? rgb("#c5bdcf")
            : biome === "arctic" ? rgb("#a5b6c4") : biome === "old-town" ? rgb("#d7cdbf") : Color3.White();
        this.sun = new DirectionalLight("sunlight", new Vector3(-0.65, -0.45, 0.36), scene);
        this.#fill = new HemisphericLight("sky light", new Vector3(0, 1, 0), scene);
        this.#fill.groundColor.set(0.36, 0.38, 0.43);
        this.#fill.specular.set(0.065, 0.079, 0.09);
        scene.fogMode = Scene.FOGMODE_EXP2;

        const sky = MeshBuilder.CreateSphere("sky", { diameter: 2300, segments: 24, sideOrientation: Mesh.BACKSIDE, updatable: true }, scene);
        sky.infiniteDistance = true;
        sky.isPickable = false;
        const skyMat = new StandardMaterial("sky gradient", scene);
        skyMat.disableLighting = true;
        skyMat.emissiveColor.set(1, 1, 1);
        skyMat.fogEnabled = false;
        skyMat.specularColor.set(0, 0, 0);
        sky.material = skyMat;
        this.#sky = sky;
        this.#skyVertices = [...sky.getVerticesData(VertexBuffer.PositionKind)!];
        sky.setVerticesData(VertexBuffer.ColorKind, new Float32Array(this.#skyVertices.length / 3 * 4).fill(1), true);
        this.#objects = new SkyObjects(scene, biome);
    }

    update(value: Conditions, camera: Vector3, car: Vector3, time: number, enhancedShadows: boolean): void {
        const { hour, daylight, fog, snow, rain } = value;
        const dusk = this.#glasswater ? Math.sqrt(value.dusk) : value.dusk;
        const cloudy = Math.max(snow, rain, fog * 0.57);
        const skyColor = Color3.Lerp(palette.night, this.#daySky, daylight);
        Color3.LerpToRef(skyColor, palette.overcast, cloudy * daylight * 0.74, skyColor);
        Color3.LerpToRef(skyColor, palette.dusk, dusk * (1 - cloudy * 0.72) * 0.39, skyColor);
        const horizon = this.#haze.color(value);
        if (this.#cloudfold) {
            const dawn = dusk * (1 - cloudy * 0.82);
            Color3.LerpToRef(skyColor, palette.dawnClouds, dawn * 0.54, skyColor);
            Color3.LerpToRef(horizon, palette.dawnHorizon, dawn * 0.38, horizon);
        }
        if (this.#bellgate) {
            const warmth = dusk * (1 - cloudy);
            Color3.LerpToRef(skyColor, palette.dawnClouds, warmth * 0.23, skyColor);
            Color3.LerpToRef(horizon, palette.dawnHorizon, warmth * 0.29, horizon);
        }
        if (this.#glasswater) {
            const evening = dusk * (1 - cloudy * 0.35);
            Color3.LerpToRef(skyColor, palette.dawnClouds, evening * 0.34, skyColor);
            Color3.LerpToRef(horizon, palette.dawnHorizon, evening * 0.68, horizon);
        }
        if (this.#aurora) {
            const afternoon = Math.sqrt(dusk) * (1 - cloudy * 0.83);
            Color3.LerpToRef(horizon, palette.dawnHorizon, afternoon * 0.30, horizon);
            Color3.LerpToRef(skyColor, palette.dawnClouds, afternoon * 0.27, skyColor);
        }
        if (this.#ares) {
            const glow = dusk * (1 - cloudy * 0.67);
            Color3.LerpToRef(skyColor, palette.dawnClouds, glow * 0.54, skyColor);
            Color3.LerpToRef(horizon, palette.dawnHorizon, glow * 0.51, horizon);
        }
        this.#scene.fogColor.copyFrom(horizon);
        this.#scene.clearColor.set(horizon.r, horizon.g, horizon.b, 1);
        this.#scene.fogDensity = this.#haze.density(value);
        if (this.#reef && camera.y < 0) {
            const depth = Math.min(1, -camera.y / 9);
            Color3.LerpToRef(this.#scene.fogColor, rgb("#185f72"), depth * 0.94, this.#scene.fogColor);
            this.#scene.fogDensity = Math.max(this.#scene.fogDensity, depth * 0.011);
            Color3.LerpToRef(skyColor, rgb("#237c91"), depth, skyColor);
            Color3.LerpToRef(horizon, this.#scene.fogColor, depth, horizon);
        }
        const theta = (hour - 6) * Math.PI / 12;
        const altitude = Math.sin(theta) * this.#sunArc;
        const lx = Math.cos(theta) * 0.46 - 0.03;
        const lz = 0.72;
        const [sin, cos] = this.#sunBearing;
        const position = new Vector3(lx * cos + lz * sin, Math.max(0.12, altitude), lz * cos - lx * sin);
        position.normalize();
        this.sun.direction.copyFrom(position.scale(-1));
        this.sun.position.copyFrom(car).addInPlace(position.scale(75));
        const cloudShade = 1 - cloudy * (this.#glasswater || this.#ares ? 0.55 : 0.67);
        const lightTint = this.#aurora || this.#ares ? (0.09 * daylight + 0.77 * dusk) : 0.72 * dusk;
        const warmLight = lightTint * (1 - cloudy * (this.#glasswater ? 0.59 : 1));
        this.sun.intensity = (0.13 + daylight * 0.91 + dusk * 0.30) * cloudShade;
        this.sun.diffuse.copyFrom(Color3.Lerp(Color3.Lerp(palette.cold, palette.white, daylight), palette.warm, warmLight));
        const horizonFill = this.#sunriseFill * dusk * daylight * (1 - cloudy * (this.#ares ? 0.61 : 1));
        const dustBounce = this.#ares ? daylight * 0.24 : 0;
        this.#fill.intensity = (0.39 + daylight * 0.43 + horizonFill + dustBounce) * (enhancedShadows ? 1 - daylight * 0.24 : 1);
        this.#fill.diffuse.copyFrom(Color3.Lerp(palette.cold, palette.white, daylight));
        this.#objects.update(value, camera, position, altitude, time, this.#reef && camera.y < -0.45);
        const tint = this.#roadTint;
        this.#scenery.road.diffuseColor.set((0.73 - rain * 0.31 + snow * 0.08) * tint.r,
            (0.75 - rain * 0.28 + snow * 0.09) * tint.g, (0.77 - rain * 0.24 + snow * 0.13) * tint.b);
        this.#scenery.road.specularColor.set(0.075 + rain * 0.51, 0.085 + rain * 0.56, 0.1 + rain * 0.62);
        this.#scenery.road.specularPower = 41 - rain * 25;
        Color3.LerpToRef(this.#ground, rgb("#dcebf5"), snow * 0.40, this.#scenery.terrain.diffuseColor);

        if (time >= this.#nextSky) {
            this.#nextSky = time + 0.22;
            const colors: number[] = [];
            for (let i = 0; i < this.#skyVertices.length; i += 3) {
                const x = this.#skyVertices[i]!;
                const y = this.#skyVertices[i + 1]!;
                const z = this.#skyVertices[i + 2]!;
                const t = Math.min(1, Math.max(0, y / 565));
                const color = Color3.Lerp(horizon, skyColor, t ** 0.64);
                const towardsSun = Math.max(0, (x * position.x + z * position.z) / (Math.hypot(x, z) || 1));
                const gold = dusk * (1 - cloudy * (this.#glasswater ? 0.37 : 0.75)) * Math.exp(-Math.abs(y) / 218) *
                    (0.12 + towardsSun ** 6 * 0.65);
                Color3.LerpToRef(color, palette.horizonGlow, gold, color);
                colors.push(color.r, color.g, color.b, 1);
            }
            this.#sky.updateVerticesData(VertexBuffer.ColorKind, colors);
        }
    }
}
