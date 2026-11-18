import test from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { aresCanopySize, aresHabitatSize } from "../src/game/course/ares-gardens.ts";
import { Course } from "../src/game/course/course.ts";
import { pacificLighthouse } from "../src/game/course/pacific-lighthouse.ts";
import { forestMillSize } from "../src/game/course/forest-mill.ts";
import { locate, pointOnRoute } from "../src/game/course/route.ts";
import { tracks } from "../src/game/course/tracks.ts";
import { waterDistance } from "../src/game/course/water.ts";
import { RaceRun } from "../src/game/race/run.ts";
import { cars } from "../src/game/vehicle/cars.ts";
import { createWorld, STEP } from "../src/game/vehicle/world.ts";

await RAPIER.init();

await test("the circuits use different species with trunks planted on dry terrain", () => {
    const kinds = new Set<string>();
    for (const track of tracks) {
        const course = new Course(track);
        for (const tree of course.vegetation.trees) {
            const { x, y, z } = tree.ground;
            assert.equal(y, course.ground.at(x, z));
            assert.ok(course.water.every(body => y > body.center.y || waterDistance(body, x, z) >= 1.04));
            kinds.add(tree.kind);
        }
    }
    assert.ok(kinds.size >= 8);
});

await test("the player car hits a solid trunk at the rendered tree position", () => {
    const track = tracks.find(item => item.id === "forest");
    assert.ok(track);
    const course = new Course(track);
    const tree = course.vegetation.trees.find(({ ground }) => {
        const here = locate(course.route, ground);
        return here.distance > 50 && here.distance < 150 && Math.abs(here.lateral) < 20;
    });
    assert.ok(tree);
    const car = cars[0];
    const run = new RaceRun(course, {
        track, direction: "forward", car, paint: car.paint, weather: "sunny", hour: 12, dynamic: false,
        laps: 3, opponents: 0, difficulty: "Normal",
    });
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    try {
        for (let i = 0; i < 180; i++) run.advance(STEP, neutral);
        const { ground } = tree;
        const row = course.at(locate(course.route, ground).distance);
        const gap = Math.hypot(ground.x - row.x, ground.z - row.z);
        const dx = (ground.x - row.x) / gap;
        const dz = (ground.z - row.z) / gap;
        const x = ground.x - dx * 6;
        const z = ground.z - dz * 6;
        const y = course.ground.at(x, z);
        assert.ok(y !== undefined);
        run.vehicle.reset({ x, y, z, dx, dz, distance: row.distance });
        run.vehicle.body.setLinvel({ x: dx * 12, y: 0, z: dz * 12 }, true);
        for (let i = 0; i < 70; i++) {
            run.advance(STEP, neutral);
            const position = run.vehicle.body.translation();
            assert.ok((position.x - ground.x) * dx + (position.z - ground.z) * dz < 0);
        }
        assert.ok(run.vehicle.damage > 10);
    } finally {
        run.dispose();
    }
});

await test("the aqueduct columns are solid beside a clear central opening", () => {
    const track = tracks.find(item => item.id === "ruins");
    assert.ok(track);
    const course = new Course(track);
    const aqueduct = course.aqueduct;
    assert.ok(aqueduct);
    assert.equal(aqueduct.columns.length, 10);
    const world = createWorld(course);
    try {
        world.step();
        const column = aqueduct.columns[4]!;
        const { row } = aqueduct;
        const direction = { x: row.dx, y: 0, z: row.dz };
        const from = (point: { x: number; z: number }): RAPIER.Ray =>
            new RAPIER.Ray({ x: point.x - row.dx * 7, y: aqueduct.springline - 1.25, z: point.z - row.dz * 7 }, direction);
        const hit = world.castRay(from(column.center), 10, true);
        assert.ok(hit && Math.abs(hit.timeOfImpact - (7 - column.depth / 2)) < 0.05);
        assert.equal(world.castRay(from(row), 10, true), null);
        const overhead = world.castRay(new RAPIER.Ray({ x: row.x, y: row.y + 2, z: row.z }, { x: 0, y: 1, z: 0 }), 20, true);
        assert.ok(overhead && overhead.timeOfImpact > 10 && overhead.timeOfImpact < 12);
    } finally {
        world.free();
    }
});


