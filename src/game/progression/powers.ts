export const powers = [
    { id: "jump", name: "Jumping suspension", coins: 3, detail: "Hop off the road. Recharge after a fifth of a lap." },
    { id: "boost", name: "Rocket boost", coins: 4, detail: "A quick burst of speed. Recharge after a third of a lap." },
    { id: "magnet", name: "Coin magnet", coins: 2, detail: "Pick up coins from farther away." },
    { id: "tires", name: "All-terrain tires", coins: 2, detail: "Keep more grip and speed on loose ground." },
    { id: "bumpers", name: "Reinforced bumpers", coins: 3, detail: "Take less damage from impacts." },
    { id: "splash", name: "Splash guard", coins: 1, detail: "Lose less speed in shallow water." },
    { id: "traction", name: "Traction control", coins: 4, detail: "Keep more grip in rain and snow." },
    { id: "pit", name: "Pit crew", coins: 5, detail: "Repair some damage at the end of each lap." },
    { id: "teleport", name: "Teleport", coins: 6, detail: "Jump 100 m ahead at the same speed. Briefly pass through rivals." },
] as const;

export type PowerId = typeof powers[number]["id"];
export type ActivePower = "jump" | "boost" | "teleport";

export interface ActivePowerView {
    readonly jump: number | undefined;
    readonly boost: number | undefined;
    readonly teleport: number | undefined;
    readonly boosting: boolean;
    readonly phasing: boolean;
    readonly teleporting: boolean;
}
