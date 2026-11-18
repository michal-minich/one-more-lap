import { ROAD_HALF } from "./route.ts";
import type { Biome } from "./tracks.ts";

export function roadHalfWidth(track: Biome, distance: number): number {
    switch (track) {
        case "stunt": return ROAD_HALF + 0.64 * section(distance, 439, 736)
            - 0.36 * section(distance, 787, 943) + 0.54 * section(distance, 1_008, 1_308);
        case "metro": return ROAD_HALF + 0.65 * section(distance, 8, 197)
            - 0.23 * section(distance, 172, 282) + 0.83 * section(distance, 317, 780)
            + 0.55 * section(distance, 858, 1_030) - 0.44 * section(distance, 1_171, 1_367);
        case "future": return ROAD_HALF + 0.56 * section(distance, 226, 470) + 0.52 * section(distance, 448, 636)
            - 0.36 * section(distance, 755, 912) + 0.71 * section(distance, 982, 1_173) - 0.26 * section(distance, 1_258, 1_483);
        case "mars": return ROAD_HALF + 0.68 * section(distance, 120, 291) + 0.78 * section(distance, 385, 577)
            + 0.65 * section(distance, 817, 1_069) - 0.37 * section(distance, 1_238, 1_523);
        case "old-town": return ROAD_HALF + 0.72 * section(distance, 18, 171)
            - 0.32 * section(distance, 144, 259) + 0.55 * section(distance, 284, 493)
            - 0.33 * section(distance, 795, 954);
        case "coast": return ROAD_HALF + 0.46 * section(distance, 155, 535) - 0.37 * section(distance, 635, 879);
        case "canyon": return ROAD_HALF + 0.49 * section(distance, 286, 551) - 0.35 * section(distance, 565, 735);
        case "alpine": return ROAD_HALF + 0.60 * section(distance, 450, 680) - 0.45 * section(distance, 690, 922);
        case "rail": return ROAD_HALF - 0.98 * section(distance, 490, 1_118)
            + 0.83 * section(distance, 746, 913) + 0.60 * section(distance, 1_147, 1_359);
        case "caldera": return ROAD_HALF + 0.85 * section(distance, 500, 875) + 0.69 * section(distance, 990, 1_246)
            - 0.43 * section(distance, 1_300, 1_780) - 0.37 * section(distance, 1_389, 1_574)
            + 0.46 * section(distance, 1_791, 2_049);
        case "ruins": return ROAD_HALF + 0.52 * section(distance, 175, 440) - 0.51 * section(distance, 520, 780);
        case "forest": return ROAD_HALF + 0.72 * section(distance, 76, 268) - 0.62 * section(distance, 470, 783);
        case "arctic": return ROAD_HALF + 0.48 * section(distance, 78, 258) - 0.43 * section(distance, 386, 611);
        case "sky": return ROAD_HALF + 0.57 * section(distance, 340, 582)
            - 0.44 * section(distance, 701, 961) + 0.44 * section(distance, 1_114, 1_359);
        case "reef": return ROAD_HALF + 0.46 * section(distance, 650, 874)
            - 0.62 * section(distance, 888, 1_209) + 0.38 * section(distance, 1_230, 1_480);
        default: return ROAD_HALF;
    }
}

function section(distance: number, start: number, end: number): number {
    const fade = Math.max(0, Math.min(1, (distance - start) / 65, (end - distance) / 65));
    return fade * fade * (3 - 2 * fade);
}
