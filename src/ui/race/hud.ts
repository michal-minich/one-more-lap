import type { Point } from "../../game/point.ts";
import type { Course } from "../../game/course/course.ts";
import type { Biome } from "../../game/course/tracks.ts";
import { damageStage } from "../../game/vehicle/damage.ts";
import { element, formatClock, formatTime } from "../dom.ts";
import { CircuitMap } from "../course-map.ts";
import type { Telemetry } from "../../game/race/run.ts";
import type { RivalPosition } from "../../game/race/opponents.ts";
import type { Setup } from "../../game/race/setup.ts";
import { Speedometer } from "./hud/speedometer.ts";
import { TimingView } from "./hud/timing.ts";
import type { ActivePower } from "../../game/progression/powers.ts";
import { TouchPadView } from "./controls/touch-pad-view.ts";
import type { TouchPadFrame } from "./controls/touch-drive.ts";
import { PowerControls } from "./controls/power-controls.ts";
import { RaceMessage } from "./overlays/race-message.ts";
import type { RaceMessageCommands } from "./overlays/race-message.ts";
import { RaceResults } from "./overlays/race-results.ts";

export interface RaceCommands extends RaceMessageCommands {
    toggleView: () => void;
    recover: () => void;
    usePower: (power: ActivePower) => void;
}

export class RaceHud {
    readonly #race = element("race-ui");
    readonly #lapMetric = element("lap-metric");
    readonly #clocks = element("race-clocks");
    readonly #freeRide = element("free-ride-label");
    readonly #lap = element("race-lap");
    readonly #position = element("position-metric");
    readonly #place = element("race-place");
    readonly #map = new CircuitMap(element("race-map", HTMLCanvasElement));
    readonly #progress = element("progress", HTMLProgressElement);
    readonly #elapsed = element("elapsed");
    readonly #speed = new Speedometer();
    readonly #timing = new TimingView();
    readonly #touchPads = new TouchPadView();
    readonly #powers = new PowerControls();
    readonly #coins = element("race-coins");
    readonly #earned = element("race-earned");
    readonly #damage = element("damage");
    readonly #damageBar = element("damage-bar", HTMLProgressElement);
    readonly #damageState = element("damage-state");
    readonly #countdown = element("race-countdown");
    readonly #warning = element("race-warning");
    readonly #waterTint = element("water-tint");
    readonly #bend = element("bend-warning");
    readonly #bendArrow = element("bend-arrow");
    readonly #bendText = element("bend-text");
    readonly #camera = element("camera", HTMLButtonElement);
    readonly #pause = element("pause", HTMLButtonElement);
    readonly #back = element("back", HTMLButtonElement);
    readonly #quickRecover = element("quick-recover", HTMLButtonElement);
    readonly #message = new RaceMessage();
    readonly #results = new RaceResults(() => this.#showFreeRide());
    #biome: Biome = "coast";
    #coinsEarned = 0;
    #teleportNoticeUntil = 0;

    connect(commands: RaceCommands): void {
        this.#camera.addEventListener("click", () => commands.toggleView());
        this.#back.addEventListener("click", () => commands.leave());
        this.#pause.addEventListener("click", () => commands.togglePause());
        this.#quickRecover.addEventListener("click", () => commands.recover());
        this.#powers.connect(power => commands.usePower(power));
        this.#message.connect(commands);
    }

    open(course: Course, { car, direction, laps }: Setup, coins: number): void {
        this.#lapMetric.hidden = false;
        this.#clocks.hidden = false;
        this.#freeRide.hidden = true;
        this.#countdown.hidden = true;
        document.body.classList.add("racing");
        this.#race.hidden = false;
        this.#message.hide();
        this.#results.hide();
        this.#lap.textContent = "1 / " + laps;
        this.#progress.value = 0;
        this.#position.hidden = true;
        this.#elapsed.textContent = formatClock(0);
        this.#biome = course.track.id;
        this.#coinsEarned = 0;
        this.#coins.textContent = String(coins);
        this.#earned.textContent = "";
        this.#earned.hidden = true;
        this.#map.show(course, direction);
        this.#speed.select(car);
        this.#timing.reset();
        this.#powers.show({ jump: undefined, boost: undefined, teleport: undefined, boosting: false, phasing: false, teleporting: false }, false);
        this.#teleportNoticeUntil = 0;
        this.#pause.disabled = false;
        this.#quickRecover.disabled = false;
        this.#bend.hidden = true;
        this.#warning.hidden = true;
        this.#waterTint.style.opacity = "0";
        this.#back.focus();
    }