await test("Pacific Run’s headland foundations and cliff wall are solid beside clear lanes", () => {
    const course = new Course(tracks.find(track => track.id === "coast")!);
    const beacon = course.biomeLandmarks.find(site => site.kind === "pacific-lighthouse");
    assert.ok(beacon && beacon.footing !== undefined && beacon.footing < beacon.y);
    assert.ok(course.locate(beacon).lateral < -35);
    const { across, depth } = pacificLighthouse.tower;
    const sin = Math.sin(beacon.yaw);
    const cos = Math.cos(beacon.yaw);
    const tower = { x: beacon.x + beacon.height * (across * cos + depth * sin), y: beacon.y + beacon.height * 0.93,
        z: beacon.z + beacon.height * (-across * sin + depth * cos) };
    const wall = course.barriers.find(barrier => Math.abs(course.locate(barrier.a).distance - 550) < 16);
    assert.ok(wall);
    const edge = { x: (wall.a.x + wall.b.x) / 2, y: (wall.a.y + wall.b.y) / 2 + 0.44, z: (wall.a.z + wall.b.z) / 2 };
    const row = course.at(course.locate(edge).distance);
    const direction = { x: -row.dz, y: 0, z: row.dx };
    const start = { x: edge.x - direction.x * 2, y: edge.y, z: edge.z - direction.z * 2 };
    const world = createWorld(course);
    try {
        world.step();
        assert.ok(world.castRay(new RAPIER.Ray(tower, { x: 0, y: -1, z: 0 }), 5, true));
        const wallHit = world.castRay(new RAPIER.Ray(start, direction), 2, true);
        assert.ok(wallHit && wallHit.timeOfImpact > 1.55);
        for (const side of [-4.8, 0, 4.8]) {
            const at = pointOnRoute(row, side, 0.62);
            assert.equal(world.castRay(new RAPIER.Ray(at, { x: row.dx, y: 0, z: row.dz }), 5, true), null);
        }
    } finally {
        world.free();
    }
});

await test("the rock gallery blocks its vault and rock wall and leaves the windows open", () => {
    const course = new Course(tracks.find(track => track.id === "gorge")!);
    const gallery = course.shelter!;
    const row = gallery.rows[Math.floor(gallery.rows.length / 2)]!;
    const world = createWorld(course);
    try {
        world.step();
        const origin = pointOnRoute(row, 0, 2);
        const wall = world.castRay(new RAPIER.Ray(origin, { x: row.dz, y: 0, z: -row.dx }), 14, true);
        const roof = world.castRay(new RAPIER.Ray(origin, { x: 0, y: 1, z: 0 }), 12, true);
        const window = world.castRay(new RAPIER.Ray(origin, { x: -row.dz, y: 0, z: row.dx }), 14, true);
        assert.ok(wall && Math.abs(wall.timeOfImpact - 10.5) < 0.1);
        assert.ok(roof && roof.timeOfImpact > 4 && roof.timeOfImpact < 8);
        assert.equal(window, null);
    } finally {
        world.free();
    }
});

await test("the freestanding sandstone formations have a matching collision surface", () => {
    const course = new Course(tracks.find(track => track.id === "canyon")!);
    const rock = course.rockFormations.at(-1)!;
    const world = createWorld(course);
    try {
        world.step();
        const from = { x: rock.x, y: rock.y + rock.sy + 4, z: rock.z };
        const hit = world.castRay(new RAPIER.Ray(from, { x: 0, y: -1, z: 0 }), 8, true);
        assert.ok(hit && Math.abs(hit.timeOfImpact - 4) < 0.1);
    } finally {
        world.free();
    }
});

await test("Bellgate's stone towers flank an open road and its gate is grounded", () => {
    const course = new Course(tracks.find(track => track.id === "old-town")!);
    const gate = course.townGate!;
    const world = createWorld(course);
    try {
        world.step();
        const { row } = gate;
        const center = pointOnRoute(row, 0, 1.35);
        const vault = world.castRay(new RAPIER.Ray(center, { x: 0, y: 1, z: 0 }), 12, true);
        assert.ok(vault && vault.timeOfImpact > 5 && vault.timeOfImpact < 7);
        const before = { x: center.x - row.dx * 8, y: center.y, z: center.z - row.dz * 8 };
        const along = new RAPIER.Ray(before, { x: row.dx, y: 0, z: row.dz });
        assert.equal(world.castRay(along, 15, true), null);
        for (const side of [-1, 1]) {
            const across = new RAPIER.Ray(center, { x: side * row.dz, y: 0, z: -side * row.dx });
            const hit = world.castRay(across, 11, true);
            assert.ok(hit && hit.timeOfImpact > 7.7 && hit.timeOfImpact < 8.2);
        }
    } finally {
        world.free();
    }
});

