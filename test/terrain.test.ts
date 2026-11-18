import test from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { Course } from "../src/game/course/course.ts";
import { GroundHeight } from "../src/game/course/ground-height.ts";
import { lagoonSurface } from "../src/game/course/reef-lagoon.ts";
import { calderaSpanEdges } from "../src/game/course/caldera-bridge.ts";
import { railwayPoint } from "../src/game/course/railway/line.ts";
import { roadHalfWidth } from "../src/game/course/road-width.ts";
import { cloudfoldPortalStation } from "../src/game/course/sky-masonry.ts";
import { pointOnRoute, sampleAt } from "../src/game/course/route.ts";
import { reefSuspended, reefTunnelEnd, reefTunnelStart } from "../src/game/course/reef-tunnel.ts";
import { coursePassages } from "../src/game/course/passages.ts";
import { tracks } from "../src/game/course/tracks.ts";
import { waterContact, waterDistance, waterPoint } from "../src/game/course/water.ts";
import { winterCabinFootprint } from "../src/game/course/winter-cabins.ts";
import { RaceRun } from "../src/game/race/run.ts";
import { cars } from "../src/game/vehicle/cars.ts";
import { bodyForward } from "../src/game/vehicle/pose.ts";
import { createWorld, STEP } from "../src/game/vehicle/world.ts";

await RAPIER.init();

await test("Alpine Pass keeps the bridge bed and tarn below the driving surface", () => {
    const course = new Course(tracks.find(track => track.id === "alpine")!);
    const bridge = course.passages.find(passage => passage.kind === "bridge");
    const lake = course.water.find(body => body.kind === "lake");
    assert.ok(bridge && lake);
    for (let distance = bridge.distance - 28; distance < bridge.distance + 59; distance += 1.5) {
        const row = course.at(distance);
        for (const side of [-5, -2.5, 0, 2.5, 5]) {
            const point = pointOnRoute(row, side);
            const ground = course.ground.at(point.x, point.z);
            assert.ok(ground !== undefined && Math.abs(ground - point.y) < 0.03);
        }
    }
    for (let distance = 460; distance <= 690; distance += 4) {
        const roadEdge = pointOnRoute(course.at(distance), 6.8);
        assert.ok(waterDistance(lake, roadEdge.x, roadEdge.z) >= 1.02);
        assert.equal(waterContact([lake], roadEdge, 0.12), undefined);
    }
    assert.ok(course.ground.at(lake.center.x, lake.center.z)! < lake.center.y - 2);
});

await test("Copper Gorge leaves the deck and gallery lanes open above solid archwork", () => {
    const course = new Course(tracks.find(({ id }) => id === "gorge")!);
    const world = createWorld(course);
    try {
        world.step();
        for (const distance of [232, 246.5, 262.5, 418, 468, 516]) {
            const row = course.at(distance);
            for (const side of [-5.6, 0, 5.6]) {
                const lane = pointOnRoute(row, side, 0.7);
                assert.equal(waterContact(course.water, lane, 0.1), undefined);
                assert.equal(world.castRay(new RAPIER.Ray(lane, { x: row.dx, y: 0, z: row.dz }), 1.5, true), null);
                const deck = world.castRay(new RAPIER.Ray(lane, { x: 0, y: -1, z: 0 }), 0.8, true);
                assert.ok(deck && Math.abs(deck.timeOfImpact - 0.7) < 0.04);
                const underBridge = distance < 270;
                const below = pointOnRoute(row, side, underBridge ? -7.1 : 1.4);
                const stone = world.castRay(new RAPIER.Ray(below, { x: 0, y: 1, z: 0 }), 10, true);
                assert.ok(stone && stone.timeOfImpact > 3.8 && stone.timeOfImpact < (underBridge ? 5.2 : 8));
            }
        }
    } finally {
        world.free();
    }
});

await test("Coral Passage's lagoon meets the tube without crossing the road", () => {
    const course = new Course(tracks.find(({ id }) => id === "reef")!);
    const water = new GroundHeight([lagoonSurface(course)]);
    for (const distance of [161, 169, 178, 190, 621, 632, 645, 657]) {
        const row = course.at(distance);
        for (const lateral of [-5, 0, 5]) {
            const dry = pointOnRoute(row, lateral);
            assert.equal(water.at(dry.x, dry.z), undefined);
        }
        for (const lateral of [-12, 12]) {
            const wet = pointOnRoute(row, lateral);
            assert.equal(water.at(wet.x, wet.z), 0);
        }
    }
    const submerged = course.at(450);
    assert.equal(water.at(submerged.x, submerged.z), 0);
});

