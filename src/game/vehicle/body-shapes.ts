import type { CarId, CarSpec } from "./cars.ts";
import { parkedSuspension } from "./wheels.ts";
import type { Point } from "../point.ts";

export interface BodyProfile {
    readonly z: number;
    readonly width: number;
    readonly base: number;
    readonly deck: number;
}

type Station = readonly [along: number, width: number, deck: number];
type SectionPoint = readonly [width: number, height: number];

type RoofPoint = readonly [along: number, width: number, height: number];

export interface BodyShape {
    readonly body: readonly Station[];
    readonly section: readonly SectionPoint[];
    readonly rearSill: RoofPoint;
    readonly rearRoof: RoofPoint;
    readonly frontRoof: RoofPoint;
    readonly frontSill: RoofPoint;
    readonly pillar: number;
    readonly light: "blade" | "rally" | "round" | "armored" | "aero" | "orbit";
    readonly sill: number;
    readonly glassBand: readonly [lower: number, upper: number];
    readonly sidePillars: readonly number[];
    readonly roofColor?: string;
}

const wedge: BodyShape = {
    section: [[0.80, 0], [0.96, 0.17], [0.88, 0.48], [0.99, 0.69], [1, 0.76], [0.82, 0.93], [0.74, 1]],
    body: [[-0.50, 0.85, 0.14], [-0.44, 1.015, 0.21], [-0.32, 1.07, 0.265], [-0.18, 0.91, 0.20],
        [0, 0.87, 0.18], [0.22, 0.99, 0.13], [0.37, 0.99, 0.075], [0.45, 0.92, 0.025], [0.50, 0.78, -0.035]],
    rearSill: [-0.368, 0.76, 0], rearRoof: [-0.233, 0.55, 0],
    frontRoof: [-0.061, 0.50, 0.02], frontSill: [0.194, 0.73, 0],
    pillar: 0.105, light: "blade", sill: -0.345, glassBand: [0.105, 0.92],
    sidePillars: [0.11, 0.38, 0.49, 0.89],
};

const rally: BodyShape = {
    section: [[0.92, 0], [0.98, 0.11], [0.95, 0.40], [0.99, 0.74], [1, 0.83], [0.91, 0.975], [0.84, 1]],
    body: [[-0.50, 0.92, 0.16], [-0.35, 1.09, 0.20], [-0.14, 0.95, 0.17], [0.17, 0.99, 0.18],
        [0.33, 1.07, 0.16], [0.45, 0.98, 0.095], [0.50, 0.92, 0.03]],
    rearSill: [-0.34, 0.83, 0.12], rearRoof: [-0.235, 0.70, 0],
    frontRoof: [0.07, 0.67, 0.025], frontSill: [0.24, 0.83, 0.10],
    pillar: 0.085, light: "rally", sill: -0.355, glassBand: [0.13, 0.89],
    sidePillars: [0.09, 0.48, 0.57, 0.89],
};

const hatch: BodyShape = {
    section: [[0.76, 0], [0.94, 0.15], [0.985, 0.40], [1, 0.63], [0.97, 0.82], [0.88, 0.96], [0.76, 1]],
    body: [[-0.50, 0.83, 0.19], [-0.455, 0.94, 0.235], [-0.27, 1.00, 0.23], [0.02, 0.97, 0.21],
        [0.27, 0.99, 0.18], [0.41, 0.94, 0.10], [0.47, 0.82, 0.055], [0.50, 0.68, 0.025]],
    rearSill: [-0.443, 0.80, 0.14], rearRoof: [-0.365, 0.64, 0.01],
    frontRoof: [0.095, 0.63, 0.04], frontSill: [0.28, 0.79, 0.11],
    pillar: 0.105, light: "round", sill: -0.31, roofColor: "#f3e4cb", glassBand: [0.15, 0.87],
    sidePillars: [0.17, 0.49, 0.56, 0.88],
};

