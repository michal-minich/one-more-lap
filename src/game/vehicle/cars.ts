export type Propulsion = "combustion" | "electric" | "ion";

export type CarId = "veloce" | "summit" | "mistral" | "bastion" | "aero" | "orbit" | "buggy" | "kestrel" | "manta";

interface Steering {
    readonly lock: number;
    readonly response: number;
    readonly speedFade: number;
    readonly sideGrip: number;
}

interface Suspension {
    readonly rest: number;
    readonly travel: number;
    readonly stiffness: number;
}

interface Stability {
    readonly centerOfMass: number;
    readonly angularDamping: number;
    readonly rollInertia: number;
    readonly damage: number;
}

interface Tire {
    readonly radius: number;
    readonly tread: number;
    readonly looseGrip: number;
}

export interface CarSpec {
    readonly id: CarId;
    readonly name: string;
    readonly layout: string;
    readonly propulsion: Propulsion;
    readonly description: string;
    readonly paint: string;
    readonly unlockCoins?: number;
    readonly mass: number;
    readonly force: number;
    readonly topSpeed: number;
    readonly brake: number;
    readonly drift: number;
    readonly grip: number;
    readonly driven: "front" | "rear" | "all";
    readonly wheelbase: number;
    readonly width: number;
    readonly length: number;
    readonly roof: number;
    readonly nose: number;
    readonly bodyHeight: number;
    readonly steering: Steering;
    readonly suspension: Suspension;
    readonly stability: Stability;
    readonly tire: Tire;
}

