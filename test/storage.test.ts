import test from "node:test";
import assert from "node:assert/strict";
import { RaceStorage } from "../src/browser/race-storage.ts";
import { startingConditions } from "../src/game/race/conditions.ts";
import { LAP_SPLITS } from "../src/game/race/records.ts";
import { cars } from "../src/game/vehicle/cars.ts";

await test("old preferences migrate and circuit records stay separate from old point-to-point times", () => {
    const data = new Map([
        ["redline-setup", "{\"car\":\"summit\",\"track\":\"gorge\",\"paint\":\"#d4d5cf\",\"hour\":0,\"weather\":\"snow\",\"dynamic\":false,\"mode\":\"explore\"}"],
        ["redline-best-gorge-summit", "61.2"],
    ]);
    const storage = new RaceStorage(() => ({
        getItem: key => data.get(key) ?? null,
        setItem: (key, value) => { data.set(key, value); },
    }));
    const setup = storage.loadSetup();
    assert.equal(setup.track.id, "gorge");
    assert.equal("mode" in setup, false);
    assert.equal(setup.direction, "forward");
    assert.equal(setup.car.id, "summit");
    assert.equal(setup.paint, "#d4d5cf");
    assert.equal(setup.weather, "rain");
    assert.equal(setup.hour, 0);
    assert.equal(setup.dynamic, false);
    assert.equal(setup.noDamage, false);
    assert.equal(setup.laps, 3);
    assert.equal(setup.opponents, 5);
    assert.equal(setup.difficulty, "Normal");
    assert.equal(storage.bestTime(setup), undefined);
    assert.equal(storage.recordTime(setup, 65), 65);
    assert.equal(storage.recordTime(setup, 60.8), 60.8);
    assert.equal(data.get("redline-best-gorge-summit"), "61.2");
    assert.equal(data.get("redline-circuit-v1-gorge-summit-3"), "60.8");
    storage.saveConditions("gorge", { hour: 12 });
    storage.saveSetup({ ...setup, opponents: 12, difficulty: "Legend", noDamage: true });
    assert.equal(JSON.parse(data.get("redline-setup")!).mode, undefined);
    assert.equal(storage.loadSetup().noDamage, true);
    assert.equal(storage.loadSetup().opponents, 12);
    assert.equal(storage.loadSetup().difficulty, "Legend");
    storage.saveSetup({ ...storage.loadSetup(), opponents: 0 });
    assert.equal(storage.loadSetup().opponents, 0);
    assert.equal(storage.loadSetup().difficulty, "Legend");
    assert.equal(storage.loadSetup().hour, 12);
    assert.equal(storage.bestTime(storage.loadSetup()), 60.8);
});

await test("course defaults apply before overrides and each course remembers only the fields the player set", () => {
    const entries = new Map([["redline-setup", '{"track":"old-town","hour":12,"weather":"sunny","opponents":4}']]);
    const open = () => ({
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => { entries.set(key, value); },
    });
    const storage = new RaceStorage(open);
    const setup = storage.loadSetup();
    assert.equal(setup.hour, 17);
    assert.equal(setup.opponents, 5);
    assert.deepEqual(storage.conditionsFor("coast"), { hour: 12, weather: "fog" });
    assert.deepEqual(storage.conditionsFor("ruins"), { hour: 6.5, weather: "sunny" });
    assert.deepEqual(storage.conditionsFor("sky"), { hour: 6.5, weather: "rain" });
    assert.deepEqual(storage.conditionsFor("mars"), { hour: 6.5, weather: "fog" });
    assert.deepEqual(storage.conditionsFor("arctic"), { hour: 12, weather: "snow" });
    assert.deepEqual(storage.conditionsFor("metro"), { hour: 17, weather: "rain" });
    assert.deepEqual(startingConditions("gorge", () => 0.49), { hour: 6.5, weather: "fog" });
    assert.deepEqual(startingConditions("gorge", () => 0.5), { hour: 12, weather: "fog" });
    storage.saveConditions("sky", { weather: "sunny" });
    storage.saveConditions("old-town", { hour: 0 });
    assert.equal(storage.hasDriven("sky"), false);
    storage.markDriven("sky");
    storage.saveSetup(setup);
    const reopened = new RaceStorage(open);
    assert.equal(reopened.loadSetup().hour, 0);
    assert.equal(reopened.hasDriven("sky"), true);
    assert.equal(reopened.hasDriven("metro"), false);
    assert.deepEqual(reopened.conditionsFor("sky"), { hour: 6.5, weather: "sunny" });
    assert.deepEqual(reopened.conditionsFor("ruins"), { hour: 6.5, weather: "sunny" });
});

