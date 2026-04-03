import { PackageDelivered01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Head, usePage, usePoll } from '@inertiajs/react';
import Heading from '@/components/heading';
import { OrderTimeline  } from '@/components/orders/OrderTimeline';
import type {StatusLog} from '@/components/orders/OrderTimeline';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { index } from '@/routes/orders';

type FishType = { id: number; name: string };
type OrderItem = {
    id: number;
    fish_type: FishType;
    cut: string | null;
    quantity_kg: string;
    quantity_pounds: string;
    price_per_pound_snapshot: string;
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
    discount_sbd: string;
    tax_sbd: string;
    tax_label_snapshot: string | null;
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
                    <Badge className={STATUS_COLORS[order.status] ?? 'bg-neutral-100 text-neutral-600'}>
                        {order.status === 'delivered' && <HugeiconsIcon icon={PackageDelivered01Icon} size={12} />}
                        {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                </div>

                {stockWarning && (
                    <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800">
                        Note: your order quantity exceeds current available
                        stock. We will confirm availability shortly.
                    </Alert>
                )}

                <Card>
                    <CardContent>
                        <OrderTimeline
                            logs={statusLogs}
                            currentStatus={order.status}
                            rejectionReason={order.rejection_reason}
                        />
                    </CardContent>
                </Card>

                <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fish</TableHead>
                            <TableHead className="text-right">kg</TableHead>
                            <TableHead className="text-right">lbs</TableHead>
                            <TableHead className="text-right">$/lb</TableHead>
                            <TableHead className="text-right">Subtotal (SBD)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                {item.fish_type.name}
                                {item.cut && item.cut !== 'whole' && (
                                    <span className="ml-1.5 text-xs capitalize text-muted-foreground">({item.cut})</span>
                                )}
                            </TableCell>
                                <TableCell className="text-right font-mono">
                                    {Number(item.quantity_kg).toFixed(3)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                    {Number(item.quantity_pounds).toFixed(3)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                    {Number(item.price_per_pound_snapshot).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {Number(item.subtotal_sbd).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>

                <div className="space-y-1 max-w-xs ml-auto">
                    {order.filleting && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Filleting</span>
                            <span className="font-mono">
                                +${Number(order.filleting_fee_snapshot).toFixed(2)}
                            </span>
                        </div>
                    )}
                    {order.delivery && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Delivery</span>
                            <span className="font-mono">
                                +${Number(order.delivery_fee_snapshot).toFixed(2)}
                            </span>
                        </div>
                    )}
                    {Number(order.discount_sbd) > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount</span>
                            <span className="font-mono text-emerald-700 dark:text-emerald-400">
                                −${Number(order.discount_sbd).toFixed(2)}
                            </span>
                        </div>
                    )}
                    {Number(order.tax_sbd) > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {order.tax_label_snapshot?.trim() || 'Tax'}
                            </span>
                            <span className="font-mono">+${Number(order.tax_sbd).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold">
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
