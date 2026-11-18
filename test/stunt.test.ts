import assert from "node:assert/strict";
import test from "node:test";
import RAPIER from "@dimforge/rapier3d-compat";
import { Course } from "../src/game/course/course.ts";
import { pointOnRoute } from "../src/game/course/route.ts";
import { roadHalfWidth } from "../src/game/course/road-width.ts";
import { bladeCenters, gateSites } from "../src/game/course/stunt/gate.ts";
import { tracks } from "../src/game/course/tracks.ts";
import { RaceRun } from "../src/game/race/run.ts";
import { StuntCourse } from "../src/game/race/stunt.ts";
import { cars } from "../src/game/vehicle/cars.ts";
import { bodyForward } from "../src/game/vehicle/pose.ts";
import { createWorld, STEP } from "../src/game/vehicle/world.ts";

await RAPIER.init();
const track = tracks.find(spec => spec.id === "stunt")!;
const course = new Course(track);
const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };

await test("Skywheel keeps both lanes clear beneath the gallery and grounds the terrace paving", () => {
    const grounds = course.skywheelGrounds!;
    const world = createWorld(course);
    try {
        new StuntCourse(world, course, "forward");
        world.step();
        assert.equal(grounds.footings.length, 10);
        assert.equal(grounds.roof.length, 3);
        assert.equal(grounds.terraces.length, 5);
        for (const sign of [-1, 1]) {
            for (let distance = 174; distance <= 226; distance += 3.25) {
                const row = course.at(distance);
                const edge = roadHalfWidth("stunt", distance) - 1.05;
                for (const across of [-edge, 0, edge]) {
                    const at = pointOnRoute(row, across, 0.72);
                    const lane = new RAPIER.Ray(at, { x: row.dx * sign, y: 0, z: row.dz * sign });
                    assert.equal(world.castRay(lane, 2.1, true), null);
                    const road = world.castRay(new RAPIER.Ray(at, { x: 0, y: -1, z: 0 }), 1, true);
                    assert.ok(road && Math.abs(road.timeOfImpact - 0.72) < 0.07);
                }
            }
        }
        const { catwalk } = grounds;
        const below = { x: catwalk.x, y: catwalk.y - 6, z: catwalk.z };
        const deck = world.castRay(new RAPIER.Ray(below, { x: 0, y: 1, z: 0 }), 7, true);
        assert.ok(deck && Math.abs(deck.timeOfImpact - 5.62) < 0.05);
        const { wheelPad, carousel } = grounds;
        for (const top of [
            { ...wheelPad, y: wheelPad.y + wheelPad.height / 2 },
            { ...carousel, y: carousel.y + 0.96 },
        ]) {
            const high = { ...top, y: top.y + 0.52 };
            const ride = world.castRay(new RAPIER.Ray(high, { x: 0, y: -1, z: 0 }), 0.6, true);
            assert.ok(ride && Math.abs(ride.timeOfImpact - 0.52) < 0.04);
        }
        for (const distance of [89, 97, 108, 124, 381, 394, 403, 413]) {
            const row = course.at(distance);
            for (const across of [-1.05, 0, 1.05]) {
                const at = pointOnRoute(row, across, 0.68);
                const road = world.castRay(new RAPIER.Ray(at, { x: 0, y: -1, z: 0 }), 0.77, true);
                assert.ok(road && Math.abs(road.timeOfImpact - 0.68) < 0.06);
            }
        }
        for (const terrace of grounds.terraces) {
            const offset = Math.floor(terrace.positions.length / 36) * 18 + 12;
            const point = { x: terrace.positions[offset]!, y: terrace.positions[offset + 1]! + 0.6,
                z: terrace.positions[offset + 2]! };
            const top = world.castRay(new RAPIER.Ray(point, { x: 0, y: -1, z: 0 }), 0.7, true);
            assert.ok(top && Math.abs(top.timeOfImpact - 0.6) < 0.07);
        }
    } finally {
        world.free();
    }
});

