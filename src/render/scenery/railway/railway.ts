import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import { railwayEnds, railwayPoint } from "../../../game/course/railway/line.ts";
import { cloudMask } from "../../environment/cloud-mask.ts";
import { material } from "../../materials.ts";
import { surface } from "../surface-mesh.ts";
import { surfaceTexture } from "../surface-textures.ts";
import { UrbanParts } from "../urban-parts.ts";
import { rollingStock } from "./rolling-stock.ts";
import { drawRailwayYard } from "./railway-yard.ts";
import { drawStation } from "./station.ts";
import { drawTrackwork } from "./trackwork.ts";
import { drawHighValley } from "./high-valley.ts";


export function drawRailway(scene: Scene, course: Course) {
    const { wall, rings } = course.railwayViaduct!;
    const brick = material(scene, "viaduct masonry", "#c3a183");
    brick.diffuseTexture = surfaceTexture(scene, "juniper masonry");
    brick.backFaceCulling = false;
    const stone = material(scene, "viaduct arch rings", "#d8b898");
    stone.diffuseTexture = surfaceTexture(scene, "juniper masonry", 1.45, 1.2);
    stone.backFaceCulling = false;
    const masonry = surface(scene, "Juniper stone viaduct", wall, brick);
    surface(scene, "Juniper dressed arch stones", rings, stone, () => {
        const colors = new Float32Array(rings.positions.length / 3 * 4);
        for (let i = 0; i < rings.positions.length; i += 12) {
            const x = rings.positions[i]!;
            const z = rings.positions[i + 2]!;
            const tone = 0.94 + Math.sin(x * 2.32 + z * 1.11) * 0.092;
            for (let vertex = 0; vertex < 4; vertex++) {
                const light = tone * (vertex === 0 || vertex === 3 ? 0.90 : 1);
                colors.set([light, light * 0.98, light * 0.94, 1], i / 3 * 4 + vertex * 4);
            }
        }
        return colors;
    });
    const terraces = surface(scene, "Juniper stone terraces", course.juniperTerraces!, stone);

    const parts = new UrbanParts(scene);
    drawTrackwork(parts.add, course);
    drawStation(parts.add, course);
    drawRailwayYard(parts.add, course);
    drawHighValley(parts.add, course);

    const trackwork = parts.draw();
    const stock = rollingStock(scene);
    const engine = stock[0]!.root;
    const outlet = new Vector3();
    const steam = locomotiveSteam(scene, outlet);
    const first = railwayEnds[0] + stock.at(-1)!.offset + 8;
    const last = railwayEnds[1] - 9;
    return {
        shadowCasters: [masonry, terraces, ...trackwork.filter(mesh =>
            mesh.name === "railway ballast" || mesh.name === "viaduct iron railing" || mesh.name === "station brickwork" || mesh.name === "Juniper station plinth")],
        animate: (time: number) => {
            const phase = time * 0.082 + 0.93;
            const lead = first + (last - first) * (1 - Math.cos(phase)) * 0.5;
            for (const { root, wheels, offset } of stock) {
                const x = lead - offset;
                const at = railwayPoint(x);
                const next = railwayPoint(x + 0.85);
                root.position.set(at.x, at.y, at.z);
                root.rotation.set(-Math.atan2(next.y - at.y, Math.hypot(next.x - at.x, next.z - at.z)),
                    Math.atan2(next.x - at.x, next.z - at.z), 0);
                for (const { axle, radius } of wheels) axle.rotation.x = -(lead - first) / radius;
            }
            const ahead = railwayPoint(lead + 4);
            outlet.set(ahead.x, engine.position.y + 5.65, ahead.z);
            steam.emitRate = 6 + Math.abs(Math.sin(phase)) * (9 + Math.sin(time * 5.3) * 4);
        },
    };
}

function locomotiveSteam(scene: Scene, outlet: Vector3): ParticleSystem {
    const steam = new ParticleSystem("locomotive steam", 76, scene);
    steam.particleTexture = cloudMask(scene, 2307);
    steam.emitter = outlet;
    steam.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    steam.minEmitBox.set(-0.26, 0, -0.26);
    steam.maxEmitBox.set(0.26, 0.18, 0.26);
    steam.color1 = new Color4(0.9, 0.88, 0.83, 0.72);
    steam.color2 = new Color4(0.72, 0.73, 0.73, 0.48);
    steam.colorDead = new Color4(0.61, 0.63, 0.66, 0);
    steam.minSize = 2.4;
    steam.maxSize = 6.1;
    steam.minLifeTime = 1.4;
    steam.maxLifeTime = 3.9;
    steam.minEmitPower = 0.55;
    steam.maxEmitPower = 1.3;
    steam.direction1.set(-3.3, 1.6, -0.65);
    steam.direction2.set(-1.7, 2.8, 0.65);
    steam.minInitialRotation = -1.4;
    steam.maxInitialRotation = 1.4;
    steam.start();
    return steam;
}
