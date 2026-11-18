import type { Course } from "./course.ts";

const foundations = [[-4.13, -3.62], [-4.13, 3.62], [4.13, -3.62], [4.13, 3.62],
    [15.2, -10.1], [15.2, -2.9], [15.2, 4.3], [15.2, 11.5]] as const;

export function auroraGarden(course: Course) {
    const row = course.at(428);
    const scale = 2.3;
    const yaw = Math.atan2(row.dx, row.dz);
    const elevation = row.y - 0.85;
    const feet = foundations.map(([x, z], index) => {
        const rail = index >= 4;
        const at = { x: row.x + (x * row.dz + z * row.dx) * scale,
            z: row.z + (-x * row.dx + z * row.dz) * scale };
        const width = (rail ? 2.96 : 2.05) * scale;
        const depth = (rail ? 1.76 : 1.70) * scale;
        const bottom = (course.ground.at(at.x, at.z) ?? elevation) - 0.65;
        const top = elevation + (rail ? 0.60 : 0.48) * scale;
        const postTop = elevation + (rail ? 6.45 : 2.85) * scale;
        return { ...at, width, depth, bottom, top, postTop };
    });
    return { row, elevation, yaw, scale, feet };
}
