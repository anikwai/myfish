import { Head, usePage, usePoll } from '@inertiajs/react';
import { OrderTimeline, type StatusLog } from '@/components/orders/OrderTimeline';
import Heading from '@/components/heading';
import { index } from '@/routes/orders';

type FishType = { id: number; name: string };
type OrderItem = {
    id: number;
    fish_type: FishType;
    quantity_kg: string;
    quantity_pounds: string;
    subtotal_sbd: string;
};
type Order = {
    id: number;
    status: string;
    filleting: boolean;
    delivery: boolean;
    delivery_location: string | null;
    filleting_fee_snapshot: string;
    delivery_fee_snapshot: string;
    total_sbd: string;
    rejection_reason: string | null;
    created_at: string;
    items: OrderItem[];
};

const STATUS_LABELS: Record<string, string> = {
    placed: 'Placed',
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

export default function ShowOrder({ order, statusLogs }: { order: Order; statusLogs: StatusLog[] }) {
    const { props } = usePage<{ flash: { stock_warning?: boolean } }>();
    const stockWarning = props.flash?.stock_warning;

    usePoll(30_000, { only: ['order', 'statusLogs'] });

    return (
        <>
            <Head title={`Order #${order.id}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading title={`Order #${order.id}`} />
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[order.status] ?? 'bg-neutral-100 text-neutral-600'}`}
                    >
                        {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                </div>

                {stockWarning && (
                    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                        Note: your order quantity exceeds current available
                        stock. We will confirm availability shortly.
                    </div>
                )}

                <div className="rounded-lg border p-4">
                    <OrderTimeline
                        logs={statusLogs}
                        currentStatus={order.status}
                        rejectionReason={order.rejection_reason}
                    />
                </div>

                <div className="rounded-lg border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium">
                                    Fish
                                </th>
                                <th className="px-4 py-2 text-right font-medium">
                                    kg
                                </th>
                                <th className="px-4 py-2 text-right font-medium">
                                    lbs
                                </th>
                                <th className="px-4 py-2 text-right font-medium">
                                    Subtotal (SBD)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-2">
                                        {item.fish_type.name}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono">
                                        {Number(item.quantity_kg).toFixed(3)}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                                        {Number(item.quantity_pounds).toFixed(
                                            3,
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono">
                                        {Number(item.subtotal_sbd).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="rounded-lg border p-4 space-y-1 text-sm max-w-xs ml-auto">
                    {order.filleting && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Filleting
                            </span>
                            <span className="font-mono">
                                +${Number(order.filleting_fee_snapshot).toFixed(2)}
                            </span>
                        </div>
                    )}
                    {order.delivery && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Delivery
                            </span>
                            <span className="font-mono">
                                +${Number(order.delivery_fee_snapshot).toFixed(2)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between border-t pt-1 font-semibold">
                        <span>Total</span>
                        <span className="font-mono">
                            ${Number(order.total_sbd).toFixed(2)} SBD
                        </span>
                    </div>
                </div>

                {order.delivery && order.delivery_location && (
                    <p className="text-sm text-muted-foreground">
                        Delivery to:{' '}
                        <span className="text-foreground">
                            {order.delivery_location}
                        </span>
                    </p>
                )}

                <p className="text-xs text-muted-foreground">
                    Placed on{' '}
                    {new Date(order.created_at).toLocaleString('en-AU', { hour12: false })}
                </p>
            </div>
        </>
    );
}

ShowOrder.layout = {
    breadcrumbs: [
        { title: 'My orders', href: index() },
        { title: 'Order details', href: '#' },
    ],
};
