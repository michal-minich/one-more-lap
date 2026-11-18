import { Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { batchRigidMeshes } from "../rigid-meshes.ts";
import { CarShell } from "./shell.ts";
import { CarWheels } from "./wheels.ts";
import { BoostJets } from "./boost-jets.ts";
import { TeleportFlash } from "./teleport-flash.ts";
import type { CarSpec } from "../../game/vehicle/cars.ts";
import type { VehiclePose } from "../../game/vehicle/pose.ts";

export class CarModel {
    readonly root: TransformNode;
    readonly #rotation = Quaternion.Identity();
    readonly #shell: CarShell;
    readonly #wheels: CarWheels;
    readonly #jets: BoostJets | undefined;
    readonly #phaseMeshes: readonly AbstractMesh[];
    #flash: TeleportFlash | undefined;
    #phasing = false;

    constructor(scene: Scene, spec: CarSpec, paint: string, sky: Texture, glassTint: Texture, detailed = true) {
        this.root = new TransformNode(spec.name, scene);
        this.root.rotationQuaternion = this.#rotation;
        this.#shell = new CarShell(scene, this.root, spec, paint, sky, glassTint, detailed);
        if (!detailed) batchRigidMeshes(this.root, false);
        this.#wheels = new CarWheels(scene, this.root, spec, detailed, sky);
        this.#jets = detailed ? new BoostJets(scene, this.root, spec) : undefined;
        this.#phaseMeshes = detailed ? this.root.getChildMeshes() : [];
    }

    setBoost(active: boolean, time: number): void {
        this.#jets?.update(active, time);
    }

    setPhase(phasing: boolean, time: number): void {
        this.#shell.setPhase(phasing, time);
        if (phasing !== this.#phasing) {
            this.#phasing = phasing;
            for (const mesh of this.#phaseMeshes) mesh.visibility = phasing ? 0.55 : 1;
        }
        this.#flash?.update(time);
    }

    flashTeleport(time: number): void {
        this.#flash ??= new TeleportFlash(this.root);
        this.#flash.trigger(time);
    }

    setPaint(color: string): void {
        this.#shell.setPaint(color);
    }

    illuminate(daylight: number, braking: boolean): void {
        this.#shell.illuminate(daylight, braking);
    }

    follow(pose: VehiclePose, damage: number): void {
        const { x, y, z } = pose.position;
        this.root.position.set(x, y, z);
        const q = pose.rotation;
        this.#rotation.set(q.x, q.y, q.z, q.w);
        this.#wheels.follow(pose.wheels);
        this.#shell.setDamage(damage);
    }
}
