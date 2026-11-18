import type { Course } from "../../../game/course/course.ts";
import type { Outpost } from "../../../game/course/outposts.ts";
import type { Point } from "../../../game/point.ts";
import { pacificLighthouse, pacificLighthouseBase } from "../../../game/course/pacific-lighthouse.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";

export function farm(build: BuildPart, course: Course, site: Outpost): void {
    const { position, yaw } = site;
    const snow = course.track.id === "arctic";
    const alpine = course.track.id === "alpine";
    const coast = course.track.id === "coast";
    const wall = snow ? "#994d44" : coast ? "#d9c9a5" : "#9b6250";
    const roof = snow ? "#dae3e4" : coast ? "#a26750" : "#66605a";
    if (site.kind === "farm") {
        cabin(build, position, yaw, 11.9, 14.6, 4.5, wall, roof, snow);
        cabin(build, grounded(course, offset(position, yaw, 9.5, -4.2)), yaw - 0.17, 5.8, 6.8, 3.05, "#91715a", roof, snow);
        const silo = grounded(course, offset(position, yaw, -9.2, 6.0));
        build("farm silo", { ...silo, y: silo.y + 3.33, sx: 3.35, sy: 7.4, sz: 3.35, yaw }, "#b3ab91", "oval");
        build("silo cap", { ...silo, y: silo.y + 6.74, sx: 3.5, sy: 2.2, sz: 3.5, yaw }, "#8b7764", "dome");
        for (let i = 0; i < 5; i++) {
            const bale = grounded(course, offset(position, yaw, 1.8 + i * 2.25, 11.4 - i % 2 * 1.42));
            build("hay rolls", { ...bale, y: bale.y + 0.72, sx: 1.66, sy: 1.28, sz: 1.66, yaw, pitch: Math.PI / 2 },
                alpine ? "#b6a56a" : "#c9a866", "oval");
        }
    } else {
        const colors = [wall, snow ? "#516b79" : "#8a745a", snow ? "#af8a55" : "#846857"] as const;
        for (const [index, x, z, turn] of [[0, -8.5, -4.1, 0], [1, 4.7, 6.1, 0.16], [2, 9.5, -6.0, -0.27]] as const) {
            const at = grounded(course, offset(position, yaw, x, z));
            cabin(build, at, yaw + turn, 6.1 + index, 8.1, 2.85 + index * 0.55, colors[index], roof, snow);
        }
    }
}

export function timberYard(build: BuildPart, course: Course, site: Outpost): void {
    const { position, yaw } = site;
    cabin(build, position, yaw, 12, 8, 3.7, "#806147", "#514c42", course.track.id === "arctic");
    for (const [dx, dz] of [[-10, 0], [-7.5, 6], [6.8, 7.1]] as const) {
        const stack = grounded(course, offset(position, yaw, dx, dz));
        for (let index = 0; index < 7; index++) {
            const raised = index > 3;
            const log = offset(stack, yaw, (index % 4 - 1.5) * 0.91 + (raised ? 0.45 : 0), (index % 2 - 0.5) * 0.27);
            build("stacked timber", { ...log, y: stack.y + (raised ? 1.33 : 0.51), sx: 0.94, sy: 4.4,
                sz: 0.94, yaw, pitch: Math.PI / 2 }, "#866342", "oval");
            const end = offset(log, yaw, 0, -2.21);
            build("cut timber ends", { ...end, y: stack.y + (raised ? 1.33 : 0.51), sx: 0.83, sy: 0.04,
                sz: 0.83, yaw, pitch: Math.PI / 2 }, "#bb976a", "oval");
        }
    }
}

export function drawLighthouseFoundation(build: BuildPart, course: Course, site: Outpost): void {
    const { position: at, yaw } = site;
    const { height, footing } = pacificLighthouse;
    const width = height * footing.width;
    const depth = height * footing.depth;
    const top = at.y + 0.39;
    const bottom = pacificLighthouseBase(at, yaw, course.ground);
    build("Pacific lighthouse foundations", { ...at, y: (bottom + top) / 2, sx: width, sy: top - bottom, sz: depth, yaw }, "#b6aa94");
    build("Pacific lighthouse paving", { ...at, y: top + 0.15, sx: width + 0.46, sy: 0.30, sz: depth + 0.44, yaw }, "#d7c5a7");
}

