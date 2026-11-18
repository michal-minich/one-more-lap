import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Course } from "../../../game/course/course.ts";
import type { GroundPlant } from "../../../game/course/vegetation/habitats.ts";
import { boulderSizes } from "../../../game/course/vegetation/layout.ts";
import { showPixalBasalt } from "../../art-pilot.ts";
import { drawPixalBasalt } from "../caldera/pixal-basalt.ts";
import { material } from "../../materials.ts";
import { basaltBoulder } from "../caldera/basalt-variants.ts";
import { stamp } from "../instances.ts";
import type { Stamp } from "../instances.ts";
import { surfaceTexture } from "../surface-textures.ts";

const plantColors: Record<GroundPlant, string> = {
    grass: "#8eb557", tussock: "#9a9c62", "dry-grass": "#ceaa5d", flowers: "#719246", scrub: "#718b51", reeds: "#859c56", succulent: "#64896b",
};

export function drawUnderstory(scene: Scene, course: Course): void {
    const { plants, boulders } = course.vegetation;
    const kinds = new Set(plants.map(plant => plant.kind));
    for (const kind of kinds) {
        const instances = plants.filter(plant => plant.kind === kind).map(({ ground, scale, yaw }): Stamp =>
            ({ ...ground, sx: scale, sy: scale, sz: scale, yaw }));
        const leaves = material(scene, kind, plantColors[kind]);
        leaves.specularColor.set(0, 0, 0);
        leaves.backFaceCulling = false;
        const clump = kind === "scrub" ? shrub(scene) : blades(scene, kind);
        if (kind === "scrub") leaves.diffuseTexture = surfaceTexture(scene, "foliage");
        if (kind === "dry-grass") leaves.emissiveColor.set(0.09, 0.056, 0.019);
        clump.material = leaves;
        stamp(clump, instances);
        if (kind === "flowers") drawFlowers(scene, instances);
        if (kind === "reeds") drawSeedHeads(scene, instances);
    }
    if (boulders.length === 0) return;
    const basalt = course.track.id === "caldera";
    const sandstone = course.track.id === "canyon" || course.track.id === "mars" || course.track.id === "gorge";
    const stone = material(scene, "exposed fieldstone", basalt ? "#b4aabf" : sandstone ? "#c18a61" : "#96928b");
    stone.diffuseTexture = surfaceTexture(scene, basalt ? "basalt" : sandstone ? "sandstone" : "granite");
    const replaced = basalt && showPixalBasalt ? drawPixalBasalt(scene, course) : undefined;
    const remaining = replaced ? boulders.filter(boulder => !replaced.has(boulder)) : boulders;
    const shapes = new Set(remaining.map(boulder => boulder.shape));
    for (const shape of shapes) {
        const size = boulderSizes[shape];
        const instances = remaining.filter(boulder => boulder.shape === shape).map(({ ground, scale, yaw }): Stamp => ({
            ...ground, y: ground.y + size.lift * scale, sx: size.width * scale, sy: size.height * scale, sz: size.depth * scale, yaw,
        }));
        const mesh = basalt ? basaltBoulder(scene, shape, stone) : boulder(scene, shape === "round");
        mesh.material = stone;
        stamp(mesh, instances);
    }
}

type BladeKind = Exclude<GroundPlant, "scrub">;

interface BladeShape {
    readonly height: number;
    readonly reach: number;
    readonly width: number;
}

const bladeShapes: Record<BladeKind, BladeShape> = {
    grass: { height: 0.48, reach: 0.44, width: 0.054 },
    tussock: { height: 0.34, reach: 0.48, width: 0.041 },
    "dry-grass": { height: 0.63, reach: 0.41, width: 0.034 },
    flowers: { height: 0.69, reach: 0.44, width: 0.054 },
    reeds: { height: 1.31, reach: 0.28, width: 0.033 },
    succulent: { height: 0.37, reach: 0.65, width: 0.13 },
};