export const cars: readonly [CarSpec, ...CarSpec[]] = [
    {
        id: "veloce", name: "Parade GT", layout: "MID ENGINE · RWD", propulsion: "combustion",
        description: "A low, quick grand tourer that responds quickly on pavement and feels lighter on loose ground.",
        paint: "#ed941b", mass: 1390, force: 8900, topSpeed: 72, brake: 9.5, grip: 1.8, drift: 0.82,
        driven: "rear", wheelbase: 2.62, width: 1.94, length: 4.38, roof: 1.06, nose: 0.51, bodyHeight: 0.44,
        steering: { lock: 0.57, response: 0.19, speedFade: 0.028, sideGrip: 1.08 },
        suspension: { rest: 0.33, travel: 0.20, stiffness: 37 },
        stability: { centerOfMass: 0.05, angularDamping: 1.4, rollInertia: 1.04, damage: 1 },
        tire: { radius: 0.395, tread: 0.300, looseGrip: 0.65 },
    },
    {
        id: "summit", name: "Taiga RS", layout: "TURBO · AWD", propulsion: "combustion",
        description: "Rally suspension and four driven wheels keep it planted over rough verges.",
        paint: "#3d66bd", mass: 1480, force: 9200, topSpeed: 66, brake: 9.8, grip: 1.96, drift: 0.66,
        driven: "all", wheelbase: 2.65, width: 1.87, length: 3.85, roof: 1.33, nose: 0.64, bodyHeight: 0.46,
        steering: { lock: 0.61, response: 0.20, speedFade: 0.030, sideGrip: 1.17 },
        suspension: { rest: 0.37, travel: 0.28, stiffness: 35 },
        stability: { centerOfMass: 0.06, angularDamping: 1.63, rollInertia: 1.12, damage: 0.94 },
        tire: { radius: 0.425, tread: 0.300, looseGrip: 0.83 },
    },
    {
        id: "mistral", name: "Sprig City", layout: "ELECTRIC · FWD", propulsion: "electric",
        description: "A short electric hatchback with a single front motor. Nimble in corners and easy to fit through tight gaps.",
        paint: "#96af43", mass: 1120, force: 6450, topSpeed: 59, brake: 9.3, grip: 1.83, drift: 0.54,
        driven: "front", wheelbase: 2.32, width: 1.68, length: 3.18, roof: 1.30, nose: 0.57, bodyHeight: 0.42,
        steering: { lock: 0.66, response: 0.22, speedFade: 0.033, sideGrip: 1.12 },
        suspension: { rest: 0.33, travel: 0.21, stiffness: 33 },
        stability: { centerOfMass: 0.09, angularDamping: 1.24, rollInertia: 0.95, damage: 1.08 },
        tire: { radius: 0.395, tread: 0.245, looseGrip: 0.74 },
    },
    {
        id: "bastion", name: "Canyon Rescue 4×4", layout: "ARMORED · AWD", propulsion: "combustion",
        description: "A wide rescue truck with low ballast. It turns slowly and is hard to roll.",
        paint: "#dc6834", mass: 2520, force: 12_600, topSpeed: 44, brake: 10.0, grip: 1.99, drift: 0.24,
        driven: "all", wheelbase: 2.94, width: 2.30, length: 4.12, roof: 1.61, nose: 0.73, bodyHeight: 0.62,
        steering: { lock: 0.41, response: 0.085, speedFade: 0.024, sideGrip: 1.05 },
        suspension: { rest: 0.38, travel: 0.32, stiffness: 42 },
        stability: { centerOfMass: -0.19, angularDamping: 3.0, rollInertia: 1.82, damage: 0.68 },
        tire: { radius: 0.515, tread: 0.390, looseGrip: 0.94 },
    },
    {
        id: "aero", name: "Glacier EV", layout: "ELECTRIC · AWD", propulsion: "electric",
        description: "A fast electric prototype with faired wheels and steering that settles at speed.",
        paint: "#c6caee", mass: 1650, force: 10_800, topSpeed: 75, brake: 10.1, grip: 1.97, drift: 0.43,
        driven: "all", wheelbase: 2.82, width: 2.04, length: 4.05, roof: 1.09, nose: 0.48, bodyHeight: 0.40,
        steering: { lock: 0.56, response: 0.17, speedFade: 0.036, sideGrip: 1.22 },
        suspension: { rest: 0.31, travel: 0.19, stiffness: 39 },
        stability: { centerOfMass: -0.05, angularDamping: 1.96, rollInertia: 1.25, damage: 0.94 },
        tire: { radius: 0.415, tread: 0.310, looseGrip: 0.66 },
    },
    {
        id: "orbit", name: "Kite R", layout: "TRACK SPECIAL · AWD", propulsion: "combustion",
        description: "A single-seat circuit car with wide tires, strong brakes and quick acceleration.",
        paint: "#17b8ab", unlockCoins: 6, mass: 1320, force: 12_200, topSpeed: 82, brake: 10.45, grip: 2.12, drift: 0.35,
        driven: "all", wheelbase: 2.98, width: 2.13, length: 4.22, roof: 0.93, nose: 0.51, bodyHeight: 0.42,
        steering: { lock: 0.55, response: 0.20, speedFade: 0.040, sideGrip: 1.29 },
        suspension: { rest: 0.295, travel: 0.17, stiffness: 44 },
        stability: { centerOfMass: -0.09, angularDamping: 1.87, rollInertia: 1.26, damage: 1.1 },
        tire: { radius: 0.455, tread: 0.360, looseGrip: 0.58 },
    },
    {
        id: "buggy", name: "Dune Hopper", layout: "LONG TRAVEL · AWD", propulsion: "combustion",
        description: "Big tires and long-travel suspension help it skim across rough ground and turn quickly.",
        paint: "#d1ad69", unlockCoins: 5, mass: 1090, force: 7190, topSpeed: 57.5, brake: 9.5, grip: 1.89, drift: 0.75,
        driven: "all", wheelbase: 2.37, width: 1.92, length: 3.40, roof: 1.12, nose: 0.59, bodyHeight: 0.39,
        steering: { lock: 0.69, response: 0.21, speedFade: 0.033, sideGrip: 1.08 },
        suspension: { rest: 0.39, travel: 0.37, stiffness: 30 },
        stability: { centerOfMass: -0.105, angularDamping: 1.51, rollInertia: 1.02, damage: 0.97 },
        tire: { radius: 0.485, tread: 0.380, looseGrip: 0.91 },
    },
    {
        id: "kestrel", name: "Comet Turbo", layout: "REAR ENGINE · RWD", propulsion: "combustion",
        description: "A short turbo liftback with big rear tires. Brake into a turn to bring the tail around.",
        paint: "#eb6b2c", unlockCoins: 4, mass: 1240, force: 8270, topSpeed: 68, brake: 9.6, grip: 1.88, drift: 0.93,
        driven: "rear", wheelbase: 2.53, width: 1.98, length: 3.62, roof: 1.13, nose: 0.58, bodyHeight: 0.47,
        steering: { lock: 0.59, response: 0.21, speedFade: 0.035, sideGrip: 1.04 },
        suspension: { rest: 0.35, travel: 0.24, stiffness: 35 },
        stability: { centerOfMass: -0.03, angularDamping: 1.5, rollInertia: 1.08, damage: 1.03 },
        tire: { radius: 0.435, tread: 0.320, looseGrip: 0.73 },
    },
    {
        id: "manta", name: "Manta Hover Racer", layout: "TWIN ION DRIVE", propulsion: "ion",
        description: "Paired ion thrusters and lift pods carry it just above the road. Fast on straights, with a wide slide under late braking.",
        paint: "#ead7b8", unlockCoins: 6, mass: 1370, force: 10_200, topSpeed: 76, brake: 9.3, grip: 1.92, drift: 0.61,
        driven: "all", wheelbase: 2.76, width: 2.60, length: 3.85, roof: 1.13, nose: 0.57, bodyHeight: 0.45,
        steering: { lock: 0.56, response: 0.15, speedFade: 0.043, sideGrip: 1.05 },
        suspension: { rest: 0.41, travel: 0.24, stiffness: 39 },
        stability: { centerOfMass: -0.12, angularDamping: 2.09, rollInertia: 1.36, damage: 0.95 },
        tire: { radius: 0.30, tread: 0.17, looseGrip: 0.78 },
    },
];

export const paintChoices = [
    { color: "#de5429", name: "Ember" }, { color: "#e6c54f", name: "Solar yellow" },
    { color: "#659bc9", name: "Glacier blue" }, { color: "#d4d5cf", name: "Silver" },
    { color: "#3c4549", name: "Graphite" }, { color: "#539273", name: "Pine green" },
    { color: "#a33f49", name: "Cherry" }, { color: "#ac82c5", name: "Lilac" },
    { color: "#41a9a8", name: "Lagoon" }, { color: "#ead7b8", name: "Ivory" },
    { color: "#a8734c", name: "Copper" }, { color: "#3f5eaa", name: "Cobalt" },
] as const;