const armored: BodyShape = {
    section: [[0.90, 0], [0.98, 0.10], [0.985, 0.41], [1, 0.74], [1, 0.83], [0.965, 0.98], [0.89, 1]],
    body: [[-0.50, 0.84, 0.19], [-0.46, 1.02, 0.26], [-0.33, 1.08, 0.275], [-0.12, 0.97, 0.275],
        [0.22, 1.0, 0.255], [0.34, 1.06, 0.195], [0.45, 0.98, 0.115], [0.50, 0.77, 0.085]],
    rearSill: [-0.37, 0.76, 0], rearRoof: [-0.31, 0.64, 0.005],
    frontRoof: [0.085, 0.59, -0.025], frontSill: [0.22, 0.76, 0],
    pillar: 0.17, light: "armored", sill: -0.36, roofColor: "#3d4540", glassBand: [0.24, 0.83],
    sidePillars: [0.19, 0.48, 0.59, 0.85],
};

const electric: BodyShape = {
    section: [[0.69, 0], [0.87, 0.16], [0.91, 0.32], [1, 0.60], [0.985, 0.72], [0.83, 0.90], [0.71, 1]],
    body: [[-0.50, 0.71, 0.13], [-0.445, 0.96, 0.17], [-0.33, 1.11, 0.235], [-0.19, 1.00, 0.19],
        [0, 0.82, 0.16], [0.21, 0.98, 0.16], [0.35, 1.08, 0.115], [0.45, 0.92, 0.064], [0.50, 0.69, -0.005]],
    rearSill: [-0.33, 0.70, 0], rearRoof: [-0.20, 0.48, 0.017],
    frontRoof: [0.019, 0.48, 0.04], frontSill: [0.259, 0.78, 0],
    pillar: 0.07, light: "aero", sill: -0.31, roofColor: "#282840", glassBand: [0.07, 0.94],
    sidePillars: [0.09, 0.61, 0.67, 0.93],
};

const orbit: BodyShape = {
    section: [[0.76, 0], [0.94, 0.14], [0.965, 0.40], [1, 0.67], [0.96, 0.79], [0.83, 0.95], [0.70, 1]],
    body: [[-0.50, 0.74, 0.12], [-0.46, 1.02, 0.18], [-0.34, 1.10, 0.20], [-0.23, 1.09, 0.145],
        [-0.10, 0.91, 0.10], [0.10, 0.90, 0.12], [0.24, 0.99, 0.175], [0.34, 1.09, 0.14],
        [0.43, 0.94, 0.08], [0.48, 0.76, 0.038], [0.50, 0.61, 0.010]],
    rearSill: [-0.28, 0.43, 0], rearRoof: [-0.19, 0.40, 0],
    frontRoof: [0.052, 0.40, 0.01], frontSill: [0.20, 0.43, 0],
    pillar: 0.052, light: "orbit", sill: -0.31, roofColor: "#1c3037", glassBand: [0.09, 0.95],
    sidePillars: [0.15, 0.90],
};

const buggy: BodyShape = {
    section: [[0.82, 0], [0.95, 0.15], [1, 0.48], [0.92, 0.76], [0.80, 0.94], [0.68, 1]],
    body: [[-0.50, 0.64, 0.10], [-0.40, 1.01, 0.28], [-0.32, 1.04, 0.32], [-0.24, 0.96, 0.25],
        [-0.16, 0.76, 0.19], [0.10, 0.79, 0.22], [0.25, 0.95, 0.24], [0.34, 1.01, 0.20],
        [0.43, 0.89, 0.095], [0.50, 0.62, 0.05]],
    rearSill: [-0.34, 0.75, -0.06], rearRoof: [-0.19, 0.62, 0],
    frontRoof: [0.095, 0.59, 0.01], frontSill: [0.239, 0.73, 0.03],
    pillar: 0.09, light: "round", sill: -0.32, glassBand: [0.12, 0.89],
    sidePillars: [0.14, 0.86],
};

