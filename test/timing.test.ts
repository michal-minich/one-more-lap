import test from "node:test";
import assert from "node:assert/strict";
import { LapClock } from "../src/game/race/lap-clock.ts";
import { LAP_SPLITS } from "../src/game/race/records.ts";

await test("pace compares the same distance, and completed laps start at the timing line", () => {
    const reference = { seconds: 60, splits: Array.from({ length: LAP_SPLITS + 1 }, (_, i) => i * 60 / LAP_SPLITS) };
    const clock = new LapClock(480, reference);
    assert.deepEqual(clock.read(5), { seconds: 0, delta: undefined });
    assert.equal(clock.observe(0, 5, 5, false), undefined);
    clock.observe(120, 17, undefined, false);
    assert.deepEqual(clock.read(17), { seconds: 12, delta: -3 });
    const lap = clock.observe(480, 50, 50, false);
    assert.ok(lap);
    assert.equal(lap.seconds, 45);
    assert.equal(lap.splits.length, LAP_SPLITS + 1);
    assert.equal(lap.splits[12], 12);
    clock.observe(600, 64, undefined, false);
    assert.deepEqual(clock.read(64), { seconds: 14, delta: 2 });
    const final = clock.observe(960, 100, 100, true);
    assert.equal(final?.seconds, 50);
    assert.deepEqual(clock.read(105), { seconds: 50, delta: 5 });
});
