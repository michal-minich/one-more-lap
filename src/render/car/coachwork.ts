import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { CarId, CarSpec } from "../../game/vehicle/cars.ts";
import { material } from "../materials.ts";
import { bodyProfiles, sideOfBody } from "../../game/vehicle/body-shapes.ts";
import type { BodyShape } from "../../game/vehicle/body-shapes.ts";

interface SideDetail {
    readonly stripe: string;
    readonly sill: number;
    readonly end: number;
    readonly stripeHeight: number;
}

const sideDetails: Record<CarId, SideDetail> = {
    veloce: { stripe: "#d0c8b6", sill: -0.182, end: 0.146, stripeHeight: 0.19 },
    summit: { stripe: "#f4d6a2", sill: -0.224, end: 0.176, stripeHeight: 0.37 },
    mistral: { stripe: "#e5d1a5", sill: -0.193, end: 0.174, stripeHeight: 0.64 },
    bastion: { stripe: "#cf9857", sill: -0.15, end: 0.14, stripeHeight: 0.52 },
    aero: { stripe: "#8acedb", sill: -0.20, end: 0.132, stripeHeight: 0.32 },
    buggy: { stripe: "#f1d7ab", sill: -0.15, end: 0.13, stripeHeight: 0.39 },
    kestrel: { stripe: "#f0d5a1", sill: -0.175, end: 0.169, stripeHeight: 0.40 },
    orbit: { stripe: "#cc9361", sill: -0.20, end: 0.15, stripeHeight: 0.38 },
    manta: { stripe: "#64cfd2", sill: -0.19, end: 0.13, stripeHeight: 0.38 },
};

export function addCoachwork(scene: Scene, root: TransformNode, car: CarSpec, shape: BodyShape): void {
    const profiles = bodyProfiles(car, shape);
    const groove = material(scene, "recessed panel seams", "#3e3835");
    const rubber = material(scene, "satin arch trim", "#2b3033");
    const detail = sideDetails[car.id];
    const highlight = material(scene, "side stripe and badges", detail.stripe);
    highlight.specularColor.set(0.30, 0.32, 0.34);

    for (const side of [-1, 1]) {
        const sidePoint = (z: number, height: number, lift: number): Vector3 => {
            const point = sideOfBody(profiles, shape, z, height);
            return new Vector3(side * (point.x + lift), point.y, z);
        };
        const at = (along: number, height: number, lift = 0.007): Vector3 => sidePoint(car.length * along, height, lift);
        const [back, front] = [detail.sill, detail.end];
        if (car.id !== "orbit") {
            const outline = [[back, 0.91], [back - 0.009, 0.59], [back + 0.022, 0.19], [-0.034, 0.15],
                [front - 0.016, 0.19], [front + 0.013, 0.65], [front, 0.91]] as const;
            const seam = [at(back, 0.91, 0.014)];
            for (let i = 1; i < outline.length; i++) {
                const [along, height] = outline[i - 1]!;
                const [end, top] = outline[i]!;
                const segments = Math.ceil(Math.max(Math.abs(end - along) * car.length / 0.085, Math.abs(top - height) * 8));
                for (let step = 1; step <= segments; step++) {
                    const t = step / segments;
                    seam.push(at(along + (end - along) * t, height + (top - height) * t, 0.014));
                }
            }
            tube(scene, root, "door shutline", seam, 0.0105, groove);
        }
        const stripe = Array.from({ length: 9 }, (_, index) => {
            const along = back + 0.034 + index / 8 * (front - back - 0.044);
            const height = detail.stripeHeight + (car.id === "summit" ? (index / 8) ** 4 * 0.34 : 0);
            return at(along, height, 0.017);
        });
        tube(scene, root, "fitted body accent", stripe, car.id === "summit" || car.id === "orbit" ? 0.027 : 0.014, highlight);
        for (const axle of [-car.wheelbase * 0.5, car.wheelbase * 0.5]) {
            const arch = car.tire.radius + 0.052;
            const edge = Array.from({ length: 13 }, (_, step) =>
                sidePoint(axle + (step / 6 - 1) * arch, 0.10, 0.019));
            const width = car.id === "summit" || car.id === "bastion" ? 0.032 : 0.018;
            tube(scene, root, "wheel arch bead", edge, width, rubber);
        }
    }
}

function tube(scene: Scene, root: TransformNode, name: string, path: Vector3[], radius: number, paint: StandardMaterial): void {
    const mesh = MeshBuilder.CreateTube(name, { path, radius, tessellation: 6 }, scene);
    mesh.material = paint;
    mesh.parent = root;
    mesh.isPickable = false;
}
