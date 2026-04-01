import { Head, useForm } from '@inertiajs/react';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { create, index } from '@/routes/orders';

const KG_TO_LBS = 2.20462;

type FishType = { id: number; name: string };
type Pricing = {
    price_per_pound: number;
    filleting_fee: number;
    delivery_fee: number;
};

type FormData = {
    items: { fish_type_id: number; quantity_kg: string }[];
    filleting: boolean;
    delivery: boolean;
    delivery_location: string;
};

export default function CreateOrder({
    fishTypes,
    pricing,
}: {
    fishTypes: FishType[];
    pricing: Pricing;
}) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        items: fishTypes.map((ft) => ({
            fish_type_id: ft.id,
            quantity_kg: '',
        })),
        filleting: false,
        delivery: false,
        delivery_location: '',
    });

    const totalPounds = data.items.reduce((sum, item) => {
        const kg = parseFloat(item.quantity_kg) || 0;
        return sum + kg * KG_TO_LBS;
    }, 0);

    const subtotal = totalPounds * pricing.price_per_pound;
    const filletingCharge = data.filleting ? pricing.filleting_fee : 0;
    const deliveryCharge = data.delivery ? pricing.delivery_fee : 0;
    const grandTotal = subtotal + filletingCharge + deliveryCharge;

    const hasItems = data.items.some(
        (item) => parseFloat(item.quantity_kg) > 0,
    );

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(OrderController.store.url());
    }

    return (
        <>
            <Head title="Place order" />

            <div className="space-y-6">
                <Heading
                    title="Place an order"
                    description="Enter the quantity in kilograms for each fish type you want."
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">
                                        Fish type
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        Quantity (kg)
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        Pounds
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        Subtotal (SBD)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {fishTypes.map((ft, i) => {
                                    const kg =
                                        parseFloat(
                                            data.items[i]?.quantity_kg,
                                        ) || 0;
                                    const lbs = kg * KG_TO_LBS;
                                    const sub =
                                        lbs * pricing.price_per_pound;
                                    return (
                                        <tr
                                            key={ft.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-2">
                                                {ft.name}
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    min="0"
                                                    className="w-28 text-right"
                                                    value={
                                                        data.items[i]
                                                            ?.quantity_kg
                                                    }
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...data.items,
                                                        ];
                                                        updated[i] = {
                                                            ...updated[i],
                                                            quantity_kg:
                                                                e.target.value,
                                                        };
                                                        setData(
                                                            'items',
                                                            updated,
                                                        );
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
                                                {lbs > 0
                                                    ? lbs.toFixed(3)
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono">
                                                {sub > 0
                                                    ? sub.toFixed(2)
                                                    : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <input
                                id="filleting"
                                type="checkbox"
                                checked={data.filleting}
                                onChange={(e) =>
                                    setData('filleting', e.target.checked)
                                }
                                className="h-4 w-4"
                            />
                            <Label htmlFor="filleting">
                                Filleting (+$
                                {pricing.filleting_fee.toFixed(2)} SBD)
                            </Label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                id="delivery"
                                type="checkbox"
                                checked={data.delivery}
                                onChange={(e) =>
                                    setData('delivery', e.target.checked)
                                }
                                className="h-4 w-4"
                            />
                            <Label htmlFor="delivery">
                                Delivery (+$
                                {pricing.delivery_fee.toFixed(2)} SBD)
                            </Label>
                        </div>

                        {data.delivery && (
                            <div className="ml-7 grid gap-2">
                                <Label htmlFor="delivery_location">
                                    Delivery location
                                </Label>
                                <Input
                                    id="delivery_location"
                                    name="delivery_location"
                                    placeholder="e.g. Near the market, Honiara"
                                    value={data.delivery_location}
                                    onChange={(e) =>
                                        setData(
                                            'delivery_location',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.delivery_location}
                                />
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border p-4 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Fish subtotal
                            </span>
                            <span className="font-mono">
                                ${subtotal.toFixed(2)} SBD
                            </span>
                        </div>
                        {data.filleting && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Filleting
                                </span>
                                <span className="font-mono">
                                    +${filletingCharge.toFixed(2)} SBD
                                </span>
                            </div>
                        )}
                        {data.delivery && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Delivery
                                </span>
                                <span className="font-mono">
                                    +${deliveryCharge.toFixed(2)} SBD
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t pt-1 font-semibold">
                            <span>Total</span>
                            <span className="font-mono">
                                ${grandTotal.toFixed(2)} SBD
                            </span>
                        </div>
                    </div>

                    <Button type="submit" disabled={processing || !hasItems}>
                        Place order
                    </Button>
                </form>
            </div>
        </>
    );
}

CreateOrder.layout = {
    breadcrumbs: [
        { title: 'My orders', href: index() },
        { title: 'Place order', href: create() },
    ],
};
