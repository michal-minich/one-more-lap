import type { Point } from "../point.ts";
import type { Course } from "./course.ts";
import { pointOnRoute } from "./route.ts";
import { channelPoint } from "./water.ts";

type FacadeStyle = "brick" | "concrete" | "glass" | "townhouse";
export interface StreetBuilding extends Point {
    readonly width: number;
    readonly depth: number;
    readonly height: number;
    readonly base: number;
    readonly yaw: number;
    readonly style: FacadeStyle;
}

export const GLASSWATER_PAVEMENT = { start: 43, end: 202, setback: 16.3 } as const;

type Frontage = readonly [distance: number, lateral: number, width: number, depth: number, height: number, style: FacadeStyle];

const glasswaterBlocks: readonly Frontage[] = [
    [64, -18.2, 14.8, 9.2, 10.6, "brick"], [83, -18.5, 17.2, 9.8, 13.8, "concrete"],
    [103, -19, 17.6, 10.6, 16.7, "glass"], [124, -19.2, 15.3, 11.2, 12.6, "brick"],
    [146, -19.5, 18.9, 11.5, 15.7, "concrete"], [170, -20.2, 20.1, 10.1, 16.6, "glass"],
    [78, 20.1, 13.9, 10.5, 9.4, "concrete"], [98, 19.3, 17.6, 10.3, 11.8, "brick"],
    [120, 20.4, 16.9, 11.4, 17.3, "glass"], [153, 19.8, 18.6, 10.1, 12.5, "brick"],
    [178, 20.5, 18.2, 9.8, 14.9, "concrete"],
    [235, -26, 19, 11, 14.2, "brick"], [260, -27, 22, 12.3, 21.5, "glass"], [286, -25.8, 17.8, 11.7, 14.8, "concrete"],
    [241, 22.4, 17.3, 10.3, 12.6, "concrete"], [266, 24.4, 16.5, 11.1, 15.3, "brick"],
    [851, -20.5, 15.6, 10.4, 12.7, "brick"], [875, -22.2, 18.1, 12.5, 12.3, "brick"],
    [865, 22.3, 16.4, 11.7, 14.9, "glass"], [904, 22.8, 15.9, 11.4, 10.4, "brick"],
    [1_015, 23.2, 14.2, 10.2, 12.9, "brick"], [1_043, 20.3, 17.9, 11.7, 14.1, "concrete"],
    [1_043, -20.4, 16.9, 11.6, 17.4, "glass"], [1_067, -21.9, 17.1, 12.3, 15.1, "brick"],
];

const bellgateBlocks: readonly Frontage[] = [
    [137, 16.5, 9.1, 9.2, 6.2, "townhouse"], [147.6, 17.5, 9.1, 10, 8.0, "townhouse"],
    [159.4, 17.4, 9.2, 8.8, 5.3, "townhouse"],
    [203, -17.7, 9.4, 9, 7.9, "townhouse"], [215, -18.2, 10, 9.8, 6.1, "townhouse"],
    [232, 21.7, 10.8, 10.2, 6.5, "townhouse"], [245, 21.7, 11.6, 11.5, 8.4, "townhouse"],
    [253.5, -17.6, 9.1, 9.0, 5.9, "townhouse"],
];

export function streetFrontage(course: Course): readonly StreetBuilding[] {
    const blocks = course.track.id === "old-town" ? bellgateBlocks : (course.track.id === "metro" ? glasswaterBlocks : []);
    const frontage = blocks.map(([distance, lateral, width, depth, height, style]) => {
        const row = course.at(distance);
        const center = pointOnRoute(row, lateral);
        let base = center.y;
        for (const along of [-width / 2, width / 2]) {
            for (const across of [-depth / 2, depth / 2]) {
                const edge = pointOnRoute(row, lateral + across);
                base = Math.min(base, course.ground.at(edge.x + row.dx * along, edge.z + row.dz * along) ?? base);
            }
        }
        const y = course.ground.at(center.x, center.z) ?? center.y;
        const yaw = Math.atan2(row.dx, row.dz) + Math.sign(lateral) * Math.PI / 2;
        return { ...center, y, base: base - 0.65, yaw, width, depth, height, style };
    });
    if (course.track.id === "metro") frontage.push(...harborFrontage(course));
    return frontage;
}

function harborFrontage(course: Course): StreetBuilding[] {
    const river = course.water.find(body => body.kind === "creek");
    if (!river) return [];
    const direction = Math.atan2(river.dx, river.dz);
    return ([
        [-0.38, -1.90, 14.2, 9.0, 8.8, "brick"],
        [-0.64, -1.97, 20.2, 10.2, 11.1, "concrete"],
        [-0.87, -1.77, 15.6, 8.3, 7.2, "brick"],
        [0.44, 1.95, 17.5, 9.7, 8.3, "brick"],
        [0.68, 1.77, 16.6, 8.4, 10.4, "brick"],
        [0.88, 1.89, 13.6, 9.9, 9.2, "glass"],
    ] as const).map(([channel, bank, width, depth, height, style]) => {
        const center = channelPoint(river, channel, bank);
        const yaw = direction + (bank < 0 ? Math.PI : 0);
        const y = course.ground.at(center.x, center.z) ?? center.y;
        let base = y;
        for (const across of [-width / 2, width / 2]) {
            for (const along of [-depth / 2, depth / 2]) {
                const x = center.x + across * Math.cos(yaw) + along * Math.sin(yaw);
                const z = center.z - across * Math.sin(yaw) + along * Math.cos(yaw);
                base = Math.min(base, course.ground.at(x, z) ?? base);
            }
        }
        return { ...center, y, base: base - 0.58, yaw, width, depth, height, style };
    });
}
