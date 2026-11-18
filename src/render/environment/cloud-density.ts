import { seededRandom } from "../../game/random.ts";

export function smoothEdge(low: number, high: number, value: number): number {
    const t = Math.min(1, Math.max(0, (value - low) / (high - low)));
    return t * t * (3 - 2 * t);
}

export function cloudNoise(seed: number, columns: number, rows: number): (u: number, v: number) => number {
    const random = seededRandom(seed);
    const stride = columns + 1;
    const samples = Float32Array.from({ length: stride * (rows + 1) }, () => random() * 2 - 1);
    return (u, v) => {
        const x = Math.min(columns - 0.00001, Math.max(0, u * columns));
        const y = Math.min(rows - 0.00001, Math.max(0, v * rows));
        const col = Math.floor(x);
        const row = Math.floor(y);
        const tx = smoothEdge(0, 1, x - col);
        const ty = smoothEdge(0, 1, y - row);
        const index = row * stride + col;
        const upper = samples[index]! * (1 - tx) + samples[index + 1]! * tx;
        const lower = samples[index + stride]! * (1 - tx) + samples[index + stride + 1]! * tx;
        return upper * (1 - ty) + lower * ty;
    };
}
