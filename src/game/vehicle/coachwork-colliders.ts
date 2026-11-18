import RAPIER from "@dimforge/rapier3d-compat";
import { bodyOutline, bodyProfiles, bodyShape, cabinCorner } from "./body-shapes.ts";
import type { CarSpec } from "./cars.ts";
import { parkedSuspension, wheelPositions } from "./wheels.ts";

export function coachworkColliders(car: CarSpec): readonly [RAPIER.ColliderDesc, RAPIER.ColliderDesc] {
    const shape = bodyShape(car);
    const shell = bodyOutline(bodyProfiles(car, shape), shape);
    for (const { x, y, z } of wheelPositions(car)) {
        const outer = x + Math.sign(x) * (car.tire.tread / 2 + 0.022);
        const center = y - parkedSuspension(car);
        const radius = car.tire.radius;
        shell.push(outer, center + radius * 0.4, z, outer, center, z - radius * 0.8, outer, center, z + radius * 0.8);
    }
    // Splitter and bumper lead the bodywork at each end.
    for (const side of [-1, 1]) {
        shell.push(side * car.width * 0.37, shape.sill + 0.04, car.length * 0.5 + 0.075);
        shell.push(side * car.width * 0.38, shape.sill + 0.07, -car.length * 0.5 - 0.074);
        if (car.id === "bastion") {
            shell.push(side * car.width * 0.38, car.nose - 0.74, car.length * 0.5 + 0.20);
            shell.push(side * car.width * 0.38, car.nose - 0.83, -car.length * 0.5 - 0.13);
        }
    }

    const cabin: number[] = [];
    for (const side of [-1, 1]) {
        for (const point of [shape.rearSill, shape.frontSill, shape.rearRoof, shape.frontRoof]) {
            const { x, y, z } = cabinCorner(car, shape, point, side, point === shape.rearRoof || point === shape.frontRoof);
            cabin.push(x, y, z);
        }
    }
    return [hull(shell, car), hull(cabin, car)];
}

function hull(vertices: number[], car: CarSpec): RAPIER.ColliderDesc {
    const collider = RAPIER.ColliderDesc.convexHull(new Float32Array(vertices));
    if (!collider) throw new Error("Could not fit the body collider for " + car.name);
    return collider;
}
