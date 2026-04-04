import {
  PackageDelivered01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ORDER_STATUS_ICONS } from "@/lib/order-status-icons";
import { Deferred, Head, Link } from "@inertiajs/react";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dashboard } from "@/routes";
import { create, index, show } from "@/routes/orders";

type Order = {
  id: number;
  status: string;
  total_sbd: string;
  created_at: string;
};

type StatusMeta = Record<
  string,
  { label: string; color: string; icon: string }
>;

export default function Dashboard({
  recentOrders,
  orderCount,
  activeOrderCount,
  totalSpend,
  activeOrder,
  statusMeta,
}: {
  recentOrders: Order[];
  orderCount: number;
  activeOrderCount: number;
  totalSpend: number;
  activeOrder: Order | null;
  statusMeta: StatusMeta;
}) {
  return (
    <>
      <Head title="Dashboard" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Heading title="Dashboard" />
          <Button asChild>
            <Link href={create()}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Place new order
            </Link>
          </Button>
        </div>

        {/* Active order banner */}
        <Deferred
          data="activeOrder"
          fallback={<Skeleton className="h-20 w-full" />}
        >
          {activeOrder && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon
                    icon={PackageDelivered01Icon}
                    size={20}
                    className="shrink-0 text-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      Order #{activeOrder.id} is in progress
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${Number(activeOrder.total_sbd).toFixed(2)} SBD
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      statusMeta[activeOrder.status]?.color ?? "bg-neutral-100"
                    }
                  >
                    {ORDER_STATUS_ICONS[
                      statusMeta[activeOrder.status]?.icon
                    ] && (
                      <HugeiconsIcon
                        icon={
                          ORDER_STATUS_ICONS[
                            statusMeta[activeOrder.status].icon
                          ]
                        }
                        size={12}
                      />
                    )}
                    {statusMeta[activeOrder.status]?.label ??
                      activeOrder.status}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={show(activeOrder)}>Track order</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </Deferred>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">Total orders</p>
              <p className="mt-1 text-2xl font-semibold">{orderCount}</p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">Active orders</p>
              <p className="mt-1 text-2xl font-semibold">{activeOrderCount}</p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">Total spend</p>
              <Deferred
                data="totalSpend"
                fallback={<Skeleton className="mt-1 h-8 w-24" />}
              >
                <p className="mt-1 text-2xl font-semibold">
                  ${Number(totalSpend).toFixed(2)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    SBD
                  </span>
                </p>
              </Deferred>
            </CardContent>
          </Card>
        </div>

        {/* Recent orders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Heading variant="small" title="Recent orders" />
            <Link
              href={index()}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
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
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusMeta[order.status]?.color ?? "bg-neutral-100"
                          }
                        >
                          {ORDER_STATUS_ICONS[
                            statusMeta[order.status]?.icon
                          ] && (
                            <HugeiconsIcon
                              icon={
                                ORDER_STATUS_ICONS[
                                  statusMeta[order.status].icon
                                ]
                              }
                              size={12}
                            />
                          )}
                          {statusMeta[order.status]?.label ?? order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${Number(order.total_sbd).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-AU")}
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}

Dashboard.layout = {
  breadcrumbs: [{ title: "Dashboard", href: dashboard() }],
};
