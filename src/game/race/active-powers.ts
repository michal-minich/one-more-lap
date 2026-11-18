import type { ActivePower, ActivePowerView, PowerId } from "../progression/powers.ts";
import type { Vehicle, VehicleUpgrades } from "../vehicle/vehicle.ts";
import { STEP } from "../vehicle/world.ts";

export class RacePowers {
    readonly #owned: ReadonlySet<PowerId>;
    readonly #jumpDistance: number;
    readonly #boostDistance: number;
    readonly #teleportDistance: number;
    readonly vehicleUpgrades: VehicleUpgrades;
    #jumpBuffer = 0;
    #boostRequested = false;
    #teleportRequested = false;
    #furthest = 0;
    #jumpReadyAt = 0;
    #boostReadyAt = 0;
    #teleportReadyAt = 0;
    #boostSeconds = 0;
    #phaseSeconds = 0;
    #phase: "teleport" | "recovery" | undefined;

    constructor(length: number, owned: readonly PowerId[]) {
        this.#owned = new Set(owned);
        this.#jumpDistance = length / 5;
        this.#boostDistance = length / 3;
        this.#teleportDistance = length / 2;
        this.vehicleUpgrades = {
            tires: this.has("tires"), bumpers: this.has("bumpers"), splash: this.has("splash"),
        };
    }

    has(power: PowerId): boolean {
        return this.#owned.has(power);
    }

    request(power: ActivePower): void {
        if (!this.has(power)) return;
        if (power === "jump" && this.#furthest >= this.#jumpReadyAt) this.#jumpBuffer = 0.20;
        if (power === "boost" && this.#furthest >= this.#boostReadyAt) this.#boostRequested = true;
        if (power === "teleport" && this.#phase !== "teleport" && this.#furthest >= this.#teleportReadyAt) this.#teleportRequested = true;
    }

    takeTeleportRequest(): boolean {
        const requested = this.#teleportRequested;
        this.#teleportRequested = false;
        return requested;
    }

    teleported(distance: number, vehicle: Vehicle): void {
        this.#furthest = Math.max(this.#furthest, distance);
        this.#teleportReadyAt = this.#furthest + this.#teleportDistance;
        this.#beginPhase("teleport", 2.4, vehicle);
    }

    recovered(vehicle: Vehicle): void {
        this.stop(vehicle);
        this.#beginPhase("recovery", 1.2, vehicle);
    }

    get phasing(): boolean {
        return this.#phase !== undefined;
    }

    stop(vehicle: Vehicle): void {
        this.#jumpBuffer = 0;
        this.#boostRequested = false;
        this.#teleportRequested = false;
        this.#boostSeconds = 0;
        this.#phaseSeconds = 0;
        this.#endPhase(vehicle);
    }

    step(distance: number, vehicle: Vehicle, clearOfRivals = true): void {
        this.#furthest = Math.max(this.#furthest, distance);
        if (this.phasing) {
            this.#phaseSeconds = Math.max(0, this.#phaseSeconds - STEP);
            if (this.#phaseSeconds === 0 && clearOfRivals) this.#endPhase(vehicle);
        }
        if (this.#jumpBuffer > 0) {
            if (vehicle.jump()) {
                this.#jumpReadyAt = this.#furthest + this.#jumpDistance;
                this.#jumpBuffer = 0;
            } else this.#jumpBuffer -= STEP;
        }
        if (this.#boostRequested) {
            this.#boostReadyAt = this.#furthest + this.#boostDistance;
            this.#boostSeconds = 1.2;
            this.#boostRequested = false;
        }
        if (this.#boostSeconds > 0) {
            vehicle.boost();
            this.#boostSeconds = Math.max(0, this.#boostSeconds - STEP);
        }
    }

    grip(grip: number): number {
        return this.has("traction") ? grip + (1 - grip) * 0.37 : grip;
    }

    view(): ActivePowerView {
        return {
            jump: this.has("jump") ? this.#charge(this.#jumpReadyAt, this.#jumpDistance) : undefined,
            boost: this.has("boost") ? this.#charge(this.#boostReadyAt, this.#boostDistance) : undefined,
            teleport: this.has("teleport") ? this.#charge(this.#teleportReadyAt, this.#teleportDistance) : undefined,
            boosting: this.#boostSeconds > 0,
            phasing: this.phasing,
            teleporting: this.#phase === "teleport",
        };
    }

    #beginPhase(phase: "teleport" | "recovery", seconds: number, vehicle: Vehicle): void {
        this.#phase = phase;
        this.#phaseSeconds = seconds;
        vehicle.setRivalCollision(false);
    }

    #endPhase(vehicle: Vehicle): void {
        this.#phase = undefined;
        vehicle.setRivalCollision(true);
    }

    #charge(readyAt: number, distance: number): number {
        return Math.min(1, Math.max(0, 1 - (readyAt - this.#furthest) / distance));
    }
}
