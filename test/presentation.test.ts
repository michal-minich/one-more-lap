import test from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { cars } from "../src/game/vehicle/cars.ts";
import { tracks } from "../src/game/course/tracks.ts";
import { Course } from "../src/game/course/course.ts";
import { Opponents } from "../src/game/race/opponents.ts";
import { locate, wrapDistance } from "../src/game/course/route.ts";
import { difficulties } from "../src/game/race/setup.ts";
import type { Setup } from "../src/game/race/setup.ts";
import { createWorld } from "../src/game/vehicle/world.ts";
import { blendPose, yawRotation } from "../src/game/vehicle/pose.ts";
import type { VehiclePose } from "../src/game/vehicle/pose.ts";
import { ChaseRig } from "../src/render/camera/chase-rig.ts";
import { conditions } from "../src/game/race/conditions.ts";
import { HorizonHaze } from "../src/render/environment/haze.ts";

await RAPIER.init();

await test("clear skies leave terrain unfogged and rainy night haze stays dark", () => {
    const day = conditions(12, "sunny", 0, false);
    const rain = conditions(0, "rain", 0, false);
    const explicitFog = conditions(12, "fog", 0, false);
    for (const track of tracks) {
        const haze = new HorizonHaze(track.id);
        const color = haze.color(rain);
        assert.equal(haze.density(day), 0);
        assert.ok(haze.density(rain) > 0 && haze.density(rain) < 0.001);
        assert.ok(haze.density(explicitFog) > haze.density(rain));
        assert.ok(Math.max(color.r, color.g, color.b) < 0.33);
    }
});

await test("all six offline opponent levels have distinct pace and a zero-opponent field stays empty", () => {
    const course = new Course(tracks[0]);
    const setup: Setup = {
        car: cars[0], paint: cars[0].paint, track: course.track, direction: "forward", weather: "sunny", hour: 12, dynamic: false,
        laps: 3, opponents: 0, difficulty: "Normal",
    };
    const world = createWorld({ surfaces: course.surfaces, barriers: course.barriers });
    try {
        const solo = new Opponents(world, course, setup);
        assert.equal(solo.specs.length, 0);
        assert.equal(solo.aheadOf(-10), 0);
    } finally {
        world.free();
    }
    let last = 0;
    for (const difficulty of difficulties) {
        const track = createWorld({ surfaces: course.surfaces, barriers: course.barriers });
        try {
            const field = new Opponents(track, course, { ...setup, difficulty, opponents: 3 });
            for (let i = 0; i < 10 * 60; i++) {
                field.step(1, { distance: -10, lane: 16, speed: 0, driving: true });
                track.step();
            }
            assert.equal(field.specs.length, 3);
            assert.equal(field.aheadOf(0), 3);
            const pos = locate(course.route, field.pose(0, 1).position);
            assert.ok(pos.distance > last + 9, difficulty);
            assert.ok(Math.abs(pos.lateral) <= 3.1);
            last = pos.distance;
        } finally {
            track.free();
        }
    }
});

await test("a twelve-car field slows and passes a stationary car in either direction", () => {
    const course = new Course(tracks[0]);
    const car = cars[0];
    for (const direction of ["forward", "reverse"] as const) {
        const world = createWorld({ surfaces: course.surfaces, barriers: course.barriers });
        try {
            const line = course.raceLine(direction);
            const field = new Opponents(world, course, {
                car, paint: car.paint, track: course.track, direction, weather: "sunny", hour: 12,
                dynamic: false, laps: 3, opponents: 12, difficulty: "Legend",
            });
            const stopped = { distance: 235, lane: 0, speed: 0, driving: false };
            for (let tick = 0; tick < 1200; tick++) {
                field.step(1, stopped);
                for (const [index] of field.specs.entries()) {
                    const spot = line.locate(field.pose(index, 1).position);
                    const gap = wrapDistance(spot.distance - line.startLine.distance - stopped.distance, line.length);
                    const clearance = Math.min(gap, line.length - gap);
                    assert.ok(Math.abs(spot.lateral) >= 2.1 || clearance > 5.1, direction + " rival " + index);
                }
            }
            assert.equal(field.aheadOf(stopped.distance), 12);
        } finally {
            world.free();
        }
    }
});

await test("the chase camera shares one filtered height between its eye and aim", () => {
    const rig = new ChaseRig();
    const pose = (y: number, z: number): VehiclePose => ({
        position: { x: 0, y, z }, rotation: yawRotation(0), wheels: [],
    });
    const origin = pose(10, 0);
    const next = pose(10.12, 0.7);
    const half = blendPose(origin, next, 0.5);
    assert.equal(half.position.z, 0.35);
    assert.ok(Math.abs(half.position.y - 10.06) < 0.000001);
    const first = rig.follow(origin, 1 / 120, true);
    const aim = first.aim.y - first.eye.y;
    for (let i = 1; i <= 120; i++) {
        const bounce = i % 2 === 0 ? 0.08 : -0.08;
        const view = rig.follow(pose(10 + bounce, i / 3), 1 / 120, false);
        assert.ok(Math.abs((view.aim.y - view.eye.y) - aim) < 0.000001);
        assert.ok(Math.abs(view.eye.y - first.eye.y) < 0.009);
    }
    const reset = rig.follow(pose(18, 50), 1 / 120, true);
    assert.ok(Math.abs(reset.eye.y - 20.85) < 0.000001);
});

await test("a faster player draws a quicker field while seven distinct rivals spread out", () => {
    // Sample a long, open section before cornering limits can cap the fastest cars.
    const course = new Course(tracks.find(track => track.id === "ruins")!);
    const car = cars[0];
    const setup: Setup = {
        car, paint: car.paint, track: course.track, direction: "forward", weather: "sunny", hour: 12, dynamic: false,
        laps: 3, opponents: 7, difficulty: "Normal",
    };
    const sample = (speed: number): number[] => {
        const world = createWorld({ surfaces: course.surfaces, barriers: course.barriers });
        try {
            const field = new Opponents(world, course, setup);
            assert.equal(field.specs.length, 7);
            assert.equal(new Set(field.specs.map(spec => spec.paint)).size, 7);
            for (let tick = 0; tick < 900; tick++) {
                field.step(1, { distance: 80, lane: 18, speed, driving: true });
                world.step();
            }
            return field.specs.map((_, index) => locate(course.route, field.pose(index, 1).position).distance);
        } finally {
            world.free();
        }
    };
    const slow = sample(4);
    const fast = sample(43);
    for (const [index, distance] of fast.entries()) assert.ok(distance > slow[index]! + 55);
    const ordered = fast.toSorted((a, b) => a - b);
    assert.ok(ordered.at(-1)! - ordered[0]! > 80);
    for (let i = 1; i < ordered.length; i++) assert.ok(ordered[i]! - ordered[i - 1]! > 10);
});
