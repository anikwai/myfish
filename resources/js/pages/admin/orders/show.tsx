import { Head, useForm } from '@inertiajs/react';
import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/orders';

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

const TRANSITION_LABELS: Record<string, string> = {
    confirmed: 'Confirm',
    rejected: 'Reject',
    on_hold: 'Put on hold',
    packed: 'Mark as packed',
    delivered: 'Mark as delivered',
};

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
    guest_name: string | null;
    guest_phone: string | null;
    user: { id: number; name: string } | null;
    items: OrderItem[];
};

export default function AdminOrderShow({
    order,
    allowedTransitions,
}: {
    order: Order;
    allowedTransitions: string[];
}) {
    const { data, setData, patch, processing, errors } = useForm<{
        status: string;
        rejection_reason: string;
    }>({
        status: '',
        rejection_reason: '',
    });

    function transition(newStatus: string) {
        setData('status', newStatus);
        patch(AdminOrderController.updateStatus.url(order), {
            data: { status: newStatus, rejection_reason: data.rejection_reason },
        });
    }

    const customerName =
        order.user?.name ?? order.guest_name ?? 'Guest';

    return (
        <>
            <Head title={`Order #${order.id}`} />

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <Heading title={`Order #${order.id}`} />
                        <p className="text-sm text-muted-foreground">
                            {customerName}
                            {order.guest_phone && (
                                <> &middot; {order.guest_phone}</>
                            )}
                        </p>
                    </div>
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[order.status] ?? 'bg-neutral-100'}`}
                    >
                        {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                </div>

                {order.rejection_reason && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        Rejection reason: {order.rejection_reason}
                    </div>
                )}

                <div className="overflow-x-auto rounded-lg border">
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
                                +$
                                {Number(order.filleting_fee_snapshot).toFixed(
                                    2,
                                )}
                            </span>
                        </div>
                    )}
                    {order.delivery && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Delivery
                                {order.delivery_location && (
                                    <> — {order.delivery_location}</>
                                )}
                            </span>
                            <span className="font-mono">
                                +$
                                {Number(order.delivery_fee_snapshot).toFixed(
                                    2,
                                )}
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

                {allowedTransitions.length > 0 && (
                    <div className="space-y-3 rounded-lg border p-4">
                        <p className="text-sm font-medium">Update status</p>

                        {allowedTransitions.includes('rejected') && (
                            <div className="grid gap-2">
                                <Label htmlFor="rejection_reason">
                                    Rejection reason (optional)
                                </Label>
                                <Input
                                    id="rejection_reason"
                                    value={data.rejection_reason}
                                    onChange={(e) =>
                                        setData(
                                            'rejection_reason',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Out of stock"
                                />
                                <InputError
                                    message={errors.rejection_reason}
                                />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {allowedTransitions.map((t) => (
                                <Button
                                    key={t}
                                    variant={
                                        t === 'rejected'
                                            ? 'destructive'
                                            : 'default'
                                    }
                                    disabled={processing}
                                    onClick={() => transition(t)}
                                >
                                    {TRANSITION_LABELS[t] ?? t}
                                </Button>
                            ))}
                        </div>

                        <InputError message={errors.status} />
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    Placed on {new Date(order.created_at).toLocaleString()}
                </p>
            </div>
        </>
    );
}

AdminOrderShow.layout = {
    breadcrumbs: [
        { title: 'Orders', href: index() },
        { title: 'Order details', href: '#' },
    ],
};