await test("Coral Passage has a continuous dry lane inside a closed tube above the seabed", () => {
    const course = new Course(tracks.find(({ id }) => id === "reef")!);
    const world = createWorld(course);
    try {
        world.step();
        for (let distance = reefTunnelStart + 18; distance < reefTunnelEnd; distance += 35) {
            const row = course.at(distance);
            assert.equal(waterContact(course.water, row, 0), undefined);
            const road = world.castRay(new RAPIER.Ray({ ...row, y: row.y + 1 }, { x: 0, y: -1, z: 0 }), 1.1, true);
            const roof = world.castRay(new RAPIER.Ray({ ...row, y: row.y + 1 }, { x: 0, y: 1, z: 0 }), 8, true);
            assert.ok(road && Math.abs(road.timeOfImpact - 1) < 0.05, String(distance));
            assert.ok(roof && roof.timeOfImpact > 6.6 && roof.timeOfImpact < 7.2, String(distance));
            if (distance >= reefSuspended.from && distance <= reefSuspended.to) {
                const underDeck = { ...row, y: row.y - 1 };
                const shell = world.castRay(new RAPIER.Ray(underDeck, { x: 0, y: -1, z: 0 }), 6, true);
                assert.ok(shell && shell.timeOfImpact > 4.4 && shell.timeOfImpact < 4.8, String(distance));
                const bed = course.ground.at(row.x, row.z, row.y - 5.9);
                assert.ok(bed !== undefined && row.y - bed > 13, String(distance));
                for (const side of [-1, 1]) {
                    const beside = pointOnRoute(row, side * 8.6);
                    assert.ok(course.ground.at(beside.x, beside.z)! < row.y - 12, String(distance));
                }
            }
            for (const side of [-1, 1]) {
                const at = pointOnRoute(row, side * 6.9, 1.1);
                const wall = world.castRay(new RAPIER.Ray(at, { x: row.dz * side, y: 0, z: -row.dx * side }), 2, true);
                assert.ok(wall && wall.timeOfImpact > 0.95 && wall.timeOfImpact < 1.6, String(distance));
            }
        }
    } finally {
        world.free();
    }
});

await test("Coral Passage portal stonework has a solid crown and clear driving lines", () => {
    const course = new Course(tracks.find(track => track.id === "reef")!);
    assert.ok(course.reefPortalStonework);
    const world = createWorld(course);
    try {
        world.step();
        for (const distance of [reefTunnelStart - 1.6, reefTunnelEnd + 1.6]) {
            const row = course.at(distance);
            const crown = world.castRay(new RAPIER.Ray(pointOnRoute(row, 0, 11), { x: 0, y: -1, z: 0 }), 2, true);
            const interior = world.castRay(new RAPIER.Ray(pointOnRoute(row, 0, 1.2), { x: 0, y: 1, z: 0 }), 8, true);
            assert.ok(crown && crown.timeOfImpact > 0.7 && crown.timeOfImpact < 1.4);
            assert.ok(interior && interior.timeOfImpact > 6.7);
            for (const lateral of [-5.2, 0, 5.2]) {
                for (const direction of [-1, 1]) {
                    const at = pointOnRoute(row, lateral, 0.71);
                    const gap = world.castRay(new RAPIER.Ray(at, { x: row.dx * direction, y: 0, z: row.dz * direction }), 2, true);
                    assert.equal(gap, null);
                }
            }
        }
    } finally {
        world.free();
    }
});

await test("a car that falls below the suspended deck returns to the dry road in either direction", () => {
    const track = tracks.find(({ id }) => id === "reef")!;
    const course = new Course(track);
    const car = cars[0];
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    for (const direction of ["forward", "reverse"] as const) {
        const run = new RaceRun(course, {
            track, direction, car, paint: car.paint, weather: "sunny", hour: 12, dynamic: false,
            laps: 1, opponents: 0, difficulty: "Normal",
        });
        try {
            finishRace(run);
            const distance = direction === "forward" ? 345 : course.length - 345;
            const row = run.line.at(distance);
            run.vehicle.reset(row);
            for (let tick = 0; tick < 6; tick++) run.advance(STEP, neutral);
            run.vehicle.body.setTranslation({ ...row, y: row.y - 2.7 }, true);
            assert.ok(run.advance(STEP, neutral).recovered, direction);
            const restored = run.vehicle.body.translation();
            assert.ok(restored.y > row.y && restored.y < row.y + 2, direction);
            assert.ok(Math.abs(run.line.locate(restored).distance - distance) < 2, direction);
        } finally {
            run.dispose();
        }
    }
});

await test("Juniper Junction leaves both race lanes open beneath solid railway arches", () => {
    const course = new Course(tracks.find(({ id }) => id === "rail")!);
    const world = createWorld(course);
    try {
        world.step();
        for (const [distance, lanes] of [[136, [-6, 0, 6]], [1486, [0, 6]], [1492, [-6, 0]]] as const) {
            const row = course.at(distance);
            for (const lane of lanes) {
                const at = pointOnRoute(row, lane, 0.1);
                const arch = world.castRay(new RAPIER.Ray(at, { x: 0, y: 1, z: 0 }), 16, true);
                assert.ok(arch && arch.timeOfImpact > 7, `${distance} / ${lane}`);
                const road = world.castRay(new RAPIER.Ray(at, { x: 0, y: -1, z: 0 }), 0.3, true);
                assert.ok(road, `${distance} / ${lane}`);
            }
        }
        for (const x of [-20, 3, 275, 306]) {
            const at = railwayPoint(x);
            const ground = course.ground.at(at.x, at.z)!;
            const ray = new RAPIER.Ray({ ...at, y: ground + 1, z: at.z - 12 }, { x: 0, y: 0, z: 1 });
            // A roadside tree can stand closer to the ray origin than the masonry.
            const impacts: number[] = [];
            world.intersectionsWithRay(ray, 24, true, hit => {
                impacts.push(hit.timeOfImpact);
                return true;
            });
            assert.ok(impacts.some(distance => Math.abs(distance - 8.4) < 0.2), String(x));
        }
    } finally {
        world.free();
    }
});

