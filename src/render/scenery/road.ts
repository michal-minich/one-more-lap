import { surfaceTexture } from "./surface-textures.ts";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { stamp } from "./instances.ts";
import type { Stamp } from "./instances.ts";
import { material } from "../materials.ts";
import type { Course } from "../../game/course/course.ts";
import type { Bend, CircuitLine } from "../../game/course/circuit-line.ts";
import { bridgeHalfLength } from "../../game/course/passages.ts";
import { bellgateCurbRanges } from "../../game/course/bellgate-streets.ts";
import { roadHalfWidth } from "../../game/course/road-width.ts";
import { pointOnRoute, ROAD_HALF } from "../../game/course/route.ts";
import { strip } from "../../game/course/surface.ts";
import { surface } from "./surface-mesh.ts";
import { drawTimingGantry } from "./timing-gantry.ts";
import { drawWindrows } from "./frosthaven/windrows.ts";

export function decorateRoad(scene: Scene, course: Course, layout: CircuitLine): void {
    const { route, track } = course;
    const white = material(scene, "white markings", track.id === "caldera" ? "#d2c7b6" :
        track.id === "reef" ? "#c9e1db" : (track.id === "metro" || track.id === "future" || track.id === "stunt")
            ? "#ece1c6" : "#dedcd0");
    const edgePaint = track.id === "mars" ? material(scene, "Ares oxide road edging", "#d8976c") : white;
    const yellow = material(scene, "centre markings", track.id === "sky" ? "#ace9df" :
        track.id === "alpine" || track.id === "reef" || track.id === "forest" || track.id === "ruins" || track.id === "coast" || track.id === "canyon" || track.id === "gorge" ? "#dfded2" : "#e4bb62");
    for (const side of [-1, 1] as const) {
        const [[firstStart, firstEnd], [secondStart, secondEnd]] = bellgateCurbRanges[side];
        const markings = track.id === "old-town"
            ? ([[0, firstStart], [firstEnd, secondStart], [secondEnd, course.length]] as const)
                .map(([start, end]) => route.filter(row => row.distance >= start && row.distance <= end))
            : [route];
        for (const rows of markings) {
            surface(scene, "edge stripe", strip(rows, row => {
                const edge = (roadHalfWidth(track.id, row.distance) - 0.46) * side;
                return [edge - 0.072, edge + 0.072];
            }, () => 0.037, course.gap), edgePaint);
        }
    }

    const line = MeshBuilder.CreateBox("road dashes", { size: 1 }, scene);
    line.material = (track.id === "metro" || track.id === "future" || track.id === "mars" || track.id === "stunt" || track.id === "caldera")
        ? white : yellow;
    line.receiveShadows = true;
    const dashes: Stamp[] = [];
    const dashLength = track.id === "rail" ? 2.35 : track.id === "reef" ? 4.2 : 3;
    const pitch = track.id === "rail" ? 11.5 : track.id === "reef" ? 10.6 : 9.5;
    const spacing = course.length / Math.round(course.length / pitch);
    const crossings = track.id === "metro" ? [52, 180, 863, 1_035] : [];
    for (let distance = spacing / 2; distance < course.length; distance += spacing) {
        if (Math.abs(course.startLine.distance - distance) < 3.7 || course.isGap(distance, dashLength / 2 + 0.1) ||
            crossings.some(crossing => Math.abs(crossing - distance) < 3.3)) continue;
        if (track.id === "old-town" && (distance < 409 || distance > 821 && distance < 950)) continue;
        const p = course.at(distance);
        const before = course.at(distance - dashLength / 2);
        const after = course.at(distance + dashLength / 2);
        dashes.push({
            x: p.x, y: p.y + 0.049, z: p.z, sx: 0.15, sy: 0.007, sz: dashLength,
            yaw: Math.atan2(p.dx, p.dz), pitch: -Math.atan2(after.y - before.y, dashLength),
        });
    }
    stamp(line, dashes);
    if (crossings.length > 0) drawGlasswaterCrossings(scene, course, white, crossings);

    const rail = MeshBuilder.CreateBox("steel guard rails", { size: 1 }, scene);
    const steel = material(scene, "galvanized steel", track.id === "metro" ? "#8a725d" : track.id === "mars" ? "#929092" : "#9b9b8e");
    steel.diffuseTexture = surfaceTexture(scene, "weathered steel");
    steel.specularColor.set(0.26, 0.27, 0.28);
    rail.material = steel;
    const beams: Stamp[] = [];
    const posts: Stamp[] = [];
    const gardenBeams: Stamp[] = [];
    const gardenPosts: Stamp[] = [];
    const gardenBarriers = new Set(course.branch?.barriers);
    if (track.id === "ruins") drawLimestoneParapet(scene, course);
    else if (track.id === "coast" || track.id === "alpine" || track.id === "canyon" || track.id === "gorge" || track.id === "arctic") drawStoneWall(scene, course);
    else course.barriers.forEach(barrier => {
        const { a, b } = barrier;
        const garden = gardenBarriers.has(barrier);
        const distance = Math.hypot(b.x - a.x, b.z - a.z);
        const length = Math.hypot(distance, b.y - a.y);
        const yaw = Math.atan2(b.x - a.x, b.z - a.z);
        (garden ? gardenBeams : beams).push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + 0.67, z: (a.z + b.z) / 2,
            sx: 0.25, sy: 0.21, sz: length, yaw, pitch: -Math.atan2(b.y - a.y, distance) });
        for (const t of [0, 0.32, 0.65]) (garden ? gardenPosts : posts).push({
            x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + 0.24,
            z: a.z + (b.z - a.z) * t, sx: 0.15, sy: 0.9, sz: 0.13, yaw,
        });
    });
    stamp(rail, beams);
    const post = MeshBuilder.CreateBox("rail posts", { size: 1 }, scene);
    const darkSteel = material(scene, "dark steel", "#5b5a4f");
    darkSteel.diffuseTexture = steel.diffuseTexture;
    post.material = darkSteel;
    stamp(post, posts);
    if (gardenBeams.length > 0) {
        const jade = material(scene, "jade garden bridge rails", "#598981");
        jade.diffuseTexture = surfaceTexture(scene, "dusty enamel");
        jade.specularColor.set(0.21, 0.28, 0.24);
        const gardenRail = MeshBuilder.CreateBox("jade handrail", { size: 1 }, scene);
        const gardenPost = MeshBuilder.CreateBox("jade rail posts", { size: 1 }, scene);
        gardenRail.material = jade;
        gardenPost.material = jade;
        stamp(gardenRail, gardenBeams);
        stamp(gardenPost, gardenPosts);
    }
    if (track.id === "arctic") {
        snowPoles(scene, course);
        drawWindrows(scene, course);
    }
    if (track.id === "forest") woodlandMarkers(scene, course);
    bendSigns(scene, layout.bends.filter(bend => bend.angle >= 0.60).slice(0, 3), darkSteel);

    drawTimingGantry(scene, layout, steel, darkSteel, white);
}

