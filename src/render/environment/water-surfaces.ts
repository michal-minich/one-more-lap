import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../game/course/course.ts";
import type { Surface } from "../../game/course/surface.ts";
import { waterContact, waterPoint } from "../../game/course/water.ts";
import type { WaterBody, WaterKind } from "../../game/course/water.ts";
import type { Point } from "../../game/point.ts";
import { material } from "../materials.ts";
import { surface } from "../scenery/surface-mesh.ts";
import { surfaceTexture } from "../scenery/surface-textures.ts";
import { pacificSurf } from "./pacific-surf.ts";

interface WaterColors {
    readonly shoal: string;
    readonly deep: string;
}

const forestLake = { shoal: "#79c1ac", deep: "#245e76" };
const copperRiver = { shoal: "#7dd6b8", deep: "#267b86" };
const cinderCreek = { shoal: "#91bea9", deep: "#347f86" };
const alpineTarn = { shoal: "#83bdbe", deep: "#235f8c" };
const aegeanSea = { shoal: "#51c4c9", deep: "#255c9b" };

const palette: Record<Exclude<WaterKind, "lava">, WaterColors> = {
    ocean: { shoal: "#65afad", deep: "#28758e" },
    ice: { shoal: "#a6d2de", deep: "#6c9bbd" },
    river: { shoal: "#6bb5a1", deep: "#31797d" },
    creek: { shoal: "#8ebbb1", deep: "#4f8997" },
    lake: { shoal: "#90c0a8", deep: "#3b859a" },
};

export class WaterSurfaces {
    readonly #ripples: Texture[] = [];
    readonly #course: Course;

    constructor(scene: Scene, course: Course) {
        this.#course = course;
        for (const body of course.water) {
            if (body.kind === "lava") continue;
            const ice = body.kind === "ice";
            const water = material(scene, body.kind + " surface", "#ffffff");
            const texture = surfaceTexture(scene, ice ? "frosthaven blue ice" : (course.track.id === "gorge" || course.track.id === "metro" || course.track.id === "future") ? "river ripples" : "water");
            water.diffuseTexture = texture;
            if (course.track.id === "metro" && body.kind === "creek") {
                water.specularColor.set(0.44, 0.51, 0.53);
                water.specularPower = 27;
            } else {
                water.specularColor.set(0.29, 0.37, 0.4);
                water.specularPower = ice ? 86 : 52;
            }
            if (!ice) this.#ripples.push(texture);
            const { shape, colors } = waterMesh(course, body);
            surface(scene, body.kind, shape, water, () => colors);
            if (course.track.id === "coast" && body.kind === "ocean") {
                this.#ripples.push(pacificSurf(scene, course, body));
            }
        }
    }

    depthAt(camera: Point): number {
        const contact = waterContact(this.#course.water, camera, 0);
        if (!contact) return 0;
        const bottom = this.#course.ground.at(camera.x, camera.z, contact.level);
        return bottom === undefined || camera.y > bottom ? contact.depth : 0;
    }

    update(seconds: number): void {
        for (const texture of this.#ripples) {
            texture.uOffset = seconds * 0.032 % 1;
            texture.vOffset = seconds * 0.018 % 1;
        }
    }
}

interface WaterMesh {
    readonly shape: Surface;
    readonly colors: Float32Array;
}

function waterMesh(course: Course, body: WaterBody): WaterMesh {
    const positions: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    const aegean = course.track.id === "ruins" && body.kind === "ocean";
    const copper = course.track.id === "gorge";
    const detailedWater = aegean || copper && body.kind === "river" || (course.track.id === "coast" && body.kind === "ocean");
    const sides = aegean ? 224 : detailedWater ? 192 : body.depth > 0 ? 64 : 96;
    const rings = detailedWater ? [...Array.from({ length: 45 }, (_, i) => (i + 1) * 0.011), 0.57, 0.70, 0.85, 1]
        : body.depth > 0 ? [0.26, 0.52, 0.72, 0.86, 0.98, 1.04] : [0.18, 0.31, 0.44, 0.57, 0.70, 0.85, 1];
    if (body.kind === "lava") throw new Error("Lava uses its own surface");
    const colorsForBody = course.track.id === "future" ? { shoal: "#91c9ab", deep: "#307d80" }
        : course.track.id === "metro" ? { shoal: "#6baca6", deep: "#193955" }
        : course.track.id === "forest" && body.kind === "lake" ? forestLake
        : course.track.id === "alpine" && body.kind === "lake" ? alpineTarn
            : course.track.id === "canyon" && body.kind === "creek" ? cinderCreek
                : aegean ? aegeanSea : copper ? copperRiver : palette[body.kind];
    const { shoal, deep } = colorsForBody;
    const light = Color3.FromHexString(shoal);
    const shade = Color3.FromHexString(deep);
    const depthScale = body.depth > 0 ? Math.max(0.65, body.depth * 0.72) : 12;
    const level = body.center.y;
    const vertex = (angle: number, radius: number): void => {
        const point = waterPoint(body, angle, radius);
        positions.push(point.x, level + 0.012, point.z);
        uv.push(point.x / 12, point.z / 12);
        const bottom = course.ground.at(point.x, point.z, level + 0.1);
        const depth = bottom === undefined ? (body.depth === 0 ? depthScale : 0) : level - bottom;
        const t = Math.min(1, Math.max(0, depth / depthScale));
        const color = Color3.Lerp(light, shade, aegean ? t * (0.48 + t * 0.52) : t);
        colors.push(color.r, color.g, color.b, 1);
    };
    vertex(0, 0);
    for (const [ring, radius] of rings.entries()) {
        for (let side = 0; side < sides; side++) {
            vertex(side / sides * Math.PI * 2, radius);
            const i = 1 + ring * sides + side;
            const next = 1 + ring * sides + (side + 1) % sides;
            if (ring === 0) indices.push(0, i, next);
            else indices.push(i - sides, i, next, i - sides, next, next - sides);
        }
    }
    return {
        shape: { positions: new Float32Array(positions), indices: new Uint32Array(indices), uv: new Float32Array(uv) },
        colors: new Float32Array(colors),
    };
}