await test("Juniper Junction's landscape rings stay upright around the valley bends", () => {
    const course = new Course(tracks.find(({ id }) => id === "rail")!);
    for (const { positions, indices } of course.surfaces.landscape) {
        for (let index = 0; index < indices.length; index += 3) {
            const a = indices[index]! * 3;
            const b = indices[index + 1]! * 3;
            const c = indices[index + 2]! * 3;
            const bx = positions[b]! - positions[a]!;
            const bz = positions[b + 2]! - positions[a + 2]!;
            const cx = positions[c]! - positions[a]!;
            const cz = positions[c + 2]! - positions[a + 2]!;
            assert.ok(bx * cz > bz * cx, `folded landscape triangle ${index / 3}`);
        }
    }
});

await test("Frosthaven harbor buildings follow the shoreline and use the rendered foundations for collision", () => {
    const course = new Course(tracks.find(({ id }) => id === "arctic")!);
    const harbor = course.frosthavenHarbor!;
    assert.equal(harbor.houses.length, 4);
    const world = createWorld(course);
    try {
        world.step();
        for (const building of [...harbor.houses, harbor.beacon]) {
            const { x, y, z, width, depth, yaw, bottom, height } = building;
            const cos = Math.cos(yaw);
            const sin = Math.sin(yaw);
            for (const side of [-1, 1]) {
                for (const end of [-1, 1]) {
                    const lateral = side * width / 2;
                    const along = end * depth / 2;
                    const ground = course.ground.at(x + cos * lateral + sin * along, z - sin * lateral + cos * along)!;
                    assert.ok(ground >= bottom && ground <= y);
                }
            }
            assert.ok(Math.abs(course.locate(building).lateral) > 16);
            const roof = world.castRay(new RAPIER.Ray({ x, y: y + height + 2, z }, { x: 0, y: -1, z: 0 }), 3, true);
            assert.ok(roof && Math.abs(roof.timeOfImpact - 2) < 0.025);
        }
        assert.ok(harbor.pier.from.y > harbor.pier.to.y);
        assert.ok(harbor.pier.to.y > course.water[0]!.center.y);
        const { quay, pier: { from, to } } = harbor;
        const quayHit = world.castRay(new RAPIER.Ray({ ...quay, y: quay.y + 2 }, { x: 0, y: -1, z: 0 }), 3, true);
        assert.ok(quayHit && Math.abs(quayHit.timeOfImpact - (2 - quay.height)) < 0.025);
        const pierY = (from.y + to.y) / 2;
        const pierRay = new RAPIER.Ray({ x: (from.x + to.x) / 2, y: pierY + 2, z: (from.z + to.z) / 2 }, { x: 0, y: -1, z: 0 });
        const pierHit = world.castRay(pierRay, 3, true);
        assert.ok(pierHit && Math.abs(pierHit.timeOfImpact - 1.86) < 0.03);
        const ship = harbor.icebreaker;
        const hull = world.castRay(new RAPIER.Ray({ ...ship, y: ship.y + 7 }, { x: 0, y: -1, z: 0 }), 5, true);
        assert.ok(hull && hull.timeOfImpact > 0.5);
        assert.ok(course.ground.at(ship.x, ship.z)! < ship.y + 0.04);
        const { deck, columns } = harbor.lookout;
        const deckRay = new RAPIER.Ray({ ...deck, y: deck.y + 2 }, { x: 0, y: -1, z: 0 });
        const surface = world.castRay(deckRay, 3, true);
        assert.ok(surface && Math.abs(surface.timeOfImpact - 1.8) < 0.025);
        for (const { x, z, bottom, top } of columns) {
            const ground = course.ground.at(x, z)!;
            assert.ok(bottom < ground && top > ground);
        }
    } finally {
        world.free();
    }
});

await test("Frosthaven's three bridge openings and stone piers share the visible crossing", () => {
    const course = new Course(tracks.find(track => track.id === "arctic")!);
    assert.ok(course.frosthavenCrossing);
    const world = createWorld(course);
    try {
        world.step();
        for (const distance of [288, 297, 305, 314, 323, 330, 340]) {
            const row = course.at(distance);
            const opening = distance === 297 || distance === 314 || distance === 330;
            for (const side of [-1, 1]) {
                const pier = world.castRay(new RAPIER.Ray(pointOnRoute(row, side * 7.95, -3.4),
                    { x: -row.dz * side, y: 0, z: row.dx * side }), 1.90, true);
                if (opening) assert.equal(pier, null);
                else assert.ok(pier && Math.abs(pier.timeOfImpact - 0.88) < 0.03);
            }
        }
        for (let distance = 280; distance < 350; distance += 2) {
            const row = course.at(distance);
            const lane = roadHalfWidth("arctic", distance) - 1.15;
            for (const lateral of [-lane, 0, lane]) {
                const above = pointOnRoute(row, lateral, 1.5);
                const deck = world.castRay(new RAPIER.Ray(above, { x: 0, y: -1, z: 0 }), 1.8, true);
                assert.ok(deck && Math.abs(deck.timeOfImpact - 1.5) < 0.04);
            }
        }
    } finally {
        world.free();
    }
});

