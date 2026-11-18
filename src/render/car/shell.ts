import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import { createCabin } from "./cabin.ts";
import { buildBuggyCage } from "./buggy-kit.ts";
import { createBubbleCabin } from "./bubble-cabin.ts";
import { addCoachwork } from "./coachwork.ts";
import { CarDamage } from "./damage.ts";
import { reflect } from "./reflections.ts";
import { bodyProfiles, bodyShape } from "../../game/vehicle/body-shapes.ts";
import { LampLens } from "./lamp-lenses.ts";
import type { LensPattern } from "./lamp-lenses.ts";
import { loft } from "./loft-mesh.ts";
import { material } from "../materials.ts";
import { surfaceTexture } from "../scenery/surface-textures.ts";
import { showBlenderFleet, showStudioKestrel } from "../art-pilot.ts";
import { blenderChassis } from "./fleet/chassis.ts";
import { mantaModel } from "../models/manta.ts";
import { fleetTexture } from "./fleet/model-textures.ts";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { studioBody } from "./kestrel/studio.ts";
import { shapeTrim } from "./trim.ts";

const headPatterns: Record<ReturnType<typeof bodyShape>["light"], LensPattern> = {
    blade: "split LED", rally: "reflector", round: "reflector", armored: "projector", aero: "light bar", orbit: "split LED",
};

const damagedColor = Color3.FromHexString("#433d40");

export class CarShell {
    readonly #paint: StandardMaterial;
    readonly #clean = new Color3();
    readonly #lights: LampLens;
    readonly #tails: LampLens;
    readonly #electric: boolean;
    readonly #hover: boolean;
    readonly #damage: CarDamage | undefined;
    #amount = 0;

    constructor(scene: Scene, root: TransformNode, spec: CarSpec, color: string, sky: Texture, glassTint: Texture,
        detailed: boolean) {
        const shape = bodyShape(spec);
        this.#hover = spec.id === "manta";
        this.#electric = spec.id === "aero" || spec.id === "orbit" || this.#hover;
        const paint = material(scene, "painted body panels", color);
        const studio = detailed && spec.id === "kestrel" && showStudioKestrel && !showBlenderFleet;
        if (detailed && (spec.id === "buggy" || (spec.id === "kestrel" && !studio))) {
            paint.diffuseTexture = surfaceTexture(scene, "dusty enamel");
        }
        const softCoat = spec.id === "bastion" || spec.id === "summit";
        const clearCoat = this.#electric ? 0.32 : softCoat ? 0.16 : 0.24;
        paint.specularColor.set(clearCoat, clearCoat * 1.03, clearCoat * 1.08);
        paint.specularPower = softCoat ? 51 : 92;
        reflect(paint, sky, this.#electric ? 0.28 : softCoat ? 0.14 : 0.21, 0.018);
        this.#paint = paint;
        this.setPaint(color);
        const glass = material(scene, "tinted reflective glass", this.#electric ? "#202640" : "#172c40");
        glass.specularColor.set(0.20, 0.27, 0.35);
        glass.specularPower = 100;
        glass.diffuseTexture = glassTint;
        reflect(glass, sky, detailed && (showBlenderFleet || this.#hover) ? 0.27 : 0.54,
            detailed && (showBlenderFleet || this.#hover) ? 0.055 : 0.18);
        const front = new TransformNode("front bumper and lamps", scene);
        const rear = new TransformNode("rear bumper and lamps", scene);
        front.parent = root;
        rear.parent = root;
        this.#lights = new LampLens(scene, headPatterns[shape.light], this.#electric || spec.id === "kestrel" ? "#a0e6ec" : "#f2dfae");
        this.#tails = new LampLens(scene, this.#electric ? "light bar" : "red prisms", this.#hover ? "#ffae30" : "#eb3927");
        if (spec.id === "manta") {
            const hull = new TransformNode("Manta low-flight hull", scene);
            hull.parent = root;
            hull.scaling.set(0.78, 0.98, 0.84);
            hull.position.y = -0.59;
            paint.diffuseTexture = fleetTexture(scene, "ceramic");
            const pieces = mantaModel(scene, hull, { paint, glass, tails: this.#tails.paint });
            if (detailed) {
                const shell = pieces.find(mesh => mesh.material === paint)!;
                const canopy = { windshield: [new Vector3(-0.14, 0.17, 1.10), new Vector3(0.14, 0.17, 1.10),
                    new Vector3(0.32, 0.57, 0.22), new Vector3(-0.32, 0.57, 0.22)] as const };
                this.#damage = new CarDamage(scene, shell, root, spec, canopy, front, rear);
            }
            return;
        }
        if (detailed && (studio || showBlenderFleet)) {
            const finishes = { paint, glass, lights: this.#lights.paint, tails: this.#tails.paint };
            const { shell, cabin } = studio
                ? studioBody(scene, root, front, rear, finishes)
                : blenderChassis(scene, spec.id, root, front, rear, finishes);
            this.#damage = new CarDamage(scene, shell, root, spec, cabin, front, rear);
            return;
        }
        const roof = shape.roofColor ? material(scene, "two-tone roof", shape.roofColor) : paint;
        if (roof !== paint) reflect(roof, sky, 0.20, 0.02);
        const shell = loft(scene, "shaped chassis and wheel arches", bodyProfiles(spec, shape), shape, paint);
        shell.parent = root;
        shell.isPickable = false;
        const buildCabin = spec.id === "orbit" ? createBubbleCabin : spec.id === "buggy" ? buildBuggyCage : createCabin;
        const cabin = buildCabin(scene, root, spec, shape, { frame: paint, glass, roof });
        const dark = material(scene, "bumper and trim", "#182127");
        shapeTrim(scene, root, spec, shape, {
            dark, paint, lights: this.#lights.paint, tails: this.#tails.paint, front, rear,
        }, detailed);
        if (detailed) addCoachwork(scene, root, spec, shape);
        this.#damage = detailed ? new CarDamage(scene, shell, root, spec, cabin, front, rear) : undefined;
    }

    setPaint(color: string): void {
        // StandardMaterial shades in gamma space; leave room for direct light and the clear coat.
        Color3.FromHexString(color).scaleToRef(0.80, this.#clean);
        this.#applyPaint();
    }

    setDamage(damage: number): void {
        if (damage === this.#amount) return;
        this.#amount = damage;
        this.#damage?.set(damage);
        this.#applyPaint();
    }

    setPhase(phasing: boolean, time: number): void {
        const shine = phasing ? 0.16 + Math.sin(time * 7) * 0.04 : 0;
        this.#paint.emissiveColor.set(shine * 0.24, shine, shine * 0.92);
    }

    #applyPaint(): void {
        Color3.LerpToRef(this.#clean, damagedColor, this.#amount * 0.0041, this.#paint.diffuseColor);
    }

    illuminate(daylight: number, braking: boolean): void {
        const light = (0.14 + (1 - daylight) * 0.77) * (1 - this.#amount * 0.006);
        this.#lights.setLight(light * (this.#electric ? 0.71 : 1), light * 0.91, light * (this.#electric ? 1 : 0.69));
        this.#tails.setLight(braking ? 0.93 : 0.27 + light * 0.42,
            this.#hover ? 0.32 : (braking ? 0.062 : 0.032), 0.025);
    }
}
