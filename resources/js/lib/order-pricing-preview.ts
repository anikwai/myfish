import { effectivePricePerPound, lineFishSubtotalSbd } from "@/lib/pricing";

export type OrderPricingPreviewSheet = {
  price_per_pound: number;
  filleting_fee: number;
  delivery_fee: number;
  kg_to_lbs_rate: number;
};

export type OrderPricingPreviewFishType = {
  id: number;
  name: string;
  price_per_pound: number | null;
};

export type OrderPricingPreviewDiscount = {
  mode: "off" | "fixed" | "percent";
  fixed_sbd: number;
  percent: number;
  max_sbd: number | null;
  min_order_sbd: number | null;
};

export type OrderPricingPreviewTax = {
  mode: "off" | "percent";
  percent: number;
  /** Customer-facing line label when tax applies (matches server / admin setting). */
  label: string;
};

export type OrderPricingPreviewLineInput = {
  fish_type_id: number;
  quantity_kg: string;
  /** When set and not `whole`, appended to the line label (matches order review UI). */
  cut?: string | null;
};

export type OrderPricingPreviewInput = {
  fishTypes: OrderPricingPreviewFishType[];
  pricing: OrderPricingPreviewSheet;
  discount: OrderPricingPreviewDiscount;
  tax: OrderPricingPreviewTax;
  items: OrderPricingPreviewLineInput[];
  filleting: boolean;
  delivery: boolean;
};

export type OrderPricingPreviewFishLine = {
  name: string;
  subtotalSbd: number;
};

export type OrderPricingPreviewAdjustment = {
  code: "filleting" | "delivery";
  label: string;
  amountSbd: number;
};

export type OrderPricingPreviewResult = {
  fishLines: OrderPricingPreviewFishLine[];
  /** Rounded fish-only subtotal (matches server: round sum of line subtotals, 2dp). */
  fishSubtotalSbd: number;
  adjustments: OrderPricingPreviewAdjustment[];
  /** Amount deducted after fish + fees (matches server discount phase). */
  discountSbd: number;
  /** Exclusive tax on subtotal after discount (matches server tax phase). */
  taxSbd: number;
  /** Label for the tax line in summaries (from admin tax label). */
  taxLabel: string;
  grandTotalSbd: number;
  /**
   * Short copy for informational footer: list tariffs vs what is already charged above.
   */
  ratesExplainer: string;
};

const DEFAULT_DISCOUNT: OrderPricingPreviewDiscount = {
  mode: "off",
  fixed_sbd: 0,
  percent: 0,
  max_sbd: null,
  min_order_sbd: null,
};

const DEFAULT_TAX: OrderPricingPreviewTax = {
  mode: "off",
  percent: 0,
  label: "Tax",
};

/** Mirrors {@see \App\Values\DiscountConfig::amountOff} for checkout preview. */
export function computeDiscountSbd(
  orderSubtotalBeforeDiscount: number,
  discount: OrderPricingPreviewDiscount
): number {
  if (discount.mode === "off") {
    return 0;
  }

  const base = Math.round(orderSubtotalBeforeDiscount * 100) / 100;

  if (
    discount.min_order_sbd != null &&
    base < Math.round(discount.min_order_sbd * 100) / 100
  ) {
    return 0;
  }

  let raw = 0;

  if (discount.mode === "fixed") {
    raw = Math.min(discount.fixed_sbd, base);
  } else if (discount.mode === "percent") {
    raw = Math.round(base * (discount.percent / 100) * 100) / 100;
  }

  if (discount.max_sbd != null) {
    raw = Math.min(raw, discount.max_sbd);
  }

  raw = Math.min(raw, base);

  return Math.round(Math.max(0, raw) * 100) / 100;
}

/** Mirrors {@see \App\Values\TaxConfig::amountOn} for checkout preview (exclusive tax). */
export function computeTaxSbd(
  taxableExclusiveSubtotal: number,
  tax: OrderPricingPreviewTax
): number {
  if (tax.mode === "off") {
    return 0;
  }

  const base = Math.round(taxableExclusiveSubtotal * 100) / 100;

  return Math.round(base * (tax.percent / 100) * 100) / 100;
}

