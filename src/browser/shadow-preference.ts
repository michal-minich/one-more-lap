const KEY = "redline-enhanced-shadows-v1";

export function bindShadowPreference(control: HTMLButtonElement): () => boolean {
    let enabled = false;
    try {
        enabled = localStorage.getItem(KEY) === "on";
    } catch {
        // Use the default if storage is unavailable.
    }
    control.setAttribute("aria-pressed", String(enabled));
    control.addEventListener("click", () => {
        enabled = !enabled;
        control.setAttribute("aria-pressed", String(enabled));
        try {
            localStorage.setItem(KEY, enabled ? "on" : "off");
        } catch {
            // The toggle still applies to the current session.
        }
    });
    return () => enabled;
}
