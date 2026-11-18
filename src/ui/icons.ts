const SVG = "http://www.w3.org/2000/svg";

export function icon(name: string): SVGSVGElement {
    const image = document.createElementNS(SVG, "svg");
    const symbol = document.createElementNS(SVG, "use");
    image.classList.add("icon");
    image.setAttribute("aria-hidden", "true");
    symbol.setAttribute("href", "#icon-" + name);
    image.append(symbol);
    return image;
}
