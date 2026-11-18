import type { Course } from "../../../game/course/course.ts";
import { railwayEnds, railwayOffset, railwayPoint, railwaySpanAt } from "../../../game/course/railway/line.ts";
import { beamBetween } from "../beam.ts";
import type { BuildPart } from "../urban-parts.ts";

export function drawTrackwork(build: BuildPart, course: Course): void {
    const [first, last] = railwayEnds;
    for (let x = first; x < last; x += 4) {
        const end = Math.min(last, x + 4);
        const from = railwayOffset(x, 0, -0.87);
        const to = railwayOffset(end, 0, -0.87);
        build("railway ballast", beamBetween(from, to, 6.55, 1.45, 0.18), "#8a8780");
        for (const side of [-1, 1]) {
            const a = railwayOffset(x, side * 0.82, 0.065);
            const b = railwayOffset(end, side * 0.82, 0.065);
            build("steel running rail", beamBetween(a, b, 0.10, 0.17, 0.055), "#9f9692");
            if (!railwaySpanAt((x + end) * 0.5)) continue;
            const edgeA = railwayOffset(x, side * 2.98, 0.01);
            const edgeB = railwayOffset(end, side * 2.98, 0.01);
            build("railway coping", beamBetween(edgeA, edgeB, 0.48, 0.61, 0.11), "#d0a88d");
            const upright = railwayOffset(x, side * 2.98, 0.76);
            build("viaduct iron posts", { ...upright, sx: 0.19, sy: 1.01, sz: 0.20, yaw: Math.PI / 2 }, "#67574a");
            for (const height of [0.57, 1.17]) {
                const railA = railwayOffset(x, side * 2.98, height);
                const railB = railwayOffset(end, side * 2.98, height);
                build("viaduct iron railing", beamBetween(railA, railB, 0.13, 0.13, 0.08), "#836c53");
            }
        }
        const middle = (x + end) / 2;
        if (railwaySpanAt(middle)) continue;
        const center = railwayPoint(middle);
        const ground = course.ground.at(center.x, center.z) ?? center.y - 1;
        const height = center.y - 0.7 - ground;
        if (height > 0.05) {
            const alignment = beamBetween(from, to, 6.25, height + 1.6, 0.12);
            build("railway embankment wall", { ...alignment, y: ground + height / 2 - 0.67,
                pitch: 0 }, "#a09681");
        }
    }
    for (let x = first; x <= last; x += 1.85) {
        const row = railwayPoint(x);
        const next = railwayPoint(x + 0.4);
        build("wooden sleepers", { ...row, y: row.y - 0.073, sx: 2.65, sy: 0.16, sz: 0.36,
            yaw: Math.atan2(next.x - row.x, next.z - row.z) }, "#605043");
    }
}
