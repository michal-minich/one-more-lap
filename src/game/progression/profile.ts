import { powers } from "./powers.ts";
import type { PowerId } from "./powers.ts";
import { cars } from "../vehicle/cars.ts";
import type { CarId, CarSpec } from "../vehicle/cars.ts";

export interface PlayerProfile {
    readonly coins: number;
    readonly owned: readonly PowerId[];
    readonly ownedCars: readonly CarId[];
}

export const emptyProfile: PlayerProfile = { coins: 0, owned: [], ownedCars: [] };

export function awardCoins(profile: PlayerProfile, coins: number): PlayerProfile {
    return { ...profile, coins: Math.min(Number.MAX_SAFE_INTEGER, profile.coins + coins) };
}

export function buyPower(profile: PlayerProfile, id: PowerId): PlayerProfile {
    const power = powers.find(option => option.id === id)!;
    if (profile.owned.includes(id) || profile.coins < power.coins) return profile;
    return { ...profile, coins: profile.coins - power.coins, owned: [...profile.owned, id] };
}

export function canDrive(profile: PlayerProfile, car: CarSpec): boolean {
    return car.unlockCoins === undefined || profile.ownedCars.includes(car.id);
}

export function buyCar(profile: PlayerProfile, id: CarId): PlayerProfile {
    const cost = cars.find(car => car.id === id)?.unlockCoins;
    if (cost === undefined || profile.ownedCars.includes(id) || profile.coins < cost) return profile;
    return { ...profile, coins: profile.coins - cost, ownedCars: [...profile.ownedCars, id] };
}

export function readPlayerProfile(value: unknown): PlayerProfile {
    if (typeof value !== "object" || value === null) return emptyProfile;
    const source = value as Record<string, unknown>;
    const coins = typeof source.coins === "number" && Number.isSafeInteger(source.coins) && source.coins >= 0
        ? source.coins : 0;
    const owned: readonly unknown[] = Array.isArray(source.owned) ? source.owned : [];
    const ownedCars: readonly unknown[] = Array.isArray(source.ownedCars) ? source.ownedCars : [];
    return {
        coins,
        owned: powers.filter(power => owned.includes(power.id)).map(power => power.id),
        ownedCars: cars.filter(car => car.unlockCoins !== undefined && ownedCars.includes(car.id)).map(car => car.id),
    };
}