await test("legacy ten-lap selections move to five without deleting old records", () => {
    const data = new Map([
        ["redline-setup", "{\"track\":\"forest\",\"laps\":10}"],
        ["redline-circuit-v1-forest-veloce-3", "187.4"],
        ["redline-circuit-v1-forest-summit-3", "194.8"],
        ["redline-circuit-v1-forest-veloce-10", "631.4"],
    ]);
    const open = () => ({
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
    });
    const storage = new RaceStorage(open);
    const setup = storage.loadSetup();
    assert.equal(setup.laps, 5);
    storage.recordTime({ ...setup, laps: 5, car: cars[1]! }, 307.5);
    const lap = { seconds: 61.2, splits: Array.from({ length: LAP_SPLITS + 1 }, (_, i) => i * 61.2 / LAP_SPLITS) };
    assert.equal(storage.recordLap("forest", lap), true);
    assert.equal(storage.recordLap("forest", lap), false);
    const reopened = new RaceStorage(open);
    assert.deepEqual(reopened.trackRecords("forest"), { lap, races: { 5: 307.5 } });
    assert.equal(data.get("redline-circuit-v1-forest-veloce-3"), "187.4");
    assert.equal(data.get("redline-circuit-v1-forest-summit-3"), "194.8");
    assert.equal(data.get("redline-circuit-v1-forest-veloce-10"), "631.4");
    assert.equal(reopened.trackRecords("alpine").lap, undefined);
});

await test("reverse laps and totals preserve existing forward circuit records", () => {
    const entries = new Map([["redline-circuit-v1-coast-lighthouse-veloce-3", "240.5"]]);
    const storage = new RaceStorage(() => ({
        getItem: key => entries.get(key) ?? null,
        setItem: (key, value) => { entries.set(key, value); },
    }));
    const setup = { ...storage.loadSetup(), direction: "reverse" } as const;
    storage.saveSetup(setup);
    storage.recordTime(setup, 221.9);
    const lap = (seconds: number) => ({
        seconds, splits: Array.from({ length: LAP_SPLITS + 1 }, (_, i) => i * seconds / LAP_SPLITS),
    });
    storage.recordLap("coast", lap(70));
    storage.recordLap("coast", lap(77), "reverse");
    assert.equal(storage.loadSetup().direction, "reverse");
    assert.equal(storage.bestRace("coast", 3), 240.5);
    assert.equal(storage.bestRace("coast", 3, "reverse"), 221.9);
    assert.equal(storage.bestLap("coast")?.seconds, 70);
    assert.equal(storage.bestLap("coast", "reverse")?.seconds, 77);
});


for (const track of ["caldera", "ruins", "coast", "alpine", "canyon"] as const) {
    await test(`the revised ${track} route uses new records while preserving the old timings`, () => {
        const oldLap = { seconds: 46, splits: Array.from({ length: LAP_SPLITS + 1 }, (_, i) => i * 46 / LAP_SPLITS) };
        const oldKey = `redline-circuit-v1-${track}-veloce-3`;
        const oldLapKey = "redline-lap-v1-" + track;
        const entries = new Map([["redline-setup", JSON.stringify({ track })], [oldKey, "180"], [oldLapKey, JSON.stringify(oldLap)]]);
        const storage = new RaceStorage(() => ({
            getItem: key => entries.get(key) ?? null,
            setItem: (key, value) => { entries.set(key, value); },
        }));
        const setup = storage.loadSetup();
        const lap = { seconds: 91, splits: Array.from({ length: LAP_SPLITS + 1 }, (_, i) => i * 91 / LAP_SPLITS) };
        assert.deepEqual(storage.trackRecords(track), { lap: undefined, races: {} });
        assert.equal(storage.recordTime(setup, 298), 298);
        assert.equal(storage.recordLap(track, lap), true);
        assert.deepEqual(storage.trackRecords(track), { lap, races: { 3: 298 } });
        assert.equal(entries.get(oldKey), "180");
        assert.equal(entries.get(oldLapKey), JSON.stringify(oldLap));
    });
}
