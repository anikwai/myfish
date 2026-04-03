export function effectivePricePerPound(
    speciesPricePerPound: number | null | undefined,
    globalPricePerPound: number,
): number {
    return speciesPricePerPound ?? globalPricePerPound;
}

/**
 * Match {@see OrderCreator}: pounds rounded to 3dp, then subtotal to 2dp.
 */
export function lineFishSubtotalSbd(quantityKg: number, kgToLbsRate: number, pricePerPound: number): number {
    const pounds = Math.round(quantityKg * kgToLbsRate * 1000) / 1000;

    return Math.round(pounds * pricePerPound * 100) / 100;
}
