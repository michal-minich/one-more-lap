import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";

export interface RenderTarget {
    readonly engine: AbstractEngine;
    readonly canvas: HTMLCanvasElement;
    readonly backend: "WebGPU" | "WebGL 2";
}

export async function openRenderer(mount: HTMLElement): Promise<RenderTarget> {
    const makeCanvas = (): HTMLCanvasElement => {
        const canvas = document.createElement("canvas");
        canvas.setAttribute("aria-label", "3D view");
        mount.replaceChildren(canvas);
        return canvas;
    };
    let canvas = makeCanvas();
    if ("gpu" in navigator && new URLSearchParams(location.search).get("renderer") !== "webgl") {
        let engine: AbstractEngine | undefined;
        try {
            const { WebGPUEngine } = await import("@babylonjs/core/Engines/webgpuEngine.js");
            const gpu = new WebGPUEngine(canvas, { antialias: true, adaptToDeviceRatio: false });
            engine = gpu;
            await gpu.initAsync();
            return { engine: gpu, canvas, backend: "WebGPU" };
        } catch (error) {
            console.info("Starting WebGL after WebGPU initialization", error);
            engine?.dispose();
            canvas = makeCanvas();
        }
    }
    const { Engine } = await import("@babylonjs/core/Engines/engine.js");
    const engine = new Engine(canvas, true, { stencil: true }, false);
    if (engine.webGLVersion !== 2) {
        engine.dispose();
        throw new Error("One More Lap needs WebGPU or WebGL 2.");
    }
    // Finish WebGL shader compilation before the garage or race releases its materials.
    delete engine.getCaps().parallelShaderCompile;
    return { engine, canvas, backend: "WebGL 2" };
}
