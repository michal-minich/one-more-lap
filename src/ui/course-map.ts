import type { Point } from "../game/point.ts";
import type { Course } from "../game/course/course.ts";
import type { CircuitLine, RaceDirection } from "../game/course/circuit-line.ts";
import type { RivalPosition } from "../game/race/opponents.ts";

type MapProjection = (point: Point) => readonly [number, number];
type MapPoint = readonly [number, number];

export function drawCourseOutline(canvas: HTMLCanvasElement, course: Course): void {
    drawCircuit(canvas, course, course.raceLine("forward"), true);
}

export class CircuitMap {
    readonly #canvas: HTMLCanvasElement;
    readonly #background: HTMLCanvasElement;
    #project: MapProjection | undefined;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#background = document.createElement("canvas");
        this.#background.width = canvas.width;
        this.#background.height = canvas.height;
    }

    show(course: Course, direction: RaceDirection): void {
        const line = course.raceLine(direction);
        this.#project = drawCircuit(this.#background, course, line, false);
        this.move(line.start);
    }

    move(point: Point, rivals: readonly RivalPosition[] = []): void {
        const context = this.#canvas.getContext("2d");
        if (!context || !this.#project) return;
        const { width, height } = this.#canvas;
        context.clearRect(0, 0, width, height);
        context.drawImage(this.#background, 0, 0);
        const [x, y] = this.#project(point);
        const px = Math.max(5, Math.min(width - 5, x));
        const py = Math.max(5, Math.min(height - 5, y));
        const markers: MapPoint[] = [[px, py]];
        for (const rival of rivals) {
            const [rx, ry] = separateMarker(this.#project(rival.position), markers);
            markers.push([rx, ry]);
            dot(context, rx, ry, 3.65, "#141919");
            dot(context, rx, ry, 2.45, rival.paint);
        }
        dot(context, px, py, 5, "#121917");
        dot(context, px, py, 3.2, "#ffffff");
    }
}

function separateMarker(at: MapPoint, markers: readonly MapPoint[]): MapPoint {
    const [x, y] = at;
    const clear = (px: number, py: number): boolean =>
        markers.every(([mx, my]) => (mx - px) ** 2 + (my - py) ** 2 >= 30.25);
    if (clear(x, y)) return at;
    for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const px = x + Math.cos(angle) * 5.5;
        const py = y + Math.sin(angle) * 5.5;
        if (clear(px, py)) return [px, py];
    }
    return at;
}

function drawCircuit(canvas: HTMLCanvasElement, course: Course, line: CircuitLine, outlineOnly: boolean): MapProjection {
    const { route } = line;
    const { width, height } = canvas;
    const xMin = Math.min(...route.map(point => point.z));
    const xMax = Math.max(...route.map(point => point.z));
    const yMin = Math.min(...route.map(point => point.x));
    const yMax = Math.max(...route.map(point => point.x));
    const scale = Math.min((width - 20) / (xMax - xMin), (height - 16) / (yMax - yMin));
    const project: MapProjection = point => [
        width * 0.5 + (point.z - (xMin + xMax) / 2) * scale,
        height * 0.5 + (point.x - (yMin + yMax) / 2) * scale,
    ];

    const context = canvas.getContext("2d");
    if (!context) return project;
    context.clearRect(0, 0, width, height);
    const path = new Path2D();
    for (const [i, point] of route.entries()) {
        const [x, y] = project(point);
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
    }
    path.closePath();
    const branch = course.branch?.route;
    if (branch) {
        const [start, ...rest] = branch;
        path.moveTo(...project(start!));
        for (const point of rest) path.lineTo(...project(point));
    }
    context.lineJoin = "round";
    context.strokeStyle = "#101912";
    context.lineWidth = outlineOnly ? 8 : 5.5;
    context.stroke(path);
    context.strokeStyle = outlineOnly ? "#fff3e8" : "#f2c0a5";
    context.lineWidth = outlineOnly ? 4 : 2;
    context.stroke(path);
    if (course.gap && !outlineOnly) {
        const [x, y] = project(course.at((course.gap.from + course.gap.to) / 2));
        dot(context, x, y, 3.4, "#36232b");
        dot(context, x, y, 2.2, "#ffc674");
    }
    const [startX, startY] = project(line.startLine);
    const { dx, dz } = line.startLine;
    startFlag(context, startX, startY, Math.atan2(-dz, dx), outlineOnly ? 4.5 : 2.4);
    return project;
}

function startFlag(context: CanvasRenderingContext2D, x: number, y: number, angle: number, tile: number): void {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.fillStyle = "#281c1f";
    context.fillRect(-2 * tile - 1.2, -tile - 1.2, 4 * tile + 2.4, 2 * tile + 2.4);
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
            context.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#161616";
            context.fillRect((col - 2) * tile, (row - 1) * tile, tile, tile);
        }
    }
    context.restore();
}

function dot(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
}
