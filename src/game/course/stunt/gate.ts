import type { Course } from "../course.ts";
import { pointOnRoute } from "../route.ts";
import type { RouteSample } from "../route.ts";

export const stuntGateWidth = 3.65;
export const stuntGateThickness = 0.62;
export const stuntBladeHeight = 1.2;

export function gateSites(course: Course): readonly RouteSample[] {
    return ([[139, 4.24], [374, -4.24]] as const).map(([z, side]) => {
        const row = course.at(course.locate({ x: 0, y: 8, z }).distance);
        return { ...row, ...pointOnRoute(row, side) };
    });
}

export function gateClearance(time: number): number {
    const phase = ((time + 0.55) % 6.1 + 6.1) % 6.1;
    const opening = Math.min(1, Math.max(0, Math.min(phase - 0.8, 5.65 - phase) / 0.72));
    return opening * opening * (3 - 2 * opening);
}

export function bladeCenters(deckHeight: number, time: number): readonly [number, number] {
    const open = gateClearance(time);
    return [deckHeight + 0.9 + open * 3.7, deckHeight + 0.12 - open * 1.4];
}
