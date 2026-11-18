import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../game/course/course.ts";
import { railwayPoint } from "../game/course/railway/line.ts";
import { pointOnRoute } from "../game/course/route.ts";
import type { Biome } from "../game/course/tracks.ts";
import type { RaceDirection } from "../game/course/circuit-line.ts";
import { bodyShape, cabinCorner } from "../game/vehicle/body-shapes.ts";
import type { CarSpec } from "../game/vehicle/cars.ts";
import { parkedHeight } from "../game/vehicle/wheels.ts";
import type { RaceCamera } from "./camera/race-camera.ts";
import type { CarModel } from "./car/model.ts";
import type { Point } from "../game/point.ts";
import { surveyCarrierSite } from "./scenery/flight/spaceport.ts";

const garageVista: Record<Biome, readonly [distance: number, side: number]> = {
    stunt: [167, -1], rail: [72, -1], reef: [293, -1], coast: [558, 0.88], alpine: [455, -1], canyon: [506, 1], ruins: [103, 0.8],
    forest: [289, -1], "old-town": [132, -1], metro: [118, 1], future: [92, -1],
    mars: [820, -0.65], arctic: [154, 0.65], gorge: [428, -1.65], sky: [90, -1], caldera: [48, -1],
};

const garageFraming: Partial<Record<Biome, Parameters<RaceCamera["park"]>[2]>> = {
    alpine: "panorama", sky: "panorama", caldera: "caldera",
};

export function garageRoof(spec: CarSpec): Vector3 {
    const shape = bodyShape(spec);
    const rear = cabinCorner(spec, shape, shape.rearRoof, 0, true);
    const front = cabinCorner(spec, shape, shape.frontRoof, 0, true);
    return new Vector3(0, (rear.y + front.y) * 0.5, (rear.z + front.z) * 0.5);
}

export function parkCar(scene: Scene, course: Course, car: CarModel, camera: RaceCamera, spec: CarSpec, direction: RaceDirection): void {
    const [distance, side] = garageVista[course.track.id];
    const row = course.at(distance);
    car.root.position.set(row.x, row.y + parkedHeight(spec), row.z);
    const grade = (course.at(row.distance + 2).y - course.at(row.distance - 2).y) / 4;
    const reverse = direction === "reverse";
    const yaw = Math.atan2(row.dx, row.dz) - 0.31 + (reverse ? Math.PI : 0);
    car.root.rotationQuaternion!.copyFrom(Quaternion.RotationYawPitchRoll(yaw, Math.atan(grade) * (reverse ? 1 : -1), 0));
    const fill = new HemisphericLight("garage fill", new Vector3(0.44, 0.86, -0.55), scene);
    fill.intensity = 0.28;
    fill.diffuse.set(0.96, 0.98, 1);
    fill.groundColor.set(0.30, 0.32, 0.38);
    const landmark = previewLandmark(course);
    if (landmark) {
        camera.parkLandmark(row, landmark, side);
    } else {
        camera.park(row, side, garageFraming[course.track.id] ?? "standard");
    }
}

function previewLandmark(course: Course): Point | undefined {
    switch (course.track.id) {
        case "ruins": return course.aqueduct?.row;
        case "forest": return course.at(course.forestBridge?.distance ?? 328);
        case "arctic": return course.frosthavenHarbor?.houses[1];
        case "stunt": return { x: 10, y: 22, z: 253 };
        case "rail": return railwayPoint(-7);
        case "coast": return course.outposts.find(site => site.kind === "lighthouse")?.position;
        case "canyon": {
            return course.shelter?.rows[0];
        }
        case "old-town": return course.townGate?.row;
        case "mars": return pointOnRoute(course.at(surveyCarrierSite.distance), surveyCarrierSite.lateral);
        case "gorge": {
            const rows = course.shelter?.rows;
            return rows && pointOnRoute(rows[Math.floor(rows.length / 2)]!, 2);
        }
        default: return undefined;
    }
}
