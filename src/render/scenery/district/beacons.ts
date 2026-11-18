import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { pacificLighthouse } from "../../../game/course/pacific-lighthouse.ts";
import type { BiomeLandmark } from "../../../game/course/biome-landmarks.ts";
import type { HarborBuilding } from "../../../game/course/frosthaven/harbor.ts";
import { lampCone } from "../../environment/lamp-cone.ts";
import { material } from "../../materials.ts";
import type { AnimateScenery } from "../course-attractions.ts";
import { offset } from "../urban-parts.ts";

export function lightPacificBeacon(scene: Scene, lighthouse: BiomeLandmark): AnimateScenery {
    const { height, yaw } = lighthouse;
    const { across, depth, rise } = pacificLighthouse.lantern;
    const center = offset(lighthouse, yaw, across * height, depth * height);
    return lightBeacon(scene, new Vector3(center.x, center.y + height * rise, center.z), yaw, "Pacific");
}

export function lightFrosthavenBeacon(scene: Scene, beacon: HarborBuilding): AnimateScenery {
    const center = offset(beacon, beacon.yaw, beacon.height * -0.03, beacon.height * 0.008);
    return lightBeacon(scene, new Vector3(center.x, center.y + beacon.height * 0.746, center.z), beacon.yaw, "Frosthaven");
}

function lightBeacon(scene: Scene, origin: Vector3, yaw: number, name: "Pacific" | "Frosthaven"): AnimateScenery {
    const harbor = name === "Frosthaven";
    const range = harbor ? 63 : 93;
    const size = harbor ? 11 : 18;
    const lantern = MeshBuilder.CreateSphere(`${name} lighthouse lens`, { diameter: 0.89, segments: 10 }, scene);
    lantern.position.copyFrom(origin);
    lantern.isPickable = false;
    const glass = material(scene, `${name} lighthouse amber lens`, "#fff0bb");
    glass.disableLighting = true;
    lantern.material = glass;
    const ray = lampCone(scene, "#ffe7b8");
    ray.name = `${name} rotating lighthouse beam`;
    ray.scaling.set(size, range, size);
    const scattering = ray.material!;
    const down = new Vector3(0, -1, 0);
    const direction = new Vector3();
    const turn = new Quaternion();
    ray.rotationQuaternion = turn;
    return (time, { daylight, fog, rain, snow }) => {
        const precipitation = harbor ? snow : rain;
        const strength = Math.min(1, (1 - daylight) * 0.96 + fog * 0.64 + precipitation * 0.17);
        const visible = strength > 0.08;
        ray.setEnabled(visible);
        lantern.setEnabled(visible);
        if (!visible) return;
        const angle = time * 0.61 + yaw;
        direction.set(Math.sin(angle), 0.032, Math.cos(angle)).normalize();
        Quaternion.FromUnitVectorsToRef(down, direction, turn);
        ray.position.copyFrom(origin).addInPlaceFromFloats(direction.x * range / 2, direction.y * range / 2, direction.z * range / 2);
        glass.emissiveColor.set(strength * 1.17, strength * 0.8, strength * 0.39);
        scattering.alpha = strength * (0.35 + fog * 0.59 + precipitation * 0.24);
    };
}
