import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Biome } from "../../game/course/tracks.ts";
import type { Conditions } from "../../game/race/conditions.ts";
import { seededRandom } from "../../game/random.ts";
import { stamp } from "../scenery/instances.ts";
import type { Stamp } from "../scenery/instances.ts";
import { cloudMask } from "./cloud-mask.ts";
import type { CloudForm } from "./cloud-mask.ts";
import { glowTexture, moonTexture, skyPaint } from "./sky-textures.ts";

interface Cloud {
    readonly mesh: Mesh;
    readonly base: Vector3;
    readonly threshold: number;
    readonly drift: number;
    readonly lowBank: boolean;
}

interface CloudProfile {
    readonly coverage: number;
    readonly forms: readonly CloudForm[];
    readonly lowBanks?: number;
}

const mixed: CloudProfile = { coverage: 0.78, forms: ["cumulus", "cumulus", "tower", "cirrus"] };
const dry: CloudProfile = { coverage: 0.44, forms: ["cirrus", "cirrus", "stratus", "cirrus"] };
const coastal: CloudProfile = { coverage: 0.91, forms: ["cumulus", "stratus", "tower", "cirrus"] };
const cloudProfiles: Readonly<Record<Biome, CloudProfile>> = {
    stunt: mixed, rail: mixed, reef: coastal, coast: coastal, canyon: dry, ruins: mixed, forest: mixed, "old-town": mixed,
    metro: coastal, future: mixed, mars: dry, gorge: dry,
    alpine: { coverage: 0.86, forms: ["cumulus", "cirrus", "tower", "cumulus"] },
    arctic: { coverage: 0.94, forms: ["stratus", "stratus", "cumulus", "cirrus"] },
    sky: { coverage: 0.98, forms: ["cumulus", "cirrus", "tower", "bank"], lowBanks: 12 },
    caldera: { coverage: 0.61, forms: ["stratus", "cirrus", "tower", "cirrus"] },
};

const cloudCount = 41;
const dimensions: Readonly<Record<CloudForm, readonly [number, number]>> = {
    cumulus: [0.36, 0.53], cirrus: [0.21, 0.34], stratus: [0.17, 0.29], tower: [0.62, 0.89], bank: [0.25, 0.39],
};

const dayCloud = Color3.FromHexString("#f7f4ea");
const eveningCloud = Color3.FromHexString("#f6b494");
const nightCloud = Color3.FromHexString("#41516d");
const stormCloud = Color3.FromHexString("#78879c");

export class SkyObjects {
    readonly #clouds: readonly Cloud[];
    readonly #cloudPaint: readonly StandardMaterial[];
    readonly #coverage: number;
    readonly #phase: number;
    readonly #glasswater: boolean;
    readonly #sun: Mesh;
    readonly #sunPaint: StandardMaterial;
    readonly #moon: Mesh;
    readonly #moonPaint: StandardMaterial;
    readonly #stars: Mesh;
    readonly #starPaint: StandardMaterial;

