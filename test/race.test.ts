import test from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { cars } from "../src/game/vehicle/cars.ts";
import { tracks } from "../src/game/course/tracks.ts";
import { conditions, DAY_SECONDS } from "../src/game/race/conditions.ts";
import { Course } from "../src/game/course/course.ts";
import { courseSurfaces } from "../src/game/course/surfaces.ts";
import { LapProgress } from "../src/game/race/lap-progress.ts";
import { RaceRun } from "../src/game/race/run.ts";
import { RaceWeather } from "../src/game/race/race-weather.ts";
import type { Setup } from "../src/game/race/setup.ts";
import { pointOnRoute } from "../src/game/course/route.ts";
import { createWorld, STEP } from "../src/game/vehicle/world.ts";
import { Vehicle } from "../src/game/vehicle/vehicle.ts";
import type { DriveInput } from "../src/game/vehicle/driver-input.ts";
import { bodyForward, yawRotation } from "../src/game/vehicle/pose.ts";

await RAPIER.init();

const neutral: DriveInput = { throttle: 0, brake: 0, steer: 0, reverse: false };
const straight = [-25, 0, 25, 210, 425].map(z => ({ x: 0, y: 0, z, dx: 0, dz: 1, distance: z + 25 }));
const start = straight[1]!;
const surfaces = courseSurfaces(tracks[0], straight);

await test("braking into a turn at 100 km/h makes a driftable car slide more than a stable car", () => {
    const slip = (car: typeof cars[number], brake: number): number => {
        const world = createWorld({ surfaces, barriers: [] });
        const vehicle = new Vehicle(world, car, start);
        try {
            for (let tick = 0; tick < 65; tick++) vehicle.step(neutral, 1, false);
            vehicle.body.setLinvel({ x: 0, y: 0, z: 100 / 3.6 }, true);
            let peak = 0;
            for (let tick = 0; tick < 34; tick++) {
                vehicle.step({ ...neutral, brake, steer: 0.88 }, 1, false);
                const facing = bodyForward(vehicle.body.rotation());
                const velocity = vehicle.body.linvel();
                const cross = velocity.x * facing.z - velocity.z * facing.x;
                const dot = velocity.x * facing.x + velocity.z * facing.z;
                if (vehicle.speed > 80 / 3.6) peak = Math.max(peak, Math.abs(Math.atan2(cross, dot)));
            }
            return peak;
        } finally {
            vehicle.dispose();
            world.free();
        }
    };
    const veloce = cars[0];
    assert.ok(slip(veloce, 0.86) > 0.2);
    assert.ok(slip(veloce, 0) < 0.08);
    assert.ok(slip(cars.find(car => car.id === "bastion")!, 0.86) < 0.09);
});

await test("the lighting clock completes a day in 20 racing minutes and weather blends into the next state", () => {
    const initial = conditions(12, "sunny", 0, true);
    const midnight = conditions(12, "sunny", DAY_SECONDS / 2, true);
    const complete = conditions(12, "sunny", DAY_SECONDS, true);
    assert.equal(complete.hour, initial.hour);
    assert.equal(midnight.hour, 0);
    assert.ok(midnight.daylight < 0.01 && initial.daylight > 0.95);
    const before = conditions(18, "sunny", 48, true);
    const blend = conditions(18, "sunny", 56, true);
    const after = conditions(18, "sunny", 65, true);
    assert.ok(before.rain < blend.rain && blend.rain < after.rain);
    assert.ok(before.grip > blend.grip && blend.grip > after.grip);
    assert.equal(conditions(18, "snow", 720, false).snow, 1);
    assert.equal(conditions(18, "fog", 0, false).fog, 1);
});

await test("a paused weather change leaves the sun clock independent and each circuit uses one precipitation type", () => {
    const arctic = tracks.find(track => track.id === "arctic")!;
    const weather = new RaceWeather({ ...drySetup(arctic, cars[0]), dynamic: true });
    assert.equal(weather.read(65).weather, "snow");
    assert.equal(weather.read(65).rain, 0);
    weather.change({ hour: 0 }, 65);
    assert.equal(weather.read(65).hour, 0);
    assert.equal(weather.read(65).weather, "snow");
    weather.change({ weather: "sunny" }, 70);
    assert.equal(weather.read(70).weather, "sunny");
    assert.equal(weather.read(70).hour, 0.1);
    const alpine = tracks.find(track => track.id === "alpine")!;
    const alpineRain = new RaceWeather({ ...drySetup(alpine, cars[0]), weather: "rain" });
    assert.equal(alpineRain.read(0).rain, 1);
    assert.equal(alpineRain.read(0).snow, 0);
    const desert = tracks.find(track => track.id === "canyon")!;
    const dry = new RaceWeather({ ...drySetup(desert, cars[0]), dynamic: true, weather: "snow" });
    assert.equal(dry.read(0).weather, "rain");
    for (let second = 0; second < 240; second++) assert.equal(dry.read(second).snow, 0);
});

