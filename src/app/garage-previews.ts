import type { Course } from "../game/course/course.ts";
import type { Setup } from "../game/race/setup.ts";
import type { RaceScene, RaceSceneFactory } from "../render/race-scene.ts";

const INACTIVE_LIMIT = 2;

export function garagePreviewKey(setup: Setup): string {
    return setup.track.id + "/" + setup.car.id + "/" + setup.direction;
}

export class GaragePreviews {
    readonly #factory: RaceSceneFactory;
    readonly #inactive = new Map<string, RaceScene>();

    constructor(factory: RaceSceneFactory) {
        this.#factory = factory;
    }

    take(key: string, setup: Setup, course: Course): RaceScene {
        const cached = this.#inactive.get(key);
        if (!cached) return this.#factory.create(setup, course);
        this.#inactive.delete(key);
        return cached;
    }

    retain(key: string, scene: RaceScene): void {
        this.#inactive.set(key, scene);
        if (this.#inactive.size <= INACTIVE_LIMIT) return;
        const oldest = this.#inactive.keys().next().value!;
        this.#inactive.get(oldest)!.dispose();
        this.#inactive.delete(oldest);
    }

    clear(): void {
        for (const scene of this.#inactive.values()) scene.dispose();
        this.#inactive.clear();
    }
}
