import button from "./button.webp?inline";
import panel from "./panel.webp?inline";
import sunrise from "./sunrise.webp?inline";
import midday from "./midday.webp?inline";
import sunset from "./sunset.webp?inline";
import night from "./night.webp?inline";
import clear from "./clear.webp?inline";
import rain from "./rain.webp?inline";
import snow from "./snow.webp?inline";
import fog from "./fog.webp?inline";

const conditions = { sunrise, midday, sunset, night, clear, rain, snow, fog };
export type ConditionBadge = keyof typeof conditions;

export function installSteelTextures(): void {
    const style = document.documentElement.style;
    style.setProperty("--steel-button", `url("${button}")`);
    style.setProperty("--steel-panel", `url("${panel}")`);
}

export function setConditionBadge(image: HTMLImageElement, badge: ConditionBadge): void {
    image.src = conditions[badge];
}
