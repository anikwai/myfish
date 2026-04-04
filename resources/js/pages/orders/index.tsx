import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Head, InfiniteScroll, Link, router } from "@inertiajs/react";
import { ORDER_STATUS_ICONS } from "@/lib/order-status-icons";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { create, index, show } from "@/routes/orders";

type Order = {
  id: number;
  status: string;
  total_sbd: string;
  created_at: string;
};

type PaginatedOrders = {
  data: Order[];
};

type StatusMeta = Record<
  string,
  { label: string; color: string; icon: string }
>;

const FILTER_TABS = [
  { key: null, label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderIndex({
  orders,
  filterStatus,
  statusMeta,
}: {
  orders: PaginatedOrders;
  filterStatus: string | null;
  statusMeta: StatusMeta;
}) {
  function applyFilter(status: string | null) {
    router.get(index(), status ? { status } : {}, { preserveState: true });
  }

  return (
    <>
      <Head title="My orders" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Heading title="My orders" />
          <Button asChild>
            <Link href={create()}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Place new order
            </Link>
          </Button>
        </div>

        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.key ?? "all"}
              size="sm"
              variant={filterStatus === tab.key ? "default" : "secondary"}
              className="rounded-full"
              onClick={() => applyFilter(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {orders.data.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No orders yet</EmptyTitle>
              <EmptyDescription>
                {filterStatus
                  ? "No orders match the current filter."
                  : "You haven't placed any orders yet."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <InfiniteScroll data="orders">
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
                  {orders.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-full",
                            statusMeta[order.status]?.color ??
                              "bg-neutral-100 text-neutral-600"
                          )}
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
          </InfiniteScroll>
        )}
      </div>
    </>
  );
}

OrderIndex.layout = {
  breadcrumbs: [{ title: "My orders", href: index() }],
};
