import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { rockProfiles } from "../../../game/course/rock-profiles.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { seededRandom } from "../../../game/random.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";

const gardens = [[275, -1], [342, -1], [403, 1], [454, -1], [510, 1], [573, -1]] as const;
const palette = [[0.94, 0.44, 0.36], [0.82, 0.37, 0.66], [0.96, 0.68, 0.4]] as const;

export function drawCoralGardens(scene: Scene, course: Course): void {
    const paint = material(scene, "rippled coral fans", "#ffffff");
    paint.diffuseTexture = surfaceTexture(scene, "granite");
    paint.backFaceCulling = false;
    paint.emissiveColor.set(0.12, 0.083, 0.098);
    paint.specularColor.set(0.035, 0.041, 0.045);
    const random = seededRandom(4_726);
    const rocks: Stamp[] = [];
    for (const [index, tint] of palette.entries()) {
        const placements: Stamp[] = [];
        for (const [distance, side] of gardens) {
            for (let i = 0; i < 2; i++) {
                const row = course.at(distance + i * 8.2 + index * 3.47);
                const at = pointOnRoute(row, side * (19.8 + index * 5.7 + random() * 5));
                const ground = course.ground.at(at.x, at.z) ?? row.y - 10;
                const crown = Math.min(-1, row.y - 1.3 + random() * 5.2);
                const base = Math.max(ground, crown - (3.9 + random() * 2.8));
                const height = crown - base;
                if (height < 2.5) continue;
                placements.push({ ...at, y: base - 0.24, sx: 3.8 + random() * 3.1, sy: height, sz: 0.9 + random() * 1.9,
                    yaw: Math.atan2(row.dx, row.dz) + side * (0.39 + random() * 0.8) });
                if (base - ground > 0.5) rocks.push({ ...at, y: ground - 0.65, sx: 5.1, sy: base - ground + 1.1,
                    sz: 4.6, yaw: row.distance * 0.11 });
            }
        }
        const { shape, colors } = fanShape(index, tint);
        stamp(surface(scene, "sea fan colony", shape, paint, () => colors), placements);
    }
    const stone = material(scene, "reef limestone shelves", "#87a594");
    stone.diffuseTexture = surfaceTexture(scene, "coral limestone");
    stamp(surface(scene, "coral limestone supports", rockProfiles.fin, stone, () => rockProfiles.fin.colors), rocks);
}

function fanShape(variant: number, [red, green, blue]: typeof palette[number]) {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const ribs = 14;
    const layers = 7;
    const columns = ribs + 1;
    for (let layer = 0; layer <= layers; layer++) {
        const rise = layer / layers;
        const spread = 0.026 + Math.sin(rise * 2.23) * 0.57;
        for (let rib = 0; rib <= ribs; rib++) {
            const along = rib / ribs;
            const side = along * 2 - 1;
            const edge = Math.sin(rib * 1.72 + variant) * 0.046 + Math.cos(rib * 0.9 - variant) * 0.036;
            const height = rise * (0.99 - Math.abs(side) ** 1.55 * 0.41 + edge);
            const bend = Math.sin(along * 17.5 + rise * 3.1 + variant) * rise * 0.2;
            positions.push(side * spread, height, bend + rise * rise * 0.28);
            uv.push(along * 2, rise * 1.47);
            const tone = 0.55 + rise * 0.39 + (rib % 2 === 0 ? 0.065 : -0.08);
            colors.push(red * tone, green * tone, blue * tone, 1);
            if (rib === 0 || layer === 0) continue;
            const i = layer * columns + rib;
            indices.push(i - columns - 1, i - columns, i - 1, i - columns, i, i - 1);
        }
    }
    return {
        colors: new Float32Array(colors),
        shape: { positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint32Array(indices) },
    };
}
