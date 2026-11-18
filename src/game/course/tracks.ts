import type { Point } from "../point.ts";

export type Biome = "coast" | "alpine" | "canyon" | "ruins" | "forest" | "old-town"
    | "metro" | "future" | "mars" | "arctic" | "gorge" | "sky" | "caldera" | "reef" | "rail" | "stunt";

export interface TrackSpec {
    readonly id: Biome;
    readonly name: string;
    readonly description: string;
    readonly terrain: string;
    readonly accent: string;
    readonly points: readonly Point[];
}

function points(coordinates: readonly (readonly [number, number, number])[]): Point[] {
    return coordinates.map(([x, y, z]) => ({ x, y, z }));
}

export const tracks: readonly [TrackSpec, ...TrackSpec[]] = [
    {
        id: "coast", name: "Pacific Run",
        description: "Sweep through windswept cypress, around a chalk headland and down the coast past the lighthouse.",
        terrain: "#a0a260", accent: "#dcad71",
        points: points([
            [0, 12, 0], [-7, 15, 91], [12, 23, 153], [53, 32, 213],
            [70, 38, 269], [59, 41, 316], [73, 44, 364], [128, 46, 420],
            [205, 43, 444], [276, 37, 423], [337, 29, 380], [378, 21, 306],
            [382, 15, 221], [347, 11, 149], [285, 12, 106], [260, 13, 43], [214, 12, -23],
            [141, 10, -76], [67, 10, -83], [16, 11, -51],
        ]),
    },
    {
        id: "alpine", name: "Alpine Pass",
        description: "Climb through granite cuts, sweep above a mountain tarn, and pass under the gondola wires.",
        terrain: "#89925b", accent: "#bdcbd2",
        points: points([
            [0, 32, 0], [0, 40, 105], [38, 49, 191], [42, 55, 259], [31, 60, 314],
            [48, 65, 377], [95, 70, 439], [153, 75, 474], [223, 77, 486], [291, 80, 465],
            [357, 83, 420], [401, 71, 347], [417, 61, 276], [384, 52, 210],
            [339, 42, 117], [282, 36, 24], [176, 30, -48], [66, 29, -73],
        ]),
    },
    {
        id: "canyon", name: "Cinder Valley",
        description: "Weave between sandstone spires, skirt the wash and drive through a long rock tunnel.",
        terrain: "#bd754e", accent: "#e2a36d",
        points: points([
            [0, 10, 0], [0, 10, 125], [-26, 12, 224], [-7, 17, 306], [4, 21, 363],
            [0, 23, 413], [29, 26, 469], [87, 30, 508], [148, 32, 524], [219, 31, 525],
            [282, 26, 501], [350, 20, 461], [393, 14, 396], [408, 10, 320], [378, 8, 250],
            [353, 8, 187], [318, 13, 65], [253, 18, -38], [126, 15, -91], [34, 10, -66],
        ]),
    },
    {
        id: "ruins", name: "Aegean Ruins",
        description: "A cliffside drive beneath a Greek aqueduct, past a hilltop temple and down to the olive terraces.",
        terrain: "#a2a65d", accent: "#e7d6aa",
        points: points([
            [0, 23, 0], [0, 25, 94], [-26, 23, 183], [-23, 19, 271], [29, 23, 377],
            [113, 34, 425], [206, 36, 420], [283, 32, 377], [326, 25, 288], [313, 18, 214],
            [278, 15, 166], [268, 12, 112], [239, 10, 36], [173, 12, -47], [66, 17, -65],
        ]),
    },
    {
        id: "forest", name: "Blackwood Forest",
        description: "A lakeside sweep, a covered timber bridge and a ridge road through old-growth cedar.",
        terrain: "#6f9755", accent: "#bdc18b",
        points: points([
            [0, 8, 0], [0, 9, 93], [31, 12, 177], [18, 15, 269], [49, 20, 365],
            [124, 29, 419], [213, 32, 422], [288, 28, 386], [340, 23, 312], [334, 17, 230], [293, 11, 161],
            [256, 11, 91], [222, 15, 35], [161, 19, -19], [77, 12, -50],
        ]),
    },
    {
        id: "old-town", name: "Bellgate",
        description: "Cross a vaulted town gate, then climb from the market square into olive terraces.",
        terrain: "#aaa77b", accent: "#d7aa83",
        points: points([
            [0, 4, 0], [0, 4, 94], [9, 7, 196], [-10, 13, 294], [38, 20, 386],
            [129, 23, 424], [230, 18, 394], [301, 10, 317], [314, 6, 214], [268, 5, 133],
            [252, 4, 38], [177, 3, -43], [76, 3, -58],
        ]),
    },
    {
        id: "metro", name: "Glasswater",
        description: "A river crossing and raised boulevard link the glass towers and brick blocks.",
        terrain: "#8f9a8c", accent: "#a8b9c1",
        points: points([
            [0, 2, 0], [0, 3, 129], [-23, 6, 261], [20, 14, 386], [96, 22, 481],
            [214, 21, 523], [345, 14, 496], [410, 7, 393], [411, 4, 260], [346, 4, 142],
            [299, 3, 24], [185, 2, -66], [55, 2, -68],
        ]),
    },
    {
        id: "future", name: "Aurora District",
        description: "Sweep under glass halls and a suspended monorail, then cross rain gardens beneath a ceramic solar arcade.",
        terrain: "#8ca080", accent: "#8cdbb8",
        points: points([
            [0, 18, 0], [0, 20, 111], [-33, 27, 221], [-12, 36, 328], [49, 42, 440],
            [147, 47, 503], [267, 43, 486], [345, 36, 414], [394, 30, 310], [368, 23, 205],
            [312, 16, 96], [225, 16, 5], [128, 17, -68], [37, 18, -57],
        ]),
    },
    {
        id: "mars", name: "Ares Basin",
        description: "Drive through a Martian hangar and ceramic gallery, then race the rim beneath a hovering survey carrier.",
        terrain: "#bb6644", accent: "#b9d37f",
        points: points([
            [0, 8, 0], [0, 8, 120], [31, 15, 227], [52, 21, 337], [21, 24, 445],
            [101, 27, 505], [231, 23, 512], [351, 16, 466], [410, 13, 364], [388, 9, 238],
            [333, 9, 124], [270, 13, 7], [159, 11, -77], [52, 8, -67],
        ]),
    },
    {
        id: "arctic", name: "Frosthaven",
        description: "Cross an icy fjord past red boathouses, a striped beacon, and snow-covered slate cliffs.",
        terrain: "#cfdee7", accent: "#a8d0e4",
        points: points([
            [0, 7, 0], [0, 9, 90], [25, 13, 176], [12, 18, 272], [51, 23, 363],
            [146, 24, 410], [242, 19, 370], [299, 14, 278], [294, 11, 174], [250, 10, 79],
            [196, 12, -15], [109, 9, -60], [38, 7, -49],
        ]),
    },
    {
        id: "gorge", name: "Copper Gorge",
        description: "Follow a cliffside gallery above the turquoise river, between shale cliffs and copper ridges.",
        terrain: "#c69466", accent: "#e8b482",
        points: points([
            [0, 77, 0], [0, 79, 119], [26, 85, 227], [83, 92, 331], [70, 94, 447],
            [141, 97, 542], [257, 102, 571], [363, 99, 520], [443, 91, 421], [427, 86, 299],
            [361, 84, 191], [332, 89, 73], [233, 86, -33], [127, 81, -83], [34, 76, -65],
        ]),
    },
    {
        id: "sky", name: "Cloudfold",
        description: "Choose the jump or take the garden bridge through a floating figure eight.",
        terrain: "#8e83b2", accent: "#abede7",
        points: Array.from({ length: 24 }, (_, index) => {
            const t = -0.55 + index * Math.PI / 12;
            return {
                x: 238 * Math.sin(t) + 7 * Math.sin(3 * t),
                y: 97 - 15 * Math.cos(t) + 2.4 * Math.sin(3 * t),
                z: 120 * Math.sin(2 * t) + 5 * Math.sin(4 * t),
            };
        }),
    },
    {
        id: "caldera", name: "Caldera Road",
        description: "Cross a lava river below a split crater, then climb the long basalt ridge and descend through the ash basin.",
        terrain: "#6a6871", accent: "#fbb369",
        points: points([
            [0, 22, 0], [0, 23, 72], [12, 24, 141], [44, 26, 207], [117, 29, 244],
            [205, 39, 285], [307, 45, 276], [410, 42, 269], [535, 54, 256], [686, 67, 236],
            [899, 80, 181], [1_016, 84, 85], [945, 67, -63], [802, 51, -147], [653, 42, -200],
            [548, 32, -231], [405, 27, -206], [311, 26, -171], [257, 26, -140], [167, 21, -103], [73, 20, -80],
        ]),
    },
    {
        id: "reef", name: "Coral Passage",
        description: "Descend into a glass tunnel through a reef, then climb into daylight beside a pirate ship.",
        terrain: "#a69b72", accent: "#6dd7d1",
        points: points([
            [0, 13, 0], [-3, 10, 91], [5, 0, 170], [23, -15, 254], [54, -20, 341],
            [108, -19, 426], [193, -16, 466], [282, -1, 463], [352, 13, 405], [384, 17, 301],
            [368, 14, 196], [319, 10, 83], [262, 9, -12], [165, 13, -81], [65, 14, -71],
        ]),
    },
    {
        id: "rail", name: "Juniper Junction",
        description: "Chase a steam train under stone viaducts, then climb into the high valley above the station.",
        terrain: "#829958", accent: "#e4ae67",
        points: points([
            [0, 10, 0], [-4, 9, 94], [-10, 10, 185], [21, 14, 278], [12, 23, 377],
            [68, 30, 459], [105, 35, 565], [184, 53, 635], [286, 63, 670], [369, 58, 622],
            [415, 49, 528], [389, 36, 453], [324, 25, 407], [296, 20, 346], [284, 15, 239],
            [277, 13, 145], [312, 17, 68], [264, 21, -21], [167, 18, -59], [67, 11, -53],
        ]),
    },
    {
        id: "stunt", name: "Skywheel Park",
        description: "Take the high loop or stay on the race road through an old-fashioned stunt park.",
        terrain: "#81a259", accent: "#f5c36e",
        points: points([
            [0, 8, 0], [0, 8, 90], [0, 8, 185], [0, 8, 290], [0, 8, 412],
            [19, 11, 488], [98, 21, 526], [209, 22, 489], [276, 18, 393], [279, 13, 293],
            [248, 11, 206], [266, 17, 120], [241, 17, 25], [186, 13, -49], [85, 9, -65], [22, 8, -39],
        ]),
    },
];