await test("Frosthaven cabins meet the snow and keep trees outside their roofs", () => {
    const course = new Course(tracks.find(({ id }) => id === "arctic")!);
    assert.ok(course.winterCabins.length >= 6);
    for (const cabin of course.winterCabins) {
        const cos = Math.cos(cabin.yaw);
        const sin = Math.sin(cabin.yaw);
        for (const x of [-winterCabinFootprint.width / 2, winterCabinFootprint.width / 2]) {
            for (const z of [-winterCabinFootprint.depth / 2, winterCabinFootprint.depth / 2]) {
                const snow = course.ground.at(cabin.x + x * cos + z * sin, cabin.z - x * sin + z * cos)!;
                assert.ok(snow >= cabin.bottom && snow <= cabin.y);
            }
        }
        for (const { ground } of course.vegetation.trees) {
            const x = ground.x - cabin.x;
            const z = ground.z - cabin.z;
            assert.ok(Math.abs(x * cos - z * sin) >= winterCabinFootprint.width / 2 ||
                Math.abs(x * sin + z * cos) >= winterCabinFootprint.depth / 2);
        }
    }
});

await test("Ares hangar equipment is solid and stays clear of the race lane", () => {
    const course = new Course(tracks.find(({ id }) => id === "mars")!);
    const modules = course.halls.find(hall => hall.kind === "space hangar")!.coolantModules;
    assert.equal(modules.length, 5);
    const world = createWorld(course);
    try {
        world.step();
        for (const module of modules) {
            const location = course.locate(module);
            const road = course.at(location.distance);
            assert.ok(Math.abs(location.lateral) > 9);
            const equipment = world.castRay(new RAPIER.Ray({ ...module, y: module.y + 5 }, { x: 0, y: -1, z: 0 }), 5, true);
            const lane = world.castRay(new RAPIER.Ray({ ...road, y: road.y + 5 }, { x: 0, y: -1, z: 0 }), 5.1, true);
            assert.ok(equipment && equipment.timeOfImpact < 3);
            assert.ok(lane && Math.abs(lane.timeOfImpact - 5) < 0.04);
        }
    } finally {
        world.free();
    }
});

await test("Ares and Aurora hall wall bases meet their collision surfaces", () => {
    for (const id of ["mars", "future"] as const) {
        const course = new Course(tracks.find(track => track.id === id)!);
        const world = createWorld(course);
        try {
            world.step();
            for (const hall of course.halls) {
                const [first, second] = hall.frames;
                for (const [side, post] of first!.posts.entries()) {
                    const next = second!.posts[side]!;
                    const edge = { x: (post.x + next.x) / 2, y: (post.y + next.y) / 2 + 0.52, z: (post.z + next.z) / 2 };
                    const sign = side === 0 ? -1 : 1;
                    const { dx, dz } = first!.row;
                    const origin = { x: edge.x - dz * sign * 1.5, y: edge.y, z: edge.z + dx * sign * 1.5 };
                    const hit = world.castRay(new RAPIER.Ray(origin, { x: dz * sign, y: 0, z: -dx * sign }), 1.6, true);
                    assert.ok(hit && Math.abs(hit.timeOfImpact - 1.36) < 0.08, hall.kind);
                }
            }
        } finally {
            world.free();
        }
    }
});

await test("the terrain joins both verges and encloses every local body of water", () => {
    for (const track of tracks.filter(({ id }) => id !== "sky")) {
        const course = new Course(track);
        const { left, right, landscape } = course.surfaces;
        const outer = landscape[0]!;
        const inner = landscape[1]!;
        for (let row = 0; row < course.route.length; row++) {
            const outerEdge = ((row + 1) * outer.seamColumns! - 1) * 3;
            const leftEdge = row * left.seamColumns! * 3;
            assert.deepEqual(outer.positions.subarray(outerEdge, outerEdge + 3), left.positions.subarray(leftEdge, leftEdge + 3), track.id);
            const innerEdge = row * inner.seamColumns! * 3;
            const rightEdge = ((row + 1) * right.seamColumns! - 1) * 3;
            assert.deepEqual(inner.positions.subarray(innerEdge, innerEdge + 3), right.positions.subarray(rightEdge, rightEdge + 3), track.id);
        }
        for (const body of course.water) {
            if (!body.depth) continue;
            for (let i = 0; i < 72; i++) {
                const edge = waterPoint(body, i * Math.PI / 36, 1.04);
                const y = course.ground.at(edge.x, edge.z);
                assert.ok(y !== undefined && y > edge.y + 0.1, track.id + " " + body.kind + " bank " + i);
            }
        }
        for (const passage of coursePassages(track.id)) {
            if (passage.kind !== "bridge") continue;
            const deck = course.at(passage.distance);
            const top = course.ground.at(deck.x, deck.z);
            const bed = course.ground.at(deck.x, deck.z, deck.y - 1.15);
            assert.ok(top !== undefined && Math.abs(top - deck.y) < 0.02, track.id + " bridge deck");
            assert.ok(bed !== undefined && bed < deck.y - 2, track.id + " bridge bed");
            assert.equal(waterContact(course.water, { ...deck, y: deck.y + 0.65 }, 0.56), undefined);
        }
    }
});