await test("each car stops from 100 km/h in a plausible dry range, with longer stops on snow", () => {
    const stop = (car: typeof cars[number], grip: number): number => {
        const vehicle = new Vehicle(createWorld({ surfaces, barriers: [] }), car, start);
        try {
            for (let tick = 0; tick < 75; tick++) vehicle.step(neutral, 1, false);
            vehicle.body.setLinvel({ x: 0, y: 0, z: 100 / 3.6 }, true);
            for (let tick = 0; tick < 500 && vehicle.speed > 0.3; tick++) {
                vehicle.step({ ...neutral, brake: 1 }, grip, false);
            }
            assert.ok(vehicle.speed <= 0.3);
            assert.equal(vehicle.damage, 0);
            return vehicle.body.translation().z;
        } finally {
            vehicle.dispose();
            vehicle.world.free();
        }
    };
    for (const car of cars) {
        const dry = stop(car, 1);
        const snow = stop(car, conditions(12, "snow", 0, false).grip);
        assert.ok(dry > 33 && dry < 43, car.name + " " + dry);
        assert.ok(snow > dry + 12, car.name + " " + snow);
    }
});

await test("parking bumps are forgiven and repeated heavy impacts reach damage stages before wrecking", () => {
    const wall = { a: { x: -7, y: 0, z: 8 }, b: { x: 7, y: 0, z: 8 } };
    const vehicle = new Vehicle(createWorld({ surfaces, barriers: [wall] }), cars[0], start);
    const hit = (speed: number, repair: boolean, target = vehicle): number => {
        target.reset(start, repair);
        for (let tick = 0; tick < 45; tick++) target.step(neutral, 1, false);
        target.body.setLinvel({ x: 0, y: 0, z: speed }, true);
        for (let tick = 0; tick < 300; tick++) target.step(neutral, 1, false);
        return target.damage;
    };
    try {
        assert.equal(hit(2, true), 0);
        const moderate = hit(9, true);
        assert.ok(moderate > 5 && moderate < 28);
        const severe = hit(28, true);
        assert.ok(severe >= 36 && severe <= 44);
        const second = hit(28, false);
        assert.ok(second >= 72 && second < 100);
        assert.equal(hit(28, false), 100);
        vehicle.reset(start, true);
        assert.equal(vehicle.damage, 0);
    } finally {
        vehicle.dispose();
        vehicle.world.free();
    }
    const protectedCar = new Vehicle(createWorld({ surfaces, barriers: [wall] }), cars[0], start, undefined, true);
    try {
        for (let attempt = 0; attempt < 3; attempt++) {
            assert.equal(hit(28, false, protectedCar), 0);
            assert.ok(protectedCar.body.translation().z < wall.a.z);
        }
    } finally {
        protectedCar.dispose();
        protectedCar.world.free();
    }
});

function drySetup(track: Setup["track"], car: Setup["car"]): Setup {
    return { track, direction: "forward", car, paint: car.paint, hour: 12, weather: "sunny", dynamic: false, laps: 3, opponents: 0, difficulty: "Normal" };
}

await test("the player starts at the back of the grid in either direction", () => {
    for (const track of tracks) {
        const course = new Course(track);
        for (const direction of ["forward", "reverse"] as const) {
            const run = new RaceRun(course, { ...drySetup(track, cars[0]), direction, opponents: 12 });
            try {
                const telemetry = run.snapshot();
                assert.equal(telemetry.place, 13, track.name + " " + direction);
                assert.equal(telemetry.drivers, 13);
                assert.equal(run.opponents.specs.length, 12);
                assert.equal(telemetry.progress, 0);
                assert.equal(telemetry.lapProgress, 0);
                assert.equal(telemetry.lap, 1);
            } finally {
                run.dispose();
            }
        }
    }
});

