import type { Course } from "./course.ts";
import type { Point } from "../point.ts";
import type { RouteSample } from "./route.ts";

interface FlyoverBeam {
    readonly from: Point;
    readonly to: Point;
    readonly width: number;
    readonly height: number;
}

interface FlyoverFooting extends Point {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
}

export interface GlasswaterFlyover {
    readonly yaw: number;
    readonly deck: Point;
    readonly spans: readonly FlyoverBeam[];
    readonly footings: readonly FlyoverFooting[];
    readonly braces: readonly FlyoverBeam[];
}

export function glasswaterFlyover(course: Pick<Course, "ground">, row: RouteSample): GlasswaterFlyover {
    const yaw = Math.atan2(row.dx, row.dz) + 0.17;
    const deck = { x: row.x, y: row.y + 6.53, z: row.z };
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const point = (across: number, along: number, y: number): Point => ({
        x: deck.x + cos * across + sin * along, y, z: deck.z - sin * across + cos * along,
    });
    const spans: FlyoverBeam[] = [{ from: point(-19, 0, deck.y), to: point(19, 0, deck.y), width: 7.62, height: 0.64 }];
    const footings: FlyoverFooting[] = [];
    const braces: FlyoverBeam[] = [];
    for (const side of [-1, 1]) {
        const end = point(side * 44, 0, deck.y);
        const floor = (course.ground.at(end.x, end.z) ?? row.y) - 0.05;
        spans.push({ from: point(side * 19, 0, deck.y), to: { ...end, y: floor }, width: 7.62, height: 0.63 });
        for (const lateral of [12.1, 26.3, 35.8]) {
            const top = deck.y + (floor - deck.y) * Math.max(0, (lateral - 19) / 25) - 0.28;
            const at = point(side * lateral, 0, top);
            const base = (course.ground.at(at.x, at.z) ?? top - 2) - 0.38;
            const height = top - base;
            if (height < 0.75) continue;
            footings.push({ ...at, y: base + height * 0.31, width: 1.12, height: height * 0.65, depth: 1.52 });
            for (const end of [-1, 1]) {
                const inner = lateral === 12.1;
                const to = point(side * lateral, end * (inner ? 2.86 : 2.04), top);
                braces.push({ from: { ...at, y: base + height * 0.54 }, to, width: inner ? 0.78 : 0.56, height: 0.65 });
            }
        }
    }
    return { yaw, deck, spans, footings, braces };
}
