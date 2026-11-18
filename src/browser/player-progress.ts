import { awardCoins, buyCar, buyPower, emptyProfile, readPlayerProfile } from "../game/progression/profile.ts";
import type { PlayerProfile } from "../game/progression/profile.ts";
import type { PowerId } from "../game/progression/powers.ts";
import type { CarId } from "../game/vehicle/cars.ts";

const STORE = "player";
const PROFILE = "garage";
type Change = (current: PlayerProfile) => PlayerProfile;

export class PlayerProgress {
    #database: IDBDatabase | undefined;
    #profile = emptyProfile;
    #writes: Promise<void> = Promise.resolve();

    private constructor(database: IDBDatabase | undefined) {
        this.#database = database;
    }

    static async open(factory: () => IDBFactory): Promise<PlayerProgress> {
        let database: IDBDatabase | undefined;
        try {
            database = await openDatabase(factory());
        } catch {
            // Storage restrictions leave the session playable in memory.
        }
        const progress = new PlayerProgress(database);
        if (database) {
            try {
                progress.#profile = await transaction(database);
            } catch {
                database.close();
                progress.#database = undefined;
            }
        }
        return progress;
    }

    get profile(): PlayerProfile {
        return this.#profile;
    }

    award(coins: number): Promise<PlayerProfile> {
        return this.#change(profile => awardCoins(profile, coins));
    }

    purchase(power: PowerId): Promise<PlayerProfile> {
        return this.#change(profile => buyPower(profile, power));
    }

    purchaseCar(car: CarId): Promise<PlayerProfile> {
        return this.#change(profile => buyCar(profile, car));
    }

    #change(change: Change): Promise<PlayerProfile> {
        const operation = this.#writes.then(async (): Promise<PlayerProfile> => {
            if (this.#database) {
                try {
                    this.#profile = await transaction(this.#database, change);
                    return this.#profile;
                } catch {
                    this.#database.close();
                    this.#database = undefined;
                }
            }
            this.#profile = change(this.#profile);
            return this.#profile;
        });
        this.#writes = operation.then(() => undefined, () => undefined);
        return operation;
    }
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = factory.open("redline-progress", 1);
        let blocked = false;
        request.onupgradeneeded = (): void => { request.result.createObjectStore(STORE); };
        request.onsuccess = (): void => {
            const database = request.result;
            if (blocked) {
                database.close();
                return;
            }
            database.onversionchange = (): void => database.close();
            resolve(database);
        };
        request.onerror = (): void => reject(request.error ?? new Error("Player profile could not open"));
        request.onblocked = (): void => {
            blocked = true;
            reject(new Error("Player profile is blocked by another window"));
        };
    });
}

function transaction(database: IDBDatabase, change?: Change): Promise<PlayerProfile> {
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE, change ? "readwrite" : "readonly");
        const store = tx.objectStore(STORE);
        const request = store.get(PROFILE);
        let next = emptyProfile;
        request.onsuccess = (): void => {
            const profile = readPlayerProfile(request.result);
            next = change ? change(profile) : profile;
            if (next !== profile) store.put(next, PROFILE);
        };
        tx.oncomplete = (): void => resolve(next);
        tx.onabort = (): void => reject(tx.error ?? new Error("Player profile transaction did not complete"));
    });
}
