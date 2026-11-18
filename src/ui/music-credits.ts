import { tracks } from "../game/course/tracks.ts";
import type { Biome } from "../game/course/tracks.ts";
import soundtrack from "../audio/soundtrack.json" with { type: "json" };

const credits: Record<Biome | "garage", { title: string; artist: string; source?: string }> = soundtrack;
const musicScenes = [{ id: "garage", name: "Garage" } as const, ...tracks];

export function showMusicCredits(list: HTMLElement): void {
    const items = musicScenes.map(({ id, name }) => {
        const credit = credits[id];
        const item = document.createElement("li");
        item.append(name + " — ");
        if (credit.source) {
            const link = document.createElement("a");
            link.textContent = credit.title;
            link.href = credit.source;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            item.append(link);
        } else {
            item.append(credit.title);
        }
        item.append(" · " + credit.artist);
        return item;
    });
    list.replaceChildren(...items);
}
