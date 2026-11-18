import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const build = ".build/site";
const files = (await readdir(build, { recursive: true, withFileTypes: true }))
    .filter(file => file.isFile() && file.name !== "sw.js")
    .map(file => join(file.parentPath, file.name).slice(build.length + 1))
    .sort();
const hash = createHash("sha256");
hash.update(await readFile(new URL(import.meta.url)));
const assets = [];
for (const file of files) {
    const contents = await readFile(join(build, file));
    const integrity = "sha256-" + createHash("sha256").update(contents).digest("base64");
    hash.update(file);
    hash.update(contents);
    assets.push({ file, integrity });
}
const prefix = "redline-touring-";
const version = hash.digest("hex").slice(0, 14);
await writeFile(join(build, "sw.js"), `
const prefix = ${JSON.stringify(prefix)} + self.registration.scope;
const cacheName = prefix + ${JSON.stringify(version)};
const entry = self.registration.scope;
const assets = ${JSON.stringify(assets)}.map(({ file, integrity }) => ({
    url: file === "index.html" ? entry : new URL(file, self.registration.scope).href,
    integrity,
}));
const packaged = new Set(assets.map(({ url }) => url));
const assetDirectory = new URL("assets/", self.registration.scope).href;

async function otherPacks() {
    return (await caches.keys()).filter(key => key.startsWith(prefix) && key !== cacheName);
}

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const existing = await caches.has(cacheName);
        const cache = await caches.open(cacheName);
        try {
            const requests = assets.map(({ url, integrity }) => new Request(url, {
                cache: "reload",
                integrity,
            }));
            await cache.addAll(requests);
        } catch (error) {
            if (!existing) await caches.delete(cacheName);
            throw error;
        }
    })());
});
self.addEventListener("message", event => {
    if (event.data === "redline-activate-update") event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        // A tab with the previous build can still request its hashed chunks.
        for (const key of (await otherPacks()).slice(0, -1)) {
            await caches.delete(key);
        }
        await self.clients.claim();
    })());
});
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;
    const url = event.request.mode === "navigate" ? entry : event.request.url;
    const inCurrentPack = packaged.has(url);
    const mayBeOldChunk = url.startsWith(assetDirectory);
    if (!inCurrentPack && !mayBeOldChunk) return;
    event.respondWith((async () => {
        // The build owns these URLs and verifies one response per URL. Module
        // requests may have a different Origin header from the install fetch.
        if (inCurrentPack) {
            const cached = await caches.match(url, { cacheName, ignoreVary: true });
            if (cached) return cached;
        }
        if (mayBeOldChunk) {
            const previous = (await otherPacks()).at(-1);
            if (previous) {
                const cached = await caches.match(url, { cacheName: previous, ignoreVary: true });
                if (cached) return cached;
            }
        }
        return await fetch(event.request);
    })());
});
`.trimStart());
console.log("Offline pack:", files.length, "files", version);