await test("the Glasswater frontage blocks side impacts and leaves the race lanes clear", () => {
    const course = new Course(tracks.find(track => track.id === "metro")!);
    const building = course.streetBuildings[2]!;
    assert.equal(course.streetBuildings.length, 30);
    const world = createWorld(course);
    try {
        world.step();
        const row = course.at(103);
        const center = { ...row, y: row.y + 1.2 };
        const toShop = new RAPIER.Ray(center, { x: -row.dz, y: 0, z: row.dx });
        const hit = world.castRay(toShop, 20, true);
        assert.ok(hit && hit.timeOfImpact > 12 && hit.timeOfImpact < 16);
        const along = new RAPIER.Ray(center, { x: row.dx, y: 0, z: row.dz });
        assert.equal(world.castRay(along, 20, true), null);
        const roof = new RAPIER.Ray({ ...building, y: building.y + building.height + 3 }, { x: 0, y: -1, z: 0 });
        const top = world.castRay(roof, 4, true);
        assert.ok(top && Math.abs(top.timeOfImpact - 3) < 0.05);
    } finally {
        world.free();
    }
});

await test("Glasswater's flyover deck and supports are solid and the road underneath stays open", () => {
    const course = new Course(tracks.find(track => track.id === "metro")!);
    const flyover = course.glasswaterFlyover!;
    const world = createWorld(course);
    try {
        world.step();
        const row = course.at(218);
        for (const lane of [-5.1, 0, 5.1]) {
            const at = pointOnRoute(row, lane, 1.24);
            const ceiling = world.castRay(new RAPIER.Ray(at, { x: 0, y: 1, z: 0 }), 9, true);
            assert.ok(ceiling && Math.abs(ceiling.timeOfImpact - 4.97) < 0.08);
        }
        const footing = flyover.footings[0]!;
        const toward = { x: Math.cos(flyover.yaw), y: 0, z: -Math.sin(flyover.yaw) };
        const start = { ...footing, x: footing.x - toward.x * 2, z: footing.z - toward.z * 2 };
        const hit = world.castRay(new RAPIER.Ray(start, toward), 1.9, true);
        assert.ok(hit && Math.abs(hit.timeOfImpact - 1.44) < 0.07);
    } finally {
        world.free();
    }
});

await test("Ares keeps both lanes open and fits solid decks, habitats and panels to the roadside", () => {
    const course = new Course(tracks.find(track => track.id === "mars")!);
    const cut = course.aresCutworks!;
    const gardens = course.aresGardens!;
    const world = createWorld(course);
    try {
        world.step();
        assert.equal(cut.footings.length, 12);
        assert.equal(cut.baffles.length, 5);
        assert.equal(cut.retainingLedges.length, 3);
        assert.equal(cut.pads.length, 5);
        for (const pad of cut.pads) {
            const down = new RAPIER.Ray({ x: pad.x, y: pad.y + 1.7, z: pad.z }, { x: 0, y: -1, z: 0 });
            const surface = world.castRay(down, 1.5, true);
            assert.ok(surface && Math.abs(surface.timeOfImpact - 1.065) < 0.05);
        }
        assert.ok(gardens.habitats.length > 1 && gardens.canopies.length > 1);
        const roofPoints = [
            ...gardens.habitats.map(({ at, base, scale }) => ({ ...at, y: base + aresHabitatSize.rise * scale })),
            ...gardens.canopies.map(({ roof }) => ({ ...roof, y: roof.y + aresCanopySize.thickness / 2 })),
        ];
        for (const { x, y, z } of roofPoints) {
            const roof = world.castRay(new RAPIER.Ray({ x, y: y + 1, z }, { x: 0, y: -1, z: 0 }), 1.1, true);
            assert.ok(roof && Math.abs(roof.timeOfImpact - 1) < 0.05);
        }
        for (const direction of ["forward", "reverse"] as const) {
            const line = course.raceLine(direction);
            for (const section of [460, 476, 500, 863, 945, 1000]) {
                const center = direction === "forward" ? section : course.length - section;
                for (let delta = -8; delta <= 8; delta += 4) {
                    const row = line.at(center + delta);
                    for (const offset of [-5.62, 0, 5.62]) {
                        const nose = pointOnRoute(row, offset, 0.74);
                        const along = new RAPIER.Ray(nose, { x: row.dx, y: 0, z: row.dz });
                        assert.equal(world.castRay(along, 2.1, true), null);
                        const down = world.castRay(new RAPIER.Ray(nose, { x: 0, y: -1, z: 0 }), 1, true);
                        assert.ok(down && Math.abs(down.timeOfImpact - 0.74) < 0.08);
                    }
                }
            }
        }
        const gallery = course.at(472);
        const beam = pointOnRoute(gallery, 0, 0.8);
        const overhead = world.castRay(new RAPIER.Ray(beam, { x: 0, y: 1, z: 0 }), 13, true);
        assert.ok(overhead && overhead.timeOfImpact > 9.8 && overhead.timeOfImpact < 10.15);
        const rim = course.at(945);
        const verge = pointOnRoute(rim, 0, 0.65);
        const guard = new RAPIER.Ray(verge, { x: -rim.dz, y: 0, z: rim.dx });
        const side = world.castRay(guard, 13, true);
        assert.ok(side && side.timeOfImpact > 8.5 && side.timeOfImpact < 10);
    } finally {
        world.free();
    }
});

