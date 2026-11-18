export type City = "old-town" | "metro" | "future";
export type Use = "brick" | "house" | "tower" | "civic" | "plaza";

export interface District {
    readonly fraction: number;
    readonly lateral: number;
    readonly yaw: number;
    readonly rows: number;
    readonly columns: number;
    readonly gap: number;
    readonly use: Use;
}

export const districtPlans: Record<City, readonly District[]> = {
    "old-town": [
        { fraction: 0.105, lateral: -26, yaw: 0.06, rows: 3, columns: 2, gap: 19, use: "house" },
        { fraction: 0.32, lateral: 52, yaw: -0.51, rows: 3, columns: 4, gap: 22, use: "civic" },
        { fraction: 0.58, lateral: -36, yaw: 0.30, rows: 2, columns: 3, gap: 21, use: "house" },
        { fraction: 0.76, lateral: 54, yaw: 0.09, rows: 3, columns: 3, gap: 19, use: "plaza" },
    ],
    metro: [
        { fraction: 0.081, lateral: -77, yaw: 0, rows: 4, columns: 3, gap: 29, use: "tower" },
        { fraction: 0.19, lateral: 53, yaw: 0.22, rows: 3, columns: 4, gap: 29, use: "plaza" },
        { fraction: 0.30, lateral: 65, yaw: -0.22, rows: 4, columns: 3, gap: 30, use: "tower" },
        { fraction: 0.42, lateral: -58, yaw: 0.72, rows: 3, columns: 3, gap: 31, use: "brick" },
        { fraction: 0.66, lateral: 62, yaw: 0.07, rows: 4, columns: 3, gap: 30, use: "tower" },
        { fraction: 0.76, lateral: -56, yaw: -0.19, rows: 3, columns: 3, gap: 27, use: "brick" },
        { fraction: 0.92, lateral: 68, yaw: 0.44, rows: 4, columns: 3, gap: 31, use: "tower" },
    ],
    future: [
        { fraction: 0.092, lateral: 48, yaw: 0.26, rows: 4, columns: 3, gap: 31, use: "tower" },
        { fraction: 0.274, lateral: -64, yaw: 0.73, rows: 3, columns: 3, gap: 28, use: "civic" },
        { fraction: 0.373, lateral: -83, yaw: 0.56, rows: 3, columns: 2, gap: 33, use: "tower" },
        { fraction: 0.53, lateral: 61, yaw: 0, rows: 3, columns: 3, gap: 34, use: "plaza" },
        { fraction: 0.63, lateral: -67, yaw: -0.46, rows: 4, columns: 3, gap: 32, use: "civic" },
        { fraction: 0.78, lateral: -56, yaw: 0.32, rows: 4, columns: 4, gap: 30, use: "tower" },
        { fraction: 0.89, lateral: 75, yaw: 0.35, rows: 3, columns: 4, gap: 29, use: "plaza" },
    ],
};