const kestrel: BodyShape = {
    section: [[0.78, 0], [0.93, 0.13], [0.96, 0.39], [1, 0.63], [0.97, 0.81], [0.88, 0.94], [0.73, 1]],
    body: [[-0.50, 0.86, 0.10], [-0.45, 0.99, 0.16], [-0.32, 1.10, 0.24], [-0.23, 0.97, 0.22],
        [0, 0.91, 0.20], [0.24, 0.99, 0.18], [0.34, 1.05, 0.135], [0.45, 0.94, 0.054], [0.50, 0.83, 0.002]],
    rearSill: [-0.438, 0.68, 0.09], rearRoof: [-0.168, 0.54, 0.01],
    frontRoof: [0.018, 0.52, 0.03], frontSill: [0.287, 0.72, 0.035],
    pillar: 0.086, light: "blade", sill: -0.325, glassBand: [0.08, 0.94],
    sidePillars: [0.10, 0.58, 0.63, 0.91],
};

const bodies: Record<CarId, BodyShape> = {
    veloce: wedge, summit: rally, mistral: hatch, bastion: armored, aero: electric, orbit, buggy, kestrel, manta: orbit,
};

export function bodyShape(car: CarSpec): BodyShape {
    return bodies[car.id];
}

export function bodyProfiles(car: CarSpec, shape: BodyShape): BodyProfile[] {
    const axle = car.wheelbase / 2;
    const arch = car.tire.radius + 0.057;
    const archTop = car.tire.radius - parkedSuspension(car) - 0.08 + 0.045;
    const positions = new Set(shape.body.map(([along]) => along * car.length));
    for (const center of [-axle, axle]) {
        for (const offset of [-arch, -arch * 0.71, 0, arch * 0.71, arch]) positions.add(center + offset);
    }
    return [...positions].sort((a, b) => a - b).map(z => {
        const [width, deck] = atStation(shape, z / car.length);
        const distance = Math.abs(Math.abs(z) - axle);
        const cutout = distance >= arch ? 0 : (archTop - shape.sill) * Math.sqrt(1 - (distance / arch) ** 2);
        const height = car.nose + deck - 0.56;
        return { z, width: width * car.width * 0.5, base: Math.min(height - 0.075, shape.sill + cutout), deck: height };
    });
}

export function deckHeight(car: CarSpec, shape: BodyShape, along: number): number {
    return car.nose + atStation(shape, along)[1] - 0.56;
}

function atStation(shape: BodyShape, along: number): readonly [number, number] {
    const index = shape.body.findIndex(station => station[0] >= along);
    const end = index < 0 ? shape.body.length - 1 : index;
    const a = shape.body[Math.max(0, end - 1)]!;
    const b = shape.body[end]!;
    const t = a === b ? 0 : (along - a[0]) / (b[0] - a[0]);
    return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function bodyOutline(profiles: readonly BodyProfile[], shape: BodyShape): number[] {
    const section = shape.section;
    const signed = [...section.map(([width, height]) => [-width, height] as const), ...section.toReversed()];
    return profiles.flatMap(({ width, deck, base, z }) =>
        signed.flatMap(([across, height]) => [across * width, base + (deck - base) * height, z]));
}

export function sideOfBody(profiles: readonly BodyProfile[], shape: BodyShape, z: number, height: number): Point {
    const next = profiles.findIndex(profile => profile.z >= z);
    const index = next < 0 ? profiles.length - 1 : Math.max(1, next);
    const left = profiles[index - 1]!;
    const right = profiles[index]!;
    const t = Math.max(0, Math.min(1, (z - left.z) / (right.z - left.z)));
    const width = left.width + (right.width - left.width) * t;
    const base = left.base + (right.base - left.base) * t;
    const deck = left.deck + (right.deck - left.deck) * t;
    const section = shape.section;
    const above = Math.max(1, section.findIndex(([, rise]) => rise >= height));
    const [lowWidth, lowHeight] = section[above - 1]!;
    const [highWidth, highHeight] = section[above]!;
    const bevel = lowWidth + (highWidth - lowWidth) * (height - lowHeight) / (highHeight - lowHeight);
    return { x: width * bevel, y: base + (deck - base) * height, z };
}

export function cabinCorner(car: CarSpec, shape: BodyShape, point: RoofPoint, side: number, top: boolean): Point {
    const [along, width, height] = point;
    return {
        x: side * width * car.width * 0.5,
        y: top ? car.roof + height - 0.56 : deckHeight(car, shape, along) - 0.023,
        z: along * car.length,
    };
}
