export function kgToLbs(kg: number, rate: number): number {
    return kg * rate;
}

export function lbsToKg(lbs: number, rate: number): number {
    return lbs / rate;
}

export function effectivePricePerPound(
    speciesPricePerPound: number | null | undefined,
    globalPricePerPound: number,
): number {
    return speciesPricePerPound ?? globalPricePerPound;
}

/**
 * Match {@see OrderCreator}: pounds rounded to 3dp, then subtotal to 2dp.
 */
export function lineFishSubtotalSbd(
    quantityKg: number,
    kgToLbsRate: number,
    pricePerPound: number,
): number {
    const pounds = Math.round(kgToLbs(quantityKg, kgToLbsRate) * 1000) / 1000;

    return Math.round(pounds * pricePerPound * 100) / 100;
}
