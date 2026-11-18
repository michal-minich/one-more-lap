const comparing = import.meta.env.VITE_ART_PILOT === "1";
const variant = comparing ? new URLSearchParams(location.search).get("art") ?? "both" : "both";

export const showPixalBasalt = variant === "both" || variant === "basalt";
export const showStudioKestrel = variant === "both" || variant === "kestrel";
export const showBlenderFleet = variant === "both" || variant === "fleet";
