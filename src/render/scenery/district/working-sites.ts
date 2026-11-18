import type { Course } from "../../../game/course/course.ts";
import type { Outpost } from "../../../game/course/outposts.ts";
import { offset } from "../urban-parts.ts";
import type { BuildPart } from "../urban-parts.ts";
import { grounded } from "./rural-sites.ts";

export function depot(build: BuildPart, course: Course, site: Outpost): void {
    const { position: at, yaw } = site;
    const martian = course.track.id === "mars";
    const sheet = martian ? "#b49379" : "#818e94";
    for (const lateral of [-9.0, 9.0]) {
        const site = grounded(course, offset(at, yaw, lateral, -4));
        build("sheet metal warehouse", { ...site, y: site.y + 2.0, sx: 15.1, sy: 6.2, sz: 16.2, yaw }, sheet);
        build("hip roof", { ...site, y: site.y + 6.0, sx: 16.4, sy: 2.3, sz: 17.8, yaw: yaw + Math.PI / 4 }, "#586773");
        for (const x of [-4.75, 0, 4.75]) {
            const door = offset(site, yaw, x, 8.18);
            build("loading bay doors", { ...door, y: site.y + 1.65, sx: 3.65, sy: 3.9, sz: 0.21, yaw }, "#4f5151");
            build("loading bay stripe", { ...door, y: site.y + 4.05, sx: 3.7, sy: 0.28, sz: 0.42, yaw }, "#d5ad65");
        }
    }
    for (const [i, x, z] of [[0, -7, 12], [1, -3.6, 13.4], [2, 3.2, 14.1], [0, 11.4, 10.9], [2, 14.1, 9.5]] as const) {
        const unit = grounded(course, offset(at, yaw, x, z));
        const paint = ["#956253", "#6e8d8b", "#a8a28e"] as const;
        build("sheet metal warehouse", { ...unit, y: unit.y + 1.02, sx: 2.4, sy: 2.3, sz: 5.8, yaw }, paint[i]);
        if (i !== 0) build("sheet metal warehouse", { ...unit, y: unit.y + 3.26, sx: 2.4, sy: 2.19, sz: 5.75, yaw }, paint[i - 1]!);
    }
}

export function habitat(build: BuildPart, course: Course, site: Outpost): void {
    const { position: at, yaw } = site;
    for (const [x, z, radius] of [[-8.8, -3.1, 8.2], [8.5, -4.0, 7.0], [1.6, 9.1, 5.65]] as const) {
        const dome = grounded(course, offset(at, yaw, x, z));
        build("habitat skirt", { ...dome, y: dome.y + 0.15, sx: radius * 2.07, sy: 3.2, sz: radius * 2.07, yaw }, "#a79e8f", "oval");
        build("garden glass", { ...dome, y: dome.y + 1.4, sx: radius * 1.95, sy: radius * 1.78, sz: radius * 1.95, yaw }, "#79b4af", "dome");
        for (let panel = 0; panel < 10; panel++) {
            const angle = panel * Math.PI / 5;
            const rib = offset(dome, yaw, Math.cos(angle) * radius * 0.965, Math.sin(angle) * radius * 0.965);
            build("habitat tie-down", { ...rib, y: dome.y + 1.49, sx: 0.57, sy: 1.87, sz: 0.42, yaw: yaw - angle, roll: -0.18 },
                "#c9bfaa");
        }
    }
    for (const x of [-13, -7.2, 12.9, 18]) {
        const rig = grounded(course, offset(at, yaw, x, 12.7));
        build("solar trestle", { ...rig, y: rig.y + 1.28, sx: 0.4, sy: 2.85, sz: 0.45, yaw }, "#8a8577");
        build("solar cells", { ...rig, y: rig.y + 2.49, sx: 4.95, sy: 0.2, sz: 3.8, yaw, pitch: -0.32 }, "#3a5577");
    }
}

export function lookout(build: BuildPart, site: Outpost): void {
    const { position: at, yaw } = site;
    const timber = "#8e7760";
    for (const x of [-2.65, 2.65]) {
        for (const z of [-2.65, 2.65]) {
            const foot = offset(at, yaw, x, z);
            build("watchtower columns", { ...foot, y: at.y + 3.9, sx: 0.50, sy: 9.35, sz: 0.50, yaw }, timber);
            build("watchtower brace", { ...foot, y: at.y + 4.2, sx: 0.27, sy: 6.21, sz: 0.27, yaw, roll: Math.sign(x) * 0.47 }, "#706457");
        }
    }
    build("watchtower deck", { ...at, y: at.y + 8.3, sx: 7.38, sy: 0.44, sz: 7.38, yaw }, "#a38c6d");
    build("weathered timber", { ...at, y: at.y + 10.04, sx: 5.5, sy: 3.28, sz: 5.5, yaw }, timber);
    build("hip roof", { ...at, y: at.y + 12.25, sx: 7.03, sy: 1.44, sz: 7.03, yaw: yaw + Math.PI / 4 }, "#635c50");
    for (const facing of [yaw, yaw + Math.PI / 2]) {
        for (const side of [-1, 1]) {
            const pane = offset(at, facing, 0, side * 2.81);
            build("lit windows", { ...pane, y: at.y + 10.4, sx: 4.61, sy: 1.22, sz: 0.17, yaw: facing }, "#d6b675");
        }
    }
}

export function mine(build: BuildPart, site: Outpost): void {
    const { position: at, yaw } = site;
    build("excavated rock", { ...at, y: at.y + 1.2, sx: 15.8, sy: 8.2, sz: 11.9, yaw }, "#9f7157", "leaf");
    const entrance = offset(at, yaw, 0, -5.24);
    build("timber portal", { ...entrance, y: at.y + 1.77, sx: 4.75, sy: 3.95, sz: 1.28, yaw }, "#76604b");
    const opening = offset(entrance, yaw, 0, -0.66);
    build("mine opening", { ...opening, y: at.y + 1.48, sx: 3.42, sy: 3.3, sz: 0.13, yaw }, "#392c27");
    for (const rail of [-0.81, 0.81]) {
        const runner = offset(entrance, yaw, rail, -4.35);
        build("mine rails", { ...runner, y: at.y + 0.15, sx: 0.13, sy: 0.12, sz: 8.6, yaw }, "#877b68");
    }
    const crane = offset(at, yaw, 9.2, 2.2);
    build("old hoist", { ...crane, y: at.y + 3.6, sx: 0.45, sy: 7.4, sz: 0.45, yaw }, "#806c52");
    build("old hoist", { ...crane, y: at.y + 6.2, sx: 4.1, sy: 0.39, sz: 0.39, yaw, roll: -0.32 }, "#806c52");
}