await test("Cloudfold has two independent levels and an unpaved jump in both directions", () => {
    const track = tracks.find(item => item.id === "sky");
    assert.ok(track);
    const course = new Course(track);
    const low = course.ground.at(0, 0, 99);
    const high = course.ground.at(0, 0);
    assert.ok(low !== undefined && high !== undefined && high - low > 25);
    assert.ok(Math.abs(course.locate({ x: 0, y: low + 0.6, z: 0 }).elevation - low) < 0.2);
    assert.ok(Math.abs(course.locate({ x: 0, y: high + 0.6, z: 0 }).elevation - high) < 0.2);
    const bridge = course.branch!;
    const deck = bridge.route[Math.floor(bridge.route.length / 2)]!;
    assert.ok(bridge.supports({ ...deck, y: deck.y + 0.6 }));
    assert.ok(Math.abs(course.ground.at(deck.x, deck.z)! - deck.y) < 0.05);
    for (const direction of ["forward", "reverse"] as const) {
        const line = course.raceLine(direction);
        const gap = line.gap;
        assert.ok(gap && gap.to - gap.from >= 15);
        const middle = line.at((gap.from + gap.to) / 2);
        assert.ok(line.isGap(middle.distance));
        assert.equal(course.ground.at(middle.x, middle.z), undefined);
        for (const distance of [gap.from - 1, gap.to + 1]) {
            const row = line.at(distance);
            assert.ok(Math.abs(course.ground.at(row.x, row.z)! - row.y) < 0.05);
        }
    }
});

await test("Bellgate's vaulted gate and limestone curbs keep the paved lanes clear", () => {
    const course = new Course(tracks.find(track => track.id === "old-town")!);
    const gate = course.townGate!;
    const world = createWorld(course);
    try {
        world.step();
        for (const direction of ["forward", "reverse"] as const) {
            const line = course.raceLine(direction);
            const station = direction === "forward" ? gate.row.distance : course.length - gate.row.distance;
            for (let distance = station - 14; distance < station + 14; distance += 1.4) {
                const row = line.at(distance);
                const width = roadHalfWidth("old-town", direction === "forward" ? distance : course.length - distance);
                for (const offset of [-(width - 0.9), 0, width - 0.9]) {
                    const shoulder = pointOnRoute(row, offset, 0.45);
                    const nose = world.castRay(new RAPIER.Ray(shoulder, { x: row.dx, y: 0, z: row.dz }), 1.5, true);
                    assert.equal(nose, null);
                    const hit = world.castRay(new RAPIER.Ray(shoulder, { x: 0, y: -1, z: 0 }), 0.7, true);
                    assert.ok(hit && Math.abs(hit.timeOfImpact - 0.45) < 0.08);
                }
            }
        }
        const fromBelow = pointOnRoute(gate.row, 0, 2.5);
        const crown = world.castRay(new RAPIER.Ray(fromBelow, { x: 0, y: 1, z: 0 }), 6.6, true);
        assert.ok(crown && crown.timeOfImpact > 3.95 && crown.timeOfImpact < 4.35);
        const market = course.at(114);
        const edge = pointOnRoute(market, roadHalfWidth("old-town", 114) + 0.29, 0.69);
        const curb = world.castRay(new RAPIER.Ray(edge, { x: 0, y: -1, z: 0 }), 0.7, true);
        assert.ok(curb && curb.timeOfImpact > 0.47 && curb.timeOfImpact < 0.60);
    } finally {
        world.free();
    }
});

await test("Cloudfold's porcelain portal and garden arches keep both driving decks clear", () => {
    const course = new Course(tracks.find(({ id }) => id === "sky")!);
    assert.ok(course.cloudfoldScenery && course.branch);
    const world = createWorld(course);
    try {
        world.step();
        const portal = course.at(cloudfoldPortalStation);
        const fromAbove = pointOnRoute(portal, 0, 14);
        const crown = world.castRay(new RAPIER.Ray(fromAbove, { x: 0, y: -1, z: 0 }), 4.5, true);
        assert.ok(crown && crown.timeOfImpact > 1.9 && crown.timeOfImpact < 3);

        const branch = sampleAt(course.branch.route, 280);
        for (const lateral of [-3.1, 0, 3.1]) {
            for (const row of [portal, branch]) {
                const at = pointOnRoute(row, lateral, 0.83);
                const floor = world.castRay(new RAPIER.Ray(at, { x: 0, y: -1, z: 0 }), 1, true);
                assert.ok(floor && Math.abs(floor.timeOfImpact - 0.83) < 0.06);
                for (const sign of [-1, 1]) {
                    const ray = new RAPIER.Ray(at, { x: sign * row.dx, y: 0, z: sign * row.dz });
                    assert.equal(world.castRay(ray, 2, true), null);
                }
            }
        }

        const across = { x: branch.dz, y: 0, z: -branch.dx };
        const opening = new RAPIER.Ray(pointOnRoute(branch, -5.15, -7), across);
        const cap = new RAPIER.Ray(pointOnRoute(branch, -5.15, -1.5), across);
        assert.equal(world.castRay(opening, 10.3, true), null);
        assert.ok(world.castRay(cap, 2, true));
    } finally {
        world.free();
    }
});

