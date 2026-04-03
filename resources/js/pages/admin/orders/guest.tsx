import { Head, useForm } from "@inertiajs/react";
import { useMemo } from "react";
import AdminOrderController from "@/actions/App/Http/Controllers/Admin/OrderController";
import Heading from "@/components/heading";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildOrderPricingPreview } from "@/lib/order-pricing-preview";
import {
  effectivePricePerPound,
  kgToLbs,
  lineFishSubtotalSbd,
} from "@/lib/pricing";
import { index } from "@/routes/admin/orders";

type FishType = { id: number; name: string; price_per_pound: number | null };
type Pricing = {
  price_per_pound: number;
  filleting_fee: number;
  delivery_fee: number;
  kg_to_lbs_rate: number;
};

type Discount = {
  mode: "off" | "fixed" | "percent";
  fixed_sbd: number;
  percent: number;
  max_sbd: number | null;
  min_order_sbd: number | null;
};

type Tax = {
  mode: "off" | "percent";
  percent: number;
  label: string;
};

type FormData = {
  guest_name: string;
  guest_phone: string;
  items: { fish_type_id: number; quantity_kg: string }[];
  filleting: boolean;
  delivery: boolean;
  delivery_location: string;
  note: string;
};

export default function GuestOrder({
  fishTypes,
  pricing,
  discount,
  tax,
}: {
  fishTypes: FishType[];
  pricing: Pricing;
  discount: Discount;
  tax: Tax;
}) {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    guest_name: "",
    guest_phone: "",
    items: fishTypes.map((ft) => ({
      fish_type_id: ft.id,
      quantity_kg: "",
    })),
    filleting: false,
    delivery: false,
    delivery_location: "",
    note: "",
  });

  const preview = useMemo(
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

  const hasItems = data.items.some((item) => parseFloat(item.quantity_kg) > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post(AdminOrderController.storeGuest.url());
  }

  return (
    <>
      <Head title="New guest order" />

      <div className="space-y-6">
        <Heading
          title="New guest order"
          description="For walk-in customers without an account."
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="guest_name">Customer name</Label>
              <Input
                id="guest_name"
                value={data.guest_name}
                onChange={(e) => setData("guest_name", e.target.value)}
                placeholder="Full name"
                required
              />
              <InputError message={errors.guest_name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest_phone">Phone number</Label>
              <Input
                id="guest_phone"
                value={data.guest_phone}
                onChange={(e) => setData("guest_phone", e.target.value)}
                placeholder="+677 ..."
                required
              />
              <InputError message={errors.guest_phone} />
            </div>
          </div>

          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Fish type</th>
                  <th className="px-4 py-2 text-right font-medium">
                    Quantity (kg)
                  </th>
                  <th className="px-4 py-2 text-right font-medium">Pounds</th>
                  <th className="px-4 py-2 text-right font-medium">
                    Subtotal (SBD)
                  </th>
                </tr>
              </thead>
              <tbody>
                {fishTypes.map((ft, i) => {
                  const kg = parseFloat(data.items[i]?.quantity_kg) || 0;
                  const lbs = kgToLbs(kg, pricing.kg_to_lbs_rate);
                  const rate = effectivePricePerPound(
                    ft.price_per_pound,
                    pricing.price_per_pound
                  );
                  const sub = lineFishSubtotalSbd(
                    kg,
                    pricing.kg_to_lbs_rate,
                    rate
                  );

                  return (
                    <tr key={ft.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{ft.name}</td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          className="w-28 text-right"
                          value={data.items[i]?.quantity_kg}
                          onChange={(e) => {
                            const updated = [...data.items];
                            updated[i] = {
                              ...updated[i],
                              quantity_kg: e.target.value,
                            };
                            setData("items", updated);
                          }}
                        />
                        <InputError
                          message={
                            errors[
                              `items.${i}.quantity_kg` as keyof typeof errors
                            ]
                          }
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                        {lbs > 0 ? lbs.toFixed(3) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {sub > 0 ? sub.toFixed(2) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="filleting"
                checked={data.filleting}
                onCheckedChange={(v) => setData("filleting", v === true)}
              />
              <Label htmlFor="filleting">
                Filleting (+${pricing.filleting_fee.toFixed(2)} SBD)
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="delivery"
                checked={data.delivery}
                onCheckedChange={(v) => setData("delivery", v === true)}
              />
              <Label htmlFor="delivery">
                Delivery (+${pricing.delivery_fee.toFixed(2)} SBD)
              </Label>
            </div>
            {data.delivery && (
              <div className="ml-7 grid gap-2">
                <Label htmlFor="delivery_location">Delivery location</Label>
                <Input
                  id="delivery_location"
                  value={data.delivery_location}
                  onChange={(e) => setData("delivery_location", e.target.value)}
                  placeholder="e.g. Near the market"
                  required
                />
                <InputError message={errors.delivery_location} />
              </div>
            )}
          </div>

          <div className="space-y-1 rounded-lg border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fish subtotal</span>
              <span className="font-mono">
                ${preview.fishSubtotalSbd.toFixed(2)} SBD
              </span>
            </div>
            {preview.adjustments.map((adj) => (
              <div key={adj.code} className="flex justify-between">
                <span className="text-muted-foreground">{adj.label}</span>
                <span className="font-mono">
                  +${adj.amountSbd.toFixed(2)} SBD
                </span>
              </div>
            ))}
            {preview.discountSbd > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  −${preview.discountSbd.toFixed(2)} SBD
                </span>
              </div>
            )}
            {preview.taxSbd > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {preview.taxLabel}
                </span>
                <span className="font-mono">
                  +${preview.taxSbd.toFixed(2)} SBD
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span className="font-mono">
                ${preview.grandTotalSbd.toFixed(2)} SBD
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">
              Special instructions{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="note"
              value={data.note}
              onChange={(e) => setData("note", e.target.value)}
              placeholder="e.g. Customer requested delivery after 5pm"
              maxLength={1000}
              rows={3}
            />
            <InputError message={errors.note} />
          </div>

          <Button type="submit" disabled={processing || !hasItems}>
            Place guest order
          </Button>
        </form>
      </div>
    </>
  );
}

GuestOrder.layout = {
  breadcrumbs: [
    { title: "Orders", href: index() },
    { title: "New guest order", href: "/admin/orders/guest" },
  ],
};
