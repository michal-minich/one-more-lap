import type { BiomeLandmark } from "./biome-landmarks.ts";

const footingPositions = [
    [-0.23, -0.13, 0.125],
    [0.23, -0.12, 0.14],
    [-0.019, 0.31, 0.062],
] as const;

export const coralLookoutFeet = footingPositions.map(([across, along]) => [across, along] as const);

export function coralLookoutFoundations({ x, y, z, yaw, height }: BiomeLandmark) {
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const bottom = y - height * 0.16;
    return footingPositions.map(([across, along, rise]) => {
        const top = y + height * rise;
        return {
            x: x + height * (cos * across + sin * along),
            y: (bottom + top) / 2,
            z: z + height * (cos * along - sin * across),
            sx: height * 0.15, sy: top - bottom, sz: height * 0.16, yaw,
        };
    });
}