await test("Cloudfold boosts once at the marked lane in both directions", () => {
    const track = tracks.find(item => item.id === "sky")!;
    const course = new Course(track);
    const car = cars[0];
    const strip = course.boostStrips[1]!;
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    for (const direction of ["forward", "reverse"] as const) {
        const sign = direction === "forward" ? 1 : -1;
        const run: RaceRun = new RaceRun(course, {
            track, direction, car, paint: car.paint, weather: "rain", hour: 8, dynamic: false,
            laps: 3, opponents: 0, difficulty: "Normal",
        });
        try {
            while (!run.driving) run.advance(STEP, neutral);
            const distance = sign === 1 ? strip.row.distance : course.length - strip.row.distance;
            const start = run.line.at(distance - 2.5);
            const cross = (lane: number): number => {
                run.vehicle.reset({ ...start, ...pointOnRoute(start, lane) });
                run.vehicle.body.setLinvel({ x: start.dx * 15, y: 0, z: start.dz * 15 }, true);
                for (let tick = 0; tick < 20; tick++) run.advance(STEP, neutral);
                return run.vehicle.speed;
            };
            const centerSpeed = cross(0);
            assert.equal(run.snapshot().stripBoosting, false);
            const stripSpeed = cross(sign * strip.offset);
            assert.ok(stripSpeed > centerSpeed + 3.5 && stripSpeed < centerSpeed + 5.2);
            assert.equal(run.snapshot().stripBoosting, true);
            for (let tick = 0; tick < 52; tick++) run.advance(STEP, neutral);
            assert.equal(run.snapshot().stripBoosting, false);
        } finally {
            run.dispose();
        }
    }
});

await test("a fall through the Cloudfold jump recovers with a run-up in either direction", () => {
    const track = tracks.find(item => item.id === "sky");
    assert.ok(track);
    const course = new Course(track);
    const car = cars[0];
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    for (const direction of ["forward", "reverse"] as const) {
        const run: RaceRun = new RaceRun(course, {
            track, direction, car, paint: car.paint, weather: "rain", hour: 6.5, dynamic: false,
            laps: 1, opponents: 0, difficulty: "Normal",
        });
        try {
            finishRace(run);
            const gap = run.line.gap!;
            run.vehicle.reset(run.line.at(gap.from - 5));
            for (let tick = 0; tick < 12; tick++) run.advance(STEP, neutral);
            run.vehicle.reset(run.line.at((gap.from + gap.to) / 2));
            let recovered = false;
            for (let tick = 0; tick < 240 && !recovered; tick++) recovered = run.advance(STEP, neutral).recovered;
            const at = run.vehicle.body.translation();
            assert.ok(recovered);
            assert.ok(course.ground.at(at.x, at.z, at.y) !== undefined);
            assert.ok(Math.abs(run.line.locate(at).distance - (gap.from - 72)) < 1);
            assert.equal(run.vehicle.speed, 0);
            let landed = false;
            for (let tick = 0; tick < 600 && !landed; tick++) {
                const position = run.vehicle.body.translation();
                const distance = run.line.locate(position).distance;
                const aim = run.line.at(distance + 24);
                const facing = bodyForward(run.vehicle.body.rotation());
                const turn = Math.atan2(aim.x - position.x, aim.z - position.z) - Math.atan2(facing.x, facing.z);
                const steer = Math.max(-1, Math.min(1, Math.atan2(Math.sin(turn), Math.cos(turn)) * 1.95));
                assert.equal(run.advance(STEP, { ...neutral, throttle: 1, steer }).recovered, false);
                landed = distance > gap.to + 11;
            }
            assert.ok(landed, direction);
            assert.equal(run.vehicle.damage, 0);
        } finally {
            run.dispose();
        }
    }
});

await test("a car in the forest shallows slows in water and recovers to a dry road", () => {
    const track = tracks.find(item => item.id === "forest");
    assert.ok(track);
    const course = new Course(track);
    const lake = course.water.find(body => body.kind === "lake");
    assert.ok(lake);
    const bed = course.ground.at(lake.center.x, lake.center.z);
    assert.ok(bed !== undefined && bed < lake.center.y);
    const car = cars[0];
    const run = new RaceRun(course, {
        track, direction: "forward", car, paint: car.paint, weather: "sunny", hour: 12, dynamic: false,
        laps: 3, opponents: 0, difficulty: "Normal",
    });
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    try {
        for (let tick = 0; tick < 180; tick++) run.advance(STEP, neutral);
        run.vehicle.body.setTranslation({ ...lake.center, y: bed + 0.65 }, true);
        run.vehicle.body.setLinvel({ x: lake.dx * 12, y: 0, z: lake.dz * 12 }, true);
        for (let tick = 0; tick < 30; tick++) run.advance(STEP, neutral);
        const water = run.snapshot().water;
        assert.ok(water && water.depth > 0.65);
        assert.ok(run.vehicle.speed < 7.5);
        assert.equal(run.snapshot().damage, 0);
        assert.equal(run.recover(), true);
        assert.equal(run.snapshot().water, undefined);
        assert.equal(run.vehicle.speed, 0);
    } finally {
        run.dispose();
    }
});