function drawGlasswaterCrossings(scene: Scene, course: Course, paint: StandardMaterial, distances: readonly number[]): void {
    const stripes: Stamp[] = [];
    for (const distance of distances) {
        const row = course.at(distance);
        const half = roadHalfWidth("metro", distance) - 0.93;
        const yaw = Math.atan2(row.dx, row.dz);
        const pitch = -Math.atan2(course.at(distance + 0.85).y - course.at(distance - 0.85).y, 1.7);
        for (let x = -half + 0.24; x < half; x += 1.0) {
            const stripe = pointOnRoute(row, x, 0.046);
            stripes.push({ ...stripe, sx: 0.44, sy: 0.009, sz: 1.68, yaw, pitch });
        }
    }
    const mesh = MeshBuilder.CreateBox("Glasswater painted pedestrian crossings", { size: 1 }, scene);
    mesh.material = paint;
    mesh.receiveShadows = true;
    stamp(mesh, stripes);
}

function drawStoneWall(scene: Scene, course: Course): void {
    const alpine = course.track.id === "alpine";
    const canyon = course.track.id === "canyon";
    const copper = course.track.id === "gorge";
    const frozen = course.track.id === "arctic";
    const region = alpine ? "Alpine" : canyon ? "Cinder" : copper ? "Copper" : frozen ? "Frosthaven" : "Pacific";
    const stone: Stamp[] = [];
    const cap: Stamp[] = [];
    const footing: Stamp[] = [];
    const piers: Stamp[] = [];
    const caps: Stamp[] = [];
    for (const [index, { a, b }] of course.barriers.entries()) {
        const run = Math.hypot(b.x - a.x, b.z - a.z);
        const yaw = Math.atan2(b.x - a.x, b.z - a.z);
        const pitch = -Math.atan2(b.y - a.y, run);
        const length = Math.hypot(run, b.y - a.y);
        const blocks = Math.max(2, Math.round(length / 2.4));
        for (let block = 0; block < blocks; block++) {
            const t = (block + 0.5) / blocks;
            const x = a.x + (b.x - a.x) * t;
            const z = a.z + (b.z - a.z) * t;
            const y = a.y + (b.y - a.y) * t;
            const width = 0.55 + (block % 3) * 0.024;
            const height = 0.69 + (block % 2) * 0.035;
            stone.push({ x, y: y + 0.25, z, sx: width, sy: height, sz: length / blocks + 0.013, yaw, pitch });
            cap.push({ x, y: y + 0.65, z, sx: width + 0.072, sy: 0.17, sz: length / blocks - 0.036, yaw, pitch });
        }
        if ((copper || frozen) && index % 3 === 0) {
            piers.push({ ...a, y: a.y + 0.41, sx: 0.7, sy: 1.1, sz: 0.8, yaw });
            caps.push({ ...a, y: a.y + 1.01, sx: 1.08, sy: 0.28, sz: 1.16, yaw: yaw + Math.PI / 4 });
        }
        footing.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 0.09, z: (a.z + b.z) / 2,
            sx: 0.57, sy: 0.34, sz: length + 0.085, yaw, pitch });
    }
    const masonry = material(scene, alpine ? "Alpine granite masonry" : canyon ? "Cinder sandstone masonry"
        : copper ? "Copper ashlar masonry" : frozen ? "Frosthaven ashlar masonry" : "Pacific slate masonry",
        alpine ? "#b2ada3" : canyon ? "#dda67c" : copper ? "#ccbba7" : frozen ? "#aeb5c2" : "#c5bcae");
    masonry.diffuseTexture = surfaceTexture(scene, alpine ? "alpine fractured granite" : canyon ? "cinder masonry"
        : copper ? "copper ashlar" : frozen ? "frosthaven ashlar" : "pacific slate");
    masonry.specularColor.set(0.03, 0.033, 0.039);
    const coping = material(scene, alpine ? "Alpine granite coping" : canyon ? "Cinder sandstone coping"
        : copper ? "Copper ashlar coping" : frozen ? "Frosthaven snow coping" : "Pacific chalk coping",
        alpine ? "#d0c6b6" : canyon ? "#dfb292" : copper ? "#d7b89b" : frozen ? "#d9e5f1" : "#c3b9a5");
    coping.diffuseTexture = surfaceTexture(scene, alpine ? "alpine fractured granite" : canyon ? "cinder sandstone"
        : copper ? "copper ashlar" : frozen ? "frosthaven drift snow" : "pacific chalk");
    coping.specularColor.set(0.036, 0.033, 0.03);
    if (piers.length) {
        const posts = MeshBuilder.CreateBox(`${region} ashlar piers`, { size: 1 }, scene);
        posts.material = masonry;
        posts.receiveShadows = true;
        stamp(posts, piers);
        const roof = MeshBuilder.CreateCylinder(`${region} parapet caps`, {
            diameterBottom: 1, diameterTop: 0.17, height: 1, tessellation: 4,
        }, scene);
        if (copper) {
            const metal = material(scene, "weathered copper coping", "#b16d49");
            metal.diffuseTexture = surfaceTexture(scene, "weathered steel");
            metal.specularColor.set(0.19, 0.13, 0.09);
            roof.material = metal;
        } else {
            roof.material = coping;
        }
        roof.receiveShadows = true;
        stamp(roof, caps);
    }
    const capstones = alpine ? "Alpine granite capstones" : canyon ? "Cinder sandstone capstones"
        : copper ? "Copper ashlar capstones" : frozen ? "Frosthaven snow capstones" : "Pacific chalk capstones";
    for (const [name, paint, pieces] of [[`${region} wall blockwork`, masonry, stone],
        [capstones, coping, cap],
        [`${region} wall foundations`, masonry, footing]] as const) {
        const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
        mesh.material = paint;
        mesh.receiveShadows = true;
        stamp(mesh, pieces);
    }
}

