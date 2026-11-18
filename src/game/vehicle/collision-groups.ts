const PLAYER = 1;
const RIVAL = 2;
const ALL = 0xffff;

export const rivalCollisionGroups = (RIVAL << 16) | ALL;

export function playerCollisionGroups(solid: boolean): number {
    return (PLAYER << 16) | (solid ? ALL : ALL & ~RIVAL);
}
