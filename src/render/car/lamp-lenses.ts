import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { material } from "../materials.ts";

export type LensPattern = "reflector" | "projector" | "split LED" | "light bar" | "red prisms";

const textures = new WeakMap<Scene, Map<LensPattern, Texture>>();
const WIDTH = 128;
const HEIGHT = 64;

export class LampLens {
    readonly paint: StandardMaterial;
    readonly #emission = new FresnelParameters();

    constructor(scene: Scene, pattern: LensPattern, color: string) {
        this.paint = material(scene, pattern + " lens", color);
        const texture = lensTexture(scene, pattern);
        this.paint.diffuseTexture = texture;
        this.paint.emissiveTexture = texture;
        this.paint.specularColor.set(0.25, 0.26, 0.25);
        this.paint.specularPower = 67;
        this.#emission.power = 1;
        this.paint.emissiveFresnelParameters = this.#emission;
        this.setLight(0, 0, 0);
    }

    setLight(red: number, green: number, blue: number): void {
        this.#emission.leftColor.set(red, green, blue);
        this.#emission.rightColor.set(red, green, blue);
    }
}

function lensTexture(scene: Scene, pattern: LensPattern): Texture {
    let palette = textures.get(scene);
    if (!palette) {
        palette = new Map();
        textures.set(scene, palette);
    }
    const existing = palette.get(pattern);
    if (existing) return existing;
    const texture = new DynamicTexture(pattern + " lens optics", { width: WIDTH, height: HEIGHT }, scene, true);
    const ctx = texture.getContext();
    const rim = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    rim.addColorStop(0, "#373737");
    rim.addColorStop(0.28, "#929292");
    rim.addColorStop(0.54, "#646464");
    rim.addColorStop(1, "#181818");
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (pattern === "reflector") reflector(ctx);
    else {
        const columns = pattern === "projector" ? 2 : pattern === "split LED" ? 3 : pattern === "light bar" ? 9 : 5;
        optics(ctx, columns, pattern);
    }
    texture.update(true);
    texture.wrapU = texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    palette.set(pattern, texture);
    return texture;
}

type LensContext = ReturnType<DynamicTexture["getContext"]>;

function reflector(ctx: LensContext): void {
    const glow = ctx.createRadialGradient(62, 29, 6, 64, 31, 31);
    glow.addColorStop(0, "#fff");
    glow.addColorStop(0.58, "#dedede");
    glow.addColorStop(0.80, "#ababab");
    glow.addColorStop(0.91, "#d4d4d4");
    glow.addColorStop(1, "#3d3d3d");
    ctx.save();
    ctx.translate(64, 32);
    ctx.scale(1.92, 1);
    ctx.translate(-64, -32);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(64, 32, 31, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(49,49,49,.20)";
    for (let x = 12; x < WIDTH - 8; x += 8) ctx.fillRect(x, 7, 1.6, HEIGHT - 14);
    ctx.fillStyle = "rgba(255,255,255,.33)";
    ctx.fillRect(22, 17, 85, 2);
    ctx.fillRect(20, 39, 87, 2);
}

function optics(ctx: LensContext, columns: number, pattern: LensPattern): void {
    const width = (WIDTH - 14) / columns;
    const y = pattern === "light bar" ? 15 : 10;
    const height = HEIGHT - y * 2;
    const prism = ctx.createLinearGradient(0, y, 0, y + height);
    prism.addColorStop(0, "#aaa");
    prism.addColorStop(0.2, "#f9f9f9");
    prism.addColorStop(0.46, "#c1c1c1");
    prism.addColorStop(0.58, "#ececec");
    prism.addColorStop(1, "#707070");
    for (let i = 0; i < columns; i++) {
        const x = 7 + i * width;
        ctx.fillStyle = "#343434";
        ctx.fillRect(x - 1, y - 2, width + 1, height + 4);
        ctx.fillStyle = prism;
        ctx.fillRect(x + 1, y, width - 3, height);
        if (pattern === "projector") {
            const center = x + width / 2;
            const glow = ctx.createRadialGradient(center, 31, 2, center, 31, 18);
            glow.addColorStop(0, "#fff");
            glow.addColorStop(0.62, "#f0f0f0");
            glow.addColorStop(1, "#626262");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(center, 31, 17, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    ctx.fillStyle = "rgba(255,255,255,.58)";
    ctx.fillRect(10, y + 4, WIDTH - 20, 2);
    ctx.fillStyle = "rgba(32,32,32,.39)";
    ctx.fillRect(9, y + height * 0.67, WIDTH - 18, 2);
}
