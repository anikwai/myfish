import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { index, show } from '@/routes/admin/orders';

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

type Order = {
    id: number;
    status: string;
    total_sbd: string;
    created_at: string;
    guest_name: string | null;
    user: { id: number; name: string } | null;
};

export default function AdminOrders({
    orders,
    filterStatus,
    statuses,
}: {
    orders: Order[];
    filterStatus: string | null;
    statuses: string[];
}) {
    function applyFilter(status: string | null) {
        router.get(index(), status ? { status } : {}, { preserveState: true });
    }

    return (
        <>
            <Head title="Orders" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading title="Orders" />
                    <Button asChild variant="outline">
                        <Link href="/admin/orders/guest">
                            New guest order
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => applyFilter(null)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${!filterStatus ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                        All
                    </button>
                    {statuses.map((s) => (
                        <button
                            key={s}
                            onClick={() => applyFilter(s)}
                            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${filterStatus === s ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                            {STATUS_LABELS[s] ?? s}
                        </button>
                    ))}
                </div>

                {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No orders found.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">
                                        Order
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                        Customer
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        Total (SBD)
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                        Date
                                    </th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-4 py-2 font-mono">
                                            #{order.id}
                                        </td>
                                        <td className="px-4 py-2">
                                            {order.user?.name ??
                                                order.guest_name ??
                                                'Guest'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-neutral-100'}`}
                                            >
                                                {STATUS_LABELS[
                                                    order.status
                                                ] ?? order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono">
                                            $
                                            {Number(
                                                order.total_sbd,
                                            ).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-muted-foreground">
                                            {new Date(
                                                order.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Link
                                                href={show(order)}
                                                className="text-primary underline-offset-4 hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

AdminOrders.layout = {
    breadcrumbs: [{ title: 'Orders', href: index() }],
};