for (const loop of course.stuntLoops) {
    const sign = loop.direction === "forward" ? 1 : -1;
    const position = { ...loop.mouth, z: loop.mouth.z - 12 * sign, dx: 0, dz: sign, distance: 0 };
    const makeRun = () => {
        const run = new RaceRun(course, {
            track, car: cars[0], paint: cars[0].paint, direction: loop.direction,
            hour: 12, weather: "sunny", dynamic: false, laps: 3, opponents: 0, difficulty: "Normal",
        });
        while (!run.driving) run.advance(STEP, neutral);
        return run;
    };

    await test(`Skywheel ${loop.direction} completes a physical loop with four wheels on the inverted road`, () => {
        const run = makeRun();
        try {
            run.vehicle.reset(position);
            run.vehicle.body.setLinvel({ x: 0, y: 0, z: 24 * sign }, true);
            let contacts = 0;
            let exit = false;
            for (let tick = 0; tick < 490 && !exit; tick++) {
                const frame = run.advance(STEP, { ...neutral, throttle: 1 });
                const at = run.vehicle.body.translation();
                const direction = bodyForward(run.vehicle.body.rotation());
                const along = (at.z - loop.mouth.z) * sign;
                assert.equal(frame.recovered, false);
                if (at.y > loop.exit.y + 11 && direction.z * sign < -0.6) {
                    contacts = Math.max(contacts, [0, 1, 2, 3].filter(i => run.vehicle.controller.wheelIsInContact(i)).length);
                }
                exit = contacts >= 3 && along > 20 && at.y > loop.exit.y - 1.6 && at.y < loop.exit.y + 2.5;
            }
            assert.equal(contacts, 4);
            assert.equal(exit, true);
            assert.equal(run.vehicle.damage, 0);
        } finally {
            run.dispose();
        }
    });

    await test(`Skywheel ${loop.direction} gives a slow car a clear run-up to retry`, () => {
        const run = makeRun();
        try {
            run.vehicle.reset(position);
            run.vehicle.body.setLinvel({ x: 0, y: 0, z: 8 * sign }, true);
            let recovered = false;
            for (let tick = 0; tick < 400 && !recovered; tick++) {
                recovered = run.advance(STEP, { ...neutral, throttle: 1 }).recovered;
            }
            const retry = run.vehicle.body.translation();
            assert.ok(recovered && (retry.z - loop.mouth.z) * sign < -74);
            assert.equal(run.vehicle.speed, 0);
            let inverted = false;
            for (let tick = 0; tick < 850 && !inverted; tick++) {
                assert.equal(run.advance(STEP, { ...neutral, throttle: 1 }).recovered, false);
                inverted = run.vehicle.body.translation().y > loop.exit.y + 11;
            }
            assert.ok(inverted);
        } finally {
            run.dispose();
        }
    });

    await test(`Skywheel ${loop.direction} timed blades physically block a car and lift clear of the deck`, () => {
        const run = makeRun();
        try {
            const at = gateSites(course)[sign > 0 ? 0 : 1]!;
            assert.ok(Math.abs(course.locate(at).lateral - sign * 4.24) < 0.15);
            assert.ok(Math.abs(at.z - loop.mouth.z) > 35);
            assert.ok(bladeCenters(at.y, 0)[0] < at.y + 1);
            assert.ok(bladeCenters(at.y, 3)[0] > at.y + 4);
            const before = { ...at, x: at.x - sign * at.dx * 5, z: at.z - sign * at.dz * 5,
                dx: at.dx * sign, dz: at.dz * sign, distance: 0 };
            run.vehicle.reset(before);
            run.vehicle.body.setLinvel({ x: 0, y: 0, z: 24 * sign }, true);
            let hit = false;
            for (let tick = 0; tick < 32; tick++) {
                const frame = run.advance(STEP, neutral);
                hit ||= frame.impact > 0;
            }
            assert.ok(hit && run.vehicle.damage > 0);
            run.vehicle.reset({ ...before, z: before.z - sign * 14 }, true);
            for (let tick = 0; tick < 140; tick++) run.advance(STEP, neutral);
            run.vehicle.reset(before, true);
            run.vehicle.body.setLinvel({ x: 0, y: 0, z: 18 * sign }, true);
            for (let tick = 0; tick < 38; tick++) run.advance(STEP, neutral);
            assert.ok((run.vehicle.body.translation().z - at.z) * sign > 3);
            assert.equal(run.vehicle.damage, 0);
        } finally {
            run.dispose();
        }
    });
}
