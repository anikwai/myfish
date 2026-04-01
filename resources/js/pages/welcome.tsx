import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import GuestOrderController from '@/actions/App/Http/Controllers/GuestOrderController';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { dashboard, login, register } from '@/routes';

const KG_TO_LBS = 2.20462;
const STEPS = ['Fish & quantities', 'Options', 'Contact', 'Review'] as const;

type FishType = { id: number; name: string };
type Pricing = {
    price_per_pound: number;
    filleting_fee: number;
    delivery_fee: number;
};
type AuthUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
} | null;

type FormData = {
    items: { fish_type_id: number; quantity_kg: string }[];
    filleting: boolean;
    delivery: boolean;
    delivery_location: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
};

export default function Welcome({
    fishTypes,
    pricing,
    canRegister = true,
}: {
    fishTypes: FishType[];
    pricing: Pricing;
    canRegister?: boolean;
}) {
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const isLoggedIn = Boolean(auth?.user);
    const [step, setStep] = useState(0);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        items: fishTypes.map((ft) => ({ fish_type_id: ft.id, quantity_kg: '' })),
        filleting: false,
        delivery: false,
        delivery_location: '',
        guest_name: auth?.user?.name ?? '',
        guest_email: auth?.user?.email ?? '',
        guest_phone: auth?.user?.phone ?? '',
    });

    const totalPounds = data.items.reduce((sum, item) => {
        const kg = parseFloat(item.quantity_kg) || 0;
        return sum + kg * KG_TO_LBS;
    }, 0);

    const fishSubtotal = totalPounds * pricing.price_per_pound;
    const filletingCharge = data.filleting ? pricing.filleting_fee : 0;
    const deliveryCharge = data.delivery ? pricing.delivery_fee : 0;
    const grandTotal = fishSubtotal + filletingCharge + deliveryCharge;

    const hasItems = data.items.some((item) => parseFloat(item.quantity_kg) > 0);

    const canProceed = [
        hasItems,
        !data.delivery || data.delivery_location.trim().length > 0,
        isLoggedIn ||
            (data.guest_name.trim().length > 0 &&
                data.guest_email.trim().length > 0 &&
                data.guest_phone.trim().length > 0),
        true,
    ];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isLoggedIn) {
            post(OrderController.store.url());
        } else {
            post(GuestOrderController.store.url());
        }
    }

    return (
        <>
            <Head title="Place an order — MyFish">
                <meta
                    name="description"
                    content="Order fresh fish online in Solomon Islands. Filleting and delivery available."
                />
            </Head>

            <div className="min-h-screen bg-background">
                {/* Nav */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <span className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
                            MyFish
                        </span>
                        <nav className="flex items-center gap-2 sm:gap-3">
                            {isLoggedIn ? (
                                <Button asChild size="sm">
                                    <Link href={dashboard()}>Dashboard</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button size="sm" asChild>
                                            <Link href={register()}>
                                                Register
                                            </Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Place an order
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Fresh fish, Solomon Islands
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                        {/* Wizard */}
                        <div>
                            {/* Step indicator */}
                            <div className="mb-6 flex items-center">
                                {STEPS.map((label, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <div
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                                i <= step
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {i + 1}
                                        </div>
                                        <span
                                            className={`hidden text-xs sm:inline ${
                                                i === step
                                                    ? 'font-medium'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {label}
                                        </span>
                                        {i < STEPS.length - 1 && (
                                            <div
                                                className={`mx-2 h-px w-4 shrink-0 sm:w-8 ${
                                                    i < step
                                                        ? 'bg-primary'
                                                        : 'bg-muted'
                                                }`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Card>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmit}>
                                        {/* Step 0: Fish & quantities */}
                                        {step === 0 && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h2 className="text-base font-semibold">
                                                        Fish & quantities
                                                    </h2>
                                                    <p className="text-sm text-muted-foreground">
                                                        Enter the quantity in
                                                        kilograms for each fish
                                                        type.
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border">
                                                    <table className="w-full text-sm">
                                                        <thead className="border-b bg-muted/50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left font-medium">
                                                                    Fish type
                                                                </th>
                                                                <th className="px-4 py-2 text-right font-medium">
                                                                    Qty (kg)
                                                                </th>
                                                                <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">
                                                                    Subtotal
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {fishTypes.map(
                                                                (ft, i) => {
                                                                    const kg =
                                                                        parseFloat(
                                                                            data
                                                                                .items[
                                                                                i
                                                                            ]
                                                                                ?.quantity_kg,
                                                                        ) || 0;
                                                                    const sub =
                                                                        kg *
                                                                        KG_TO_LBS *
                                                                        pricing.price_per_pound;
                                                                    return (
                                                                        <tr
                                                                            key={
                                                                                ft.id
                                                                            }
                                                                            className="border-b last:border-0"
                                                                        >
                                                                            <td className="px-4 py-2">
                                                                                {
                                                                                    ft.name
                                                                                }
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.001"
                                                                                    min="0"
                                                                                    className="w-24 text-right"
                                                                                    value={
                                                                                        data
                                                                                            .items[
                                                                                            i
                                                                                        ]
                                                                                            ?.quantity_kg
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) => {
                                                                                        const updated =
                                                                                            [
                                                                                                ...data.items,
                                                                                            ];
                                                                                        updated[
                                                                                            i
                                                                                        ] =
                                                                                            {
                                                                                                ...updated[
                                                                                                    i
                                                                                                ],
                                                                                                quantity_kg:
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
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
                                                                            <td className="hidden px-4 py-2 text-right font-mono text-muted-foreground sm:table-cell">
                                                                                {sub >
                                                                                0
                                                                                    ? `$${sub.toFixed(2)}`
                                                                                    : '—'}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                },
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 1: Options */}
                                        {step === 1 && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h2 className="text-base font-semibold">
                                                        Options
                                                    </h2>
                                                    <p className="text-sm text-muted-foreground">
                                                        Add filleting and
                                                        delivery if needed.
                                                    </p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            id="filleting"
                                                            type="checkbox"
                                                            className="h-4 w-4"
                                                            checked={
                                                                data.filleting
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    'filleting',
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                        <Label htmlFor="filleting">
                                                            Filleting{' '}
                                                            <span className="text-muted-foreground">
                                                                (+$
                                                                {pricing.filleting_fee.toFixed(
                                                                    2,
                                                                )}{' '}
                                                                SBD)
                                                            </span>
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            id="delivery"
                                                            type="checkbox"
                                                            className="h-4 w-4"
                                                            checked={
                                                                data.delivery
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    'delivery',
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                        <Label htmlFor="delivery">
                                                            Delivery{' '}
                                                            <span className="text-muted-foreground">
                                                                (+$
                                                                {pricing.delivery_fee.toFixed(
                                                                    2,
                                                                )}{' '}
                                                                SBD)
                                                            </span>
                                                        </Label>
                                                    </div>
                                                    {data.delivery && (
                                                        <div className="ml-7 grid gap-2">
                                                            <Label htmlFor="delivery_location">
                                                                Delivery
                                                                location
                                                            </Label>
                                                            <Input
                                                                id="delivery_location"
                                                                placeholder="e.g. Near the market, Honiara"
                                                                value={
                                                                    data.delivery_location
                                                                }
                                                                onChange={(e) =>
                                                                    setData(
                                                                        'delivery_location',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={
                                                                    errors.delivery_location
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 2: Contact */}
                                        {step === 2 && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h2 className="text-base font-semibold">
                                                        Contact details
                                                    </h2>
                                                    <p className="text-sm text-muted-foreground">
                                                        {isLoggedIn
                                                            ? 'Your order will be placed under your account.'
                                                            : "We'll use these to confirm your order."}
                                                    </p>
                                                </div>
                                                <div className="grid gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="guest_name">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            id="guest_name"
                                                            value={
                                                                data.guest_name
                                                            }
                                                            readOnly={
                                                                isLoggedIn
                                                            }
                                                            className={
                                                                isLoggedIn
                                                                    ? 'bg-muted'
                                                                    : ''
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    'guest_name',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Your name"
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.guest_name
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="guest_email">
                                                            Email
                                                        </Label>
                                                        <Input
                                                            id="guest_email"
                                                            type="email"
                                                            value={
                                                                data.guest_email
                                                            }
                                                            readOnly={
                                                                isLoggedIn
                                                            }
                                                            className={
                                                                isLoggedIn
                                                                    ? 'bg-muted'
                                                                    : ''
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    'guest_email',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="your@email.com"
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.guest_email
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="guest_phone">
                                                            Phone
                                                        </Label>
                                                        <Input
                                                            id="guest_phone"
                                                            type="tel"
                                                            value={
                                                                data.guest_phone
                                                            }
                                                            readOnly={
                                                                isLoggedIn
                                                            }
                                                            className={
                                                                isLoggedIn
                                                                    ? 'bg-muted'
                                                                    : ''
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    'guest_phone',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="+677 12345"
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.guest_phone
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 3: Review */}
                                        {step === 3 && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h2 className="text-base font-semibold">
                                                        Review your order
                                                    </h2>
                                                    <p className="text-sm text-muted-foreground">
                                                        Check everything before
                                                        placing.
                                                    </p>
                                                </div>
                                                <div className="space-y-3 text-sm">
                                                    <div className="space-y-1">
                                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                            Fish
                                                        </p>
                                                        {data.items
                                                            .filter(
                                                                (item) =>
                                                                    parseFloat(
                                                                        item.quantity_kg,
                                                                    ) > 0,
                                                            )
                                                            .map((item) => {
                                                                const ft =
                                                                    fishTypes.find(
                                                                        (f) =>
                                                                            f.id ===
                                                                            item.fish_type_id,
                                                                    );
                                                                return (
                                                                    <div
                                                                        key={
                                                                            item.fish_type_id
                                                                        }
                                                                        className="flex justify-between"
                                                                    >
                                                                        <span>
                                                                            {
                                                                                ft?.name
                                                                            }
                                                                        </span>
                                                                        <span className="font-mono">
                                                                            {
                                                                                item.quantity_kg
                                                                            }{' '}
                                                                            kg
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                    <Separator />
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">
                                                                Filleting
                                                            </span>
                                                            <span>
                                                                {data.filleting
                                                                    ? 'Yes'
                                                                    : 'No'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">
                                                                Delivery
                                                            </span>
                                                            <span>
                                                                {data.delivery
                                                                    ? data.delivery_location
                                                                    : 'No'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Separator />
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">
                                                                Name
                                                            </span>
                                                            <span>
                                                                {isLoggedIn
                                                                    ? auth
                                                                          ?.user
                                                                          ?.name
                                                                    : data.guest_name}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">
                                                                Email
                                                            </span>
                                                            <span>
                                                                {isLoggedIn
                                                                    ? auth
                                                                          ?.user
                                                                          ?.email
                                                                    : data.guest_email}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">
                                                                Phone
                                                            </span>
                                                            <span>
                                                                {isLoggedIn
                                                                    ? (auth
                                                                          ?.user
                                                                          ?.phone ??
                                                                      '—')
                                                                    : data.guest_phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Navigation */}
                                        <div className="mt-6 flex items-center justify-between">
                                            {step > 0 ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setStep(step - 1)
                                                    }
                                                >
                                                    Back
                                                </Button>
                                            ) : (
                                                <div />
                                            )}
                                            {step < STEPS.length - 1 ? (
                                                <Button
                                                    type="button"
                                                    disabled={
                                                        !canProceed[step]
                                                    }
                                                    onClick={() =>
                                                        setStep(step + 1)
                                                    }
                                                >
                                                    Continue
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Place order
                                                </Button>
                                            )}
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Pricing summary */}
                        <div>
                            <div className="sticky top-24">
                                <Card>
                                    <CardContent className="space-y-4 pt-6">
                                        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Order summary
                                        </h2>

                                        <div className="space-y-1">
                                            <div className="flex justify-between py-1 text-sm">
                                                <span className="text-muted-foreground">
                                                    Fish subtotal
                                                </span>
                                                <span className="font-mono">
                                                    {fishSubtotal > 0
                                                        ? `$${fishSubtotal.toFixed(2)} SBD`
                                                        : '—'}
                                                </span>
                                            </div>
                                            {data.filleting && (
                                                <div className="flex justify-between py-1 text-sm">
                                                    <span className="text-muted-foreground">
                                                        Filleting
                                                    </span>
                                                    <span className="font-mono">
                                                        +$
                                                        {pricing.filleting_fee.toFixed(
                                                            2,
                                                        )}{' '}
                                                        SBD
                                                    </span>
                                                </div>
                                            )}
                                            {data.delivery && (
                                                <div className="flex justify-between py-1 text-sm">
                                                    <span className="text-muted-foreground">
                                                        Delivery
                                                    </span>
                                                    <span className="font-mono">
                                                        +$
                                                        {pricing.delivery_fee.toFixed(
                                                            2,
                                                        )}{' '}
                                                        SBD
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="flex items-baseline justify-between">
                                            <span className="font-semibold">
                                                Total
                                            </span>
                                            <span className="font-mono text-xl font-bold text-primary">
                                                ${grandTotal.toFixed(2)}{' '}
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    SBD
                                                </span>
                                            </span>
                                        </div>

                                        <Separator />

                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Price per pound</span>
                                                <span>
                                                    $
                                                    {pricing.price_per_pound.toFixed(
                                                        2,
                                                    )}{' '}
                                                    SBD
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Filleting fee</span>
                                                <span>
                                                    $
                                                    {pricing.filleting_fee.toFixed(
                                                        2,
                                                    )}{' '}
                                                    SBD
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Delivery fee</span>
                                                <span>
                                                    $
                                                    {pricing.delivery_fee.toFixed(
                                                        2,
                                                    )}{' '}
                                                    SBD
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="border-t py-8">
                    <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
                        <p className="text-sm text-muted-foreground">
                            MyFish — Fresh fish, Solomon Islands
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
