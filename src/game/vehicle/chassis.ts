import RAPIER from "@dimforge/rapier3d-compat";
import type { RouteSample } from "../course/route.ts";
import type { CarSpec } from "./cars.ts";
import { yawRotation } from "./pose.ts";
import { parkedHeight } from "./wheels.ts";
import { coachworkColliders } from "./coachwork-colliders.ts";
import { playerCollisionGroups } from "./collision-groups.ts";

export function buildChassis(world: RAPIER.World, car: CarSpec, spawn: RouteSample): RAPIER.RigidBody {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(spawn.x, spawn.y + parkedHeight(car), spawn.z)
        .setRotation(yawRotation(Math.atan2(spawn.dx, spawn.dz)))
        .setAngularDamping(car.stability.angularDamping).setLinearDamping(0.035).setCcdEnabled(true).setCanSleep(false));

    const width = car.width * 0.43;
    const height = car.bodyHeight / 2;
    const length = car.length * 0.46;
    const inertia = {
        x: car.mass / 3 * (height ** 2 + length ** 2),
        y: car.mass / 3 * (width ** 2 + length ** 2),
        z: car.mass / 3 * (width ** 2 + height ** 2) * car.stability.rollInertia,
    };
    const [shell, cabin] = coachworkColliders(car);
    world.createCollider(shell
        .setMassProperties(car.mass, { x: 0, y: car.stability.centerOfMass, z: 0 }, inertia, yawRotation(0))
        .setCollisionGroups(playerCollisionGroups(true))
        .setFriction(0.22).setRestitution(0.13)
        .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(4_000), body);

    world.createCollider(cabin.setDensity(0).setFriction(0.32).setRestitution(0.10)
        .setCollisionGroups(playerCollisionGroups(true))
        .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(4_000), body);
    return body;
}