await test("Aurora's solar arcade clears both driving directions and grounds the garden walks", () => {
    const course = new Course(tracks.find(track => track.id === "future")!);
    const arcade = course.auroraWaterside!;
    const world = createWorld(course);
    try {
        world.step();
        assert.equal(arcade.footings.length, 12);
        assert.equal(arcade.solarRoof.length, 10);
        for (const direction of ["forward", "reverse"] as const) {
            const line = course.raceLine(direction);
            const center = direction === "forward" ? 519 : course.length - 519;
            for (let delta = -24; delta <= 24; delta += 4) {
                const row = line.at(center + delta);
                for (const lateral of [-5.65, 0, 5.65]) {
                    const lane = pointOnRoute(row, lateral, 0.72);
                    const tangent = new RAPIER.Ray(lane, { x: row.dx, y: 0, z: row.dz });
                    assert.equal(world.castRay(tangent, 2.7, true), null);
                    const downward = new RAPIER.Ray(lane, { x: 0, y: -1, z: 0 });
                    const ground = world.castRay(downward, 1.1, true);
                    assert.ok(ground && Math.abs(ground.timeOfImpact - 0.72) < 0.09);
                }
            }
        }
        const row = course.at(519);
        const underCrown = pointOnRoute(row, 0, 1);
        const overhead = world.castRay(new RAPIER.Ray(underCrown, { x: 0, y: 1, z: 0 }), 13, true);
        assert.ok(overhead && overhead.timeOfImpact > 10.3 && overhead.timeOfImpact < 11);
        for (const lateral of [-7.56, 7.56]) {
            const walkway = pointOnRoute(row, lateral, 1);
            const support = world.castRay(new RAPIER.Ray(walkway, { x: 0, y: -1, z: 0 }), 1.4, true);
            assert.ok(support && Math.abs(support.timeOfImpact - 1.032) < 0.05);
        }
        for (const { positions } of arcade.terraces) {
            for (const column of [3, 5]) {
                const i = (15 * 8 + column) * 3;
                const step = {
                    x: (positions[i]! + positions[i + 3]!) / 2,
                    y: (positions[i + 1]! + positions[i + 4]!) / 2 + 0.65,
                    z: (positions[i + 2]! + positions[i + 5]!) / 2,
                };
                const support = world.castRay(new RAPIER.Ray(step, { x: 0, y: -1, z: 0 }), 1, true);
                assert.ok(support && Math.abs(support.timeOfImpact - 0.65) < 0.05);
            }
        }
    } finally {
        world.free();
    }
});

