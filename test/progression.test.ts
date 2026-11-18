import test from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { Course } from "../src/game/course/course.ts";
import { locate, wrapDistance } from "../src/game/course/route.ts";
import { courseSurfaces } from "../src/game/course/surfaces.ts";
import { tracks } from "../src/game/course/tracks.ts";
import { awardCoins, buyCar, buyPower, canDrive, emptyProfile, readPlayerProfile } from "../src/game/progression/profile.ts";
import { CoinField } from "../src/game/race/coin-field.ts";
import { RacePowers } from "../src/game/race/active-powers.ts";
import { RaceRun } from "../src/game/race/run.ts";
import { cars } from "../src/game/vehicle/cars.ts";
import { Vehicle } from "../src/game/vehicle/vehicle.ts";
import { createWorld } from "../src/game/vehicle/world.ts";
import { rivalCollisionGroups } from "../src/game/vehicle/collision-groups.ts";

await RAPIER.init();

await test("a coin is awarded once per race, and permanent purchases spend the balance once", () => {
    const field = new CoinField(new Course(tracks[0]), false);
    const first = field.coins[0]!;
    const { x, y, z } = first.position;
    const picked: number[] = [];
    field.collect({ x: x - 4, y, z }, { x: x + 4, y, z }, picked);
    field.collect({ x, y, z }, { x, y, z }, picked);
    assert.deepEqual(picked, [first.index]);
    const wallet = awardCoins(emptyProfile, 6);
    const equipped = buyPower(wallet, "boost");
    assert.deepEqual(equipped, { coins: 2, owned: ["boost"], ownedCars: [] });
    assert.equal(buyPower(equipped, "boost"), equipped);
    assert.equal(buyPower(equipped, "jump"), equipped);
    assert.deepEqual(readPlayerProfile({ coins: 2, owned: ["boost", "boost", "obsolete"] }), equipped);
});

await test("the Orbit unlock preserves earlier upgrades and cannot be purchased twice", () => {
    const orbit = cars.find(car => car.id === "orbit")!;
    const legacy = readPlayerProfile({ coins: 7, owned: ["jump"] });
    assert.equal(canDrive(legacy, orbit), false);
    assert.equal(canDrive(legacy, cars[0]), true);
    assert.equal(buyCar(emptyProfile, orbit.id), emptyProfile);
    const garage = buyCar(legacy, orbit.id);
    assert.equal(canDrive(garage, orbit), true);
    assert.equal(buyCar(garage, orbit.id), garage);
    assert.deepEqual(readPlayerProfile(garage), { coins: 1, owned: ["jump"], ownedCars: ["orbit"] });
});

await test("jump lifts a grounded car and rocket boost recharges over one third of a lap", () => {
    const route = [-30, 0, 40, 250].map(z => ({ x: 0, y: 0, z, dx: 0, dz: 1, distance: z + 30 }));
    const powers = new RacePowers(600, ["jump", "boost"]);
    const vehicle = new Vehicle(createWorld({ surfaces: courseSurfaces(tracks[0], route), barriers: [] }), cars[0], route[1]!);
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    try {
        for (let i = 0; i < 60; i++) vehicle.step(neutral, 1, false);
        powers.request("jump");
        powers.step(20, vehicle);
        assert.ok(vehicle.body.linvel().y > 5);
        assert.equal(powers.view().jump, 0);
        powers.request("boost");
        powers.step(20, vehicle);
        assert.ok(vehicle.speed > 0.15);
        assert.equal(powers.view().boosting, true);
        assert.equal(powers.view().boost, 0);
        powers.step(15, vehicle);
        assert.equal(powers.view().boost, 0);
        powers.step(119, vehicle);
        assert.ok(Math.abs(powers.view().boost! - 0.495) < 0.001);
        assert.ok(powers.view().jump! < 1);
        powers.step(219, vehicle);
        assert.ok(powers.view().boost! < 1);
        assert.equal(powers.view().jump, 1);
        powers.step(220, vehicle);
        assert.equal(powers.view().boost, 1);
    } finally {
        vehicle.dispose();
        vehicle.world.free();
    }
});

