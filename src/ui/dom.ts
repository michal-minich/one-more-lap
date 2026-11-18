export function element(id: string): HTMLElement;
export function element<T extends Element>(id: string, kind: new () => T): T;
export function element(id: string, kind: new () => Element = HTMLElement): Element {
    const node = document.getElementById(id);
    if (!(node instanceof kind)) throw new Error("Missing " + kind.name + " #" + id);
    return node;
}

export function formatClock(seconds: number): string {
    const whole = Math.floor(seconds);
    return String(Math.floor(whole / 60)).padStart(2, "0") + ":"
        + String(whole % 60).padStart(2, "0");
}

export function formatTime(seconds: number): string {
    return formatClock(seconds) + "." + String(Math.floor(seconds * 1_000) % 1_000).padStart(3, "0");
}
