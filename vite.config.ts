import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { version } from "./package.json";

function releaseLocalWorker(): Plugin {
    return {
        name: "release-local-worker",
        configureServer(server) {
            server.middlewares.use((request, response, next) => {
                if (request.url !== "/sw.js") {
                    next();
                    return;
                }
                // The cached build can offer a switch back to Vite on this origin.
                response.setHeader("Content-Type", "text/javascript");
                response.setHeader("Cache-Control", "no-store");
                response.end(`
self.addEventListener("message", event => {
    if (event.data === "redline-activate-update") event.waitUntil(self.skipWaiting());
    if (event.data === "redline-finish-local-update") event.waitUntil(self.registration.unregister());
});
self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});
`);
            });
        },
    };
}

export default defineConfig({
    base: "./",
    assetsInclude: ["**/*.bin"],
    plugins: [releaseLocalWorker()],
    define: { "import.meta.env.VITE_GAME_VERSION": JSON.stringify(version) },
    build: {
        outDir: ".build/site",
        emptyOutDir: true,
        assetsInlineLimit: file => file.endsWith(".ttf") || file.endsWith("/route-mark.svg"),
        cssCodeSplit: false,
        modulePreload: false,
        rollupOptions: { output: { inlineDynamicImports: true } },
    },
});
