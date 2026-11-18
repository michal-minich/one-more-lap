import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarId, CarSpec } from "../../game/vehicle/cars.ts";
import { showBlenderFleet, showStudioKestrel } from "../art-pilot.ts";
import { blenderWheel } from "./fleet/wheel.ts";
import { studioWheel } from "./kestrel/studio.ts";
import { material } from "../materials.ts";
import { parkedSuspension, wheelPositions } from "../../game/vehicle/wheels.ts";
import type { WheelPose } from "../../game/vehicle/pose.ts";
import { surfaceTexture } from "../scenery/surface-textures.ts";
import { fleetTexture } from "./fleet/model-textures.ts";
import { reflect } from "./reflections.ts";

interface WheelModel {
    readonly restY: number;
    readonly steer: TransformNode;
    readonly hub: TransformNode;
}

interface Rim {
    readonly color: string;
    readonly spokes: number;
    readonly diameter: number;
    readonly cap: number;
}

const rims: Record<Exclude<CarId, "manta">, Rim> = {
    veloce: { color: "#e4c795", spokes: 6, diameter: 1.44, cap: 0.40 },
    summit: { color: "#c6cbd0", spokes: 8, diameter: 1.28, cap: 0.40 },
    mistral: { color: "#e2c59b", spokes: 6, diameter: 1.44, cap: 0.48 },
    bastion: { color: "#d2af73", spokes: 7, diameter: 1.28, cap: 0.48 },
    aero: { color: "#b7bacd", spokes: 3, diameter: 1.44, cap: 0.88 },
    buggy: { color: "#cfab75", spokes: 6, diameter: 1.28, cap: 0.40 },
    kestrel: { color: "#e8ce9d", spokes: 7, diameter: 1.44, cap: 0.40 },
    orbit: { color: "#e5cba2", spokes: 6, diameter: 1.44, cap: 0.40 },
};

export class CarWheels {
    readonly #parts: readonly WheelModel[];

    constructor(scene: Scene, root: TransformNode, spec: CarSpec, detailed: boolean, sky: Texture) {
        if (spec.id === "manta") {
            this.#parts = [];
            return;
        }
        const id = spec.id;
        const rim = rims[id];
        const { radius, tread } = spec.tire;
        const rubber = material(scene, "tires", "#212225");
        rubber.specularColor.set(0.09, 0.08, 0.08);
        if (detailed && spec.id === "buggy") rubber.diffuseTexture = surfaceTexture(scene, "molded rubber");
        const metal = material(scene, "machined alloy", rim.color);
        metal.diffuseColor.scaleInPlace(0.82);
        metal.specularColor.set(0.34, 0.31, 0.26);
        metal.specularPower = 72;
        reflect(metal, sky, 0.18, 0.025);
        const disc = material(scene, "brake discs", "#272d34");
        disc.specularColor.set(0.13, 0.14, 0.15);
        if (detailed && showBlenderFleet) {
            rubber.diffuseTexture = fleetTexture(scene, "rubber");
            metal.diffuseTexture = disc.diffuseTexture = fleetTexture(scene, "alloy");
        }
        this.#parts = wheelPositions(spec).map((pos, i): WheelModel => {
            const steer = new TransformNode("wheel steering", scene);
            steer.parent = root;
            steer.position.set(pos.x, pos.y - parkedSuspension(spec), pos.z);
            const hub = new TransformNode("wheel spin", scene);
            hub.parent = steer;
            const side = i % 2 ? 1 : -1;
            if (detailed && id === "kestrel" && showStudioKestrel && !showBlenderFleet) {
                studioWheel(scene, hub, side, [disc, metal, rubber]);
                return { restY: pos.y, steer, hub };
            }
            if (detailed && showBlenderFleet) {
                blenderWheel(scene, id, hub, side, [disc, metal, rubber]);
                return { restY: pos.y, steer, hub };
            }
            const cylinder = (name: string, diameter: number, depth: number, at: number, mat: StandardMaterial): void => {
                const mesh = MeshBuilder.CreateCylinder(name, { diameter, height: depth, tessellation: detailed ? 28 : 12 }, scene);
                mesh.rotation.z = Math.PI / 2;
                mesh.position.x = at;
                mesh.parent = hub;
                mesh.material = mat;
            };
            cylinder("tire", radius * 2, tread * 0.82, 0, rubber);
            cylinder("rounded sidewall", radius * 1.89, tread, 0, rubber);
            const rimDiameter = radius * rim.diameter;
            cylinder("rim lip", rimDiameter, 0.024, side * (tread / 2 + 0.014), metal);
            if (detailed && spec.id === "buggy") addTreads(scene, hub, radius, tread, rubber);
            if (!detailed) return { restY: pos.y, steer, hub };
            cylinder("brake rotor", rimDiameter * 0.88, 0.027, side * (tread / 2 + 0.022), disc);
            for (let spoke = 0; spoke < rim.spokes; spoke++) {
                const arm = MeshBuilder.CreateBox("alloy spoke", { width: 0.021, height: rimDiameter * 0.78, depth: 0.038 }, scene);
                arm.position.x = side * (tread / 2 + 0.04);
                arm.material = metal;
                arm.parent = hub;
                arm.rotation.x = spoke * Math.PI / rim.spokes;
            }
            cylinder("hub cap", rimDiameter * rim.cap, 0.042, side * (tread / 2 + 0.045), metal);
            return { restY: pos.y, steer, hub };
        });
    }

    follow(wheels: readonly WheelPose[]): void {
        for (const [i, { restY, steer, hub }] of this.#parts.entries()) {
            const wheel = wheels[i]!;
            steer.position.y = restY - wheel.suspension;
            steer.rotation.y = wheel.steer;
            hub.rotation.x = -wheel.rotation;
        }
    }
}

function addTreads(scene: Scene, hub: TransformNode, radius: number, tread: number, rubber: StandardMaterial): void {
    const lugs = [];
    for (const side of [-1, 1]) {
        for (let index = 0; index < 22; index++) {
            const angle = (index + side * 0.19) / 22 * Math.PI * 2;
            const lug = MeshBuilder.CreateBox("tire tread lug",
                { width: tread * 0.41, height: 0.031, depth: 0.063 }, scene);
            lug.position.set(side * tread * 0.22, radius * Math.cos(angle), radius * Math.sin(angle));
            lug.rotation.set(angle, side * 0.24, 0);
            lugs.push(lug);
        }
    }
    const band = Mesh.MergeMeshes(lugs, true, true)!;
    band.name = "knobby tread";
    band.material = rubber;
    band.parent = hub;
}
