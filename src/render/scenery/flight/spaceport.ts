import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { mantaModel } from "../../models/manta.ts";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import type { AresLandingPad } from "../../../game/course/ares-cutworks.ts";
import type { Stamp } from "../instances.ts";
import { offset, UrbanParts } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { drawOrbitalLift } from "./orbital-lift.ts";
import { Spacecraft } from "./spacecraft.ts";
import { drawUtilityShuttles } from "./utility-shuttle.ts";

const charcoal = "#565465";
const oxide = "#be774b";
export const surveyCarrierSite = { distance: 975, lateral: -40 } as const;

export function drawSpaceport(scene: Scene, course: Course): (time: number) => void {
    const hulls = new Spacecraft(scene);
    const buildings = new UrbanParts(scene);
    const carrier = hulls.carrier();
    // The eastern rim gives the carrier a long, open approach in both directions.
    const hover = site(course, surveyCarrierSite.distance, surveyCarrierSite.lateral);
    const hoverHeight = Math.max(hover.point.y, hover.row.y - 0.9) + 19.7;
    const yaw = Math.atan2(hover.row.dx, hover.row.dz) + 0.95;
    carrier.position.set(hover.point.x, hoverHeight, hover.point.z);
    carrier.rotation.y = yaw;

    const shuttles: Stamp[] = [];
    for (const pad of course.aresCutworks?.pads ?? []) {
        landingPad(buildings.add, pad);
        if (pad.showcase) {
            const craft = new TransformNode("Manta on Ares survey pad", scene);
            craft.position.set(pad.x, pad.y + 0.66, pad.z);
            craft.scaling.setAll(1.64);
            craft.rotation.y = pad.yaw + Math.PI;
            mantaModel(scene, craft);
            continue;
        }
        shuttles.push({ x: pad.x, y: pad.y + 0.635, z: pad.z, sx: 2.1, sy: 2.1, sz: 2.1, yaw: pad.yaw });
    }
    drawUtilityShuttles(scene, shuttles);

    const tower = site(course, 362, 39);
    const lift = drawOrbitalLift(scene, buildings.add, tower.point, Math.atan2(tower.row.dx, tower.row.dz));
    buildings.draw();
    return (time: number): void => {
        carrier.position.y = hoverHeight + Math.sin(time * 0.39) * 0.84;
        carrier.rotation.y = yaw + Math.sin(time * 0.085) * 0.23;
        carrier.rotation.z = Math.sin(time * 0.26) * 0.033;
        lift(time);
    };
}

function site(course: Course, distance: number, lateral: number) {
    const row = course.at(distance);
    const at = pointOnRoute(row, lateral);
    return { row, point: { ...at, y: course.ground.at(at.x, at.z) ?? at.y } };
}

function landingPad(build: BuildPart, at: AresLandingPad): void {
    const { bottom, yaw } = at;
    const top = at.y + 0.5;
    build("landing pad foundation", { ...at, y: (top + bottom) / 2, sx: 9.35, sy: top - bottom, sz: 12.4, yaw }, oxide, "oval");
    build("landing pad deck", { ...at, y: at.y + 0.53, sx: 8.74, sy: 0.21, sz: 11.48, yaw }, charcoal, "oval");
    for (const side of [-1, 1]) {
        const light = offset(at, yaw, side * 3.45, 0);
        build("hall lantern", { ...light, y: at.y + 0.65, sx: 0.21, sy: 0.14, sz: 5.4, yaw }, "#cce2bc");
    }
}
