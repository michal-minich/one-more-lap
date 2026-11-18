import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { reefSuspended } from "../../../game/course/reef-tunnel.ts";
import { seededRandom } from "../../../game/random.ts";
import { material } from "../../materials.ts";
import { beamBetween } from "../beam.ts";
import { ActorMeshes } from "../flight/actor-meshes.ts";
import { surface } from "../surface-mesh.ts";
import { offset, UrbanParts } from "../urban-parts.ts";

const coralColors = ["#eb7357", "#eda968", "#b879b5", "#689d75", "#e9b997"] as const;
const fishColors = [["#f7b143", "#ffd37e"], ["#53c5cf", "#aaede5"], ["#f0756c", "#fea58b"]] as const;
const forkedFin = {
    positions: new Float32Array([0, 0, 0, 0, 0.23, -0.31, 0, 0, -0.20, 0, -0.18, -0.29]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    uv: new Float32Array([0, 0.5, 1, 1, 0.63, 0.5, 1, 0]),
};

export function drawReefLife(scene: Scene, course: Course): (time: number) => void {
    const parts = new UrbanParts(scene);
    const random = seededRandom(8141);
    for (let i = 0; i < 77; i++) {
        const row = course.at(216 + i * 5.34);
        const side = i % 2 === 0 ? -1 : 1;
        const at = pointOnRoute(row, side * (11 + random() * 17));
        const ground = course.ground.at(at.x, at.z) ?? row.y;
        if (ground > -2.5) continue;
        const tower = i % 5 === 0 && row.distance >= reefSuspended.from && row.distance <= reefSuspended.to;
        const relief = tower ? Math.max(0, row.y - ground) * 0.36 : 0;
        const height = 0.65 + random() * 3.5 + relief;
        const yaw = random() * Math.PI * 2;
        const tint = coralColors[i % coralColors.length]!;
        const root = { ...at, y: ground - 0.09 };
        parts.add("reef limestone", { ...root, y: ground + 0.14, sx: height * 1.24,
            sy: height * 0.42, sz: height * 0.93, yaw }, "#9b9f8f", "leaf");
        const trunk = { ...root, y: ground + height * 0.58 };
        parts.add("branching coral", beamBetween(root, trunk, height * 0.21, height * 0.18, 0.1), tint, "oval");
        for (const angle of [0, 2.12, 4.18]) {
            const tip = offset({ ...trunk, y: ground + height * (0.7 + random() * 0.33) },
                yaw + angle, height * 0.23, height * 0.16);
            parts.add("branching coral", beamBetween(trunk, tip, height * 0.14, height * 0.13, 0.08), tint, "oval");
            parts.add("coral tips", { ...tip, sx: height * 0.16, sy: height * 0.21,
                sz: height * 0.16, yaw }, tint, "leaf");
            if (height > 1.6) {
                for (const bend of [-0.6, 0.55]) {
                    const offshoot = offset({ ...tip, y: tip.y + height * (0.12 + random() * 0.16) },
                        yaw + angle + bend, height * 0.16, height * 0.14);
                    parts.add("branching coral", beamBetween(tip, offshoot, height * 0.079, height * 0.092, 0.05),
                        tint, "oval");
                }
            }
        }
        if (i % 3 === 0) {
            const shelf = pointOnRoute(row, side * (20 + random() * 14));
            const floor = course.ground.at(shelf.x, shelf.z) ?? ground;
            const scale = 2.3 + random() * 3.5;
            parts.add("reef limestone", { ...shelf, y: floor + scale * 0.09, sx: scale * 1.4,
                sy: scale * 0.67, sz: scale, yaw }, "#829a8d", "leaf");
        }
    }
    parts.draw();
    const paint = fishColors.map(([body, fin]) => {
        const scales = material(scene, "reef fish scales", body);
        scales.emissiveColor.set(0.12, 0.10, 0.04);
        const rays = material(scene, "reef fish fin rays", fin);
        rays.backFaceCulling = false;
        rays.emissiveColor.copyFrom(scales.emissiveColor);
        return { scales, rays };
    });
    const schools = Array.from({ length: 7 }, (_, school) => {
        const row = course.at(243 + school * 54);
        const side = school % 2 === 0 ? -1 : 1;
        const below = school % 3 === 1;
        const home = pointOnRoute(row, side * (below ? 3.5 : 12.6), below ? -8.4 : 3.6 + (school % 3) * 0.92);
        const root = new TransformNode("school of reef fish", scene);
        const mesh = new ActorMeshes(scene, root);
        const tails = Array.from({ length: 5 }, (_, i) => {
            const x = (i % 3 - 1) * 0.75;
            const y = (i % 2) * 0.64;
            const z = -Math.floor(i / 2) * 1.18 - i * 0.22;
            const fish = paint[school % paint.length]!;
            const size = 0.83 + (i % 3) * 0.115;
            mesh.oval("fish body", [0.28 * size, 0.52 * size, 0.94 * size], [x, y, z], fish.scales);
            const tail = surface(scene, "forked fish tail", forkedFin, fish.rays);
            tail.parent = root;
            tail.position.set(x, y, z - 0.38 * size);
            tail.scaling.setAll(size);
            tail.receiveShadows = false;
            return tail;
        });
        return { row, side, home, root, tails };
    });
    return time => {
        for (const [i, { row, side, home, root, tails }] of schools.entries()) {
            const phase = time * 0.51 + i * 1.47;
            const along = Math.cos(phase) * 7;
            const lateral = side * Math.sin(phase) * 2.1;
            root.position.set(home.x + row.dx * along + row.dz * lateral,
                home.y + Math.sin(phase * 1.7) * 0.85, home.z + row.dz * along - row.dx * lateral);
            root.rotation.y = Math.atan2(-row.dx * Math.sin(phase) * 7 + row.dz * side * Math.cos(phase) * 2.1,
                -row.dz * Math.sin(phase) * 7 - row.dx * side * Math.cos(phase) * 2.1);
            tails.forEach((tail, index) => { tail.rotation.y = Math.sin(time * 8 + index) * 0.43; });
        }
    };
}
