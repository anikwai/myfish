import { useForm } from '@inertiajs/react';
import { CheckCircle2, Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import GuestOrderController from '@/actions/App/Http/Controllers/GuestOrderController';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const KG_TO_LBS = 2.20462;

type FishType = { id: number; name: string };
type Pricing = {
    price_per_pound: number;
    filleting_fee: number;
    delivery_fee: number;
};
type AuthenticatedContact = {
    name: string;
    email: string;
    phone: string | null;
};
type FormData = {
    items: { fish_type_id: number; quantity_kg: string }[];
    filleting: boolean;
    delivery: boolean;
    delivery_location: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
};
type Step = 0 | 1 | 2 | 3;

export interface ConversationalOrderFlowProps {
    fishTypes: FishType[];
    pricing: Pricing;
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
            className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-4 py-3 text-sm transition-colors hover:bg-muted"
        >
            <div className="flex min-w-0 items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="shrink-0 text-muted-foreground">{stepName}:</span>
                <span className="truncate font-medium">{label}</span>
            </div>
            <span className="ml-3 shrink-0 text-xs text-muted-foreground">Edit</span>
        </button>
    );
}

function PricingSummary({
    fishTypes,
    data,
    pricing,
}: {
    fishTypes: FishType[];
    data: FormData;
    pricing: Pricing;
}) {
    const lines = data.items
        .filter((item) => parseFloat(item.quantity_kg) > 0)
        .map((item) => {
            const ft = fishTypes.find((f) => f.id === item.fish_type_id);
            const kg = parseFloat(item.quantity_kg);
            const sub = kg * KG_TO_LBS * pricing.price_per_pound;

            return { name: ft?.name ?? '—', sub };
        });

    const fishSubtotal = lines.reduce((s, l) => s + l.sub, 0);
    const filletingCharge = data.filleting ? pricing.filleting_fee : 0;
    const deliveryCharge = data.delivery ? pricing.delivery_fee : 0;
    const grandTotal = fishSubtotal + filletingCharge + deliveryCharge;

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order summary</p>
            <div className="space-y-1">
                {lines.length > 0 ? (
                    lines.map((l, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{l.name}</span>
                            <span className="font-mono">${l.sub.toFixed(2)}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No fish selected</p>
                )}
                {filletingCharge > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Filleting</span>
                        <span className="font-mono">+${filletingCharge.toFixed(2)}</span>
                    </div>
                )}
                {deliveryCharge > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="font-mono">+${deliveryCharge.toFixed(2)}</span>
                    </div>
                )}
            </div>
            <Separator />
            <div className="flex items-baseline justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-mono text-xl font-bold text-primary">
                    ${grandTotal.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-muted-foreground">SBD</span>
                </span>
            </div>
            <Separator />
            <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                    <span>Price per pound</span>
                    <span>${pricing.price_per_pound.toFixed(2)} SBD</span>
                </div>
                <div className="flex justify-between">
                    <span>Filleting fee</span>
                    <span>${pricing.filleting_fee.toFixed(2)} SBD</span>
                </div>
                <div className="flex justify-between">
                    <span>Delivery fee</span>
                    <span>${pricing.delivery_fee.toFixed(2)} SBD</span>
                </div>
            </div>
        </div>
    );
}