function drawLimestoneParapet(scene: Scene, course: Course): void {
    const cap: Stamp[] = [];
    const base: Stamp[] = [];
    const piers: Stamp[] = [];
    for (const [index, { a, b }] of course.barriers.entries()) {
        const run = Math.hypot(b.x - a.x, b.z - a.z);
        const length = Math.hypot(run, b.y - a.y) + 0.08;
        const yaw = Math.atan2(b.x - a.x, b.z - a.z);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
        const beam = { ...mid, sz: length, yaw, pitch: -Math.atan2(b.y - a.y, run) };
        cap.push({ ...beam, y: mid.y + 0.79, sx: 0.47, sy: 0.21 });
        base.push({ ...beam, y: mid.y + 0.075, sx: 0.46, sy: 0.21 });
        if (index % 2 === 0) piers.push({ ...a, y: a.y + 0.43, sx: 0.48, sy: 0.99, sz: 0.53, yaw });
        if (index === course.barriers.length - 1) {
            piers.push({ ...b, y: b.y + 0.43, sx: 0.48, sy: 0.99, sz: 0.53, yaw });
        }
    }
    const masonry = material(scene, "Aegean parapet masonry", "#dfc8a0");
    masonry.diffuseTexture = surfaceTexture(scene, "aegean masonry");
    const coping = material(scene, "Aegean parapet coping", "#f1ddb5");
    coping.diffuseTexture = surfaceTexture(scene, "aegean limestone");
    for (const [name, paint, instances] of [
        ["Aegean parapet capstones", coping, cap],
        ["Aegean parapet footings", masonry, base],
        ["Aegean parapet piers", masonry, piers],
    ] as const) {
        const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
        mesh.material = paint;
        mesh.receiveShadows = true;
        stamp(mesh, instances);
    }
}