await test("a paused countdown freezes, then gives way to the timed race", () => {
    const alpine = tracks.find(track => track.id === "alpine");
    assert.ok(alpine);
    const course = new Course(alpine);
    const setup = drySetup(alpine, cars[0]);
    const run = new RaceRun(course, setup);
    const vehicle = run.vehicle;
    const throttle: DriveInput = { ...neutral, throttle: 1 };
    try {
        assert.equal(run.snapshot().startIn, 3);
        for (let tick = 0; tick < 120; tick++) run.advance(STEP, throttle);
        assert.equal(run.snapshot().startIn, 1);
        assert.equal(run.snapshot().elapsed, 0);
        assert.equal(vehicle.speed, 0);
        run.paused = true;
        for (let tick = 0; tick < 90; tick++) run.advance(STEP, throttle);
        assert.equal(run.snapshot().startIn, 1);
        run.paused = false;
        for (let tick = 0; tick < 120; tick++) run.advance(STEP, throttle);
        assert.equal(run.snapshot().startIn, 0);
        assert.equal(run.snapshot().elapsed, 1);
        assert.ok(run.snapshot().speed > 3);
        assert.equal(run.snapshot().lap, 1);
    } finally {
        run.dispose();
    }
});

await test("every circuit completes three laps in both directions through the collision geometry", () => {
    for (const [index, track] of tracks.entries()) {
        const course = new Course(track);
        const car = cars[index % cars.length]!;
        for (const direction of ["forward", "reverse"] as const) {
            driveCircuit(course, { ...drySetup(track, car), direction });
        }
    }
});

function driveCircuit(course: Course, setup: Setup): void {
    const run = new RaceRun(course, setup);
    const { line, vehicle } = run;
    const description = course.track.name + " " + setup.direction;
    try {
        const completedLaps = new Set<number>();
        let lastLap = 1;
        const maxTicks = Math.max(22_000, Math.ceil(course.length * setup.laps / (16 * STEP)));
        for (let tick = 0; tick < maxTicks && !run.finished; tick++) {
            const position = vehicle.body.translation();
            const here = line.locate(position);
            const q = vehicle.body.rotation();
            const target = line.at(here.distance + 24);
            const desired = Math.atan2(target.x - position.x, target.z - position.z);
            const yaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.x * q.x + q.y * q.y));
            const difference = Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw));
            run.advance(STEP, {
                throttle: Math.max(0, Math.min(1, (19 - vehicle.speed) * 0.32)),
                brake: vehicle.speed > 21.5 ? 0.22 : 0,
                steer: Math.min(1, Math.max(-1, difference * 1.95)),
                reverse: false,
            });
            const { lap, lapProgress } = run.snapshot();
            if (lap !== lastLap) {
                assert.ok(lapProgress < 0.01, description + " lap progress should reset");
                completedLaps.add(lap);
                lastLap = lap;
            }
        }
        assert.equal(run.snapshot().finish, "finished", description + " " + JSON.stringify(run.snapshot()));
        assert.equal(run.snapshot().progress, 1, description);
        assert.equal(run.snapshot().lapProgress, 1, description);
        assert.deepEqual([...completedLaps], [2, 3], description);
        assert.equal(vehicle.damage, 0, description);
    } finally {
        run.dispose();
    }
}

await test("laps require forward crossings in order and accept the driveable verge", () => {
    const course = new Course(tracks[0]);
    const laps = new LapProgress(course, 3);
    const gate = course.startLine;
    const side = (distance: number, lateral: number): ReturnType<typeof pointOnRoute> => ({
        ...pointOnRoute(gate, lateral), x: gate.x + gate.dx * distance + gate.dz * lateral,
        z: gate.z + gate.dz * distance - gate.dx * lateral,
    });
    laps.observe(side(2, 0), side(-2, 0));
    assert.equal(laps.acceptsRecoveryAt(gate.distance + 4), false);
    laps.observe(side(-2, 17), side(2, 17));
    assert.equal(laps.acceptsRecoveryAt(gate.distance + 4), false);
    laps.observe(side(-2, 9), side(2, 9));
    assert.equal(laps.acceptsRecoveryAt(gate.distance + 4), true);
    for (let i = 0; i < 4; i++) laps.observe(side(-2, 0), side(2, 0));
    assert.equal(laps.lap, 1);
    assert.equal(laps.finished, false);
});

await test("holding the brake after stopping engages reverse", () => {
    const vehicle = new Vehicle(createWorld({ surfaces, barriers: [] }), cars[0], start);
    try {
        for (let i = 0; i < 60; i++) vehicle.step(neutral, 1, false);
        vehicle.body.setLinvel({ x: 0, y: 0, z: 12 }, true);
        const brake: DriveInput = { ...neutral, brake: 1 };
        for (let i = 0; i < 135; i++) vehicle.step(brake, 1, false);
        assert.ok(vehicle.body.linvel().z < -1, "continued Brake engages reverse");
        for (let i = 0; i < 90; i++) vehicle.step({ ...neutral, throttle: 1 }, 1, false);
        assert.ok(vehicle.body.linvel().z > 2, "accelerator can return to forward after reversing");
    } finally {
        vehicle.dispose();
        vehicle.world.free();
    }
});

