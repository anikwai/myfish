import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
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

export default function OrderIndex({ orders }: { orders: Order[] }) {
    return (
        <>
            <Head title="My orders" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading title="My orders" />
                    <Button asChild>
                        <Link href={create()}>Place new order</Link>
                    </Button>
                </div>

                {orders.length === 0 ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>No orders yet</EmptyTitle>
                            <EmptyDescription>You haven't placed any orders yet.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total (SBD)</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>#{order.id}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={cn(
                                                'rounded-full',
                                                STATUS_COLORS[order.status] ?? 'bg-neutral-100 text-neutral-600',
                                            )}
                                        >
                                            {STATUS_LABELS[order.status] ?? order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        ${Number(order.total_sbd).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('en-AU')}
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={show(order)}
                                            className="text-primary underline-offset-4 hover:underline"
                                        >
                                            View
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </>
    );
}

OrderIndex.layout = {
    breadcrumbs: [{ title: 'My orders', href: index() }],
};