function woodlandMarkers(scene: Scene, course: Course): void {
    const posts: Stamp[] = [];
    const lamps: Stamp[] = [];
    for (const [from, to] of [[92, 212], [258, 294], [366, 403], [486, 572]] as const) {
        for (let distance = from; distance < to; distance += 10.5) {
            const row = course.at(distance);
            for (const side of [-1, 1]) {
                const edge = roadHalfWidth("forest", distance);
                const at = pointOnRoute(row, side * (edge + (side === 1 && distance >= 117 && distance <= 195 ? 1.81 : 1.05)));
                const y = course.ground.at(at.x, at.z) ?? row.y;
                const yaw = Math.atan2(row.dx, row.dz);
                posts.push({ ...at, y: y + 0.48, sx: 0.15, sy: 0.94, sz: 0.17, yaw });
                lamps.push({ ...at, y: y + 0.88, sx: 0.104, sy: 0.14, sz: 0.182, yaw });
            }
        }
    }
    const post = MeshBuilder.CreateBox("Blackwood delineator posts", { size: 1 }, scene);
    post.material = material(scene, "weathered marker enamel", "#3c4545");
    stamp(post, posts);
    const lamp = MeshBuilder.CreateBox("Blackwood amber reflectors", { size: 1 }, scene);
    const amber = material(scene, "warm amber reflectors", "#ffd696");
    amber.emissiveColor.set(0.44, 0.22, 0.062);
    lamp.material = amber;
    stamp(lamp, lamps);
}