await test("the wrong-way warning waits for sustained backward travel and does not block the car", () => {
    const course = new Course(tracks[0]);
    const setup = drySetup(course.track, cars[0]);
    const run = new RaceRun(course, setup);
    const vehicle = run.vehicle;
    try {
        for (let i = 0; i < 180; i++) run.advance(STEP, neutral);
        vehicle.body.setRotation(yawRotation(Math.atan2(course.start.dx, course.start.dz) + Math.PI), true);
        for (let i = 0; i < 30; i++) run.advance(STEP, { ...neutral, throttle: 1 });
        assert.equal(run.snapshot().wrongWay, false);
        for (let i = 0; i < 100; i++) run.advance(STEP, { ...neutral, throttle: 1 });
        assert.equal(run.snapshot().wrongWay, true);
        assert.ok(run.snapshot().speed > 5);
        assert.equal(run.recover(), true);
        assert.equal(run.snapshot().wrongWay, false);
        assert.equal(run.snapshot().speed, 0);
        assert.equal(run.snapshot().lap, 1);
    } finally {
        run.dispose();
    }
});

await test("a wreck pins the player and timer while rivals continue the race", () => {
    const course = new Course(tracks[0]);
    const run = new RaceRun(course, { ...drySetup(course.track, cars[0]), opponents: 3 });
    try {
        for (let tick = 0; tick < 230; tick++) run.advance(STEP, { ...neutral, throttle: 1 });
        run.vehicle.damage = 100;
        run.advance(STEP, neutral);
        const elapsed = run.snapshot().elapsed;
        const wreck = run.pose().position;
        const before = run.opponents.pose(0, 1).position;
        for (let tick = 0; tick < 150; tick++) run.advance(STEP, { ...neutral, throttle: 1, steer: 1 });
        const after = run.opponents.pose(0, 1).position;
        assert.equal(run.snapshot().finish, "wrecked");
        assert.equal(run.snapshot().elapsed, elapsed);
        assert.equal(run.snapshot().speed, 0);
        assert.deepEqual(run.pose().position, wreck);
        assert.ok(Math.hypot(after.x - before.x, after.z - before.z) > 12);
    } finally {
        run.dispose();
    }
});

await test("the finish records one result and leaves the player and rivals driving", () => {
    const course = new Course(tracks[0]);
    const run = new RaceRun(course, { ...drySetup(course.track, cars[0]), laps: 1, opponents: 3 });
    try {
        for (let tick = 0; tick < 180; tick++) run.advance(STEP, neutral);
        let completed = 0;
        for (const gate of [...run.line.gates, run.line.startLine]) {
            run.vehicle.reset({ ...gate, x: gate.x - gate.dx * 0.24, z: gate.z - gate.dz * 0.24 });
            run.vehicle.body.setLinvel({ x: gate.dx * 27, y: 0, z: gate.dz * 27 }, true);
            completed += run.advance(STEP, neutral).completedLaps.length;
        }
        const result = run.snapshot();
        assert.equal(result.finish, "finished");
        assert.equal(result.place, 1);
        assert.equal(completed, 1);
        assert.ok(run.driving);
        const playerBefore = run.vehicle.body.translation();
        const rivalBefore = run.opponents.pose(0, 1).position;
        for (let tick = 0; tick < 90; tick++) {
            assert.equal(run.advance(STEP, { ...neutral, throttle: 1 }).completedLaps.length, 0);
        }
        const playerAfter = run.vehicle.body.translation();
        const rivalAfter = run.opponents.pose(0, 1).position;
        assert.ok(Math.hypot(playerAfter.x - playerBefore.x, playerAfter.z - playerBefore.z) > 15);
        assert.ok(Math.hypot(rivalAfter.x - rivalBefore.x, rivalAfter.z - rivalBefore.z) > 3);
        const after = run.snapshot();
        assert.equal(after.elapsed, result.elapsed);
        assert.equal(after.place, result.place);
        assert.equal(after.lapTiming.seconds, result.lapTiming.seconds);
        assert.ok(after.conditions.hour > result.conditions.hour);
        assert.ok(run.recover());
        assert.equal(run.snapshot().result, result.result);
    } finally {
        run.dispose();
    }
});
