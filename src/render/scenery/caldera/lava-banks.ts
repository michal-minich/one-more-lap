import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { locate } from "../../../game/course/route.ts";
import { channelPoint, waterDistance } from "../../../game/course/water.ts";
import type { WaterBody } from "../../../game/course/water.ts";
import { seededRandom } from "../../../game/random.ts";
import { material } from "../../materials.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { basaltBoulder } from "./basalt-variants.ts";

export function drawLavaBanks(scene: Scene, course: Course, lava: WaterBody): void {
    const random = seededRandom(1757);
    const shelves: Stamp[] = [];
    const fragments: Stamp[] = [];
    for (let cluster = 0; cluster < 29; cluster++) {
        const downriver = -0.81 + cluster * 0.059;
        const shore = Math.sqrt(1 - downriver ** 2);
        for (const bank of [-1, 1]) {
            const point = channelPoint(lava, downriver, bank * (shore + 0.16 + random() * 0.37));
            const width = 1.8 + random() * 3.2;
            const ahead = channelPoint(lava, downriver + 0.015, bank * shore);
            const yaw = Math.atan2(ahead.x - point.x, ahead.z - point.z) + (random() - 0.5) * 0.6;
            const slab = { ...point, sx: width, sy: 0.89 + random() * 0.65, sz: 2.8 + random() * 2.8, yaw };
            const chip = { ...point, x: point.x + random() * 0.6,
                sx: width * 0.47, sy: 0.47 + random() * 0.58, sz: 1.1 + random() * 1.43, yaw: yaw + 0.18 };
            const shelf = groundRock(course, lava, slab);
            const fragment = groundRock(course, lava, chip);
            if (shelf) shelves.push(shelf);
            if (fragment) fragments.push(fragment);
        }
    }
    const rock = material(scene, "cooled lava and ash", "#858591");
    rock.diffuseTexture = surfaceTexture(scene, "basalt");
    rock.specularColor.set(0.045, 0.038, 0.037);
    const slabs = basaltBoulder(scene, "slab", rock);
    const chips = basaltBoulder(scene, "round", rock);
    stamp(slabs, shelves);
    stamp(chips, fragments);
}

function groundRock(course: Course, lava: WaterBody, rock: Stamp): Stamp | undefined {
    if (Math.abs(locate(course.route, rock).lateral) < 12 + rock.sx) return undefined;
    const sin = Math.sin(rock.yaw);
    const cos = Math.cos(rock.yaw);
    const samples = [[0, 0], [-0.65, 0], [0.65, 0], [0, -0.65], [0, 0.65]] as const;
    const elevations = [];
    for (const [u, v] of samples) {
        const x = rock.x + u * rock.sx * cos + v * rock.sz * sin;
        const z = rock.z - u * rock.sx * sin + v * rock.sz * cos;
        if (waterDistance(lava, x, z) < 1.04) return undefined;
        const y = course.ground.at(x, z);
        if (y === undefined || y < lava.center.y + 0.28) return undefined;
        elevations.push(y);
    }
    const floor = Math.min(...elevations);
    const top = Math.max(...elevations);
    if (top - floor > rock.sy * 1.9) return undefined;
    const pitch = -Math.atan2(elevations[4]! - elevations[3]!, rock.sz * 1.3);
    const roll = Math.atan2(elevations[2]! - elevations[1]!, rock.sx * 1.3);
    return { ...rock, y: elevations[0]! + rock.sy * 0.24, pitch, roll };
}
