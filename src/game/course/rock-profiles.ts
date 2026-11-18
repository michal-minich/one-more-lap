import type { Surface } from "./surface.ts";

type Bed = readonly [height: number, radius: number, tone: number];

const beds = {
    mesa: [[0, 0.58, 0.75], [0.15, 0.54, 0.81], [0.23, 0.45, 0.97], [0.34, 0.44, 0.8],
        [0.53, 0.4, 0.88], [0.57, 0.39, 0.73], [0.75, 0.34, 0.94], [0.95, 0.33, 0.86], [1, 0.28, 0.98]],
    hoodoo: [[0, 0.58, 0.78], [0.19, 0.43, 0.86], [0.27, 0.31, 0.95], [0.45, 0.27, 0.76],
        [0.65, 0.24, 0.95], [0.8, 0.21, 0.81], [0.86, 0.3, 0.68], [0.95, 0.28, 0.88], [1, 0.17, 0.96]],
    fin: [[0, 0.57, 0.74], [0.15, 0.52, 0.87], [0.28, 0.45, 0.75], [0.47, 0.43, 0.96],
        [0.57, 0.35, 0.83], [0.72, 0.31, 0.96], [0.87, 0.24, 0.89], [1, 0.13, 0.98]],
    stack: [[0, 0.54, 0.55], [0.22, 0.52, 0.66], [0.31, 0.48, 0.82], [0.49, 0.45, 0.9],
        [0.64, 0.35, 0.81], [0.78, 0.3, 0.94], [0.91, 0.27, 0.84], [1, 0.15, 1]],
} as const satisfies Record<string, readonly Bed[]>;

export type RockProfile = keyof typeof beds;

interface RockSurface extends Surface {
    readonly colors: Float32Array;
}

function erodedRock(profile: RockProfile, sides: number, phase: number, lean: number): RockSurface {
    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const colors: number[] = [];
    const stride = sides + 1;
    const layers = beds[profile].entries();
    for (const [layer, [height, radius, tone]] of layers) {
        for (let side = 0; side <= sides; side++) {
            const angle = (side % sides) / sides * Math.PI * 2;
            const face = Math.sin(angle * 3 + phase);
            const rough = 1 + face * 0.16 + Math.sin(angle * 5 - phase + height * 1.9) * 0.1;
            const ridge = Math.sin(angle * 2 + height * 2.4 + phase);
            const rise = height + Math.sin(height * Math.PI) * (ridge * 0.052 + face * 0.026);
            positions.push(radius * rough * Math.cos(angle) + height * lean, rise,
                radius * rough * Math.sin(angle) + height * 0.034);
            uv.push(side / sides * 3, rise * 2.4 + Math.cos(angle + phase) * 0.13);
            const light = tone * (0.94 + ridge * 0.08 + face * 0.034);
            colors.push(light, light * (0.91 + tone * 0.08), light * (0.82 + tone * 0.17), 1);
            if (layer === 0 || side === 0) continue;
            const i = layer * stride + side;
            indices.push(i - stride - 1, i - stride, i, i - stride - 1, i, i - 1);
        }
    }
    const crown = positions.length / 3;
    positions.push(lean, 1, 0.034);
    uv.push(1.5, 2.4);
    colors.push(0.96, 0.93, 0.89, 1);
    for (let side = crown - stride; side < crown - 1; side++) indices.push(crown, side, side + 1);
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices),
        uv: new Float32Array(uv), colors: new Float32Array(colors), seamColumns: stride };
}

export const rockProfiles: Record<RockProfile, RockSurface> = {
    mesa: erodedRock("mesa", 12, 0.3, -0.04),
    hoodoo: erodedRock("hoodoo", 11, 1.8, -0.11),
    fin: erodedRock("fin", 10, 2.6, 0.08),
    stack: erodedRock("stack", 13, 3.5, -0.08),
};
