import { PackageDelivered01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Head, router, useForm, usePoll } from '@inertiajs/react';
import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { OrderTimeline  } from '@/components/orders/OrderTimeline';
import type {StatusLog} from '@/components/orders/OrderTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    guest_name: string | null;
    guest_phone: string | null;
    user: { id: number; name: string } | null;
    items: OrderItem[];
};

export default function AdminOrderShow({
    order,
    statusLogs,
    allowedTransitions,
}: {
    order: Order;
    statusLogs: StatusLog[];
    allowedTransitions: string[];
}) {
    usePoll(30_000, { only: ['order', 'statusLogs'] });

    const { data, setData, errors } = useForm<{
        status: string;
        rejection_reason: string;
    }>({
        status: '',
        rejection_reason: '',
    });

    function transition(newStatus: string) {
        router.patch(AdminOrderController.updateStatus.url(order), {
            status: newStatus,
            rejection_reason: data.rejection_reason,
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
                    <Badge className={STATUS_COLORS[order.status] ?? 'bg-neutral-100'}>
                        {order.status === 'delivered' && <HugeiconsIcon icon={PackageDelivered01Icon} size={12} />}
                        {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                </div>

                <Card>
                    <CardContent>
                        <OrderTimeline
                            logs={statusLogs}
                            currentStatus={order.status}
                            rejectionReason={order.rejection_reason}
                            showActor
                        />
                    </CardContent>
                </Card>

                <div className="overflow-hidden rounded-lg border">
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
                            <span className="text-muted-foreground">
                                Delivery
                                {order.delivery_location && (
                                    <> — {order.delivery_location}</>
                                )}
                            </span>
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
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span className="font-mono">
                            ${Number(order.total_sbd).toFixed(2)} SBD
                        </span>
                    </div>
                </div>

                {allowedTransitions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Update status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
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
                                        onClick={() => transition(t)}
                                    >
                                        {TRANSITION_LABELS[t] ?? t}
                                    </Button>
                                ))}
                            </div>

                            <InputError message={errors.status} />
                        </CardContent>
                    </Card>
                )}

                <p className="text-xs text-muted-foreground">
                    Placed on {new Date(order.created_at).toLocaleString('en-AU', { hour12: false })}
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
