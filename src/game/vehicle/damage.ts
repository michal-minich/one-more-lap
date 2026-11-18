export function damageFromImpact(deltaSpeed: number): number {
    return Math.min(44, Math.max(0, deltaSpeed - 2.8) * 1.85 + Math.max(0, deltaSpeed - 8) ** 2 * 0.08);
}

export function damageStage(damage: number): string {
    if (damage >= 100) return "Wrecked";
    if (damage >= 72) return "Critical";
    if (damage >= 38) return "Smoking";
    if (damage >= 21) return "Dented";
    return damage >= 6 ? "Scuffed" : "";
}

export function smokeAmount(damage: number): number {
    return Math.max(0, (damage - 22) / 78);
}
