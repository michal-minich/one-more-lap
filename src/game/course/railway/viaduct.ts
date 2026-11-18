import type { GroundHeight } from "../ground-height.ts";
import type { Surface } from "../surface.ts";
import type { Point } from "../../point.ts";
import { railwayOffset, railwayPoint, viaductSpans } from "./line.ts";

const halfWidth = 3.35;
const soffit = -1.35;
const archSpring = -8.9;

interface Masonry {
    readonly wall: Surface;
    readonly rings: Surface;
}

export function buildViaduct(ground: GroundHeight): Masonry {
    const wall = new MasonryMesh();
    const rings = new MasonryMesh();
    for (const spans of viaductSpans) {
        for (const [index, start] of spans.slice(0, -1).entries()) {
            const end = spans[index + 1]!;
            addPier(wall, ground, start);
            addArch(wall, rings, start + 1.68, end - 1.68);
            if (index === spans.length - 2) addPier(wall, ground, end);
        }
    }
    return { wall: wall.finish(), rings: rings.finish() };
}

function addPier(mesh: MasonryMesh, ground: GroundHeight, x: number): void {
    const cap = railwayPoint(x).y + soffit;
    const footprint = [-1, 1].flatMap(side => [-1, 1].map(end => railwayOffset(x + end * 1.68, side * (halfWidth + 0.20))));
    const foot = Math.min(cap - 12, ...footprint.map(at => (ground.at(at.x, at.z) ?? cap - 10) - 0.8));
    const columns = [...footprint.slice(0, 2), ...footprint.slice(2).reverse()];
    for (const [i, a] of columns.entries()) {
        const b = columns[(i + 1) % columns.length]!;
        mesh.quad({ ...a, y: foot }, { ...b, y: foot }, { ...b, y: cap + 0.02 }, { ...a, y: cap + 0.02 });
    }
}

function addArch(wall: MasonryMesh, rings: MasonryMesh, start: number, end: number): void {
    let lower = archSpring;
    let x = start;
    for (let step = 1; step <= 24; step++) {
        const angle = Math.PI * step / 24;
        const nextX = start + (end - start) * (1 - Math.cos(angle)) / 2;
        const next = archSpring + 6.75 * Math.sin(angle);
        const underside = [railwayOffset(x, -halfWidth, lower), railwayOffset(nextX, -halfWidth, next),
            railwayOffset(nextX, halfWidth, next), railwayOffset(x, halfWidth, lower)] as const;
        wall.quad(...underside);
        for (const side of [-1, 1]) {
            const offset = halfWidth * side;
            const face = [railwayOffset(x, offset, lower), railwayOffset(nextX, offset, next),
                railwayOffset(nextX, offset, soffit), railwayOffset(x, offset, soffit)] as const;
            if (side < 0) wall.quad(...face);
            else wall.quad(face[3], face[2], face[1], face[0]);
            const trim = (halfWidth + 0.027) * side;
            const stoneHeight = step % 2 === 0 ? 0.66 : 0.70;
            rings.quad(railwayOffset(x, trim, lower - 0.045), railwayOffset(nextX, trim, next - 0.045),
                railwayOffset(nextX, trim, next + stoneHeight), railwayOffset(x, trim, lower + stoneHeight), true);
        }
        x = nextX;
        lower = next;
    }
}

class MasonryMesh {
    readonly #positions: number[] = [];
    readonly #indices: number[] = [];
    readonly #uv: number[] = [];

    quad(a: Point, b: Point, c: Point, d: Point, voussoir = false): void {
        const i = this.#positions.length / 3;
        const section = Math.floor(a.x * 0.47 + a.z * 0.27);
        const rotation = Math.sin(section * 2.09);
        for (const [corner, p] of [a, b, c, d].entries()) {
            this.#positions.push(p.x, p.y, p.z);
            if (voussoir) {
                this.#uv.push(0.12 + rotation * 0.06 + (corner === 1 || corner === 2 ? 0.49 : 0),
                    0.22 + (corner >= 2 ? 0.44 : 0));
            } else {
                this.#uv.push((p.x + p.z * 0.72) / 5.2, (p.y + p.z * 0.31) / 4.6);
            }
        }
        this.#indices.push(i, i + 1, i + 2, i, i + 2, i + 3);
    }

    finish(): Surface {
        return { positions: new Float32Array(this.#positions), indices: new Uint32Array(this.#indices),
            uv: new Float32Array(this.#uv) };
    }
}