function runCoreLinesPhase(
  input: OrderPricingPreviewInput
): OrderPricingPreviewFishLine[] {
  return input.items
    .filter((item) => parseFloat(item.quantity_kg) > 0)
    .map((item) => {
      const ft = input.fishTypes.find((f) => f.id === item.fish_type_id);
      const kg = parseFloat(item.quantity_kg);
      const rate = effectivePricePerPound(
        ft?.price_per_pound,
        input.pricing.price_per_pound
      );
      const subtotalSbd = lineFishSubtotalSbd(
        kg,
        input.pricing.kg_to_lbs_rate,
        rate
      );

      const cut = item.cut?.trim().toLowerCase();
      const cutSuffix = cut && cut !== "whole" ? ` (${cut})` : "";

      return {
        name: `${ft?.name ?? "—"}${cutSuffix}`,
        subtotalSbd,
      };
    });
}

function runFeeAdjustmentsPhase(
  input: OrderPricingPreviewInput
): OrderPricingPreviewAdjustment[] {
  const out: OrderPricingPreviewAdjustment[] = [];

  if (input.filleting) {
    out.push({
      code: "filleting",
      label: "Filleting",
      amountSbd: input.pricing.filleting_fee,
    });
  }

  if (input.delivery) {
    out.push({
      code: "delivery",
      label: "Delivery",
      amountSbd: input.pricing.delivery_fee,
    });
  }

  return out;
}

function runFinalizePhase(
  fishLines: OrderPricingPreviewFishLine[],
  adjustments: OrderPricingPreviewAdjustment[],
  discount: OrderPricingPreviewDiscount,
  tax: OrderPricingPreviewTax
): {
  fishSubtotalSbd: number;
  discountSbd: number;
  taxSbd: number;
  grandTotalSbd: number;
} {
  const fishRaw = fishLines.reduce((s, l) => s + l.subtotalSbd, 0);
  const fishSubtotalSbd = Math.round(fishRaw * 100) / 100;
  const adjSum = adjustments.reduce((s, a) => s + a.amountSbd, 0);
  const subtotalBeforeDiscountSbd =
    Math.round((fishSubtotalSbd + adjSum) * 100) / 100;
  const discountSbd = computeDiscountSbd(subtotalBeforeDiscountSbd, discount);
  const afterDiscountSbd =
    Math.round((subtotalBeforeDiscountSbd - discountSbd) * 100) / 100;
  const taxSbd = computeTaxSbd(afterDiscountSbd, tax);
  const grandTotalSbd = Math.round((afterDiscountSbd + taxSbd) * 100) / 100;

  return { fishSubtotalSbd, discountSbd, taxSbd, grandTotalSbd };
}

/** Client-side preview using the same phase order as the server `OrderPricingPipeline`. */
export function buildOrderPricingPreview(
  input: OrderPricingPreviewInput
): OrderPricingPreviewResult {
  const discount = input.discount ?? DEFAULT_DISCOUNT;
  const tax: OrderPricingPreviewTax = { ...DEFAULT_TAX, ...input.tax };
  const taxLabel = tax.label.trim() || "Tax";
  const fishLines = runCoreLinesPhase(input);
  const adjustments = runFeeAdjustmentsPhase(input);
  const { fishSubtotalSbd, discountSbd, taxSbd, grandTotalSbd } =
    runFinalizePhase(fishLines, adjustments, discount, tax);

  const ratesExplainer =
    `Standard rates (for reference): default $${input.pricing.price_per_pound.toFixed(2)}/lb; ` +
    `filleting $${input.pricing.filleting_fee.toFixed(2)}; delivery $${input.pricing.delivery_fee.toFixed(2)}. ` +
    `Amounts above reflect your selections, species pricing, discount rules, and tax settings.`;

  return {
    fishLines,
    fishSubtotalSbd,
    adjustments,
    discountSbd,
    taxSbd,
    taxLabel,
    grandTotalSbd,
    ratesExplainer,
  };
}
