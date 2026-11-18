import RAPIER from "@dimforge/rapier3d-compat";
import { harborPierSize, icebreakerHull } from "../course/frosthaven/harbor.ts";
import type { FrosthavenHarbor, HarborBuilding } from "../course/frosthaven/harbor.ts";
import { winterCabinFootprint } from "../course/winter-cabins.ts";
import type { WinterCabin } from "../course/winter-cabins.ts";
import { yawPitchRotation, yawRotation } from "./pose.ts";

export function addWinterColliders(world: RAPIER.World, cabins: readonly WinterCabin[], harbor?: FrosthavenHarbor): void {
    const structures: HarborBuilding[] = cabins.map(cabin => ({ ...cabin, ...winterCabinFootprint, height: 3.44 }));
    if (harbor) structures.push(harbor.beacon, ...harbor.houses, harbor.quay);
    for (const { x, y, z, width, depth, height, bottom, yaw } of structures) {
        const top = y + height;
        world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, (top - bottom) / 2, depth / 2)
            .setTranslation(x, (top + bottom) / 2, z).setRotation(yawRotation(yaw)).setFriction(0.56));
    }
    if (!harbor) return;
    const ship = harbor.icebreaker;
    world.createCollider(RAPIER.ColliderDesc.roundCuboid(icebreakerHull.width * ship.scale * 0.43, icebreakerHull.height * ship.scale * 0.43,
        icebreakerHull.length * ship.scale * 0.43, 0.45)
        .setTranslation(ship.x, ship.y + icebreakerHull.lift * ship.scale, ship.z)
        .setRotation(yawRotation(ship.yaw)).setFriction(0.52));
    const { from, to } = harbor.pier;
    const run = Math.hypot(to.x - from.x, to.z - from.z);
    const rise = to.y - from.y;
    const bearing = Math.atan2(to.x - from.x, to.z - from.z);
    world.createCollider(RAPIER.ColliderDesc.cuboid(harborPierSize.width / 2, harborPierSize.depth / 2,
        (Math.hypot(run, rise) + harborPierSize.overlap) / 2)
        .setTranslation((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2)
        .setRotation(yawPitchRotation(bearing, -Math.atan2(rise, run))).setFriction(0.59));
    const { deck, yaw, width, depth, columns } = harbor.lookout;
    const turn = yawRotation(yaw);
    world.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, 0.2, depth / 2)
        .setTranslation(deck.x, deck.y, deck.z).setRotation(turn).setFriction(0.56));
    for (const { x, z, top, bottom } of columns) {
        world.createCollider(RAPIER.ColliderDesc.cuboid(0.38, (top - bottom) / 2, 0.37)
            .setTranslation(x, (top + bottom) / 2, z).setRotation(turn).setFriction(0.56));
    }
}
