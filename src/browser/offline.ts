const UPDATE_CHECK_TIMEOUT = 8_000;
const CHECK_INTERVAL = 60_000;
const READY: readonly ServiceWorkerState[] = ["installed", "activating", "activated"];

declare global {
    interface Window {
        firstOfflineRegistration?: Promise<ServiceWorkerRegistration | undefined>;
    }
}

export async function connectOfflineControls(
    status: HTMLElement,
    button: HTMLButtonElement,
    canReload: () => boolean,
): Promise<void> {
    if (!import.meta.env.PROD) {
        // Firefox can keep the worker in "activating" when it unregisters itself from activate.
        navigator.serviceWorker?.controller?.postMessage("redline-finish-local-update");
        return;
    }
    if (location.protocol === "file:") return;
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "./manifest.webmanifest";
    document.head.append(manifest);
    if (!("serviceWorker" in navigator)) return;
    const workers = navigator.serviceWorker;
    const watching = new WeakSet<ServiceWorker>();
    let loadedWorker = workers.controller;
    let registration: ServiceWorkerRegistration | undefined;
    let available: ServiceWorker | undefined;
    let checking = false;
    let applying = false;

    button.addEventListener("click", () => void apply());
    workers.addEventListener("controllerchange", watchCandidate);
    document.addEventListener("visibilitychange", () => void check());
    window.addEventListener("focus", () => void check());
    window.addEventListener("online", () => void check());
    window.setInterval(() => void check(), CHECK_INTERVAL);
    await check(true);

    async function check(initial = false): Promise<void> {
        if (checking || applying || (!initial && document.hidden)) return;
        checking = true;
        try {
            if (!registration) await prepare();
            if (!registration) return;
            watchCandidate();
            try {
                await updateRegistration(registration);
            } catch {
                // The active pack stays available while a version check is offline.
            }
            watchCandidate();
        } finally {
            checking = false;
        }
    }

    async function prepare(): Promise<void> {
        status.hidden = false;
        status.textContent = "Preparing offline…";
        try {
            registration = await installPack(workers);
            loadedWorker ??= workers.controller ?? registration.active;
            registration.addEventListener("updatefound", watchCandidate);
            status.hidden = true;
            status.textContent = "";
        } catch {
            status.textContent = "Offline download unavailable";
        }
    }

    function watchCandidate(): void {
        if (!registration) return;
        if (available?.state === "redundant") hideAvailable();
        const worker = registration.waiting ?? registration.installing ?? registration.active;
        if (!worker || worker === loadedWorker || worker === available || watching.has(worker)) return;
        watching.add(worker);
        void waitForState(worker, READY).then(() => {
            available = worker;
            button.hidden = false;
            button.disabled = applying;
        }).catch(() => {
            if (available === worker) hideAvailable();
        }).finally(() => {
            watching.delete(worker);
        });
    }

    function hideAvailable(): void {
        available = undefined;
        button.hidden = true;
        button.disabled = true;
    }

    async function apply(): Promise<void> {
        const worker = available;
        if (!worker || applying) return;
        applying = true;
        button.disabled = true;
        status.hidden = false;
        status.textContent = "Updating…";
        try {
            if (worker.state === "installed") worker.postMessage("redline-activate-update");
            await waitForState(worker, ["activated"]);
            if (canReload()) {
                status.textContent = "Reloading…";
                window.location.reload();
            } else {
                status.textContent = "Update ready";
            }
        } catch {
            status.textContent = "Update unavailable";
            if (worker.state === "redundant") hideAvailable();
        } finally {
            applying = false;
            button.disabled = available === undefined;
        }
    }
}

async function installPack(workers: ServiceWorkerContainer): Promise<ServiceWorkerRegistration> {
    let registration = (await window.firstOfflineRegistration) ?? await workers.getRegistration();
    if (!registration?.active && !registration?.installing && !registration?.waiting) {
        registration = await workers.register("./sw.js", { updateViaCache: "none" });
    }
    const worker = registration.active ?? registration.installing ?? registration.waiting;
    if (!worker) throw new Error("No offline pack is installing");
    await waitForState(worker, ["activated"]);
    return registration;
}

async function updateRegistration(registration: ServiceWorkerRegistration): Promise<void> {
    let timeout: number | undefined;
    const expired = new Promise<never>((_, reject) => {
        timeout = window.setTimeout(() => reject(new Error("The update check timed out")), UPDATE_CHECK_TIMEOUT);
    });
    try {
        await Promise.race([registration.update(), expired]);
    } finally {
        window.clearTimeout(timeout);
    }
}

function waitForState(worker: ServiceWorker, states: readonly ServiceWorkerState[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => finish(new Error("Offline pack timed out")), 120_000);

        function finish(error?: Error): void {
            window.clearTimeout(timeout);
            worker.removeEventListener("statechange", changed);
            if (error) reject(error);
            else resolve();
        }

        function changed(): void {
            if (states.includes(worker.state)) finish();
            else if (worker.state === "redundant") finish(new Error("Offline pack did not install"));
        }

        worker.addEventListener("statechange", changed);
        changed();
    });
}