await test("Glasswater's river bridge carries the race lanes and its waterfront geometry is solid", () => {
    const course = new Course(tracks.find(track => track.id === "metro")!);
    const crossing = course.glasswaterRiverworks!;
    const world = createWorld(course);
    try {
        world.step();
        assert.equal(crossing.quays.length, 4);
        for (const direction of ["forward", "reverse"] as const) {
            const line = course.raceLine(direction);
            const center = direction === "forward" ? 945 : course.length - 945;
            for (let step = -30; step <= 30; step += 3) {
                const row = line.at(center + step);
                for (const offset of [-5.6, 0, 5.6]) {
                    const inside = pointOnRoute(row, offset, 0.72);
                    const support = world.castRay(new RAPIER.Ray(inside, { x: 0, y: -1, z: 0 }), 1, true);
                    assert.ok(support && Math.abs(support.timeOfImpact - 0.72) < 0.08);
                    assert.equal(world.castRay(new RAPIER.Ray(inside, { x: row.dx, y: 0, z: row.dz }), 1.9, true), null);
                }
            }
        }
        const row = course.at(945);
        const arch = pointOnRoute(row, 8.5, 13);
        const cap = world.castRay(new RAPIER.Ray(arch, { x: 0, y: -1, z: 0 }), 4, true);
        assert.ok(cap && cap.timeOfImpact > 1.8 && cap.timeOfImpact < 3.2);
        for (const quay of crossing.quays) {
            const a = quay.positions;
            const columns = 9;
            for (const sample of [16, 23]) {
                const i = (sample * columns + 5) * 3;
                const point = { x: (a[i]! + a[i + 3]!) / 2, y: (a[i + 1]! + a[i + 4]!) / 2 + 0.8,
                    z: (a[i + 2]! + a[i + 5]!) / 2 };
                const tread = world.castRay(new RAPIER.Ray(point, { x: 0, y: -1, z: 0 }), 1, true);
                assert.ok(tread && Math.abs(tread.timeOfImpact - 0.8) < 0.07);
            }
        }
    } finally {
        world.free();
    }
});

await test("Blackwood's mill sits on the bank and its paddles clear the lake bed", () => {
    const course = new Course(tracks.find(track => track.id === "forest")!);
    const lake = course.water.find(body => body.kind === "lake");
    const mill = course.forestMill;
    assert.ok(lake && mill);
    const { wheel, position, yaw } = mill;
    const { depth, wheelRadius } = forestMillSize;
    assert.ok(waterDistance(lake, position.x, position.z) > 1.1);
    assert.ok(wheel.y - wheelRadius < lake.center.y);
    for (const across of [-0.71, 0, 0.71]) {
        for (let i = -10; i <= 10; i++) {
            const along = wheelRadius * i / 10;
            const x = wheel.x + along * Math.cos(yaw) + across * Math.sin(yaw);
            const z = wheel.z - along * Math.sin(yaw) + across * Math.cos(yaw);
            const ground = course.ground.at(x, z);
            const bottom = wheel.y - Math.sqrt(wheelRadius ** 2 - along ** 2);
            assert.ok(ground !== undefined && ground < bottom && waterDistance(lake, x, z) < 1);
        }
    }

    const world = createWorld(course);
    try {
        world.step();
        const dx = Math.sin(yaw);
        const dz = Math.cos(yaw);
        const from = { x: position.x + dx * 7, y: position.y + 1.1, z: position.z + dz * 7 };
        const hit = world.castRay(new RAPIER.Ray(from, { x: -dx, y: 0, z: -dz }), 7, true);
        assert.ok(hit && Math.abs(hit.timeOfImpact - (7 - depth / 2)) < 0.05);
    } finally {
        world.free();
    }
});

await test("Blackwood's covered bridge leaves both racing lanes open and supports a solid roof", () => {
    const course = new Course(tracks.find(track => track.id === "forest")!);
    const bridge = course.forestBridge;
    assert.ok(bridge);
    const world = createWorld(course);
    try {
        world.step();
        for (const distance of bridge.frames) {
            const row = course.at(distance);
            for (const lane of [-4.8, 0, 4.8]) {
                const position = pointOnRoute(row, lane, 0.48);
                const hit = world.castRay(new RAPIER.Ray(position, { x: 0, y: 1, z: 0 }), 9, true);
                assert.ok(hit && hit.timeOfImpact > 5.3 && hit.timeOfImpact < 8.1, String(distance));
            }
        }
        for (const { x, y, z, base } of bridge.supports) {
            assert.ok(course.ground.at(x, z, y - 0.8)! > base);
            const hit = world.castRay(new RAPIER.Ray({ x, y: y + 0.8, z }, { x: 0, y: 1, z: 0 }), 1, true);
            assert.equal(hit?.timeOfImpact, 0);
        }
    } finally {
        world.free();
    }
});
