import {
  PlusSignIcon,
  SortByDown01Icon,
  SortByUp01Icon,
  Sorting01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Head, InfiniteScroll, Link, router } from "@inertiajs/react";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import AdminOrderController from "@/actions/App/Http/Controllers/Admin/OrderController";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { index, show } from "@/routes/admin/orders";

type StatusMeta = Record<string, { label: string; color: string }>;

type Order = {
  id: number;
  status: string;
  total_sbd: string;
  created_at: string;
  guest_name: string | null;
  user: { id: number; name: string } | null;
};

type PaginatedOrders = {
  data: Order[];
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") {
    return <HugeiconsIcon icon={SortByDown01Icon} data-icon="inline-end" />;
  }

  if (sorted === "desc") {
    return <HugeiconsIcon icon={SortByUp01Icon} data-icon="inline-end" />;
  }

  return <HugeiconsIcon icon={Sorting01Icon} data-icon="inline-end" />;
}

function makeColumns(statusMeta: StatusMeta): ColumnDef<Order>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order
          <SortIcon sorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
    },
    {
      id: "customer",
      accessorFn: (row) => row.user?.name ?? row.guest_name ?? "Guest",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <SortIcon sorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ getValue }) => getValue() as string,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "rounded-full",
            statusMeta[row.original.status]?.color ??
              "bg-neutral-100 text-neutral-600"
          )}
        >
          {statusMeta[row.original.status]?.label ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "total_sbd",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full justify-end"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total (SBD)
          <SortIcon sorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="block text-right font-mono">
          ${Number(row.original.total_sbd).toFixed(2)}
        </span>
      ),
      sortingFn: (a, b) =>
        Number(a.original.total_sbd) - Number(b.original.total_sbd),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <SortIcon sorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString("en-AU")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Link
          href={show(row.original)}
          className="text-primary underline-offset-4 hover:underline"
        >
          View
        </Link>
      ),
    },
  ];
}

export default function AdminOrders({
  orders,
  filterStatus,
  search,
  statuses,
  statusMeta,
}: {
  orders: PaginatedOrders;
  filterStatus: string | null;
  search: string;
  statuses: string[];
  statusMeta: StatusMeta;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [searchValue, setSearchValue] = useState(search);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterStatusRef = useRef(filterStatus);
  filterStatusRef.current = filterStatus;

  const columns = makeColumns(statusMeta);

  const table = useReactTable({
    data: orders.data,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      const params: Record<string, string> = {};

      if (filterStatusRef.current) {
        params.status = filterStatusRef.current;
      }

      if (searchValue) {
        params.search = searchValue;
      }

      router.get(index(), params, {
        preserveState: true,
        reset: ["orders"],
      });
    }, 300);

    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, [searchValue]);

  function applyFilter(status: string | null) {
    const params: Record<string, string> = {};

    if (status) {
      params.status = status;
    }

    if (searchValue) {
      params.search = searchValue;
    }

    router.get(index(), params, { preserveState: true, reset: ["orders"] });
  }

  return (
    <>
      <Head title="Orders" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Heading title="Orders" />
          <Button asChild variant="outline">
            <Link href={AdminOrderController.createGuest.url()}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              New guest order
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={!filterStatus ? "default" : "secondary"}
              className="rounded-full"
              onClick={() => applyFilter(null)}
            >
              All
            </Button>
            {statuses.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filterStatus === s ? "default" : "secondary"}
                className="rounded-full"
                onClick={() => applyFilter(s)}
              >
                {statusMeta[s]?.label ?? s}
              </Button>
            ))}
          </div>

          <Input
            placeholder="Search by customer or order #..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64"
          />
        </div>

        <InfiniteScroll data="orders">
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>No orders found</EmptyTitle>
                          <EmptyDescription>
                            No orders match the current filter.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </InfiniteScroll>
      </div>
    </>
  );
}

AdminOrders.layout = {
  breadcrumbs: [{ title: "Orders", href: index() }],
};
