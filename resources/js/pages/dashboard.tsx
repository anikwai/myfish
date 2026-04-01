import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { create, index, show } from '@/routes/orders';

type Order = {
    id: number;
    status: string;
    total_sbd: string;
    created_at: string;
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

export default function Dashboard({
    recentOrders,
    orderCount,
}: {
    recentOrders: Order[];
    orderCount: number;
}) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading title="Dashboard" />
                    <Button asChild>
                        <Link href={create()}>Place new order</Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Total orders</p>
                        <p className="mt-1 text-2xl font-semibold">{orderCount}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Heading variant="small" title="Recent orders" />
                        <Link href={index()} className="text-sm text-primary underline-offset-4 hover:underline">
                            View all
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No orders yet.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">Order</th>
                                        <th className="px-4 py-2 text-left font-medium">Status</th>
                                        <th className="px-4 py-2 text-right font-medium">Total (SBD)</th>
                                        <th className="px-4 py-2 text-left font-medium">Date</th>
                                        <th className="px-4 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="border-b last:border-0">
                                            <td className="px-4 py-2">#{order.id}</td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-neutral-100'}`}
                                                >
                                                    {STATUS_LABELS[order.status] ?? order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono">
                                                ${Number(order.total_sbd).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString()}
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
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
