import { Head, Link, usePage, usePoll } from '@inertiajs/react';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import type { StatusLog } from '@/components/orders/OrderTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { register } from '@/routes';

type FishType = { id: number; name: string };
type OrderItem = {
    id: number;
    fish_type: FishType;
    cut: string | null;
    quantity_kg: string;
    quantity_pounds: string;
    subtotal_sbd: string;
};
type Order = {
    id: number;
    status: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    filleting: boolean;
    delivery: boolean;
    delivery_location: string | null;
    filleting_fee_snapshot: string;
    delivery_fee_snapshot: string;
    discount_sbd: string;
    tax_sbd: string;
    tax_label_snapshot: string | null;
    total_sbd: string;
    rejection_reason: string | null;
    created_at: string;
    items: OrderItem[];
};

const STATUS_LABELS: Record<string, string> = {
    placed: 'Placed — awaiting confirmation',
    confirmed: 'Confirmed',
    on_hold: 'On hold',
    rejected: 'Rejected',
    packed: 'Packed',
    delivered: 'Delivered',
};

const STATUS_COLORS: Record<string, string> = {
    placed: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    packed: 'bg-purple-100 text-purple-700',
    delivered: 'bg-neutral-100 text-neutral-600',
};

export default function GuestConfirmation({
    order,
    statusLogs,
    canRegister = true,
}: {
    order: Order;
    statusLogs: StatusLog[];
    canRegister?: boolean;
}) {
    const { props } = usePage<{ flash: { stock_warning?: boolean } }>();
    const stockWarning = props.flash?.stock_warning;

    usePoll(30_000, { only: ['order', 'statusLogs'] });

    return (
        <>
            <Head title={`Order #${order.id} — MyFish`} />

            <div className="min-h-screen bg-background">
                {/* Nav */}
                <header className="border-b">
                    <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
                        <span className="text-xl font-bold tracking-tight text-primary">
                            MyFish
                        </span>
                    </div>
                </header>

                <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
                    {/* Success header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
                            ✓
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Order received!
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Thanks, {order.guest_name}. We'll be in touch at{' '}
                            <span className="font-medium text-foreground">
                                {order.guest_email}
                            </span>{' '}
                            shortly.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Status */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Order
                                        </p>
                                        <p className="text-lg font-semibold">
                                            #{order.id}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-neutral-100 text-neutral-600'}`}
                                    >
                                        {STATUS_LABELS[order.status] ??
                                            order.status}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {stockWarning && (
                            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                                Note: your order quantity exceeds current
                                available stock. We will confirm availability
                                shortly.
                            </div>
                        )}

                        {/* Status timeline */}
                        <Card>
                            <CardContent className="pt-6">
                                <OrderTimeline
                                    logs={statusLogs}
                                    currentStatus={order.status}
                                    rejectionReason={
                                        order.rejection_reason ?? null
                                    }
                                />
                            </CardContent>
                        </Card>

                        {/* Order items */}
                        <Card>
                            <CardContent className="pt-6">
                                <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Fish
                                </p>
                                <div className="space-y-2">
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between text-sm"
                                        >
                                            <span>
                                                {item.fish_type.name}
                                                {item.cut &&
                                                    item.cut !== 'whole' && (
                                                        <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                                                            ({item.cut})
                                                        </span>
                                                    )}
                                            </span>
                                            <span className="font-mono text-muted-foreground">
                                                {Number(
                                                    item.quantity_kg,
                                                ).toFixed(3)}{' '}
                                                kg /{' '}
                                                {Number(
                                                    item.quantity_pounds,
                                                ).toFixed(3)}{' '}
                                                lbs
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="my-4" />

                                <div className="space-y-1 text-sm">
                                    {order.filleting && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Filleting
                                            </span>
                                            <span className="font-mono">
                                                +$
                                                {Number(
                                                    order.filleting_fee_snapshot,
                                                ).toFixed(2)}{' '}
                                                SBD
                                            </span>
                                        </div>
                                    )}
                                    {order.delivery && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Delivery
                                            </span>
                                            <span className="font-mono">
                                                +$
                                                {Number(
                                                    order.delivery_fee_snapshot,
                                                ).toFixed(2)}{' '}
                                                SBD
                                            </span>
                                        </div>
                                    )}
                                    {Number(order.discount_sbd) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Discount
                                            </span>
                                            <span className="font-mono text-emerald-700 dark:text-emerald-400">
                                                −$
                                                {Number(
                                                    order.discount_sbd,
                                                ).toFixed(2)}{' '}
                                                SBD
                                            </span>
                                        </div>
                                    )}
                                    {Number(order.tax_sbd) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                {order.tax_label_snapshot?.trim() ||
                                                    'Tax'}
                                            </span>
                                            <span className="font-mono">
                                                +$
                                                {Number(order.tax_sbd).toFixed(
                                                    2,
                                                )}{' '}
                                                SBD
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t pt-2 font-semibold">
                                        <span>Total</span>
                                        <span className="font-mono">
                                            $
                                            {Number(order.total_sbd).toFixed(2)}{' '}
                                            SBD
                                        </span>
                                    </div>
                                </div>

                                {order.delivery && order.delivery_location && (
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        Delivery to:{' '}
                                        <span className="text-foreground">
                                            {order.delivery_location}
                                        </span>
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Register upsell */}
                        {canRegister && (
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="pt-6">
                                    <h2 className="font-semibold">
                                        Track all your orders
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Create a free account to see your order
                                        history, get status updates, and order
                                        faster next time.
                                    </p>
                                    <Button asChild className="mt-4 w-full">
                                        <Link
                                            href={register({
                                                query: {
                                                    name: order.guest_name,
                                                    email: order.guest_email,
                                                    phone:
                                                        order.guest_phone ?? '',
                                                },
                                            })}
                                        >
                                            Create account
                                        </Link>
                                    </Button>
                                    <p className="mt-2 text-center text-xs text-muted-foreground">
                                        Your guest order will be linked
                                        automatically.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <p className="text-center text-xs text-muted-foreground">
                            Placed on{' '}
                            {new Date(order.created_at).toLocaleString(
                                'en-AU',
                                { hour12: false },
                            )}
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}