function snowPoles(scene: Scene, course: Course): void {
    const poles: Stamp[] = [];
    const tips: Stamp[] = [];
    const crossing = course.passages.find(passage => passage.kind === "bridge");
    for (let distance = 32; distance < course.length; distance += 31) {
        if (crossing && Math.abs(crossing.distance - distance) < bridgeHalfLength(course.track.id) + 4) continue;
        const row = course.at(distance);
        for (const side of [-1, 1]) {
            const at = pointOnRoute(row, side * (roadHalfWidth(course.track.id, distance) + 1.23));
            const y = course.ground.at(at.x, at.z) ?? row.y;
            poles.push({ ...at, y: y + 0.63, sx: 0.075, sy: 1.27, sz: 0.075, yaw: 0 });
            tips.push({ ...at, y: y + 1.19, sx: 0.12, sy: 0.31, sz: 0.12, yaw: 0 });
        }
    }
    const post = MeshBuilder.CreateBox("winter roadside poles", { size: 1 }, scene);
    const steel = material(scene, "dark snow pole", "#3b515b");
    steel.diffuseTexture = surfaceTexture(scene, "weathered steel");
    post.material = steel;
    stamp(post, poles);
    const cap = MeshBuilder.CreateBox("orange snow pole reflectors", { size: 1 }, scene);
    const orange = material(scene, "orange snow marker", "#e6a05d");
    orange.emissiveColor.set(0.19, 0.077, 0.024);
    cap.material = orange;
    stamp(cap, tips);
}

function bendSigns(scene: Scene, bends: readonly Bend[], postMaterial: StandardMaterial): void {
    const supports: Stamp[] = [];
    const arrows: Record<Bend["side"], Stamp[]> = { left: [], right: [] };
    for (const bend of bends) {
        const row = bend.sign;
        const outside = bend.side === "right" ? -1 : 1;
        const pos = pointOnRoute(row, (ROAD_HALF + 1.8) * outside);
        const yaw = Math.atan2(row.dx, row.dz);
        arrows[bend.side].push({ ...pos, y: pos.y + 1.68, sx: 1.3, sy: 0.70, sz: 1, yaw });
        supports.push({ ...pos, y: pos.y + 0.83, sx: 0.09, sy: 1.8, sz: 0.09, yaw });
    }
    const posts = MeshBuilder.CreateBox("bend sign posts", { size: 1 }, scene);
    posts.material = postMaterial;
    stamp(posts, supports);
    for (const direction of ["left", "right"] as const) {
        if (!arrows[direction].length) continue;
        const tile = new DynamicTexture(direction + " arrow", { width: 128, height: 64 }, scene, true);
        const ctx = tile.getContext();
        ctx.fillStyle = "#ebc65b";
        ctx.fillRect(0, 0, 128, 64);
        ctx.strokeStyle = "#272520";
        ctx.lineWidth = 4;
        ctx.strokeRect(5, 5, 118, 54);
        if (direction === "left") ctx.setTransform(-1, 0, 0, 1, 128, 0);
        ctx.fillStyle = "#272520";
        ctx.beginPath();
        ctx.moveTo(43, 13);
        ctx.lineTo(67, 13);
        ctx.lineTo(90, 32);
        ctx.lineTo(67, 51);
        ctx.lineTo(43, 51);
        ctx.lineTo(66, 32);
        ctx.closePath();
        ctx.fill();
        tile.update(false);
        const mat = material(scene, direction + " bend sign", "#ffffff");
        mat.diffuseTexture = tile;
        mat.emissiveTexture = tile;
        mat.emissiveColor.set(0.26, 0.26, 0.26);
        mat.specularColor.set(0, 0, 0);
        const sign = MeshBuilder.CreatePlane(direction + " curve ahead", { size: 1 }, scene);
        sign.material = mat;
        stamp(sign, arrows[direction]);
    }
}
