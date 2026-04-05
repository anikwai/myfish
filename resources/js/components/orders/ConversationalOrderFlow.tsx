import {
  CheckmarkCircle02Icon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

import GuestOrderController from "@/actions/App/Http/Controllers/GuestOrderController";
import OrderController from "@/actions/App/Http/Controllers/OrderController";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { buildOrderPricingPreview } from "@/lib/order-pricing-preview";
import type {
  OrderPricingPreviewDiscount,
  OrderPricingPreviewTax,
} from "@/lib/order-pricing-preview";
import { cn } from "@/lib/utils";

type FishType = { id: number; name: string; price_per_pound: number | null };
type Pricing = {
  price_per_pound: number;
  filleting_fee: number;
  delivery_fee: number;
  kg_to_lbs_rate: number;
};
type AuthenticatedContact = {
  name: string;
  email: string;
  phone: string | null;
};
type Cut = "whole" | "fillet" | "steak";
type FormData = {
  items: { fish_type_id: number; quantity_kg: string; cut: Cut }[];
  filleting: boolean;
  delivery: boolean;
  delivery_location: string;
  note: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
};
type Step = 0 | 1 | 2 | 3;
type OrderingFor = "individual" | "business";

export interface ConversationalOrderFlowProps {
  fishTypes: FishType[];
  pricing: Pricing;
  discount: OrderPricingPreviewDiscount;
  tax: OrderPricingPreviewTax;
  authenticatedContact?: AuthenticatedContact;
}

function StepChip({
  stepName,
  label,
  onEdit,
}: {
  stepName: string;
  label: string;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full animate-in items-center justify-between rounded-lg border bg-muted/50 px-4 py-3 text-sm transition-colors duration-200 fade-in slide-in-from-top-2 hover:bg-muted motion-reduce:animate-none"
    >
      <div className="flex min-w-0 items-center gap-2">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={16}
          className="shrink-0 text-primary"
        />
        <span className="shrink-0 text-muted-foreground">{stepName}:</span>
        <span className="truncate font-medium">{label}</span>
      </div>
      <span className="ml-3 shrink-0 text-xs text-muted-foreground">Edit</span>
    </button>
  );
}

function PricingSummary({
  preview,
}: {
  preview: ReturnType<typeof buildOrderPricingPreview>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Order summary
      </p>
      <div className="space-y-1">
        {preview.fishLines.length > 0 ? (
          preview.fishLines.map((l, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{l.name}</span>
              <span className="font-mono">${l.subtotalSbd.toFixed(2)}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No fish selected</p>
        )}
        {preview.adjustments.map((adj) => (
          <div key={adj.code} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{adj.label}</span>
            <span className="font-mono">+${adj.amountSbd.toFixed(2)}</span>
          </div>
        ))}
        {preview.discountSbd > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400">
              −${preview.discountSbd.toFixed(2)}
            </span>
          </div>
        )}
        {preview.taxSbd > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{preview.taxLabel}</span>
            <span className="font-mono">+${preview.taxSbd.toFixed(2)}</span>
          </div>
        )}
      </div>
      <Separator />
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">Total</span>
        <span className="font-mono text-xl font-bold text-primary">
          ${preview.grandTotalSbd.toFixed(2)}{" "}
          <span className="text-xs font-normal text-muted-foreground">SBD</span>
        </span>
      </div>
      <Separator />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {preview.ratesExplainer}
      </p>
    </div>
  );
}

const STEP_ANNOUNCEMENTS: Record<Step, string> = {
  0: "Step 1 of 4: What would you like to order?",
  1: "Step 2 of 4: Any extras?",
  2: "Step 3 of 4: Contact details",
  3: "Step 4 of 4: Review your order",
};

export function ConversationalOrderFlow({
  fishTypes,
  pricing,
  discount,
  tax,
  authenticatedContact,
}: ConversationalOrderFlowProps) {
  const [activeStep, setActiveStep] = useState<Step>(0);
  const [orderingFor, setOrderingFor] = useState<OrderingFor>("individual");
  const [selectedFishIds, setSelectedFishIds] = useState<number[]>([]);
  const activeCardRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const increment = orderingFor === "individual" ? 0.5 : 1;

  const { data, setData, post, transform, processing, errors } =
    useForm<FormData>({
      items: fishTypes.map((ft) => ({
        fish_type_id: ft.id,
        quantity_kg: "",
        cut: "whole" satisfies Cut,
      })),
      filleting: false,
      delivery: false,
      delivery_location: "",
      note: "",
      guest_name: authenticatedContact?.name ?? "",
      guest_email: authenticatedContact?.email ?? "",
      guest_phone: authenticatedContact?.phone ?? "",
    });

  const isLoggedIn = authenticatedContact !== undefined;

  const pricingPreview = useMemo(
    () =>
      buildOrderPricingPreview({
        fishTypes,
        pricing,
        discount,
        tax,
        items: data.items,
        filleting: data.filleting,
        delivery: data.delivery,
      }),
    [
      fishTypes,
      pricing,
      discount,
      tax,
      data.items,
      data.filleting,
      data.delivery,
    ]
  );

  const grandTotal = pricingPreview.grandTotalSbd;

  const hasItems = data.items.some((item) => parseFloat(item.quantity_kg) > 0);
  const deliveryLocationFilled =
    !data.delivery || data.delivery_location.trim().length > 0;
  const contactFilled =
    isLoggedIn ||
    (data.guest_name.trim().length > 0 &&
      data.guest_email.trim().length > 0 &&
      data.guest_phone.trim().length > 0);
  const canContinue = [hasItems, deliveryLocationFilled, contactFilled, true][
    activeStep
  ];

  function fishChipLabel() {
    return data.items
      .filter((i) => parseFloat(i.quantity_kg) > 0)
      .map((i) => {
        const ft = fishTypes.find((f) => f.id === i.fish_type_id);
        const cutSuffix = i.cut && i.cut !== "whole" ? ` (${i.cut})` : "";

        return `${ft?.name}${cutSuffix} ${i.quantity_kg}kg`;
      })
      .join(" · ");
  }

  function optionsChipLabel() {
    const parts: string[] = [];

    if (data.filleting) {
      parts.push("Filleting");
    }

    if (data.delivery) {
      parts.push(`Delivery to ${data.delivery_location}`);
    }

    return parts.length > 0 ? parts.join(" · ") : "No extras";
  }

  function contactChipLabel() {
    const name = isLoggedIn ? authenticatedContact!.name : data.guest_name;
    const email = isLoggedIn ? authenticatedContact!.email : data.guest_email;

    return `${name} · ${email}`;
  }

  function setCut(index: number, cut: Cut) {
    const updated = [...data.items];
    updated[index] = { ...updated[index], cut };
    setData("items", updated);
  }

  function toggleFish(id: number) {
    const isSelected = selectedFishIds.includes(id);

    if (isSelected) {
      const idx = fishTypes.findIndex((f) => f.id === id);

      if (idx !== -1) {
        const updated = [...data.items];
        updated[idx] = { ...updated[idx], quantity_kg: "" };
        setData("items", updated);
      }

      setSelectedFishIds((prev) => prev.filter((x) => x !== id));
    } else {
      setSelectedFishIds((prev) => [...prev, id]);
    }
  }

  function adjustQuantity(index: number, delta: number) {
    const updated = [...data.items];
    const current = parseFloat(updated[index].quantity_kg) || 0;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    updated[index] = {
      ...updated[index],
      quantity_kg: next > 0 ? next.toString() : "",
    };
    setData("items", updated);
  }

  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = STEP_ANNOUNCEMENTS[activeStep];
    }

    const card = activeCardRef.current;

    if (!card) {
      return;
    }

    card.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const focusable = card.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus({ preventScroll: true });
  }, [activeStep]);

  function goTo(step: Step) {
    setActiveStep(step);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    transform((d) => ({
      ...d,
      items: d.items.filter((item) => parseFloat(item.quantity_kg) > 0),
    }));

    if (isLoggedIn) {
      post(OrderController.store.url());
    } else {
      post(GuestOrderController.store.url());
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* aria-live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
        {/* Conversational flow column */}
        <div className="space-y-3 pb-24 lg:pb-0">
          {activeStep > 0 && (
            <StepChip
              stepName="Fish"
              label={fishChipLabel()}
              onEdit={() => goTo(0)}
            />
          )}
          {activeStep > 1 && (
            <StepChip
              stepName="Options"
              label={optionsChipLabel()}
              onEdit={() => goTo(1)}
            />
          )}
          {activeStep > 2 && (
            <StepChip
              stepName="Contact"
              label={contactChipLabel()}
              onEdit={() => goTo(2)}
            />
          )}

          <Card
            key={activeStep}
            ref={activeCardRef}
            className="animate-in duration-200 fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
          >
            <CardContent className="pt-6">
              {/* Mobile back link */}
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={() => goTo((activeStep - 1) as Step)}
                  className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
                >
                  ← Back
                </button>
              )}

              {/* Step 0: Fish selection */}
              {activeStep === 0 && (
                <div className="space-y-5">
                  {/* Ordering for selector */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Ordering for
                    </p>
                    <div className="flex gap-2">
                      {(
                        [
                          {
                            value: "individual",
                            label: "Individual",
                          },
                          {
                            value: "business",
                            label: "Business",
                          },
                        ] as {
                          value: OrderingFor;
                          label: string;
                        }[]
                      ).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setOrderingFor(value)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                            orderingFor === value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Fish chip selector */}
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-base font-semibold">
                        What would you like to order?
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Select the fish you'd like, then set quantities.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fishTypes.map((ft) => {
                        const selected = selectedFishIds.includes(ft.id);

                        return (
                          <button
                            key={ft.id}
                            type="button"
                            onClick={() => toggleFish(ft.id)}
                            className={cn(
                              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:bg-muted"
                            )}
                          >
                            {ft.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity panel — only for selected fish */}
                  {selectedFishIds.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Quantities
                      </p>
                      {selectedFishIds.map((id) => {
                        const ft = fishTypes.find((f) => f.id === id);
                        const idx = fishTypes.findIndex((f) => f.id === id);
                        const qty =
                          parseFloat(data.items[idx]?.quantity_kg) || 0;
                        const cut = data.items[idx]?.cut ?? "whole";

                        return (
                          <div
                            key={id}
                            className="space-y-3 rounded-lg border px-4 py-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{ft?.name}</span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  disabled={qty <= 0}
                                  onClick={() =>
                                    adjustQuantity(idx, -increment)
                                  }
                                  className="flex size-12 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                                  aria-label={`Decrease ${ft?.name} by ${increment} kg`}
                                >
                                  <HugeiconsIcon
                                    icon={MinusSignIcon}
                                    size={14}
                                  />
                                </button>
                                <span className="w-14 text-center text-sm font-medium tabular-nums">
                                  {qty > 0 ? `${qty} kg` : "—"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => adjustQuantity(idx, increment)}
                                  className="flex size-12 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
                                  aria-label={`Increase ${ft?.name} by ${increment} kg`}
                                >
                                  <HugeiconsIcon
                                    icon={PlusSignIcon}
                                    size={14}
                                  />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Cut:
                              </span>
                              {(["whole", "fillet", "steak"] as Cut[]).map(
                                (option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => setCut(idx, option)}
                                    className={cn(
                                      "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-colors",
                                      cut === option
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                                    )}
                                  >
                                    {option}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {errors.items && (
                    <p className="text-sm text-destructive">{errors.items}</p>
                  )}
                </div>
              )}

              {/* Step 1: Options */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold">Any extras?</h2>
                    <p className="text-sm text-muted-foreground">
                      Optional filleting and delivery.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="filleting"
                        checked={data.filleting}
                        onCheckedChange={(v) =>
                          setData("filleting", v === true)
                        }
                      />
                      <div>
                        <Label htmlFor="filleting" className="cursor-pointer">
                          Filleting
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          +$
                          {pricing.filleting_fee.toFixed(2)} SBD
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="delivery"
                        checked={data.delivery}
                        onCheckedChange={(v) => setData("delivery", v === true)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="delivery" className="cursor-pointer">
                          Delivery
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          +$
                          {pricing.delivery_fee.toFixed(2)} SBD
                        </p>
                        {data.delivery && (
                          <div className="mt-3 space-y-1.5">
                            <Label
                              htmlFor="delivery_location"
                              className="text-sm"
                            >
                              Delivery location
                            </Label>
                            <Input
                              id="delivery_location"
                              className="text-base"
                              placeholder="e.g. Near the market, Honiara"
                              value={data.delivery_location}
                              onChange={(e) =>
                                setData("delivery_location", e.target.value)
                              }
                              autoFocus
                            />
                            <InputError message={errors.delivery_location} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note">
                      Special instructions{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      id="note"
                      className="text-base"
                      value={data.note}
                      onChange={(e) => setData("note", e.target.value)}
                      placeholder="e.g. Please call before delivery"
                      maxLength={1000}
                      rows={3}
                    />
                    <InputError message={errors.note} />
                  </div>
                </div>
              )}

              {/* Step 2: Contact */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold">Contact details</h2>
                    <p className="text-sm text-muted-foreground">
                      {isLoggedIn
                        ? "Your order will be placed under your account."
                        : "We'll use these to confirm your order."}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="guest_name">
                        {orderingFor === "business" ? "Business name" : "Name"}
                      </Label>
                      <Input
                        id="guest_name"
                        value={data.guest_name}
                        readOnly={isLoggedIn}
                        className={cn(
                          "text-base",
                          isLoggedIn ? "bg-muted" : ""
                        )}
                        onChange={(e) => setData("guest_name", e.target.value)}
                        placeholder={
                          orderingFor === "business"
                            ? "e.g. Pacific Trading Co."
                            : "Your name"
                        }
                        autoFocus={!isLoggedIn}
                      />
                      <InputError message={errors.guest_name} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="guest_email">
                        {orderingFor === "business" ? "Contact email" : "Email"}
                      </Label>
                      <Input
                        id="guest_email"
                        type="email"
                        value={data.guest_email}
                        readOnly={isLoggedIn}
                        className={cn(
                          "text-base",
                          isLoggedIn ? "bg-muted" : ""
                        )}
                        onChange={(e) => setData("guest_email", e.target.value)}
                        placeholder="your@email.com"
                      />
                      <InputError message={errors.guest_email} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="guest_phone">
                        {orderingFor === "business" ? "Contact phone" : "Phone"}
                      </Label>
                      <Input
                        id="guest_phone"
                        type="tel"
                        value={data.guest_phone}
                        readOnly={isLoggedIn}
                        className={cn(
                          "text-base",
                          isLoggedIn ? "bg-muted" : ""
                        )}
                        onChange={(e) => setData("guest_phone", e.target.value)}
                        placeholder="+677 12345"
                      />
                      <InputError message={errors.guest_phone} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold">
                      Review your order
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Check everything before placing.
                    </p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Fish
                      </p>
                      {data.items
                        .filter((i) => parseFloat(i.quantity_kg) > 0)
                        .map((item) => {
                          const ft = fishTypes.find(
                            (f) => f.id === item.fish_type_id
                          );

                          return (
                            <div
                              key={item.fish_type_id}
                              className="flex justify-between"
                            >
                              <span>
                                {ft?.name}
                                {item.cut && item.cut !== "whole" && (
                                  <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                                    ({item.cut})
                                  </span>
                                )}
                              </span>
                              <span className="font-mono">
                                {item.quantity_kg} kg
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Filleting</span>
                        <span>{data.filleting ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span>
                          {data.delivery ? data.delivery_location : "No"}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span>{data.guest_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span>{data.guest_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span>{data.guest_phone || "—"}</span>
                      </div>
                    </div>
                    {data.note && (
                      <>
                        <Separator />
                        <div>
                          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Special instructions
                          </p>
                          <p>{data.note}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation — desktop only */}
              <div className="mt-6 hidden items-center justify-between lg:flex">
                {activeStep > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goTo((activeStep - 1) as Step)}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                {activeStep < 3 ? (
                  <Button
                    type="button"
                    disabled={!canContinue}
                    onClick={() => goTo((activeStep + 1) as Step)}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" disabled={processing}>
                    Place order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mobile inline pricing summary — always visible, hidden on desktop where sidebar takes over */}
          <div className="lg:hidden">
            <Card>
              <CardContent className="pt-5">
                <PricingSummary preview={pricingPreview} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Desktop pricing panel */}
        <div className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <Card>
              <CardContent className="pt-6">
                <PricingSummary preview={pricingPreview} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA bar */}
      <div
        className="fixed right-0 bottom-0 left-0 z-40 border-t bg-background/95 px-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="truncate font-bold">
              ${grandTotal.toFixed(2)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                SBD
              </span>
            </p>
          </div>
          {activeStep < 3 ? (
            <Button
              type="button"
              disabled={!canContinue}
              onClick={() => goTo((activeStep + 1) as Step)}
              className="shrink-0"
            >
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={processing} className="shrink-0">
              Place order
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