export function lighthouse(build: BuildPart, course: Course, site: Outpost): void {
    const { position: at, yaw } = site;
    const tower = course.track.id === "arctic" ? "#b9b7ad" : "#d8cdb5";
    const ground = grounded(course, offset(at, yaw, -3.5, 0));
    const base = Math.min(at.y - 1.2, ground.y - 0.7);
    build("beacon plinth", { ...at, y: (at.y + base) / 2, sx: 8.8, sy: at.y - base + 0.9, sz: 8.8, yaw },
        "#9b9585", "oval");
    for (const [low, high, diameter, tint] of [[0, 1.2, 5.4, "#b4ae9e"], [1.2, 7.4, 5.0, tower],
        [7.4, 10.2, 4.78, "#a2483f"], [10.2, 14.25, 4.54, tower], [14.25, 14.92, 4.77, "#bcb5a4"]] as const) {
        build("beacon tower", { ...at, y: at.y + (low + high) / 2, sx: diameter, sy: high - low + 0.04,
            sz: diameter, yaw }, tint, "oval");
    }
    const iron = "#506460";
    build("beacon walkway", { ...at, y: at.y + 15.04, sx: 6.64, sy: 0.43, sz: 6.64, yaw }, iron, "oval");
    build("lit windows", { ...at, y: at.y + 16.37, sx: 3.94, sy: 2.2, sz: 3.94, yaw }, "#dba96c", "oval");
    for (let index = 0; index < 12; index++) {
        const angle = index * Math.PI / 6;
        const post = offset(at, yaw, Math.sin(angle) * 1.97, Math.cos(angle) * 1.97);
        build("beacon glazing frame", { ...post, y: at.y + 16.36, sx: 0.13, sy: 2.32, sz: 0.15, yaw: yaw + angle }, iron);
        const rail = offset(at, yaw, Math.sin(angle) * 3.12, Math.cos(angle) * 3.12);
        build("beacon glazing frame", { ...rail, y: at.y + 15.67, sx: 0.13, sy: 1.14, sz: 0.13, yaw: yaw + angle }, iron);
        const middle = angle + Math.PI / 12;
        const handrail = offset(at, yaw, Math.sin(middle) * 3.015, Math.cos(middle) * 3.015);
        build("beacon glazing frame", { ...handrail, y: at.y + 16.2, sx: 1.64, sy: 0.13, sz: 0.15, yaw: yaw + middle }, iron);
    }
    build("beacon walkway", { ...at, y: at.y + 17.56, sx: 4.72, sy: 0.29, sz: 4.72, yaw }, iron, "oval");
    build("beacon cap", { ...at, y: at.y + 17.69, sx: 4.67, sy: 2.16, sz: 4.67, yaw }, "#973d36", "dome");
    build("beacon glazing frame", { ...at, y: at.y + 18.94, sx: 0.17, sy: 0.93, sz: 0.17, yaw }, iron, "oval");
    const entry = offset(at, yaw, 0, -2.51);
    build("painted door", { ...entry, y: at.y + 1.31, sx: 0.96, sy: 2.25, sz: 0.22, yaw }, iron);
    for (const face of [-1, 1]) {
        const window = offset(at, yaw, 0, face * 2.29);
        build("beacon glazing frame", { ...window, y: at.y + 12.03, sx: 0.67, sy: 0.94, sz: 0.23, yaw }, iron);
        build("lit windows", { ...window, y: at.y + 12.03, sx: 0.43, sy: 0.68, sz: 0.27, yaw }, "#d9af78");
    }
    const shed = grounded(course, offset(at, yaw, 7.28, 2.5));
    cabin(build, shed, yaw, 6.3, 5.1, 2.95, "#b5ac95", "#8d5a4e", false);
}