export function ConversationalOrderFlow({ fishTypes, pricing, authenticatedContact }: ConversationalOrderFlowProps) {
    const [activeStep, setActiveStep] = useState<Step>(0);

    const { data, setData, post, transform, processing, errors } = useForm<FormData>({
        items: fishTypes.map((ft) => ({ fish_type_id: ft.id, quantity_kg: '' })),
        filleting: false,
        delivery: false,
        delivery_location: '',
        guest_name: authenticatedContact?.name ?? '',
        guest_email: authenticatedContact?.email ?? '',
        guest_phone: authenticatedContact?.phone ?? '',
    });

    const isLoggedIn = authenticatedContact !== undefined;

    const fishSubtotal = data.items.reduce((sum, item) => {
        const kg = parseFloat(item.quantity_kg) || 0;

        return sum + kg * KG_TO_LBS * pricing.price_per_pound;
    }, 0);
    const filletingCharge = data.filleting ? pricing.filleting_fee : 0;
    const deliveryCharge = data.delivery ? pricing.delivery_fee : 0;
    const grandTotal = fishSubtotal + filletingCharge + deliveryCharge;

    const hasItems = data.items.some((item) => parseFloat(item.quantity_kg) > 0);
    const deliveryLocationFilled = !data.delivery || data.delivery_location.trim().length > 0;
    const contactFilled =
        isLoggedIn ||
        (data.guest_name.trim().length > 0 && data.guest_email.trim().length > 0 && data.guest_phone.trim().length > 0);
    const canContinue = [hasItems, deliveryLocationFilled, contactFilled, true][activeStep];

    function fishChipLabel() {
        return data.items
            .filter((i) => parseFloat(i.quantity_kg) > 0)
            .map((i) => {
                const ft = fishTypes.find((f) => f.id === i.fish_type_id);

                return `${ft?.name} ${i.quantity_kg}kg`;
            })
            .join(' · ');
    }

    function optionsChipLabel() {
        const parts: string[] = [];

        if (data.filleting) {
parts.push('Filleting');
}

        if (data.delivery) {
parts.push(`Delivery to ${data.delivery_location}`);
}

        return parts.length > 0 ? parts.join(' · ') : 'No extras';
    }

    function contactChipLabel() {
        const name = isLoggedIn ? authenticatedContact!.name : data.guest_name;
        const email = isLoggedIn ? authenticatedContact!.email : data.guest_email;

        return `${name} · ${email}`;
    }

    function adjustQuantity(index: number, delta: number) {
        const updated = [...data.items];
        const current = parseFloat(updated[index].quantity_kg) || 0;
        const next = Math.max(0, Math.round((current + delta) * 10) / 10);
        updated[index] = { ...updated[index], quantity_kg: next > 0 ? next.toString() : '' };
        setData('items', updated);
    }

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
            <div className="grid items-start gap-6 md:grid-cols-[1fr_300px]">
                {/* Conversational flow column */}
                <div className="space-y-3 pb-20 md:pb-0">
                    {activeStep > 0 && (
                        <StepChip stepName="Fish" label={fishChipLabel()} onEdit={() => goTo(0)} />
                    )}
                    {activeStep > 1 && (
                        <StepChip stepName="Options" label={optionsChipLabel()} onEdit={() => goTo(1)} />
                    )}
                    {activeStep > 2 && (
                        <StepChip stepName="Contact" label={contactChipLabel()} onEdit={() => goTo(2)} />
                    )}

                    <Card>
                        <CardContent className="pt-6">
                            {/* Mobile back link */}
                            {activeStep > 0 && (
                                <button
                                    type="button"
                                    onClick={() => goTo((activeStep - 1) as Step)}
                                    className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
                                >
                                    ← Back
                                </button>
                            )}

                            {/* Step 0: Fish selection */}
                            {activeStep === 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-base font-semibold">What would you like to order?</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Tap + to add kilograms for each fish type.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {fishTypes.map((ft, i) => {
                                            const qty = parseFloat(data.items[i]?.quantity_kg) || 0;

                                            return (
                                                <div
                                                    key={ft.id}
                                                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                                                >
                                                    <span className="font-medium">{ft.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            disabled={qty <= 0}
                                                            onClick={() => adjustQuantity(i, -0.5)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                                                            aria-label={`Decrease ${ft.name} by 0.5 kg`}
                                                        >
                                                            <Minus className="h-3.5 w-3.5" />
                                                        </button>
                                                        <span className="w-14 text-center text-sm font-medium tabular-nums">
                                                            {qty > 0 ? `${qty} kg` : '—'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => adjustQuantity(i, 0.5)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
                                                            aria-label={`Increase ${ft.name} by 0.5 kg`}
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}
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
                                                onCheckedChange={(v) => setData('filleting', v === true)}
                                            />
                                            <div>
                                                <Label htmlFor="filleting" className="cursor-pointer">
                                                    Filleting
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    +${pricing.filleting_fee.toFixed(2)} SBD
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="delivery"
                                                checked={data.delivery}
                                                onCheckedChange={(v) => setData('delivery', v === true)}
                                            />
                                            <div className="flex-1">
                                                <Label htmlFor="delivery" className="cursor-pointer">
                                                    Delivery
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    +${pricing.delivery_fee.toFixed(2)} SBD
                                                </p>
                                                {data.delivery && (
                                                    <div className="mt-3 space-y-1.5">
                                                        <Label htmlFor="delivery_location" className="text-sm">
                                                            Delivery location
                                                        </Label>
                                                        <Input
                                                            id="delivery_location"
                                                            placeholder="e.g. Near the market, Honiara"
                                                            value={data.delivery_location}
                                                            onChange={(e) => setData('delivery_location', e.target.value)}
                                                            autoFocus
                                                        />
                                                        <InputError message={errors.delivery_location} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
                                                ? 'Your order will be placed under your account.'
                                                : "We'll use these to confirm your order."}
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="guest_name">Name</Label>
                                            <Input
                                                id="guest_name"
                                                value={data.guest_name}
                                                readOnly={isLoggedIn}
                                                className={isLoggedIn ? 'bg-muted' : ''}
                                                onChange={(e) => setData('guest_name', e.target.value)}
                                                placeholder="Your name"
                                                autoFocus={!isLoggedIn}
                                            />
                                            <InputError message={errors.guest_name} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="guest_email">Email</Label>
                                            <Input
                                                id="guest_email"
                                                type="email"
                                                value={data.guest_email}
                                                readOnly={isLoggedIn}
                                                className={isLoggedIn ? 'bg-muted' : ''}
                                                onChange={(e) => setData('guest_email', e.target.value)}
                                                placeholder="your@email.com"
                                            />
                                            <InputError message={errors.guest_email} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="guest_phone">Phone</Label>
                                            <Input
                                                id="guest_phone"
                                                type="tel"
                                                value={data.guest_phone}
                                                readOnly={isLoggedIn}
                                                className={isLoggedIn ? 'bg-muted' : ''}
                                                onChange={(e) => setData('guest_phone', e.target.value)}
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
                                        <h2 className="text-base font-semibold">Review your order</h2>
                                        <p className="text-sm text-muted-foreground">Check everything before placing.</p>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="space-y-1">
                                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Fish
                                            </p>
                                            {data.items
                                                .filter((i) => parseFloat(i.quantity_kg) > 0)
                                                .map((item) => {
                                                    const ft = fishTypes.find((f) => f.id === item.fish_type_id);

                                                    return (
                                                        <div key={item.fish_type_id} className="flex justify-between">
                                                            <span>{ft?.name}</span>
                                                            <span className="font-mono">{item.quantity_kg} kg</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        <Separator />
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Filleting</span>
                                                <span>{data.filleting ? 'Yes' : 'No'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Delivery</span>
                                                <span>{data.delivery ? data.delivery_location : 'No'}</span>
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
                                                <span>{data.guest_phone || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation — desktop only */}
                            <div className="mt-6 hidden items-center justify-between md:flex">
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
                </div>

                {/* Desktop pricing panel */}
                <div className="hidden md:block">
                    <div className="sticky top-24">
                        <Card>
                            <CardContent className="pt-6">
                                <PricingSummary fishTypes={fishTypes} data={data} pricing={pricing} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Mobile sticky pricing bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold">
                            ${grandTotal.toFixed(2)}{' '}
                            <span className="text-xs font-normal text-muted-foreground">SBD</span>
                        </p>
                    </div>
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
            </div>
        </form>
    );
}