await test("teleport advances 100 metres at speed, phases briefly and works again after recharging", () => {
    const course = new Course(tracks[0]);
    const car = cars[0];
    const run = new RaceRun(course, {
        car, track: course.track, direction: "forward", paint: car.paint, weather: "sunny", hour: 12, dynamic: false,
        laps: 3, opponents: 0, difficulty: "Normal",
    }, { fastestLap: undefined, owned: ["teleport"] });
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    try {
        for (let i = 0; i < 181; i++) run.advance(1 / 60, neutral);
        const before = locate(course.route, run.vehicle.body.translation()).distance;
        run.vehicle.body.setLinvel({ x: 15 * course.start.dx, y: 0, z: 15 * course.start.dz }, true);
        run.usePower("teleport");
        const frame = run.advance(1 / 60, neutral);
        const after = locate(course.route, run.vehicle.body.translation()).distance;
        const jump = wrapDistance(after - before, course.length);
        assert.ok(jump > 99.9 && jump < 100.5, String(jump));
        assert.ok(Math.abs(run.vehicle.speed - 15) < 0.2, String(run.vehicle.speed));
        assert.equal(frame.recovered, true);
        assert.equal(frame.teleport, "used");
        assert.deepEqual(frame.pickedCoins, []);
        assert.equal(run.snapshot().missedGate, false);
        assert.ok(run.snapshot().lapTiming.seconds > 0);
        assert.equal(run.snapshot().powers.phasing, true);
        assert.ok(run.snapshot().powers.teleport! < 0.01);
        for (let i = 0; i < 145; i++) run.advance(1 / 60, neutral);
        assert.equal(run.snapshot().powers.phasing, false);
        for (let i = 0; i < 5_000 && run.snapshot().powers.teleport! < 1; i++) {
            const position = run.vehicle.body.translation();
            const here = run.line.locate(position);
            const target = run.line.at(here.distance + 24);
            const yaw = run.vehicle.body.rotation();
            const bearing = Math.atan2(2 * (yaw.w * yaw.y + yaw.x * yaw.z), 1 - 2 * (yaw.x ** 2 + yaw.y ** 2));
            const turn = Math.atan2(target.x - position.x, target.z - position.z) - bearing;
            run.advance(1 / 60, {
                ...neutral, steer: Math.max(-1, Math.min(1, Math.atan2(Math.sin(turn), Math.cos(turn)) * 1.95)),
                throttle: Math.max(0, Math.min(1, (19 - run.vehicle.speed) * 0.32)),
                brake: run.vehicle.speed > 21.5 ? 0.22 : 0,
            });
        }
        assert.equal(run.snapshot().powers.teleport, 1, "the second charge is ready");
        run.usePower("teleport");
        assert.equal(run.advance(1 / 60, neutral).teleport, "used");
        assert.ok(run.snapshot().powers.teleport! < 0.01);
    } finally {
        run.dispose();
    }
});

await test("phasing filters rival contact while leaving a solid barrier active", () => {
    const route = [-30, 0, 40, 250].map(z => ({ x: 0, y: 0, z, dx: 0, dz: 1, distance: z + 30 }));
    const wall = { a: { x: -7, y: 0, z: 20 }, b: { x: 7, y: 0, z: 20 } };
    const world = createWorld({ surfaces: courseSurfaces(tracks[0], route), barriers: [wall] });
    const vehicle = new Vehicle(world, cars[0], route[1]!);
    const rival = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.60, 8));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.95, 0.27, 2.0).setCollisionGroups(rivalCollisionGroups), rival);
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    const powers = new RacePowers(600, []);
    try {
        for (let i = 0; i < 60; i++) vehicle.step(neutral, 1, false);
        vehicle.body.setLinvel({ x: 0, y: 0, z: 13 }, true);
        powers.recovered(vehicle);
        assert.equal(powers.view().phasing, true);
        assert.equal(powers.view().teleporting, false);
        for (let i = 0; i < 65; i++) vehicle.step(neutral, 1, false);
        assert.ok(vehicle.body.translation().z > 10);
        assert.equal(vehicle.damage, 0);
        for (let i = 0; i < 70; i++) vehicle.step(neutral, 1, false);
        assert.ok(vehicle.damage > 5);
        vehicle.reset(route[1]!, true);
        powers.stop(vehicle);
        for (let i = 0; i < 35; i++) vehicle.step(neutral, 1, false);
        vehicle.body.setLinvel({ x: 0, y: 0, z: 13 }, true);
        for (let i = 0; i < 50; i++) vehicle.step(neutral, 1, false);
        assert.ok(vehicle.body.translation().z < 7);
        assert.ok(vehicle.damage > 5);
    } finally {
        vehicle.dispose();
        vehicle.world.free();
    }
});