await test("Caldera's bridge clears the lava and contact with the channel or cascade recovers in both directions", () => {
    const track = tracks.find(item => item.id === "caldera");
    const car = cars.find(item => item.id === "buggy");
    assert.ok(track && car);
    const course = new Course(track);
    const lava = course.water.find(body => body.kind === "lava");
    const bridge = course.passages.find(passage => passage.kind === "bridge");
    assert.ok(lava && bridge && course.shelter?.kind === "gallery");
    const deck = course.at(bridge.distance);
    assert.ok(deck.y > lava.center.y + 5);
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    for (const direction of ["forward", "reverse"] as const) {
        const run: RaceRun = new RaceRun(course, {
            track, direction, car, paint: car.paint, weather: "sunny", hour: 16, dynamic: false,
            laps: 1, opponents: 0, difficulty: "Normal",
        });
        try {
            while (!run.driving) run.advance(STEP, neutral);
            const river = waterPoint(lava, Math.PI, 0.46);
            const bed = course.ground.at(river.x, river.z);
            assert.ok(bed !== undefined && bed < river.y - 0.5);
            run.vehicle.body.setTranslation({ ...river, y: river.y + 0.2 }, true);
            assert.equal(run.advance(STEP, neutral).recovered, true);
            const recovered = run.vehicle.body.translation();
            assert.ok(Math.hypot(recovered.x - river.x, recovered.z - river.z) > 10);
            assert.equal(run.snapshot().water, undefined);
            assert.equal(run.snapshot().damage, 0);
            const cascade = course.calderaRunoff!;
            const runoff = cascade.cascade;
            assert.ok(runoff.y > lava.center.y + 4);
            assert.equal(cascade.reaches({ ...runoff, y: runoff.y + 3 }, 0.65), false);
            run.vehicle.body.setTranslation({ ...runoff, y: runoff.y + 0.35 }, true);
            assert.equal(run.advance(STEP, neutral).recovered, true);
            const returned = run.vehicle.body.translation();
            assert.ok(Math.hypot(returned.x - runoff.x, returned.z - runoff.z) > 10);
        } finally {
            run.dispose();
        }
    }
});

await test("the Caldera escarpment shares its visible surface with the physics world", () => {
    const course = new Course(tracks.find(({ id }) => id === "caldera")!);
    const escarpment = course.lavaEscarpment!;
    const world = createWorld(course);
    try {
        world.step();
        // An interior triangle is high enough above the bank to distinguish the two surfaces.
        const triangle = escarpment.indices.subarray(498, 501);
        const mean = (axis: number): number =>
            triangle.reduce((sum, index) => sum + escarpment.positions[index * 3 + axis]!, 0) / triangle.length;
        const [x, y, z] = [mean(0), mean(1), mean(2)];
        const bed = course.ground.at(x!, z!);
        assert.ok(bed !== undefined && y! - bed > 2);
        const hit = world.castRay(new RAPIER.Ray({ x: x!, y: y! + 3, z: z! }, { x: 0, y: -1, z: 0 }), 3.1, true);
        assert.ok(hit && Math.abs(hit.timeOfImpact - 3) < 0.02);
    } finally {
        world.free();
    }
});

await test("Caldera reveals the bridge from the chase view while the car is still under rock", () => {
    const course = new Course(tracks.find(({ id }) => id === "caldera")!);
    const shelter = course.shelter!;
    const bridge = course.passages.find(passage => passage.kind === "bridge")!;
    const world = createWorld(course);
    try {
        world.step();
        const row = course.at(shelter.rows.at(-1)!.distance - 25);
        const eye = { x: row.x - row.dx * 7.6, y: row.y + 4, z: row.z - row.dz * 7.6 };
        const underVault = world.castRay(new RAPIER.Ray(eye, { x: 0, y: 1, z: 0 }), 15, true);
        assert.ok(underVault);
        const arch = pointOnRoute(course.at(bridge.distance), 7.12, -2.2);
        const toArch = { x: arch.x - eye.x, y: arch.y - eye.y, z: arch.z - eye.z };
        const obstruction = world.castRay(new RAPIER.Ray(eye, toArch), 0.995, true);
        assert.equal(obstruction, null);
        const opening = course.at(shelter.rows.at(-1)!.distance - 7);
        const viewpoint = { x: opening.x - opening.dx * 7.6, y: opening.y + 4, z: opening.z - opening.dz * 7.6 };
        const crater = course.calderaCrater!;
        const vent = crater.vent;
        const toVent = { x: vent.x - viewpoint.x, y: vent.y + 1 - viewpoint.y, z: vent.z - viewpoint.z };
        assert.equal(world.castRay(new RAPIER.Ray(viewpoint, toVent), 0.99, true), null);
        assert.ok(crater.spillway.every((point, index) => index === 0 || point.y < crater.spillway[index - 1]!.y));
    } finally {
        world.free();
    }
});