    close(): void {
        this.#race.hidden = true;
        this.#touchPads.show(undefined);
        this.#results.hide();
        this.#timing.reset();
        this.#waterTint.style.opacity = "0";
        document.body.classList.remove("racing");
    }

    showTouchPads(frame: TouchPadFrame | undefined): void {
        this.#touchPads.show(frame);
    }

    setCamera(firstPerson: boolean): void {
        this.#camera.setAttribute("aria-pressed", String(firstPerson));
        const label = firstPerson ? "Chase view" : "First person";
        this.#camera.setAttribute("aria-label", label);
        this.#camera.title = label;
    }

    moveMarkers(position: Point, rivals: readonly RivalPosition[]): void {
        this.#map.move(position, rivals);
    }

    showRecord(title: string, seconds: number): void {
        this.#timing.record(title, seconds);
    }

    completeLap(seconds: number): void {
        this.#timing.completeLap(seconds);
    }

    showTeleportBlocked(): void {
        this.#teleportNoticeUntil = performance.now() + 1_650;
    }

    addCoins(coins: number): void {
        this.#coinsEarned += coins;
        this.#earned.textContent = "+" + this.#coinsEarned;
        this.#earned.hidden = false;
    }

    setCameraWaterDepth(depth: number): void {
        const opacity = String(depth > 0 ? Math.min(0.88, 0.18 + depth * 0.71) : 0);
        if (this.#waterTint.style.opacity !== opacity) this.#waterTint.style.opacity = opacity;
    }

    render(data: Telemetry, paused: boolean): void {
        if (paused) this.#message.showConditions(this.#biome, data.conditions);
        const finished = data.result !== undefined;
        const clock = finished ? formatTime(data.elapsed) : formatClock(data.elapsed);
        if (this.#elapsed.textContent !== clock) this.#elapsed.textContent = clock;
        this.#speed.show(data.speed);
        if (!this.#clocks.hidden) this.#timing.show(data.lapTiming, finished);
        this.#powers.show(data.powers, !paused && data.startIn === 0 && data.finish !== "wrecked");
        this.#damage.textContent = Math.round(data.damage) + "%";
        this.#damageBar.value = data.damage;
        const stage = damageStage(data.damage);
        if (this.#damageState.textContent !== stage) this.#damageState.textContent = stage;
        this.#damageState.hidden = stage === "";
        const lap = data.lap + " / " + data.totalLaps;
        if (this.#lap.textContent !== lap) this.#lap.textContent = lap;
        this.#position.hidden = data.drivers === 1 || !this.#freeRide.hidden;
        this.#place.textContent = data.place + " / " + data.drivers;
        this.#progress.value = data.lapProgress;
        this.#showCountdown(data, paused);
        this.#showWarning(data);
        this.#showBend(data);
    }

    #showCountdown(data: Telemetry, paused: boolean): void {
        const go = data.startIn === 0;
        const visible = !paused && !data.finish && (!go || data.elapsed < 0.65);
        this.#countdown.hidden = !visible;
        if (!visible) return;
        const text = go ? "GO" : String(data.startIn);
        if (this.#countdown.textContent !== text) this.#countdown.textContent = text;
        this.#countdown.classList.toggle("go", go);
    }

    #showBend(data: Telemetry): void {
        this.#bend.hidden = !data.bend || data.elapsed < 0.65 || !this.#warning.hidden;
        if (!data.bend) return;
        const { side, distance } = data.bend;
        this.#bendArrow.textContent = side === "left" ? "↰" : "↱";
        const rounded = Math.ceil(distance / 10) * 10;
        this.#bendText.textContent = (side === "left" ? "Left" : "Right") + " bend · " + rounded + " m";
    }

    #showWarning(data: Telemetry): void {
        const message = data.wrongWay ? "Wrong way" : data.missedGate ? "Missed checkpoint · Recover to road"
            : performance.now() < this.#teleportNoticeUntil ? "Teleport needs a clear stretch of road" : "";
        if (this.#warning.textContent !== message) this.#warning.textContent = message;
        this.#warning.hidden = message === "";
    }

    showPause(): void {
        this.#message.pause();
    }

    resume(): void {
        this.#message.hide();
        this.#pause.focus();
    }

    #showFreeRide(): void {
        this.#freeRide.hidden = false;
        this.#lapMetric.hidden = true;
        this.#position.hidden = true;
        this.#clocks.hidden = true;
        this.#timing.reset();
    }

    showFinish(data: Telemetry, best: number | undefined): void {
        if (data.finish === "wrecked") {
            this.#pause.disabled = true;
            this.#quickRecover.disabled = true;
            this.#results.hide();
            this.#message.wrecked();
        } else {
            this.#results.show(data.elapsed, data.place, data.drivers, best);
        }
    }
}
