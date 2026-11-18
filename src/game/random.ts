export function seededRandom(seed: number): () => number {
    return () => {
        seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
        return seed / 4_294_967_296;
    };
}