function blades(scene: Scene, kind: BladeKind): Mesh {
    const mesh = new Mesh(kind + " blades", scene);
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const { height, reach, width } = bladeShapes[kind];
    for (let i = 0; i < 11; i++) {
        const angle = i * 2.39996;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        const tip = height * (0.69 + (i % 4) * 0.11);
        const bend = reach * (0.67 + (i % 3) * 0.15);
        const base = positions.length / 3;
        positions.push(x * 0.06 - z * width, -0.07, z * 0.06 + x * width,
            x * 0.06 + z * width, -0.07, z * 0.06 - x * width,
            x * bend * 0.48 - z * width * 0.64, tip * 0.65, z * bend * 0.48 + x * width * 0.64,
            x * bend * 0.48 + z * width * 0.64, tip * 0.65, z * bend * 0.48 - x * width * 0.64,
            x * bend, tip, z * bend);
        indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3, base + 2, base + 3, base + 4);
        colors.push(0.56, 0.69, 0.46, 1, 0.56, 0.69, 0.46, 1, 0.76, 0.87, 0.65, 1,
            0.75, 0.86, 0.63, 1, 0.96, 1, 0.83, 1);
    }
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.normals = normals;
    data.colors = colors;
    data.applyToMesh(mesh);
    return mesh;
}

function shrub(scene: Scene): Mesh {
    const lobes = [0, 1, 2, 3].map(i => {
        const lobe = MeshBuilder.CreateIcoSphere("scrub leaf cluster", { radius: 1, subdivisions: 1, flat: true }, scene);
        lobe.position.set(Math.cos(i * 2.4) * 0.34, 0.27 + (i % 2) * 0.11, Math.sin(i * 2.4) * 0.26);
        lobe.scaling.set(0.38 + i * 0.024, 0.31 + i * 0.045, 0.37);
        return lobe;
    });
    return Mesh.MergeMeshes(lobes, true, true)!;
}

function drawFlowers(scene: Scene, positions: readonly Stamp[]): void {
    const flowers = [2, 3, 5, 7, 9].map(i => {
        const flower = MeshBuilder.CreateIcoSphere("flower head", { radius: 0.10, subdivisions: 1, flat: false }, scene);
        const angle = i * 2.39996;
        const bend = 0.44 * (0.67 + (i % 3) * 0.15);
        flower.position.set(Math.cos(angle) * bend, 0.69 * (0.69 + (i % 4) * 0.11), Math.sin(angle) * bend);
        flower.scaling.y = 0.63;
        return flower;
    });
    const bloom = Mesh.MergeMeshes(flowers, true, true)!;
    bloom.material = material(scene, "verge flowers", "#e1b754");
    stamp(bloom, positions);
}

function drawSeedHeads(scene: Scene, positions: readonly Stamp[]): void {
    const heads = [3, 6, 7, 10].map(i => {
        const head = MeshBuilder.CreateIcoSphere("reed seed head", { radius: 0.064, subdivisions: 1, flat: false }, scene);
        const angle = i * 2.39996;
        const bend = 0.28 * (0.67 + (i % 3) * 0.15);
        head.position.set(Math.cos(angle) * bend, 1.31 * (0.69 + (i % 4) * 0.11), Math.sin(angle) * bend);
        head.scaling.y = 2.5;
        return head;
    });
    const reeds = Mesh.MergeMeshes(heads, true, true)!;
    reeds.material = material(scene, "reed heads", "#806847");
    stamp(reeds, positions);
}

function boulder(scene: Scene, round: boolean): Mesh {
    const rock = MeshBuilder.CreateIcoSphere("scattered boulders", { radius: 1, subdivisions: 2, flat: true }, scene);
    const positions = rock.getVerticesData(VertexBuffer.PositionKind)!;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]!;
        const y = positions[i + 1]!;
        const z = positions[i + 2]!;
        const rough = 0.90 + 0.16 * Math.sin(x * 5.8 + y * 3.4) * Math.cos(z * 4.2);
        positions[i] = x * rough + (round ? 0 : y * 0.16);
        positions[i + 1] = (round ? y : Math.min(0.78, y)) * rough;
        positions[i + 2] = z * rough;
    }
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, rock.getIndices()!, normals);
    rock.setVerticesData(VertexBuffer.PositionKind, positions);
    rock.setVerticesData(VertexBuffer.NormalKind, normals);
    return rock;
}
