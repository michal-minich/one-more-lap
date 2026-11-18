import test from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { tracks } from "../src/game/course/tracks.ts";
import { courseSurfaces } from "../src/game/course/surfaces.ts";
import { bodyShape } from "../src/game/vehicle/body-shapes.ts";
import { cars } from "../src/game/vehicle/cars.ts";
import type { CarSpec } from "../src/game/vehicle/cars.ts";
import { bodyForward } from "../src/game/vehicle/pose.ts";
import { Vehicle } from "../src/game/vehicle/vehicle.ts";
import { createWorld } from "../src/game/vehicle/world.ts";

await RAPIER.init();

const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
const straight = [-45, 0, 45, 100, 250].map(z => ({ x: 0, y: 0, z, dx: 0, dz: 1, distance: z + 45 }));
const surfaces = courseSurfaces(tracks[0], straight);

await test("the compact hatch turns sooner and the armored truck resists a roll", () => {
    const hatch = cars.find(car => car.id === "mistral");
    const truck = cars.find(car => car.id === "bastion");
    assert.ok(hatch && truck);
    const turn = (car: CarSpec): number => withCar(car, vehicle => {
        vehicle.body.setLinvel({ x: 0, y: 0, z: 9.8 }, true);
        for (let i = 0; i < 19; i++) vehicle.step({ ...neutral, throttle: 0.24, steer: 1 }, 1, false);
        return Math.abs(bodyForward(vehicle.body.rotation()).x);
    });
    const roll = (car: CarSpec): number => withCar(car, vehicle => {
        vehicle.body.applyTorqueImpulse({ x: 0, y: 0, z: 2_800 }, true);
        let lowestUp = 1;
        for (let i = 0; i < 38; i++) {
            vehicle.step(neutral, 1, false);
            const { x, z } = vehicle.body.rotation();
            lowestUp = Math.min(lowestUp, 1 - 2 * (x ** 2 + z ** 2));
        }
        return lowestUp;
    });
    assert.ok(turn(hatch) > turn(truck) * 1.35);
    assert.ok(roll(truck) > 0.91);
    assert.ok(roll(hatch) < 0);
});

await test("car contact reaches the front and rear bumper of each model", () => {
    for (const car of cars) {
        withCar(car, vehicle => {
            const { x, y, z } = vehicle.body.translation();
            const shell = vehicle.body.collider(0);
            const groundToBumper = y + bodyShape(car).sill + 0.072;
            for (const end of [-1, 1]) {
                const start = { x, y: groundToBumper, z: z + end * (car.length / 2 + 1) };
                const ray = new RAPIER.Ray(start, { x: 0, y: 0, z: -end });
                const hit = shell.castRay(ray, 1.25, true);
                assert.ok(hit >= 0.75 && hit < 1.05, car.name + " bumper " + end + " " + hit);
            }
        });
    }
});

function withCar<T>(car: CarSpec, measure: (vehicle: Vehicle) => T): T {
    const vehicle = new Vehicle(createWorld({ surfaces, barriers: [] }), car, straight[1]!);
    try {
        for (let i = 0; i < 55; i++) vehicle.step(neutral, 1, false);
        return measure(vehicle);
    } finally {
        vehicle.dispose();
        vehicle.world.free();
    }
}
