import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Course } from "../../../game/course/course.ts";
import type { Point } from "../../../game/point.ts";
import { pointOnRoute } from "../../../game/course/route.ts";
import { channelPoint } from "../../../game/course/water.ts";

export function galleryLightSources(course: Course): readonly Point[] {
    return [108, 126, 153, 175, 194].map(distance =>
        pointOnRoute(course.at(distance), -12.2, 1.25));
}

export function channelLightSources(course: Course): readonly Point[] {
    const lava = course.water.find(body => body.kind === "lava")!;
    return [-0.78, -0.65, -0.52, -0.39, -0.26, -0.13, 0, 0.13].map(along => {
        const point = channelPoint(lava, along, 0);
        return { ...point, y: point.y + 1.6 };
    });
}

// Store directional lava bounce in the stone's vertex colors so the scene needs only one moving light.
export function tintLavaFaces(mesh: Mesh, sources: readonly Point[], strength: number): void {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
    const normals = mesh.getVerticesData(VertexBuffer.NormalKind)!;
    const colors = new Float32Array(positions.length / 3 * 4);
    for (let vertex = 0; vertex < positions.length / 3; vertex++) {
        const i = vertex * 3;
        const x = positions[i]!;
        const y = positions[i + 1]!;
        const z = positions[i + 2]!;
        let bounce = 0;
        for (const source of sources) {
            const dx = source.x - x;
            const dy = source.y - y;
            const dz = source.z - z;
            const distance = Math.hypot(dx, dy, dz);
            const facing = Math.max(0, (dx * normals[i]! + dy * normals[i + 1]! + dz * normals[i + 2]!)
                / Math.max(0.1, distance));
            const reach = Math.max(0, 1 - distance / 29);
            bounce += facing * reach ** 2;
        }
        const rock = 0.92 + 0.05 * Math.sin(y * 0.78 + Math.sin(x * 0.19)) + 0.03 * Math.cos(z * 0.47);
        const glow = Math.min(1, bounce * strength);
        colors.set([rock * (0.72 + 1.75 * glow), rock * (0.81 + 0.55 * glow),
            rock * (0.93 - 0.53 * glow), 1], vertex * 4);
    }
    mesh.setVerticesData(VertexBuffer.ColorKind, colors);
}
