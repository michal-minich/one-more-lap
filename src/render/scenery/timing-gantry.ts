import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { pointOnRoute, ROAD_HALF } from "../../game/course/route.ts";
import type { CircuitLine } from "../../game/course/circuit-line.ts";
import { strip } from "../../game/course/surface.ts";
import { material } from "../materials.ts";

export function drawTimingGantry(
    scene: Scene, line: CircuitLine, steel: StandardMaterial, darkSteel: StandardMaterial, white: StandardMaterial,
): void {
    const row = line.startLine;
    const finish = MeshBuilder.CreateBox("timing gantry", { width: 15.7, height: 1.16, depth: 0.65 }, scene);
    finish.position.set(row.x, row.y + 5.5, row.z);
    finish.rotation.y = Math.atan2(row.dx, row.dz);
    finish.material = darkSteel;
    timingBanner(scene, finish);
    for (const side of [-1, 1]) {
        const p = pointOnRoute(row, side * 7.72);
        const leg = MeshBuilder.CreateBox("gantry legs", { width: 0.25, height: 5.5, depth: 0.24 }, scene);
        leg.position.set(p.x, p.y + 2.65, p.z);
        leg.material = steel;
    }
    const sections = 20;
    const width = (ROAD_HALF - 0.45) * 2;
    const cellSize = width / sections;
    const cells = strip([-cellSize, 0, cellSize].map(offset => line.at(row.distance + offset)),
        Array.from({ length: sections + 1 }, (_, i) => i * cellSize - width / 2), () => 0.057);
    const colors: number[] = [];
    const geometry = new Mesh("timing line", scene);
    const faces: number[] = [];
    const vertices: number[] = [];
    for (const [i, index] of cells.indices.entries()) {
        const corner = index * 3;
        vertices.push(cells.positions[corner]!, cells.positions[corner + 1]!, cells.positions[corner + 2]!);
        const cell = Math.floor(i / 6);
        const value = (cell + Math.floor(cell / sections)) % 2 ? 0.11 : 0.92;
        colors.push(value, value, value, 1);
        faces.push(i);
    }
    const data = new VertexData();
    data.positions = vertices;
    data.indices = faces;
    data.colors = colors;
    data.normals = vertices.map((_, i) => i % 3 === 1 ? 1 : 0);
    data.applyToMesh(geometry);
    geometry.material = white;
}

function timingBanner(scene: Scene, beam: Mesh): void {
    const squares = 30;
    const texture = new DynamicTexture("checkered starting banner", { width: 240, height: 16 }, scene, true);
    const ctx = texture.getContext();
    for (let i = 0; i < squares; i++) {
        for (let row = 0; row < 2; row++) {
            ctx.fillStyle = (i + row) % 2 === 0 ? "#f7f5e9" : "#101315";
            ctx.fillRect(i * 8, row * 8, 8, 8);
        }
    }
    texture.update();
    const paint = material(scene, "start gantry squares", "#ffffff");
    paint.diffuseTexture = texture;
    paint.emissiveColor.set(0.13, 0.13, 0.13);
    paint.specularColor.set(0, 0, 0);
    for (const side of [-1, 1]) {
        const face = MeshBuilder.CreatePlane("start banner checkerboard", { width: 15.36, height: 1.024 }, scene);
        face.parent = beam;
        face.position.z = side * 0.331;
        face.rotation.y = side < 0 ? 0 : Math.PI;
        face.material = paint;
        face.isPickable = false;
    }
}
