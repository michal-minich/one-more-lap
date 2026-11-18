import type { Course } from "../../game/course/course.ts";
import { tracks } from "../../game/course/tracks.ts";
import { canDrive, emptyProfile } from "../../game/progression/profile.ts";
import type { PlayerProfile } from "../../game/progression/profile.ts";
import type { PowerId } from "../../game/progression/powers.ts";
import type { TrackRecords } from "../../game/race/records.ts";
import type { Setup } from "../../game/race/setup.ts";
import { cars } from "../../game/vehicle/cars.ts";
import type { CarId, CarSpec } from "../../game/vehicle/cars.ts";
import { element } from "../dom.ts";
import { showMusicCredits } from "../music-credits.ts";
import { CarPanel } from "./car-panel.ts";
import { drawCourseOutline } from "../course-map.ts";
import { GaragePanels } from "./panels.ts";
import { RaceOptionsView } from "./race-options.ts";
import { Stepper } from "./stepper.ts";
import { UpgradeShop } from "./upgrade-shop.ts";

export interface GarageCommands {
    changeSetup: (change: Partial<Setup>) => void;
    start: () => void;
    purchase: (power: PowerId) => Promise<void>;
    purchaseCar: (car: CarId) => Promise<void>;
}

export class GarageView {
    readonly mount = element("view");
    readonly #load = element("load-message");
    readonly #backend = element("backend");
    readonly #layout = element("car-layout");
    readonly #description = element("car-description");
    readonly #trackDescription = element("track-description");
    readonly #map = element("map", HTMLCanvasElement);
    readonly #start = element("start", HTMLButtonElement);
    readonly #startSymbol = this.#start.querySelector("use")!;
    readonly #continue = element("continue-race", HTMLButtonElement);
    readonly #setup = element("garage-setup", HTMLDialogElement);
    readonly #about = element("about", HTMLDialogElement);
    readonly #fps = element("about-fps");
    readonly #tracks = new Stepper("track", "hero-track", tracks, track => track.name, true);
    readonly #cars = new Stepper("car", "car-title", cars, car => car.name, true);
    readonly #options = new RaceOptionsView();
    readonly #shop = new UpgradeShop();
    readonly #panels = new GaragePanels();
    readonly #carPanel = new CarPanel();
    #mappedCourse?: Course;
    #car: CarSpec = cars[0];
    #profile = emptyProfile;
    #ready = false;
    #nextFrameRate = 0;

    connect(commands: GarageCommands): void {
        this.#panels.connect();
        this.#tracks.connect(track => commands.changeSetup({ track }));
        this.#cars.connect(car => commands.changeSetup({ car, paint: car.paint }));
        this.#options.connect(change => commands.changeSetup(change));
        this.#continue.addEventListener("click", () => {
            this.#carPanel.closePaint();
            this.#panels.show("race-panel");
            this.#setup.showModal();
            this.#start.focus({ preventScroll: true });
        });
        document.addEventListener("keydown", event => {
            if (event.code !== "Enter" || event.repeat || event.altKey || event.ctrlKey || event.metaKey ||
                event.defaultPrevented || document.body.classList.contains("racing") || document.querySelector("dialog[open]")) return;
            if (event.target !== document.body && event.target !== document.documentElement) return;
            if (this.#continue.disabled) return;
            event.preventDefault();
            this.#continue.click();
        });
        element("back-to-preview").addEventListener("click", () => this.#setup.close());
        this.#start.addEventListener("click", () => {
            this.#setup.close();
            commands.start();
        });
        this.#shop.connect(power => commands.purchase(power));
        this.#carPanel.connect(paint => commands.changeSetup({ paint }), () => commands.purchaseCar(this.#car.id));
        const help = element("controls", HTMLDialogElement);
        element("help").addEventListener("click", () => help.showModal());
        element("about-game").addEventListener("click", () => this.#about.showModal());
        element("about-version").textContent = import.meta.env.VITE_GAME_VERSION ?? "Development";
        showMusicCredits(element("music-credits"));
    }

    showProfile(profile: PlayerProfile): void {
        this.#profile = profile;
        this.#shop.show(profile);
        this.#showCarAccess();
    }

    show(setup: Setup, course: Course, records: TrackRecords): void {
        this.#tracks.show(setup.track);
        this.#cars.show(setup.car);
        this.#car = setup.car;
        this.#showCarAccess();
        this.#options.show(setup, records);
        this.#carPanel.show(setup.car, setup.paint);
        this.#layout.textContent = setup.car.layout;
        this.#description.textContent = setup.car.description;
        this.#trackDescription.textContent = setup.track.description;
        if (this.#mappedCourse !== course) {
            drawCourseOutline(this.#map, course);
            this.#map.setAttribute("aria-label", setup.track.name + " track outline");
            this.#mappedCourse = course;
        }
    }

    ready(backend: string): void {
        this.#backend.textContent = backend;
        element("about-renderer").textContent = backend;
        this.#load.hidden = true;
        this.#ready = true;
        this.#showCarAccess();
    }

    reportError(message: string): void {
        this.#load.textContent = message;
        this.#load.hidden = false;
    }

    focusStart(): void {
        this.#continue.focus({ preventScroll: true });
    }

    placePaint(x: number, y: number): void {
        this.#carPanel.placePaint(x, y);
    }

    get setupOpen(): boolean {
        return this.#setup.open;
    }

    showFrameRate(fps: number): void {
        if (!this.#about.open) return;
        const now = performance.now();
        if (now < this.#nextFrameRate) return;
        this.#nextFrameRate = now + 500;
        this.#fps.textContent = Math.round(fps) + " fps";
    }

    #showCarAccess(): void {
        const car = this.#car;
        const owned = canDrive(this.#profile, car);
        this.#carPanel.showAccess(car, owned, this.#profile.coins);
        this.#start.disabled = !this.#ready || !owned;
        this.#continue.disabled = !this.#ready || !owned;
        this.#startSymbol.setAttribute("href", owned ? "#icon-play" : "#icon-lock");
        this.#start.title = owned ? "" : "Unlock " + car.name + " in the garage";
        this.#start.classList.toggle("car-locked", !owned);
    }
}