    constructor(scene: Scene, biome: Biome) {
        const seed = [...biome].reduce((sum, letter) => sum * 13 + letter.charCodeAt(0), 91);
        const random = seededRandom(seed);
        this.#phase = random() * 7;
        this.#glasswater = biome === "metro";
        const { coverage, forms, lowBanks = 0 } = cloudProfiles[biome];
        this.#coverage = coverage;
        this.#cloudPaint = forms.map((form, index) =>
            skyPaint(scene, "soft " + form + " cloud", cloudMask(scene, 6217 + index * 51, form)));
        this.#clouds = Array.from({ length: cloudCount + lowBanks }, (_, index) => {
            const angle = index * 2.399963 + random() * 0.63;
            const lowBank = index >= cloudCount;
            const paintIndex = lowBank ? forms.indexOf("bank") : index % forms.length;
            const form = forms[paintIndex]!;
            const radius = lowBank ? 340 + random() * 260 : 520 + random() * 298;
            const width = lowBank ? 250 + random() * 235 : 115 + random() * 162;
            const [minAspect, maxAspect] = dimensions[form];
            const aspect = minAspect + random() * (maxAspect - minAspect);
            const mesh = billboard(scene, lowBank ? "cloud bank below the circuit" : "drifting cloud",
                width, width * aspect, lowBank ? 7 : 8 + index % 3);
            mesh.material = this.#cloudPaint[paintIndex]!;
            return {
                mesh, base: new Vector3(Math.cos(angle) * radius, lowBank ? -49 - random() * 38 : 50 + random() * 225,
                    Math.sin(angle) * radius),
                threshold: random() * 0.96, drift: 0.45 + random() * 0.88, lowBank,
            };
        });
        this.#sun = billboard(scene, "sun and soft halo", 142, 142, 3);
        this.#sunPaint = skyPaint(scene, "warm sun halo", glowTexture(scene, true));
        this.#sun.material = this.#sunPaint;
        this.#moon = billboard(scene, "moon", 38, 38, 4);
        this.#moonPaint = skyPaint(scene, "lunar glow", moonTexture(scene));
        this.#moon.material = this.#moonPaint;
        this.#starPaint = skyPaint(scene, "fading stars", glowTexture(scene, false));
        this.#stars = MeshBuilder.CreatePlane("procedural starfield", { size: 1 }, scene);
        this.#stars.material = this.#starPaint;
        this.#stars.alphaIndex = 2;
        stamp(this.#stars, stars(random));
    }

    update(env: Conditions, camera: Vector3, sun: Vector3, altitude: number, time: number, submerged = false): void {
        const storm = Math.max(env.rain, env.snow * 0.83, env.fog * 0.52);
        const cover = Math.min(1, this.#coverage + 0.13 * Math.sin(time * 0.018 + this.#phase) +
            storm * 0.25 - env.dusk * (1 - storm) * 0.08);
        const tint = Color3.Lerp(nightCloud, dayCloud, env.daylight);
        Color3.LerpToRef(tint, eveningCloud, env.dusk * env.daylight * (1 - storm) * 0.68, tint);
        Color3.LerpToRef(tint, stormCloud, storm * env.daylight * 0.69, tint);
        if (this.#glasswater) {
            Color3.LerpToRef(tint, eveningCloud, Math.sqrt(env.dusk) * env.daylight * (0.19 + storm * 0.20), tint);
        }
        for (const paint of this.#cloudPaint) paint.diffuseColor.copyFrom(tint);
        for (const { mesh, base, threshold, drift, lowBank } of this.#clouds) {
            const visibility = Math.min(1, Math.max(0, (cover - threshold) * 3.7));
            mesh.setEnabled(!submerged && visibility > 0.015);
            mesh.visibility = visibility * (0.62 + env.daylight * 0.32) * (lowBank ? 0.77 : 1);
            const glide = Math.sin(time * 0.026 * drift + threshold * 6) * (23 + drift * 14);
            mesh.position.set(camera.x * 0.64 + base.x + glide, camera.y * (lowBank ? 0.90 : 0.51) + base.y,
                camera.z * 0.64 + base.z + glide * 0.36);
        }
        this.#sun.setEnabled(!submerged && altitude >= -0.057 && storm < 0.84);
        this.#sun.position.set(camera.x + sun.x * 620, camera.y + altitude * 475 + 12, camera.z + sun.z * 620);
        this.#sunPaint.alpha = (1 - storm * 0.94) * Math.min(1, Math.max(0, (altitude + 0.065) * 28));
        this.#sunPaint.diffuseColor.set(1, 0.96 - env.dusk * 0.08, 0.87 - env.dusk * 0.20);
        const night = Math.max(0, 1 - env.daylight * 1.13);
        this.#stars.position.copyFrom(camera);
        this.#stars.setEnabled(!submerged && night > 0.05);
        this.#starPaint.alpha = night ** 1.35 * (1 - storm * 0.84) * 0.92;
        const moonBearing = env.hour * Math.PI / 12 - 0.31;
        this.#moon.position.set(camera.x + Math.sin(moonBearing) * 686,
            camera.y + 110 + Math.cos(moonBearing) * 37, camera.z + Math.cos(moonBearing) * 686);
        this.#moon.setEnabled(!submerged && night > 0.025);
        this.#moonPaint.alpha = Math.min(1, night * 1.32) * (1 - storm * 0.68);
    }
}

function billboard(scene: Scene, name: string, width: number, height: number, alphaIndex: number): Mesh {
    const mesh = MeshBuilder.CreatePlane(name, { width, height }, scene);
    mesh.isPickable = false;
    mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
    mesh.alphaIndex = alphaIndex;
    return mesh;
}

function stars(random: () => number): Stamp[] {
    return Array.from({ length: 235 }, (_, index) => {
        const yaw = index * 2.399963 + random() * 0.21;
        const altitude = 0.06 + random() * 1.45;
        const flat = Math.cos(altitude) * 857;
        const size = 0.95 + random() ** 2 * 3.6;
        return { x: Math.sin(yaw) * flat, y: Math.sin(altitude) * 857, z: Math.cos(yaw) * flat,
            sx: size, sy: size, sz: 1, yaw, pitch: -altitude };
    });
}