await test("Caldera's stepped ridges are solid and stand outside the track and lava channel", () => {
    const course = new Course(tracks.find(({ id }) => id === "caldera")!);
    const shape = course.calderaRidges!;
    const lava = course.water.find(body => body.kind === "lava")!;
    for (let i = 0; i < shape.positions.length; i += 3) {
        const point = { x: shape.positions[i]!, y: shape.positions[i + 1]!, z: shape.positions[i + 2]! };
        assert.ok(Math.abs(course.locate(point).lateral) > 22);
        assert.ok(waterDistance(lava, point.x, point.z) > 1.5);
    }
    const world = createWorld(course);
    try {
        world.step();
        const hill = { x: 165, z: 374 };
        const ground = course.ground.at(hill.x, hill.z)!;
        const ray = new RAPIER.Ray({ ...hill, y: ground + 80 }, { x: 0, y: -1, z: 0 });
        const hit = world.castRay(ray, 70, true);
        assert.ok(hit);
    } finally {
        world.free();
    }
});

await test("Caldera's ash cleft and rim carry two clear lanes past solid rock and station aprons", () => {
    const course = new Course(tracks.find(({ id }) => id === "caldera")!);
    const world = createWorld(course);
    try {
        world.step();
        const stations = [473.5, 910, 1_064, 1_089, 1_127, 1_160, 1_438, 1_449, 1_460, 1_477, 1_491, 1_522, 2_071];
        for (const distance of stations) {
            const row = course.at(distance);
            const edge = roadHalfWidth("caldera", distance);
            for (const offset of [0.8 - edge, 0, edge - 0.8]) {
                const point = pointOnRoute(row, offset, 0.65);
                for (const sign of [-1, 1]) {
                    assert.equal(world.castRay(new RAPIER.Ray(point, { x: sign * row.dx, y: 0, z: sign * row.dz }), 2, true), null);
                }
                const floor = world.castRay(new RAPIER.Ray(point, { x: 0, y: -1, z: 0 }), 0.8, true);
                assert.ok(floor && Math.abs(floor.timeOfImpact - 0.65) < 0.04);
                if (distance === 1_449 || distance === 1_460) {
                    const roof = world.castRay(new RAPIER.Ray(point, { x: 0, y: 1, z: 0 }), 11, true);
                    assert.ok(roof && roof.timeOfImpact > 8.2 && roof.timeOfImpact < 9.8);
                }
            }
            if (distance >= 1_064 && distance < 1_175) {
                const shoulder = pointOnRoute(row, 0.15 - edge, 0.54);
                const rail = world.castRay(new RAPIER.Ray(shoulder, { x: -row.dz, y: 0, z: row.dx }), 2.15, true);
                assert.ok(rail && rail.timeOfImpact > 1.7);
            }
        }
        for (const [distance, offset] of [[506, 14], [1_847, 13], [2_070, -13], [2_318, 14]] as const) {
            const point = pointOnRoute(course.at(distance), offset);
            const apron = course.calderaAshworks!.apronHeight.at(point.x, point.z)!;
            assert.ok(apron > course.ground.at(point.x, point.z)! + 0.2);
            const floor = world.castRay(new RAPIER.Ray({ ...point, y: apron + 1 }, { x: 0, y: -1, z: 0 }), 1.1, true);
            assert.ok(floor && Math.abs(floor.timeOfImpact - 1) < 0.015);
        }
    } finally {
        world.free();
    }
});

await test("Caldera's curved bridge has grounded piers and an open driving lane", () => {
    const course = new Course(tracks.find(({ id }) => id === "caldera")!);
    const crossing = course.passages.find(passage => passage.kind === "bridge")!.distance;
    const [, piers] = course.calderaCrossing!;
    const world = createWorld(course);
    try {
        world.step();
        for (const [index, edge] of calderaSpanEdges.entries()) {
            const row = course.at(crossing + edge);
            for (let corner = index * 48; corner < index * 48 + 12; corner += 3) {
                const [x, y, z] = piers.positions.subarray(corner, corner + 3);
                const floor = course.ground.at(x!, z!, row.y - 0.15);
                if (floor !== undefined) assert.ok(y! < floor);
            }
            const hit = world.castRay(new RAPIER.Ray({ ...row, y: row.y + 2 }, { x: 0, y: -1, z: 0 }), 2.2, true);
            assert.ok(hit && Math.abs(hit.timeOfImpact - 2) < 0.04);
        }
        const row = course.at(crossing - 18);
        const side = pointOnRoute(row, 9, -6.35);
        const pier = world.castRay(new RAPIER.Ray(side, { x: -row.dz, y: 0, z: row.dx }), 2.1, true);
        assert.ok(pier);
        for (const direction of [-1, 1]) {
            const shoulder = pointOnRoute(row, direction * 9.4, 0.08);
            const hit = world.castRay(new RAPIER.Ray(shoulder,
                { x: -row.dz * direction, y: 0, z: row.dx * direction }), 2.1, true);
            assert.ok(hit && hit.timeOfImpact < 1.2);
        }
    } finally {
        world.free();
    }
});

function finishRace(run: RaceRun): void {
    const neutral = { throttle: 0, brake: 0, steer: 0, reverse: false };
    while (!run.driving) run.advance(STEP, neutral);
    const { line, vehicle } = run;
    for (const gate of [...line.gates, line.startLine]) {
        vehicle.reset({ ...gate, x: gate.x - gate.dx * 0.24, z: gate.z - gate.dz * 0.24 });
        vehicle.body.setLinvel({ x: gate.dx * 27, y: 0, z: gate.dz * 27 }, true);
        for (let tick = 0; tick < 3; tick++) run.advance(STEP, neutral);
    }
    assert.equal(run.snapshot().finish, "finished");
}