export function forestLodge(build: BuildPart, course: Course, site: Outpost): void {
    const { position, yaw } = site;
    const width = 13;
    const depth = 11;
    const wallHeight = 4.1;
    let bottom = position.y;
    for (const x of [-width / 2, width / 2]) {
        for (const z of [-depth / 2, depth / 2]) {
            const point = offset(position, yaw, x, z);
            bottom = Math.min(bottom, course.ground.at(point.x, point.z) ?? bottom);
        }
    }
    const paint = position.z < 105 ? "#87624e" : position.z < 310 ? "#a78361" : "#645b47";
    const footing = position.y - bottom + 0.92;
    build("stone footing", { ...position, y: position.y - footing / 2 + 0.34, sx: width + 0.3, sy: footing + 0.69,
        sz: depth + 0.3, yaw }, "#76776b");
    build("weathered timber", { ...position, y: position.y + wallHeight / 2, sx: width, sy: wallHeight, sz: depth, yaw }, paint);
    build("gable roof", { ...position, y: position.y + wallHeight - 0.08, sx: width + 1.14, sy: 2.84,
        sz: depth + 1.18, yaw }, "#4c5451");
    const chimney = offset(position, yaw, -3.15, 2.6);
    build("stone chimney", { ...chimney, y: position.y + 5.96, sx: 0.91, sy: 3.2, sz: 0.85, yaw }, "#8b7566");
    build("stone footing", { ...chimney, y: position.y + 7.53, sx: 1.21, sy: 0.20, sz: 1.09, yaw }, "#76776b");
    for (const side of [-1, 1]) {
        const facade = offset(position, yaw, 0, side * (depth / 2 + 0.13));
        build("barn doors", { ...facade, y: position.y + 1.29, sx: 1.62, sy: 2.54, sz: 0.25, yaw }, "#584437");
        for (const lateral of [-4.3, 4.3]) {
            const window = offset(facade, yaw, lateral, 0);
            build("window frame", { ...window, y: position.y + 2.27, sx: 1.74, sy: 1.53, sz: 0.26, yaw }, "#d2be95");
            build("lit windows", { ...window, y: position.y + 2.27, sx: 1.42, sy: 1.21, sz: 0.32, yaw }, "#c89c66");
            build("timber window trim", { ...window, y: position.y + 2.27, sx: 0.105, sy: 1.36, sz: 0.39, yaw }, "#d2be95");
        }
    }
    drawLodgePorch(build, course, position, yaw, depth);
}

function drawLodgePorch(build: BuildPart, course: Course, position: Point, yaw: number, depth: number): void {
    const porch = offset(position, yaw, 0, -depth / 2 - 1.32);
    const trim = "#66503d";
    build("weathered timber", { ...porch, y: position.y + 0.55, sx: 8.6, sy: 0.30, sz: 2.70, yaw }, trim);
    build("shingled porch roof", { ...porch, y: position.y + 3.31, sx: 9.2, sy: 0.25, sz: 3.01, yaw, pitch: 0.12 }, "#4c5451");
    for (const lateral of [-4.02, -2.01, 2.01, 4.02]) {
        const post = grounded(course, offset(porch, yaw, lateral, -1.12));
        const base = Math.min(position.y, post.y) - 0.42;
        build("weathered timber", { ...post, y: (position.y + 3.1 + base) / 2, sx: 0.24,
            sy: position.y + 3.1 - base, sz: 0.26, yaw }, trim);
    }
}

function cabin(
    build: BuildPart, at: Point, yaw: number, width: number, depth: number, height: number, wall: string, roof: string, snow: boolean,
    foundationDepth = 1.55,
): void {
    build("stone footing", { ...at, y: at.y + (0.65 - foundationDepth) / 2, sx: width * 1.04,
        sy: 0.65 + foundationDepth, sz: depth * 1.04, yaw }, "#777363");
    build("weathered timber", { ...at, y: at.y + height / 2, sx: width, sy: height, sz: depth, yaw }, wall);
    build("hip roof", { ...at, y: at.y + height + 0.91, sx: width * 1.15, sy: 1.94, sz: depth * 1.14,
        yaw: yaw + Math.PI / 4 }, roof);
    const trim = offset(at, yaw, width * 0.27, depth * 0.22);
    build("stone chimney", { ...trim, y: at.y + height + 1.40, sx: 0.68, sy: 2.26, sz: 0.71, yaw }, "#69645b");
    const front = offset(at, yaw, 0, -depth / 2 - 0.07);
    build("barn doors", { ...front, y: at.y + height * 0.34, sx: width * 0.39, sy: height * 0.68, sz: 0.25, yaw }, "#514236");
    for (const side of [-1, 1]) {
        const sill = offset(front, yaw, side * width * 0.33, -0.08);
        build("lit windows", { ...sill, y: at.y + height * 0.54, sx: 1.12, sy: 0.88, sz: 0.18, yaw }, "#dec19a");
        build("timber window trim", { ...sill, y: at.y + height * 0.54 - 0.52, sx: 1.41, sy: 0.15, sz: 0.29, yaw },
            snow ? "#d9d0bc" : "#b9a889");
    }
}

export function grounded(course: Course, at: Point): Point {
    return { ...at, y: course.ground.at(at.x, at.z) ?? at.y };
}
