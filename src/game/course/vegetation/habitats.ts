import type { Biome } from "../tracks.ts";
import type { TreeKind } from "./trees.ts";

export type GroundPlant = "grass" | "tussock" | "dry-grass" | "flowers" | "scrub" | "reeds" | "succulent";

interface Habitat {
    readonly trees: readonly TreeKind[];
    readonly stride: number;
    readonly density: number;
    readonly groves: boolean;
    readonly verge: readonly GroundPlant[];
    readonly stones: number;
}

export const habitats: Record<Exclude<Biome, "sky">, Habitat> = {
    stunt: { trees: ["birch", "oak", "spruce"], stride: 6, density: 0.59, groves: true,
        verge: ["grass", "flowers", "tussock"], stones: 0.09 },
    rail: { trees: ["spruce", "birch", "fir", "oak"], stride: 4, density: 0.72, groves: true,
        verge: ["tussock", "grass", "flowers", "flowers", "scrub"], stones: 0.2 },
    reef: { trees: ["coastal-pine", "olive"], stride: 7, density: 0.37, groves: false,
        verge: ["scrub", "flowers", "grass"], stones: 0.18 },
    coast: { trees: ["coastal-pine", "cypress", "oak"], stride: 3, density: 0.78, groves: true,
        verge: ["grass", "grass", "flowers", "scrub"], stones: 0.16 },
    alpine: { trees: ["spruce", "fir", "spruce", "birch"], stride: 3, density: 0.84, groves: true,
        verge: ["tussock", "flowers", "scrub"], stones: 0.38 },
    canyon: { trees: ["olive", "coastal-pine"], stride: 5, density: 0.13, groves: false,
        verge: ["succulent", "scrub", "dry-grass"], stones: 0.58 },
    ruins: { trees: ["olive", "cypress", "olive", "oak"], stride: 3, density: 0.72, groves: true,
        verge: ["scrub", "grass", "flowers", "flowers"], stones: 0.29 },
    forest: { trees: ["fir", "spruce", "fir", "birch", "fir"], stride: 3, density: 0.77, groves: true,
        verge: ["grass", "scrub", "dry-grass", "flowers"], stones: 0.25 },
    "old-town": { trees: ["cypress", "oak", "olive"], stride: 5, density: 0.84, groves: false,
        verge: ["flowers", "scrub", "grass"], stones: 0.03 },
    metro: { trees: ["oak", "birch", "cypress"], stride: 5, density: 0.82, groves: false,
        verge: ["grass", "scrub", "flowers"], stones: 0.03 },
    future: { trees: ["cypress", "birch", "coastal-pine"], stride: 4, density: 0.88, groves: false,
        verge: ["flowers", "scrub", "grass"], stones: 0.01 },
    mars: { trees: ["birch", "coastal-pine", "olive"], stride: 4, density: 0.85, groves: false,
        verge: ["succulent", "scrub", "grass"], stones: 0.57 },
    arctic: { trees: ["snow-pine", "snow-pine", "spruce"], stride: 10, density: 0.75, groves: true,
        verge: ["scrub", "tussock"], stones: 0.31 },
    caldera: { trees: [], stride: 5, density: 0, groves: false,
        verge: ["dry-grass", "dry-grass", "succulent"], stones: 0.72 },
    gorge: { trees: ["coastal-pine", "olive", "cypress"], stride: 5, density: 0.21, groves: false,
        verge: ["scrub", "succulent", "dry-grass"], stones: 0.54 },
};
